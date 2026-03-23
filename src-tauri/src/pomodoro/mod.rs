//! Pomodoro timer - runs in Rust backend for accuracy
//! Sends tick events via broadcast channel to frontend

use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::time::sleep;
use serde::{Serialize, Deserialize};
use tauri::AppHandle;
use crate::broadcast::BroadcastManager;

/// Pomodoro timer state
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PomodoroState {
    Idle,
    Running,
    Paused,
    Break,
    LongBreak,
}

impl Default for PomodoroState {
    fn default() -> Self {
        Self::Idle
    }
}

/// Pomodoro configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PomodoroConfig {
    /// Work duration in minutes
    pub work_minutes: u32,
    /// Short break duration in minutes
    pub break_minutes: u32,
    /// Long break duration in minutes
    pub long_break_minutes: u32,
    /// Number of sessions before long break
    pub sessions_before_long_break: u32,
}

impl Default for PomodoroConfig {
    fn default() -> Self {
        Self {
            work_minutes: 25,
            break_minutes: 5,
            long_break_minutes: 15,
            sessions_before_long_break: 4,
        }
    }
}

/// Current pomodoro timer data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PomodoroData {
    pub state: PomodoroState,
    pub remaining_seconds: u32,
    pub total_seconds: u32,
    pub completed_sessions: u32,
    pub progress_percent: f64,
}

impl Default for PomodoroData {
    fn default() -> Self {
        let config = PomodoroConfig::default();
        let total_seconds = config.work_minutes * 60;
        Self {
            state: PomodoroState::Idle,
            remaining_seconds: total_seconds,
            total_seconds,
            completed_sessions: 0,
            progress_percent: 0.0,
        }
    }
}

/// Thread-safe pomodoro timer
#[derive(Clone, Default)]
pub struct PomodoroTimer {
    config: Arc<PomodoroConfig>,
    data: Arc<Mutex<PomodoroData>>,
    stop_signal: Arc<Mutex<bool>>,
}

impl PomodoroTimer {
    /// Create a new pomodoro timer with default config
    pub fn new() -> Self {
        Self::with_config(PomodoroConfig::default())
    }

    /// Create a new pomodoro timer with custom config
    pub fn with_config(config: PomodoroConfig) -> Self {
        let total_seconds = config.work_minutes * 60;
        Self {
            config: Arc::new(config),
            data: Arc::new(Mutex::new(PomodoroData {
                state: PomodoroState::Idle,
                remaining_seconds: total_seconds,
                total_seconds,
                completed_sessions: 0,
                progress_percent: 0.0,
            })),
            stop_signal: Arc::new(Mutex::new(false)),
        }
    }

    /// Start the pomodoro timer (work session)
    pub fn start(&self) {
        let mut data = self.data.lock().unwrap();
        let mut stop = self.stop_signal.lock().unwrap();

        *stop = false;

        if data.state == PomodoroState::Idle || data.state == PomodoroState::Break || data.state == PomodoroState::LongBreak {
            // Start new work session
            let total_seconds = self.config.work_minutes * 60;
            data.state = PomodoroState::Running;
            data.remaining_seconds = total_seconds;
            data.total_seconds = total_seconds;
            data.progress_percent = 0.0;
        } else if data.state == PomodoroState::Paused {
            // Resume from pause
            data.state = PomodoroState::Running;
        }

        drop(data);
        drop(stop);
    }

    /// Pause the timer
    pub fn pause(&self) {
        let mut data = self.data.lock().unwrap();
        if data.state == PomodoroState::Running {
            data.state = PomodoroState::Paused;
        }
    }

    /// Reset the timer to current session start
    pub fn reset(&self) {
        let mut data = self.data.lock().unwrap();
        let total_seconds = match data.state {
            PomodoroState::Running | PomodoroState::Paused | PomodoroState::Idle => {
                self.config.work_minutes * 60
            }
            PomodoroState::Break => self.config.break_minutes * 60,
            PomodoroState::LongBreak => self.config.long_break_minutes * 60,
        };
        data.remaining_seconds = total_seconds;
        data.total_seconds = total_seconds;
        data.progress_percent = 0.0;
        if data.state != PomodoroState::Idle {
            data.state = PomodoroState::Idle;
        }
    }

    /// Stop the timer completely
    pub fn stop(&self) {
        let mut stop = self.stop_signal.lock().unwrap();
        *stop = true;
        let mut data = self.data.lock().unwrap();
        data.state = PomodoroState::Idle;
    }

    /// Get current timer data
    pub fn get_data(&self) -> PomodoroData {
        let data = self.data.lock().unwrap();
        data.clone()
    }

    /// Update remaining time (called every second by the timer loop)
    fn tick(&self) -> bool {
        // Returns true if timer should continue, false if completed
        let mut data = self.data.lock().unwrap();

        if data.remaining_seconds > 0 {
            data.remaining_seconds -= 1;
            data.progress_percent = 100.0 * (1.0 - data.remaining_seconds as f64 / data.total_seconds as f64);
            true
        } else {
            // Session completed
            self.complete_session(&mut data);
            false
        }
    }

    /// Called when a session completes
    fn complete_session(&self, data: &mut PomodoroData) {
        match data.state {
            PomodoroState::Running => {
                // Work session completed
                data.completed_sessions += 1;
                let is_long_break = data.completed_sessions % self.config.sessions_before_long_break == 0;
                let total_seconds = if is_long_break {
                    data.state = PomodoroState::LongBreak;
                    self.config.long_break_minutes * 60
                } else {
                    data.state = PomodoroState::Break;
                    self.config.break_minutes * 60
                };
                data.remaining_seconds = total_seconds;
                data.total_seconds = total_seconds;
                data.progress_percent = 0.0;
            }
            PomodoroState::Break | PomodoroState::LongBreak => {
                // Break completed, start new work session
                data.state = PomodoroState::Running;
                let total_seconds = self.config.work_minutes * 60;
                data.remaining_seconds = total_seconds;
                data.total_seconds = total_seconds;
                data.progress_percent = 0.0;
            }
            _ => {}
        }
    }

    /// Start the async timer loop that runs in background
    pub async fn run_timer_loop(&self, app_handle: AppHandle, broadcast: &BroadcastManager) {
        let stop_signal = self.stop_signal.clone();

        loop {
            // Check if we should stop
            {
                let stop = stop_signal.lock().unwrap();
                if *stop {
                    break;
                }
            }

            let data = self.get_data();

            match data.state {
                PomodoroState::Running | PomodoroState::Break | PomodoroState::LongBreak => {
                    // Tick once per second
                    sleep(Duration::from_secs(1)).await;

                    // Check stop again after sleep
                    {
                        let stop = stop_signal.lock().unwrap();
                        if *stop {
                            break;
                        }
                    }

                    let should_continue = self.tick();
                    let updated_data = self.get_data();

                    // Broadcast tick event
                    let event = serde_json::to_value(updated_data.clone()).unwrap();
                    broadcast.pomodoro_tick().broadcast(&app_handle, event);

                    if !should_continue {
                        // Session completed, broadcast state change
                        let state_event = serde_json::to_value(updated_data).unwrap();
                        broadcast.pomodoro_state_change().broadcast(&app_handle, state_event);
                    }
                }
                PomodoroState::Paused | PomodoroState::Idle => {
                    // Sleep for a bit and check again
                    sleep(Duration::from_millis(500)).await;
                }
            }
        }

        tracing::debug!("Pomodoro timer loop stopped");
    }
}

/// Tauri command to get current pomodoro state
#[tauri::command]
pub fn get_pomodoro_state(timer: tauri::State<'_, PomodoroTimer>) -> PomodoroData {
    timer.get_data()
}

/// Tauri command to start pomodoro
#[tauri::command]
pub fn start_pomodoro(timer: tauri::State<'_, PomodoroTimer>) {
    timer.start();
}

/// Tauri command to pause pomodoro
#[tauri::command]
pub fn pause_pomodoro(timer: tauri::State<'_, PomodoroTimer>) {
    timer.pause();
}

/// Tauri command to reset pomodoro
#[tauri::command]
pub fn reset_pomodoro(timer: tauri::State<'_, PomodoroTimer>) {
    timer.reset();
}

/// Tauri command to stop pomodoro
#[tauri::command]
pub fn stop_pomodoro(timer: tauri::State<'_, PomodoroTimer>) {
    timer.stop();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = PomodoroConfig::default();
        assert_eq!(config.work_minutes, 25);
        assert_eq!(config.break_minutes, 5);
    }

    #[test]
    fn test_start_work_session() {
        let timer = PomodoroTimer::new();
        timer.start();
        let data = timer.get_data();
        assert_eq!(data.state, PomodoroState::Running);
        assert_eq!(data.remaining_seconds, 25 * 60);
    }

    #[test]
    fn test_pause_resume() {
        let timer = PomodoroTimer::new();
        timer.start();
        timer.pause();
        let data = timer.get_data();
        assert_eq!(data.state, PomodoroState::Paused);
        timer.start();
        let data = timer.get_data();
        assert_eq!(data.state, PomodoroState::Running);
    }

    #[test]
    fn test_reset() {
        let timer = PomodoroTimer::new();
        timer.start();
        let mut data = timer.get_data();
        // Simulate some ticks
        for _ in 0..100 {
            timer.tick();
        }
        data = timer.get_data();
        assert!(data.remaining_seconds < 25 * 60);
        timer.reset();
        data = timer.get_data();
        assert_eq!(data.remaining_seconds, 25 * 60);
        assert_eq!(data.state, PomodoroState::Idle);
    }

    #[test]
    fn test_tick_reduces_remaining() {
        let timer = PomodoroTimer::new();
        timer.start();
        let initial = timer.get_data().remaining_seconds;
        let should_continue = timer.tick();
        assert!(should_continue);
        let after = timer.get_data().remaining_seconds;
        assert_eq!(after, initial - 1);
    }
}
