// Rize 中文本地化 - Rust 后端主程序
// AI自动时间追踪

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use anyhow::{Result, anyhow};
use chrono::{Local, Date, NaiveDate, Duration as ChronoDuration};
use regex::Regex;
use reqwest::Client;
use serde::{Serialize, Deserialize};
use tauri::Manager;

// 数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    pub id: String,
    pub name: String,
    pub window_title: String,
    pub category: Option<String>,
    pub start_time: Instant,
    pub duration_minutes: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub ai_api_key: String,
    pub ai_provider: String, // ernie | doubao
    pub auto_start_on_boot: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            ai_api_key: String::new(),
            ai_provider: "ernie".to_string(),
            auto_start_on_boot: true,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct DailyStats {
    pub total_focus_minutes: f64,
    pub total_categories: usize,
    pub top_category: String,
}

#[derive(Debug, Serialize)]
pub struct WeeklyStatItem {
    pub category: String,
    pub duration: f64,
    pub percentage: f64,
}

// 全局状态
pub struct AppState {
    activities: Mutex<Vec<Activity>>,
    settings: Mutex<Settings>,
    is_tracking: Mutex<bool>,
    http_client: Client,
}

// AI分类请求响应
#[derive(Debug, Serialize)]
struct ErnieRequest {
    messages: Vec<ErnieMessage>,
    temperature: f32,
}

#[derive(Debug, Serialize, Deserialize)]
struct ErnieMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ErnieResponse {
    result: Option<String>,
}

#[derive(Debug, Serialize)]
struct DoubaoRequest {
    model: String,
    messages: Vec<ErnieMessage>,
}

// 主函数
fn main() {
    // 初始化状态
    let state = Arc::new(AppState {
        activities: Mutex::new(Vec::new()),
        settings: Mutex::new(Settings::default()),
        is_tracking: Mutex::new(true),
        http_client: Client::new(),
    });

    // 加载设置
    let _ = load_settings(&state);

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            get_today_activities,
            get_today_stats,
            get_weekly_stats,
            get_settings,
            save_settings,
            toggle_tracking,
            check_tracking_status,
            classify_activity,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// 获取今日活动
#[tauri::command]
fn get_today_activities(state: tauri::State<'_, AppState>) -> Result<Vec<Activity>, String> {
    let today = Local::now().date_naive();
    // 这里筛选今天的活动，实际需要从数据库加载
    let activities = state.activities.lock().unwrap();
    Ok(activities.clone())
}

// 获取今日统计
#[tauri::command]
fn get_today_stats(state: tauri::State<'_, AppState>) -> Result<DailyStats, String> {
    let mut category_counts: HashMap<String, f64> = HashMap::new();
    let mut total_focus = 0.0;

    let activities = state.activities.lock().unwrap();
    for activity in activities.iter() {
        total_focus += activity.duration_minutes;
        if let Some(cat) = &activity.category {
            *category_counts.entry(cat.clone()).or_default() += activity.duration_minutes;
        }
    }

    let top_category = category_counts
        .iter()
        .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
        .map(|(k, _)| k.clone())
        .unwrap_or_default();

    Ok(DailyStats {
        total_focus_minutes: total_focus,
        total_categories: category_counts.len(),
        top_category,
    })
}

// 获取每周统计
#[tauri::command]
fn get_weekly_stats(state: tauri::State<'_, AppState>) -> Result<Vec<WeeklyStatItem>, String> {
    let mut category_totals: HashMap<String, f64> = HashMap::new();
    let mut total_all = 0.0;

    // 这里简化，实际需要从数据库读取一周的数据
    let activities = state.activities.lock().unwrap();
    for activity in activities.iter() {
        if let Some(cat) = &activity.category {
            *category_totals.entry(cat.clone()).or_default() += activity.duration_minutes;
            total_all += activity.duration_minutes;
        }
    }

    let mut items: Vec<WeeklyStatItem> = category_totals
        .into_iter()
        .map(|(category, duration)| {
            let percentage = if total_all > 0.0 {
                (duration / total_all) * 100.0
            } else {
                0.0
            };
            WeeklyStatItem {
                category,
                duration,
                percentage,
            }
        })
        .collect();

    items.sort_by(|a, b| b.duration.partial_cmp(&a.duration).unwrap());

    Ok(items)
}

// 获取设置
#[tauri::command]
fn get_settings(state: tauri::State<'_, AppState>) -> Result<Settings, String> {
    let settings = state.settings.lock().unwrap();
    Ok(settings.clone())
}

// 保存设置
#[tauri::command]
fn save_settings(new_settings: Settings, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut settings = state.settings.lock().unwrap();
    *settings = new_settings;
    drop(settings);
    let _ = save_settings_internal(&state);
    Ok(())
}

// 切换追踪状态
#[tauri::command]
fn toggle_tracking(enable: bool, state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let mut is_tracking = state.is_tracking.lock().unwrap();
    *is_tracking = enable;
    Ok(*is_tracking)
}

// 检查追踪状态
#[tauri::command]
fn check_tracking_status(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let is_tracking = state.is_tracking.lock().unwrap();
    Ok(*is_tracking)
}

// AI分类活动
#[tauri::command]
async fn classify_activity(
    app_name: String,
    window_title: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let settings = state.settings.lock().unwrap();
    let api_key = settings.ai_api_key.clone();
    let provider = settings.ai_provider.clone();
    drop(settings);

    if api_key.is_empty() {
        // 没有API密钥，用简单规则分类
        return Ok(classify_by_rules(&app_name, &window_title));
    }

    let prompt = format!(
        "请给这个电脑活动分类，只返回分类名称，不要解释。可选分类：工作、学习、娱乐、社交、开发设计、浏览新闻、工具使用。\n应用名称：{}\n窗口标题：{}\n分类：",
        app_name, window_title
    );

    let result = match provider.as_str() {
        "ernie" => call_ernie(&api_key, prompt, &state.http_client).await,
        "doubao" => call_doubao(&api_key, prompt, &state.http_client).await,
        _ => Err(anyhow!("未知AI提供商")),
    };

    match result {
        Ok(category) => Ok(category.trim().to_string()),
        Err(e) => {
            // 如果AI调用失败，回退到规则分类
            Ok(classify_by_rules(&app_name, &window_title))
        }
    }
}

// 百度文心一言调用
async fn call_ernie(api_key: &str, prompt: String, client: &Client) -> Result<String> {
    // 先获取access_token
    let url = format!(
        "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={}",
        api_key
    );
    let token_resp: serde_json::Value = client.get(&url).send().await?.json().await?;
    let access_token = token_resp["access_token"]
        .as_str()
        .ok_or_else(|| anyhow!("获取access_token失败"))?;

    let ai_url = format!(
        "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token={}",
        access_token
    );

    let req = ErnieRequest {
        messages: vec![ErnieMessage {
            role: "user".to_string(),
            content: prompt,
        }],
        temperature: 0.3,
    };

    let resp: ErnieResponse = client.post(&ai_url).json(&req).send().await?.json().await?;

    Ok(resp.result.unwrap_or_else(|| "未分类".to_string()))
}

// 字节豆包调用
async fn call_doubao(api_key: &str, prompt: String, client: &Client) -> Result<String> {
    let url = "https://aquasearch.ai.bytedance.com/api/v1/chat/completions";

    let req = DoubaoRequest {
        model: "doubao-lite-128k".to_string(),
        messages: vec![ErnieMessage {
            role: "user".to_string(),
            content: prompt,
        }],
    };

    let resp = client
        .post(url)
        .bearer_auth(api_key)
        .json(&req)
        .send()
        .await?;

    #[derive(Debug, Deserialize)]
    struct DoubaoResponse {
        choices: Option<Vec<DoubaoChoice>>,
    }

    #[derive(Debug, Deserialize)]
    struct DoubaoChoice {
        message: DoubaoMessage,
    }

    #[derive(Debug, Deserialize)]
    struct DoubaoMessage {
        content: String,
    }

    let resp: serde_json::Value = resp.json().await?;
    let choices = resp["choices"].as_array();

    if let Some(choices) = choices {
        if let Some(first) = choices.first() {
            if let Some(content) = first["message"]["content"].as_str() {
                return Ok(content.to_string());
            }
        }
    }

    Ok("未分类".to_string())
}

// 简单规则分类（AI不可用时回退）
fn classify_by_rules(app_name: &str, _window_title: &str) -> String {
    let app_lower = app_name.to_lowercase();

    // IDE / 编辑器 -> 开发
    if app_lower.contains("vscode") || 
       app_lower.contains("idea") || 
       app_lower.contains("goland") || 
       app_lower.contains("pycharm") ||
       app_lower.contains("neovim") ||
       app_lower.contains("vim") {
        return "开发".to_string();
    }

    // 浏览器 -> 看情况，默认浏览
    if app_lower.contains("chrome") || 
       app_lower.contains("firefox") || 
       app_lower.contains("safari") ||
       app_lower.contains("edge") {
        return "浏览".to_string();
    }

    // 通讯
    if app_lower.contains("wechat") || 
       app_lower.contains("qq") || 
       app_lower.contains("dingtalk") ||
       app_lower.contains("lark") {
        return "社交/通讯".to_string();
    }

    // 视频娱乐
    if app_lower.contains("youtube") || 
       app_lower.contains("bilibili") || 
       app_lower.contains("netflix") ||
       app_lower.contains("potplayer") {
        return "娱乐".to_string();
    }

    // 办公
    if app_lower.contains("word") || 
       app_lower.contains("excel") || 
       app_lower.contains("powerpoint") ||
       app_lower.contains("ppt") {
        return "工作".to_string();
    }

    "其他".to_string()
}

// 加载设置从文件
fn load_settings(state: &Arc<AppState>) -> Result<()> {
    // 实际项目这里从配置文件读取
    Ok(())
}

// 保存设置到文件
fn save_settings_internal(state: &Arc<AppState>) -> Result<()> {
    // 实际项目这里保存到配置文件
    Ok(())
}
