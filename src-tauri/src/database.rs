//! SQLite database module for local data persistence
//! - activities: 追踪活动记录
//! - tasks: 计划任务
//! - habits: 习惯追踪
//! - focus_sessions: 专注会话
//! - pet: 虚拟宠物数据
//! - settings: 用户设置

use serde::{Serialize, Deserialize};
use tauri_plugin_sql::Migration;

// Database migrations
pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "Create core tables ",
            kind: tauri_plugin_sql::MigrationKind::Up,
            sql: r###"
-- Activities table - tracked window activities
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    user_id INTEGER DEFAULT 1,
    name TEXT NOT NULL,
    window_title TEXT,
    category TEXT,
    start_time_ms INTEGER NOT NULL,
    duration_minutes REAL NOT NULL,
    is_manual INTEGER DEFAULT 0,
    is_ai_classified INTEGER DEFAULT 0,
    ai_approved INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table - planned tasks
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority INTEGER DEFAULT 3,
    estimated_minutes INTEGER DEFAULT 0,
    actual_minutes REAL DEFAULT 0,
    status TEXT DEFAULT "pending",
    due_date TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habits table - habit tracking
CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_id INTEGER DEFAULT 1,
    name TEXT NOT NULL,
    icon TEXT,
    target_minutes INTEGER DEFAULT 0,
    target_count INTEGER DEFAULT 1,
    color TEXT,
    streak INTEGER DEFAULT 0,
    category TEXT,
    reminders TEXT, -- JSON array of HH:mm
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habit checkins table
CREATE TABLE IF NOT EXISTS habit_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id TEXT NOT NULL,
    user_id INTEGER DEFAULT 1,
    checkin_date TEXT NOT NULL,
    value REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habit_id) REFERENCES habits(id)
);

-- Focus sessions table - pomodoro/focus sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER DEFAULT 1,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration INTEGER NOT NULL,
    type TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pet table - virtual pet data
CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1 UNIQUE,
    pet_type TEXT DEFAULT "cat",
    name TEXT DEFAULT "Trace",
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    hunger INTEGER DEFAULT 100,
    mood INTEGER DEFAULT 100,
    coins INTEGER DEFAULT 0,
    last_fed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_interacted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decoration TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table - user app settings
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    user_id INTEGER DEFAULT 1 UNIQUE,
    theme TEXT DEFAULT "light",
    color_theme TEXT DEFAULT "blue",
    background_skin TEXT DEFAULT "default",
    daily_goal_minutes INTEGER DEFAULT 480,
    language TEXT DEFAULT "zh-CN",
    ai_api_key TEXT,
    ai_provider TEXT DEFAULT "ernie",
    auto_start_on_boot INTEGER DEFAULT 1,
    blocked_patterns TEXT, -- JSON array
    feature_flags TEXT, -- JSON object
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time blocks table - planned time blocks
CREATE TABLE IF NOT EXISTS time_blocks (
    id TEXT PRIMARY KEY,
    user_id INTEGER DEFAULT 1,
    task_id TEXT,
    title TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category TEXT,
    notes TEXT,
    date TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Blocked patterns - distraction blocking
CREATE TABLE IF NOT EXISTS blocked_patterns (
    id TEXT PRIMARY KEY,
    user_id INTEGER DEFAULT 1,
    pattern TEXT NOT NULL,
    type TEXT NOT NULL, -- domain or app
    enabled INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracking rules - custom classification rules
CREATE TABLE IF NOT EXISTS tracking_rules (
    id TEXT PRIMARY KEY,
    user_id INTEGER DEFAULT 1,
    app_name TEXT NOT NULL,
    title_keyword TEXT,
    url_pattern TEXT,
    target_category TEXT NOT NULL,
    priority INTEGER DEFAULT 5,
    created_at TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User overrides - learned classification preferences
CREATE TABLE IF NOT EXISTS classification_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    app_name TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, app_name, title)
);
"###,
            },
            Migration {
                version: 2,
                description: "Add default settings row ",
                kind: tauri_plugin_sql::MigrationKind::Up,
                sql: r###"
INSERT OR IGNORE INTO settings (id, user_id) VALUES (1, 1);
INSERT OR IGNORE INTO pets (id, user_id) VALUES (1, 1);
"###,
            },
        ]
    }

// Rust types for database rows
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbActivity {
    pub id: String,
    pub name: String,
    pub window_title: Option<String>,
    pub category: Option<String>,
    pub start_time_ms: i64,
    pub duration_minutes: f64,
    pub is_manual: i32,
    pub is_ai_classified: Option<i32>,
    pub ai_approved: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbTask {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub priority: u8,
    pub estimated_minutes: i32,
    pub actual_minutes: f64,
    pub status: String,
    pub due_date: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbHabit {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub target_minutes: i32,
    pub target_count: i32,
    pub color: Option<String>,
    pub streak: i32,
    pub category: Option<String>,
    pub reminders: Option<String>, // JSON
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbHabitCheckin {
    pub id: i32,
    pub habit_id: String,
    pub checkin_date: String,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbFocusSession {
    pub id: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration: i32,
    pub r#type: String,
    pub completed: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbPet {
    pub pet_type: String,
    pub name: String,
    pub level: i32,
    pub experience: i32,
    pub hunger: i32,
    pub mood: i32,
    pub coins: i32,
    pub last_fed: String,
    pub last_interacted: String,
    pub decoration: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbSettings {
    pub theme: String,
    pub color_theme: String,
    pub background_skin: String,
    pub daily_goal_minutes: i32,
    pub language: String,
    pub ai_api_key: Option<String>,
    pub ai_provider: Option<String>,
    pub auto_start_on_boot: i32,
    pub blocked_patterns: Option<String>,
    pub feature_flags: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbTimeBlock {
    pub id: String,
    pub task_id: Option<String>,
    pub title: String,
    pub start_time: String,
    pub end_time: String,
    pub duration_minutes: i32,
    pub category: Option<String>,
    pub notes: Option<String>,
    pub date: String,
    pub is_completed: i32,
}

// Helper functions
// NOTE: Default data is already inserted by migration v2 (INSERT OR IGNORE)
// pub async fn init_default_data(pool: &DbPool) -> Result<()> {
//     // Check if settings exist
//     let mut conn = pool.acquire().await?;
//     let result: Result<Option<i32>, _> = sqlx::query_scalar!(
//         "SELECT id FROM settings WHERE id = 1"
//     )
//     .fetch_optional(&mut *conn)
//     .await;
//
//     if result.is_ok() && result.unwrap().is_none() {
//         // Insert default settings
//         sqlx::query!(
//             r###"
// INSERT INTO settings (id, user_id, theme, color_theme, background_skin, daily_goal_minutes, language, auto_start_on_boot) VALUES (1, 1, "light", "blue", "default", 480, "zh-CN", 1)
// "###
//         )
//         .execute(&mut *conn)
//         .await?;
//     }
//
//     // Check if pet exists
//     let pet_result: Result<Option<i32>, _> = sqlx::query_scalar!(
//         "SELECT id FROM pets WHERE user_id = 1"
//     )
//     .fetch_optional(&mut *conn)
//     .await;
//
//     if pet_result.is_ok() && pet_result.unwrap().is_none() {
//         sqlx::query!(
//             r###"
// INSERT INTO pets (id, user_id, pet_type, name) VALUES (1, 1, "cat", "Trace")
// "###
//         )
//         .execute(&mut *conn)
//         .await?;
//     }
//
//     Ok(())
// }
