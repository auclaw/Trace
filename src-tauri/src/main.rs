// Rize 中文本地化 - Rust 后端主程序
// AI自动时间追踪 + 今日计划

// 新模块 - 功能特性
pub mod broadcast;
pub mod feature_flags;
pub mod pomodoro;
pub mod idle_detection;

use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use anyhow::{Result, anyhow};
use chrono::{Local, NaiveDate};
use x_win::get_active_window;
use reqwest::Client;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use tauri::AppHandle;

// 数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    pub id: String,
    pub name: String,
    pub window_title: String,
    pub category: Option<String>,
    pub task_id: Option<String>, // 关联到哪个计划任务
    pub start_time_ms: i64,     // 绝对开始时间 Unix 毫秒时间戳
    #[serde(skip, default)]
    pub start_instant: Option<Instant>, // 运行时临时使用，不序列化
    pub duration_minutes: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub ai_api_key: String,
    pub ai_provider: String, // ernie | doubao
    pub auto_start_on_boot: bool,
    pub ignored_applications: Vec<String>, // 忽略列表，这些应用不会被记录
    pub feature_flags: Option<std::collections::HashMap<String, bool>>, // Runtime feature flags
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            ai_api_key: String::new(),
            ai_provider: "ernie".to_string(),
            auto_start_on_boot: true,
            ignored_applications: Vec::new(),
            feature_flags: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RepeatType {
    None,
    Daily,        // 每日重复
    Weekly,       // 每周重复
    Monthly,      // 每月重复
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubTask {
    pub id: String,
    pub title: String,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlannedTask {
    pub id: String,
    pub title: String,       // 任务标题
    pub priority: u8,       // 1-5，1最高优先级
    pub estimated_minutes: f64, // 预估时间（分钟）
    pub actual_minutes: f64,   // 实际已用时间
    pub completed: bool,       // 是否完成
    pub created_at: NaiveDate,
    pub project: Option<String>, // 项目分类
    pub repeat_type: Option<String>, // 重复类型: none/daily/weekly/monthly
    pub subtasks: Option<Vec<SubTask>>, // 子任务
    pub due_date: Option<String>, // 截止日期
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyPlan {
    pub date: NaiveDate,
    pub tasks: Vec<PlannedTask>,
}

#[derive(Debug, Serialize)]
pub struct DailyStats {
    pub total_focus_minutes: f64,
    pub total_categories: usize,
    pub top_category: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct MonthlyDayStat {
    pub day: u32,
    pub total_minutes: f64,
}

#[derive(Debug, Serialize)]
pub struct WeeklyStatItem {
    pub category: String,
    pub duration: f64,
    pub percentage: f64,
}

// 全局状态
#[derive(Clone)]
pub struct AppState {
    activities: Arc<Mutex<Vec<Activity>>>,
    current_loaded_date: Arc<Mutex<NaiveDate>>, // 当前加载的日期，保存时使用
    planned_tasks: Arc<Mutex<Vec<PlannedTask>>>, // 今日计划任务
    settings: Arc<Mutex<Settings>>,
    is_tracking: Arc<Mutex<bool>>,
    http_client: Client,
    current_activity: Arc<Mutex<Option<Activity>>>,
    last_activity_check: Arc<Mutex<Instant>>,
    // New modules for feature flags and realtime broadcast
    pub broadcast_manager: broadcast::BroadcastManager,
    pub pomodoro_timer: pomodoro::PomodoroTimer,
    pub feature_flags: feature_flags::FeatureFlagState,
    pub idle_detector: idle_detection::IdleDetector,
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

// 获取数据目录
fn get_data_dir() -> Result<PathBuf> {
    let home_dir = dirs::data_dir().ok_or_else(|| anyhow!("无法获取数据目录"))?;
    let app_dir = home_dir.join("merize");
    fs::create_dir_all(&app_dir)?;
    Ok(app_dir)
}

// 获取设置文件路径
fn get_settings_path() -> Result<PathBuf> {
    let data_dir = get_data_dir()?;
    Ok(data_dir.join("settings.json"))
}

// 获取活动文件路径按日期
fn get_activities_path(date: NaiveDate) -> Result<PathBuf> {
    let data_dir = get_data_dir()?;
    Ok(data_dir.join(format!("activities_{}.json", date)))
}

// 获取今日计划路径
fn get_daily_plan_path(date: NaiveDate) -> Result<PathBuf> {
    let data_dir = get_data_dir()?;
    Ok(data_dir.join(format!("plan_{}.json", date)))
}

// 加载活动数据
fn load_activities(state: &AppState, date: NaiveDate) -> Result<()> {
    let path = get_activities_path(date)?;
    if !path.exists() {
        *state.activities.lock().unwrap() = Vec::new();
        return Ok(());
    }
    let content = fs::read_to_string(&path)?;
    let activities: Vec<Activity> = serde_json::from_str(&content)?;
    *state.activities.lock().unwrap() = activities;
    *state.current_loaded_date.lock().unwrap() = date;
    Ok(())
}

// 保存活动数据
fn save_activities(state: &AppState) -> Result<()> {
    let _data_dir = get_data_dir()?;
    let current_date = *state.current_loaded_date.lock().unwrap();
    let path = get_activities_path(current_date)?;
    let activities = state.activities.lock().unwrap();
    let json = serde_json::to_string_pretty(&*activities)?;
    fs::write(path, json)?;
    Ok(())
}

// 加载设置
fn load_settings(state: &AppState) -> Result<()> {
    let path = get_settings_path()?;
    if !path.exists() {
        *state.settings.lock().unwrap() = Settings::default();
        return Ok(());
    }
    let content = fs::read_to_string(&path)?;
    let settings: Settings = serde_json::from_str(&content)?;
    *state.settings.lock().unwrap() = settings;
    Ok(())
}

// 保存设置
fn save_settings_internal(state: &AppState) -> Result<()> {
    let path = get_settings_path()?;
    let settings = state.settings.lock().unwrap();
    let json = serde_json::to_string_pretty(&*settings)?;
    fs::write(path, json)?;
    Ok(())
}

// 加载今日计划
fn load_today_tasks(state: &AppState) -> Result<()> {
    let today = Local::now().date_naive();
    let path = get_daily_plan_path(today)?;
    if !path.exists() {
        *state.planned_tasks.lock().unwrap() = Vec::new();
        return Ok(());
    }
    let content = fs::read_to_string(&path)?;
    let plan: DailyPlan = serde_json::from_str(&content)?;
    *state.planned_tasks.lock().unwrap() = plan.tasks;
    Ok(())
}

// 保存今日计划
fn save_today_tasks(state: &AppState) -> Result<()> {
    let today = Local::now().date_naive();
    let path = get_daily_plan_path(today)?;
    let tasks = state.planned_tasks.lock().unwrap();
    let plan = DailyPlan {
        date: today,
        tasks: tasks.clone(),
    };
    let json = serde_json::to_string_pretty(&plan)?;
    fs::write(path, json)?;
    Ok(())
}

// 轮询活动窗口
fn poll_active_window(state: &AppState) -> Result<Option<(String, String, String)>> {
    if !*state.is_tracking.lock().unwrap() {
        return Ok(None);
    }

    let ignored: Vec<String> = {
        let settings = state.settings.lock().unwrap();
        settings.ignored_applications.clone()
    };

    let window_info = match get_active_window() {
        Ok(info) => info,
        Err(_) => return Ok(None),
    };

    // x_win WindowInfo has .info which contains app info
    // For mac, we can extract the app name from the process info
    let app_name = window_info.info.name;
    let window_title = window_info.title;

    // 检查忽略列表
    for ignored_app in &ignored {
        if app_name.contains(ignored_app) {
            return Ok(None);
        }
    }

    let now = Instant::now();
    let last_check = *state.last_activity_check.lock().unwrap();
    let elapsed = now.duration_since(last_check).as_secs_f64();
    *state.last_activity_check.lock().unwrap() = now;

    let mut current_activity = state.current_activity.lock().unwrap();
    let elapsed_minutes = elapsed / 60.0;

    if let Some(ref mut last_activity) = *current_activity {
        // 更新上一个活动时长
        let mut activities = state.activities.lock().unwrap();
        if let Some(activity) = activities.iter_mut().find(|a| a.id == last_activity.id) {
            activity.duration_minutes += elapsed_minutes;
        }
        drop(activities);

        // 如果还是同一个窗口，继续
        if let Some((last_title, last_app)) = last_activity.window_title.split_once(" - ") {
            if last_app == app_name && last_title == window_title {
                return Ok(None);
            }
        }
    }

    // 创建新活动
    let start_time_ms = chrono::Utc::now().timestamp_millis();
    let activity = Activity {
        id: Uuid::new_v4().to_string(),
        name: app_name.clone(),
        window_title: window_title.clone(),
        category: None,
        task_id: None,
        start_time_ms,
        start_instant: Some(now),
        duration_minutes: 0.0,
    };

    let activity_id = activity.id.clone();

    let mut activities = state.activities.lock().unwrap();
    activities.push(activity.clone());
    drop(activities);

    *current_activity = Some(activity);

    Ok(Some((activity_id, window_title, app_name)))
}

// AI自动匹配活动分类
async fn ai_auto_match_activity(
    activity_id: String,
    window_title: String,
    app_name: String,
    state: &AppState,
) -> Result<()> {
    let (api_key, provider) = {
        let settings = state.settings.lock().unwrap();
        (settings.ai_api_key.clone(), settings.ai_provider.clone())
    };

    if api_key.is_empty() {
        return Ok(());
    }

    let category = match provider.as_str() {
        "ernie" => call_ernie(&api_key, format!(
            "请给这个电脑活动分类，只返回分类名称，不要解释。可选分类：工作、学习、娱乐、社交、开发设计、浏览新闻、工具使用。\n应用名称：{}\n窗口标题：{}\n分类：",
            app_name, window_title
        ), &state.http_client).await,
        "doubao" => call_doubao(&api_key, format!(
            "请给这个电脑活动分类，只返回分类名称，不要解释。可选分类：工作、学习、娱乐、社交、开发设计、浏览新闻、工具使用。\n应用名称：{}\n窗口标题：{}\n分类：",
            app_name, window_title
        ), &state.http_client).await,
        _ => Err(anyhow!("未知AI提供商")),
    };

    if let Ok(category) = category {
        let mut activities = state.activities.lock().unwrap();
        if let Some(activity) = activities.iter_mut().find(|a| a.id == activity_id) {
            activity.category = Some(category.trim().to_string());
        }
        drop(activities);
        let _ = save_activities(state);
    }

    Ok(())
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

// 获取今日活动
#[tauri::command]
fn get_today_activities(state: tauri::State<'_, AppState>) -> Result<Vec<Activity>, String> {
    let today = Local::now().date_naive();
    let mut current_loaded = state.current_loaded_date.lock().unwrap();
    if *current_loaded != today {
        drop(current_loaded);
        load_activities(&state, today).map_err(|e| e.to_string())?;
        current_loaded = state.current_loaded_date.lock().unwrap();
        *current_loaded = today;
    }
    drop(current_loaded);

    let activities = state.activities.lock().unwrap();
    Ok(activities.clone())
}

// 获取指定日期活动
#[tauri::command]
fn get_activities_by_date(date_str: String, state: tauri::State<'_, AppState>) -> Result<Vec<Activity>, String> {
    let date = NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
        .map_err(|e| e.to_string())?;

    let mut current_loaded = state.current_loaded_date.lock().unwrap();
    if *current_loaded != date {
        drop(current_loaded);
        load_activities(&state, date).map_err(|e| e.to_string())?;
        current_loaded = state.current_loaded_date.lock().unwrap();
        *current_loaded = date;
    }
    drop(current_loaded);

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

// 获取指定日期统计
#[tauri::command]
fn get_daily_stats_by_date(date_str: String, state: tauri::State<'_, AppState>) -> Result<DailyStats, String> {
    let date = NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
        .map_err(|e| e.to_string())?;

    // 确保加载了指定日期的数据
    let mut current_loaded = state.current_loaded_date.lock().unwrap();
    if *current_loaded != date {
        drop(current_loaded);
        load_activities(&state, date).map_err(|e| e.to_string())?;
        current_loaded = state.current_loaded_date.lock().unwrap();
        *current_loaded = date;
    }
    drop(current_loaded);

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

// 获取月度统计 - 热力图数据，每天总分钟数
#[tauri::command]
fn get_monthly_stats(year: i32, month: u32, _state: tauri::State<'_, AppState>) -> Result<Vec<MonthlyDayStat>, String> {
    let mut result = Vec::new();

    // 获取当月天数
    let num_days = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => if (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) { 29 } else { 28 },
        _ => 30,
    };

    // 遍历每一天
    for day in 1..=num_days {
        let date = NaiveDate::from_ymd_opt(year, month, day)
            .ok_or_else(|| format!("Invalid date: {}-{}-{}", year, month, day))?;
        let path = get_activities_path(date).map_err(|e| e.to_string())?;

        // 如果文件不存在，这天没有记录，跳过或者加0
        if !path.exists() {
            continue;
        }

        // 读取并计算总分钟
        if let Ok(contents) = std::fs::read_to_string(&path) {
            if let Ok(activities) = serde_json::from_str::<Vec<Activity>>(&contents) {
                let total: f64 = activities.iter().map(|a| a.duration_minutes).sum();
                if total > 0.0 {
                    result.push(MonthlyDayStat { day, total_minutes: total });
                }
            }
        }
    }

    Ok(result)
}

// 获取每周统计（最近7天）
#[tauri::command]
fn get_weekly_stats(_state: tauri::State<'_, AppState>) -> Result<Vec<WeeklyStatItem>, String> {
    let mut category_totals: HashMap<String, f64> = HashMap::new();
    let mut total_all = 0.0;

    let today = Local::now().date_naive();

    // 遍历最近7天
    for i in 0..7 {
        let date = today - chrono::Days::new(i);
        let path = get_activities_path(date).map_err(|e| e.to_string())?;

        if path.exists() {
            let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            let activities: Vec<Activity> = serde_json::from_str(&content).map_err(|e| e.to_string())?;

            for activity in activities.iter() {
                if let Some(cat) = &activity.category {
                    *category_totals.entry(cat.clone()).or_default() += activity.duration_minutes;
                    total_all += activity.duration_minutes;
                }
            }
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

// 获取所有历史活动用于导出
#[tauri::command]
fn get_all_activities_export(_state: tauri::State<'_, AppState>) -> Result<Vec<Activity>, String> {
    let mut all_activities: Vec<Activity> = Vec::new();
    let _data_dir = get_data_dir().map_err(|e| e.to_string())?;

    // 读取所有活动文件
    if let Ok(entries) = fs::read_dir(_data_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Some(file_name) = path.file_name().and_then(|f| f.to_str()) {
                if file_name.starts_with("activities_") && file_name.ends_with(".json") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Ok(activities) = serde_json::from_str::<Vec<Activity>>(&content) {
                            all_activities.extend(activities);
                        }
                    }
                }
            }
        }
    }

    Ok(all_activities)
}

// 创建手动活动
#[tauri::command]
fn create_activity(
    name: String,
    window_title: String,
    category: Option<String>,
    start_time_ms: i64,
    duration_minutes: f64,
    state: tauri::State<'_, AppState>,
) -> Result<Activity, String> {
    let activity = Activity {
        id: Uuid::new_v4().to_string(),
        name,
        window_title,
        category,
        task_id: None,
        start_time_ms,
        start_instant: None,
        duration_minutes,
    };

    let mut activities = state.activities.lock().unwrap();
    activities.push(activity.clone());
    drop(activities);

    save_activities(&state).map_err(|e| e.to_string())?;

    Ok(activity)
}

// 更新活动
#[tauri::command]
fn update_activity(
    id: String,
    name: Option<String>,
    window_title: Option<String>,
    category: Option<String>,
    start_time_ms: Option<i64>,
    duration_minutes: Option<f64>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut activities = state.activities.lock().unwrap();
    if let Some(activity) = activities.iter_mut().find(|a| a.id == id) {
        if let Some(new_name) = name {
            activity.name = new_name;
        }
        if let Some(new_title) = window_title {
            activity.window_title = new_title;
        }
        activity.category = category;
        if let Some(new_start) = start_time_ms {
            activity.start_time_ms = new_start;
        }
        if let Some(new_duration) = duration_minutes {
            activity.duration_minutes = new_duration;
        }
    }
    drop(activities);

    save_activities(&state).map_err(|e| e.to_string())?;

    Ok(())
}

// 删除活动
#[tauri::command]
fn delete_activity(id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut activities = state.activities.lock().unwrap();
    activities.retain(|a| a.id != id);
    drop(activities);

    save_activities(&state).map_err(|e| e.to_string())?;

    Ok(())
}

// 更新活动分类
#[tauri::command]
fn update_activity_category(id: String, category: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut activities = state.activities.lock().unwrap();
    if let Some(activity) = activities.iter_mut().find(|a| a.id == id) {
        activity.category = Some(category);
    }
    drop(activities);

    save_activities(&state).map_err(|e| e.to_string())?;

    Ok(())
}

// AI分类活动
#[tauri::command]
async fn classify_activity(
    app_name: String,
    window_title: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let (api_key, provider) = {
        let settings = state.settings.lock().unwrap();
        (settings.ai_api_key.clone(), settings.ai_provider.clone())
    };

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
        Err(_e) => {
            // 如果AI调用失败，回退到规则分类
            Ok(classify_by_rules(&app_name, &window_title))
        }
    }
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
    save_settings_internal(&state).map_err(|e| e.to_string())?;
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

// 获取所有功能特性开关状态
#[tauri::command]
fn get_feature_flags(state: tauri::State<'_, AppState>) -> Vec<(String, bool)> {
    let flags = state.feature_flags.get_all();
    flags.into_iter().map(|(flag, enabled)| (flag.to_key().to_string(), enabled)).collect()
}

// 更新单个功能特性开关
#[tauri::command]
fn set_feature_flag(key: String, enabled: bool, state: tauri::State<'_, AppState>) -> Result<(), String> {
    if let Some(flag) = feature_flags::FeatureFlag::from_key(&key) {
        state.feature_flags.set_enabled(flag, enabled);

        // Save to settings
        let mut settings = state.settings.lock().unwrap();
        let mut map = settings.feature_flags.clone().unwrap_or_default();
        map.insert(key, enabled);
        settings.feature_flags = Some(map);
        drop(settings);

        save_settings_internal(&*state).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("Unknown feature flag: {}", key))
    }
}

// --- 今日计划API ---

// 获取今日计划任务
#[tauri::command]
fn get_today_planned_tasks(state: tauri::State<'_, AppState>) -> Result<Vec<PlannedTask>, String> {
    let tasks = state.planned_tasks.lock().unwrap();
    Ok(tasks.clone())
}

// 添加计划任务
#[tauri::command]
fn add_planned_task(
    title: String,
    priority: u8,
    estimated_minutes: f64,
    project: Option<String>,
    repeat_type: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<PlannedTask, String> {
    let task = PlannedTask {
        id: Uuid::new_v4().to_string(),
        title,
        priority,
        estimated_minutes,
        actual_minutes: 0.0,
        completed: false,
        created_at: Local::now().date_naive(),
        project,
        repeat_type,
        subtasks: None,
        due_date: None,
    };

    let mut tasks = state.planned_tasks.lock().unwrap();
    tasks.push(task.clone());
    drop(tasks);

    save_today_tasks(&state).map_err(|e| e.to_string())?;

    Ok(task)
}

// 更新计划任务
#[tauri::command]
fn update_planned_task(
    id: String,
    title: Option<String>,
    priority: Option<u8>,
    estimated_minutes: Option<f64>,
    actual_minutes: Option<f64>,
    completed: Option<bool>,
    project: Option<Option<String>>,
    repeat_type: Option<Option<String>>,
    subtasks: Option<Option<Vec<SubTask>>>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut tasks = state.planned_tasks.lock().unwrap();
    if let Some(task) = tasks.iter_mut().find(|t| t.id == id) {
        if let Some(new_title) = title {
            task.title = new_title;
        }
        if let Some(new_priority) = priority {
            task.priority = new_priority;
        }
        if let Some(new_est) = estimated_minutes {
            task.estimated_minutes = new_est;
        }
        if let Some(new_actual) = actual_minutes {
            task.actual_minutes = new_actual;
        }
        if let Some(new_completed) = completed {
            task.completed = new_completed;
        }
        if let Some(new_project) = project {
            task.project = new_project;
        }
        if let Some(new_repeat) = repeat_type {
            task.repeat_type = new_repeat;
        }
        if let Some(new_subtasks) = subtasks {
            task.subtasks = new_subtasks;
        }
    }
    drop(tasks);

    save_today_tasks(&state).map_err(|e| e.to_string())?;

    Ok(())
}

// 删除计划任务
#[tauri::command]
fn delete_planned_task(id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut tasks = state.planned_tasks.lock().unwrap();
    tasks.retain(|t| t.id != id);
    drop(tasks);

    save_today_tasks(&state).map_err(|e| e.to_string())?;

    Ok(())
}

// 匹配活动到任务
#[tauri::command]
fn match_activity_to_task(
    activity_id: String,
    task_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut activities = state.activities.lock().unwrap();
    if let Some(activity) = activities.iter_mut().find(|a| a.id == activity_id) {
        activity.task_id = Some(task_id);
    }
    drop(activities);

    save_activities(&state).map_err(|e| e.to_string())?;

    Ok(())
}

// 获取任务实际用时
#[tauri::command]
fn get_task_actual_time(task_id: String, state: tauri::State<'_, AppState>) -> Result<f64, String> {
    let activities = state.activities.lock().unwrap();
    let total: f64 = activities.iter()
        .filter(|a| a.task_id == Some(task_id.clone()))
        .map(|a| a.duration_minutes)
        .sum();
    Ok(total)
}

// AI重新规划任务
#[tauri::command]
async fn ai_reschedule_tasks(
    tasks: Vec<PlannedTask>,
    current_hour: f64,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<PlannedTask>, String> {
    let (api_key, _provider) = {
        let settings = state.settings.lock().unwrap();
        (settings.ai_api_key.clone(), settings.ai_provider.clone())
    };

    if api_key.is_empty() {
        // 没有API密钥，直接按当前优先级返回
        let mut sorted = tasks.clone();
        sorted.sort_by(|a, b| a.priority.cmp(&b.priority));
        return Ok(sorted);
    }

    // 调用后端Python API进行AI重排
    // 我们已经在后端有了完整的实现，直接调用即可
    let client = &state.http_client;

    // 构建请求
    #[derive(Debug, Serialize)]
    struct ReqBody {
        tasks: Vec<serde_json::Value>,
        current_hour: f64,
    }

    // 将tasks转换为JSON值
    let tasks_json: Vec<serde_json::Value> = tasks
        .iter()
        .map(|t| serde_json::to_value(t).unwrap())
        .collect();

    let body = ReqBody {
        tasks: tasks_json,
        current_hour,
    };

    // 假设后端运行在 localhost:5000
    // 用户需要启动后端服务
    match client
        .post("http://localhost:2345/api/ai/reschedule")
        .json(&body)
        .send()
        .await
    {
        Ok(resp) => {
            #[derive(Debug, Deserialize)]
            struct Resp {
                code: i32,
                data: Option<Vec<PlannedTask>>,
                msg: Option<String>,
            }

            match resp.json::<Resp>().await {
                Ok(json_resp) => {
                    if json_resp.code == 200 && json_resp.data.is_some() {
                        Ok(json_resp.data.unwrap())
                    } else {
                        // AI调用失败，返回原排序
                        let mut sorted = tasks.clone();
                        sorted.sort_by(|a, b| a.priority.cmp(&b.priority));
                        Ok(sorted)
                    }
                }
                Err(_) => {
                    // JSON解析失败，返回原排序
                    let mut sorted = tasks.clone();
                    sorted.sort_by(|a, b| a.priority.cmp(&b.priority));
                    Ok(sorted)
                }
            }
        }
        Err(_) => {
            // 后端连接失败，返回原排序
            let mut sorted = tasks.clone();
            sorted.sort_by(|a, b| a.priority.cmp(&b.priority));
            Ok(sorted)
        }
    }
}

// 简单规则分类（AI不可用时回退）
fn classify_by_rules(app_name: &str, window_title: &str) -> String {
    let app_lower = app_name.to_lowercase();
    let title_lower = window_title.to_lowercase();

    // IDE / 编辑器 -> 开发
    if app_lower.contains("vscode") ||
       app_lower.contains("idea") ||
       app_lower.contains("goland") ||
       app_lower.contains("pycharm") ||
       app_lower.contains("clion") ||
       app_lower.contains("webstorm") ||
       app_lower.contains("neovim") ||
       app_lower.contains("vim") ||
       app_lower.contains("emacs") ||
       app_lower.contains("sublime") ||
       app_lower.contains("code") ||
       app_lower.contains("terminal") ||
       app_lower.contains("iterm") ||
       app_lower.contains("ghostty") ||
       app_lower.contains("git") {
        return "开发".to_string();
    }

    // 设计工具
    if app_lower.contains("figma") ||
       app_lower.contains("sketch") ||
       app_lower.contains("photoshop") ||
       app_lower.contains("illustrator") ||
       app_lower.contains("xd") ||
       app_lower.contains("blender") {
        return "设计".to_string();
    }

    // 办公软件
    if app_lower.contains("word") ||
       app_lower.contains("excel") ||
       app_lower.contains("powerpoint") ||
       app_lower.contains("ppt") ||
       app_lower.contains("keynote") ||
       app_lower.contains("pages") ||
       app_lower.contains("numbers") ||
       app_lower.contains("wps") ||
       app_lower.contains("office") {
        return "工作".to_string();
    }

    // 通讯/社交
    if app_lower.contains("wechat") ||
       app_lower.contains("weixin") ||
       app_lower.contains("qq") ||
       app_lower.contains("dingtalk") ||
       app_lower.contains("lark") ||
       app_lower.contains("feishu") ||
       app_lower.contains("企业微信") ||
       app_lower.contains("slack") ||
       app_lower.contains("telegram") ||
       app_lower.contains("discord") {
        return "社交/通讯".to_string();
    }

    // 视频
    if app_lower.contains("youtube") ||
       app_lower.contains("bilibili") ||
       app_lower.contains("netflix") ||
       app_lower.contains("potplayer") ||
       app_lower.contains("mpv") ||
       app_lower.contains("vlc") ||
       app_lower.contains("iina") ||
       app_lower.contains("douyin") ||
       app_lower.contains("tiktok") {
        return "视频".to_string();
    }

    // 音乐
    if app_lower.contains("netease") ||
       app_lower.contains("cloudmusic") ||
       app_lower.contains("qqmusic") ||
       app_lower.contains("spotify") ||
       app_lower.contains("apple music") {
        return "音乐".to_string();
    }

    // 笔记
    if app_lower.contains("notion") ||
       app_lower.contains("obsidian") ||
       app_lower.contains("bear") ||
       app_lower.contains("dayone") ||
       app_lower.contains("印象笔记") ||
       app_lower.contains("evernote") ||
       app_lower.contains("notability") ||
       app_lower.contains("goodnotes") {
        return "笔记".to_string();
    }

    // 浏览器 - 根据标题进一步判断
    if app_lower.contains("chrome") ||
       app_lower.contains("firefox") ||
       app_lower.contains("safari") ||
       app_lower.contains("edge") ||
       app_lower.contains("browser") {

        // 标题中包含开发关键词
        if title_lower.contains("github") ||
           title_lower.contains("gitlab") ||
           title_lower.contains("code") ||
           title_lower.contains("commit") ||
           title_lower.contains("pull request") ||
           title_lower.contains("stackoverflow") ||
           title_lower.contains("stackoverflow") ||
           title_lower.contains("docs.") ||
           title_lower.contains("developer.") {
            return "开发".to_string();
        }

        // 标题包含视频/B站
        if title_lower.contains("bilibili") ||
           title_lower.contains("youtube") ||
           title_lower.contains("douyin") ||
           title_lower.contains("tiktok") ||
           title_lower.contains("视频") {
            return "视频".to_string();
        }

        // 标题包含社交
        if title_lower.contains("weibo") ||
           title_lower.contains("zhihu") ||
           title_lower.contains("twitter") ||
           title_lower.contains("x.com") ||
           title_lower.contains("facebook") ||
           title_lower.contains("instagram") {
            return "社交".to_string();
        }

        // 标题包含购物
        if title_lower.contains("taobao") ||
           title_lower.contains("jd.com") ||
           title_lower.contains("pinduoduo") ||
           title_lower.contains("tmall") {
            return "购物".to_string();
        }

        // 默认浏览
        return "浏览".to_string();
    }

    // 游戏
    if app_lower.contains("steam") ||
       app_lower.contains("game") ||
       app_lower.contains("riot") ||
       app_lower.contains("league") ||
       app_lower.contains("valorant") ||
       app_lower.contains("minecraft") {
        return "娱乐".to_string();
    }

    // 终端
    if app_lower.contains("terminal") ||
       app_lower.contains("iterm") ||
       app_lower.contains("hyper") ||
       app_lower.contains("alacritty") {
        return "开发".to_string();
    }

    "其他".to_string()
}

// 主函数
fn main() {
    // 初始化 tokio runtime 用于异步AI调用
    let rt = tokio::runtime::Runtime::new().unwrap();
    let _guard = rt.enter();

    // 初始化状态
    let today = Local::now().date_naive();
    let state = Arc::new(AppState {
        activities: Arc::new(Mutex::new(Vec::new())),
        current_loaded_date: Arc::new(Mutex::new(today)),
        planned_tasks: Arc::new(Mutex::new(Vec::new())),
        settings: Arc::new(Mutex::new(Settings::default())),
        is_tracking: Arc::new(Mutex::new(false)),
        http_client: Client::new(),
        current_activity: Arc::new(Mutex::new(None)),
        last_activity_check: Arc::new(Mutex::new(Instant::now())),
        // Initialize new modules
        broadcast_manager: broadcast::BroadcastManager::new(),
        pomodoro_timer: pomodoro::PomodoroTimer::new(),
        feature_flags: feature_flags::FeatureFlagState::new(),
        idle_detector: idle_detection::IdleDetector::new(),
    });

    // 克隆状态用于轮询线程
    let state_clone = state.clone();
    let rt_handle = rt.handle().clone();

    // 加载持久化数据：活动和今日计划
    let _ = load_activities(&state, today);
    let _ = load_today_tasks(&state);
    let _ = load_settings(&state);

    // 启动活动轮询线程（每 1 秒检查一次当前窗口）
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_secs(1));
            let result = poll_active_window(&state_clone);
            // 每次轮询后保存活动到文件
            let _ = save_activities(&state_clone);

            // 如果保存了新活动，触发 AI 自动匹配
            if let Ok(Some((activity_id, window_title, app_name))) = result {
                let state_clone2 = state_clone.clone();
                rt_handle.spawn(async move {
                    let _ = ai_auto_match_activity(activity_id, window_title, app_name, &state_clone2).await;
                });
            }
        }
    });

    use tauri::Manager;
    use tauri::menu::{MenuBuilder, MenuItem};
    use tauri::tray::TrayIconBuilder;

    let state_for_setup = state.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None
        ))
        .manage(state)
        .setup(move |app| {
            // state is cloned for setup because state was moved into .manage()
            let state = state_for_setup;
            // state is already defined outside, use it directly
            let is_tracking = *state.is_tracking.lock().unwrap();
            let toggle_label = if is_tracking { "暂停追踪" } else { "开始追踪" };

            // 创建系统托盘菜单 - Tauri 2.0 MenuItem::new(manager, text, enabled, accelerator)
            let show_main_window = MenuItem::new(app, "打开主窗口", true, None::<&str>).unwrap();
            let open_focus_mode = MenuItem::new(app, "专注模式", true, None::<&str>).unwrap();
            let toggle_tracking = MenuItem::new(app, toggle_label, true, None::<&str>).unwrap();
            let quit_app = MenuItem::new(app, "退出应用", true, None::<&str>).unwrap();

            let tray_menu = MenuBuilder::new(app)
                .item(&show_main_window)
                .item(&open_focus_mode)
                .item(&toggle_tracking)
                .separator()
                .item(&quit_app)
                .build()
                .unwrap();

            let _tray = TrayIconBuilder::new()
                .menu(&tray_menu)
                .title(if is_tracking { "🔍 追踪中" } else { "⏸️ 暂停" })
                .build(app);

            // Load feature flags from saved settings
            let settings_guard = state.settings.lock().unwrap();
            if let Some(frontend_flags) = &settings_guard.feature_flags {
                state.feature_flags.merge_from_frontend(frontend_flags);
            }
            drop(settings_guard);

            // Get app handle for background tasks
            let app_handle = app.handle().clone();
            let broadcast_manager = state.broadcast_manager.clone();
            let broadcast_manager_pomodoro = broadcast_manager.clone();

            // Start pomodoro timer background loop
            let pomodoro_timer = state.pomodoro_timer.clone();
            tokio::spawn(async move {
                pomodoro_timer.run_timer_loop(app_handle.clone(), &broadcast_manager_pomodoro).await;
            });

            // Start idle detection background loop if enabled
            if state.feature_flags.is_enabled(feature_flags::FeatureFlag::IdleDetection) {
                let idle_detector = state.idle_detector.clone();
                let state_clone = (*state).clone();
                let app_handle = app.handle().clone();

                std::thread::spawn(move || {
                    let rt = tokio::runtime::Runtime::new().unwrap();
                    rt.block_on(async move {
                        // Handle idle transition: auto-pause tracking
                        let on_idle = |app: &AppHandle| {
                            let mut is_tracking = state_clone.is_tracking.lock().unwrap();
                            if *is_tracking {
                                *is_tracking = false;
                                drop(is_tracking);

                                // Update tray menu
                                let toggle_label = "开始追踪";
                                let show_main_window = tauri::menu::MenuItem::new(app, "打开主窗口", true, None::<&str>).unwrap();
                                let open_focus_mode = tauri::menu::MenuItem::new(app, "专注模式", true, None::<&str>).unwrap();
                                let toggle_tracking = tauri::menu::MenuItem::new(app, toggle_label, true, None::<&str>).unwrap();
                                let quit_app = tauri::menu::MenuItem::new(app, "退出应用", true, None::<&str>).unwrap();

                                let tray_menu = tauri::menu::MenuBuilder::new(app)
                                    .item(&show_main_window)
                                    .item(&open_focus_mode)
                                    .item(&toggle_tracking)
                                    .separator()
                                    .item(&quit_app)
                                    .build()
                                    .unwrap();

                                let _ = tauri::tray::TrayIconBuilder::new()
                                    .menu(&tray_menu)
                                    .title("⏸️ 暂停 (空闲)")
                                    .build(app);
                            }
                        };

                        // Handle active transition: auto-resume tracking if configured
                        let on_active = |app: &AppHandle| {
                            let _settings = state_clone.settings.lock().unwrap();
                            let auto_resume = true; // Default: auto-resume enabled
                            if auto_resume {
                                let mut is_tracking = state_clone.is_tracking.lock().unwrap();
                                if !*is_tracking {
                                    *is_tracking = true;
                                    drop(is_tracking);

                                    // Update tray menu
                                    let toggle_label = "暂停追踪";
                                    let show_main_window = tauri::menu::MenuItem::new(app, "打开主窗口", true, None::<&str>).unwrap();
                                    let open_focus_mode = tauri::menu::MenuItem::new(app, "专注模式", true, None::<&str>).unwrap();
                                    let toggle_tracking = tauri::menu::MenuItem::new(app, toggle_label, true, None::<&str>).unwrap();
                                    let quit_app = tauri::menu::MenuItem::new(app, "退出应用", true, None::<&str>).unwrap();

                                    let tray_menu = tauri::menu::MenuBuilder::new(app)
                                        .item(&show_main_window)
                                        .item(&open_focus_mode)
                                        .item(&toggle_tracking)
                                        .separator()
                                        .item(&quit_app)
                                        .build()
                                        .unwrap();

                                    let _ = tauri::tray::TrayIconBuilder::new()
                                        .menu(&tray_menu)
                                        .title("🔍 追踪中")
                                        .build(app);
                                }
                            }
                        };

                        idle_detector.run_detection_loop(app_handle, &broadcast_manager, on_idle, on_active).await;
                    });
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_today_activities,
            get_activities_by_date,
            get_today_stats,
            get_daily_stats_by_date,
            get_monthly_stats,
            get_weekly_stats,
            get_all_activities_export,
            create_activity,
            update_activity,
            delete_activity,
            update_activity_category,
            get_settings,
            save_settings,
            toggle_tracking,
            check_tracking_status,
            classify_activity,
            // 新增：Feature flags
            get_feature_flags,
            set_feature_flag,
            // 新增：今日计划API
            get_today_planned_tasks,
            add_planned_task,
            update_planned_task,
            delete_planned_task,
            match_activity_to_task,
            get_task_actual_time,
            ai_reschedule_tasks,
            // 新增：Pomodoro commands
            pomodoro::get_pomodoro_state,
            pomodoro::start_pomodoro,
            pomodoro::pause_pomodoro,
            pomodoro::reset_pomodoro,
            pomodoro::stop_pomodoro,
        ])
        .on_tray_icon_event(|_tray, _event| {
            // 默认已经处理点击弹出菜单
        })
        .on_menu_event(|app_handle, event| {
            // In Tauri 2, the id string is the text we gave it
            match event.id().0.as_str() {
                "打开主窗口" => {
                    // 显示主窗口
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    } else {
                        // Tauri 2.0 WebviewWindowBuilder::new(manager, label, url)
                        let _ = tauri::webview::WebviewWindowBuilder::new(
                            app_handle,
                            "main",
                            tauri::WebviewUrl::default()
                        )
                            .title("Merize")
                            .inner_size(1024.0, 768.0)
                            .build();
                    }
                }
                "专注模式" => {
                    // 打开专注模式窗口（复用主窗口，导航到focus路由）
                    if let Some(window) = app_handle.get_webview_window("main") {
                        // 已经是同一个窗口，只需要显示，前端会处理路由
                        let _ = window.show();
                        let _ = window.set_focus();
                        // 注意：JS端需要处理，但由于我们是单页应用，用户打开后会看到路由入口，可以点击进入
                    } else {
                        let _ = tauri::webview::WebviewWindowBuilder::new(
                            app_handle,
                            "main",
                            tauri::WebviewUrl::default()
                        )
                            .title("Merize - 专注模式")
                            .inner_size(800.0, 600.0)
                            .build();
                    }
                }
                "暂停追踪" | "开始追踪" => {
                    // 获取当前状态并切换
                    let state = app_handle.try_state::<AppState>().unwrap();
                    let mut is_tracking = state.is_tracking.lock().unwrap();
                    *is_tracking = !*is_tracking;
                    let new_status = *is_tracking;
                    drop(is_tracking);

                    // 更新托盘菜单和标题
                    let toggle_label = if new_status { "暂停追踪" } else { "开始追踪" };
                    let title = if new_status { "🔍 追踪中" } else { "⏸️ 暂停" };

                    let show_main_window = MenuItem::new(app_handle, "打开主窗口", true, None::<&str>).unwrap();
                    let open_focus_mode = MenuItem::new(app_handle, "专注模式", true, None::<&str>).unwrap();
                    let toggle_tracking = MenuItem::new(app_handle, toggle_label, true, None::<&str>).unwrap();
                    let quit_app = MenuItem::new(app_handle, "退出应用", true, None::<&str>).unwrap();

                    let tray_menu = MenuBuilder::new(app_handle)
                        .item(&show_main_window)
                        .item(&open_focus_mode)
                        .item(&toggle_tracking)
                        .separator()
                        .item(&quit_app)
                        .build()
                        .unwrap();

                    // 更新托盘
                    let _ = TrayIconBuilder::new()
                        .menu(&tray_menu)
                        .title(title)
                        .build(app_handle);
                }
                "退出应用" => {
                    app_handle.exit(0);
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
