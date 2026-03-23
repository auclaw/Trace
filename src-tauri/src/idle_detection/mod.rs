//! Cross-platform idle detection
//! Detects when user is idle (no keyboard/mouse input)
//! Auto-pauses tracking after configurable idle time, auto-resumes when user returns

use std::sync::{Arc, Mutex};
use std::time::Duration;
use serde::{Serialize, Deserialize};
use tauri::AppHandle;
use anyhow::Result;
use crate::broadcast::BroadcastManager;

// Platform-specific implementations are inline below
#[cfg(target_os = "macos")]
#[path = "macos.rs"]
mod macos;
#[cfg(target_os = "macos")]
use macos::get_idle_time as platform_get_idle_time;

#[cfg(target_os = "windows")]
#[path = "windows.rs"]
mod windows;
#[cfg(target_os = "windows")]
use windows::get_idle_time as platform_get_idle_time;

#[cfg(target_os = "linux")]
#[path = "linux.rs"]
mod linux;
#[cfg(target_os = "linux")]
use linux::get_idle_time as platform_get_idle_time;

/// Idle detection configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdleConfig {
    /// Idle threshold in minutes
    pub idle_threshold_minutes: u32,
    /// Should auto-resume when user returns
    pub auto_resume: bool,
}

impl Default for IdleConfig {
    fn default() -> Self {
        Self {
            idle_threshold_minutes: 5,
            auto_resume: true,
        }
    }
}

/// Idle detection state
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum IdleState {
    Active,
    Idle,
}

impl Default for IdleState {
    fn default() -> Self {
        Self::Active
    }
}

/// Cross-platform idle detector
#[derive(Clone, Default)]
pub struct IdleDetector {
    config: Arc<IdleConfig>,
    state: Arc<Mutex<IdleState>>,
    last_state: Arc<Mutex<IdleState>>,
    stop_signal: Arc<Mutex<bool>>,
}

impl IdleDetector {
    /// Create a new idle detector with default config
    pub fn new() -> Self {
        Self::with_config(IdleConfig::default())
    }

    /// Create a new idle detector with custom config
    pub fn with_config(config: IdleConfig) -> Self {
        Self {
            config: Arc::new(config),
            state: Arc::new(Mutex::new(IdleState::Active)),
            last_state: Arc::new(Mutex::new(IdleState::Active)),
            stop_signal: Arc::new(Mutex::new(false)),
        }
    }

    /// Get current idle state
    pub fn get_state(&self) -> IdleState {
        let state = self.state.lock().unwrap();
        state.clone()
    }

    /// Get current idle time in seconds
    pub fn get_idle_seconds(&self) -> Result<u64> {
        match platform_get_idle_time() {
            Ok(idle_secs) => Ok(idle_secs),
            Err(e) => Err(e),
        }
    }

    /// Check if user is currently idle
    pub fn is_idle(&self) -> Result<bool> {
        let idle_secs = self.get_idle_seconds()?;
        let threshold_secs = (self.config.idle_threshold_minutes * 60) as u64;
        Ok(idle_secs >= threshold_secs)
    }

    /// Force set idle state (for external control)
    pub fn set_state(&self, new_state: IdleState) {
        let mut state = self.state.lock().unwrap();
        *state = new_state;
    }

    /// Stop the detection loop
    pub fn stop(&self) {
        let mut stop = self.stop_signal.lock().unwrap();
        *stop = true;
    }

    /// Start the background detection loop
    pub async fn run_detection_loop<Fidle, Factive>(&self, app_handle: AppHandle, broadcast: &BroadcastManager, mut on_idle: Fidle, mut on_active: Factive)
    where
        Fidle: FnMut(&AppHandle) -> (),
        Factive: FnMut(&AppHandle) -> (),
    {
        let stop_signal = self.stop_signal.clone();
        let state = self.state.clone();
        let last_state = self.last_state.clone();

        tracing::debug!("Starting idle detection loop");

        loop {
            // Check if we should stop
            {
                let stop = stop_signal.lock().unwrap();
                if *stop {
                    break;
                }
            }

            // Check current idle state
            let current_is_idle = match self.is_idle() {
                Ok(idle) => idle,
                Err(e) => {
                    tracing::error!("Failed to check idle state: {}", e);
                    // On error, assume active to avoid false pauses
                    false
                }
            };

            let current_state = if current_is_idle { IdleState::Idle } else { IdleState::Active };

            // Check for state transition
            let mut state_guard = state.lock().unwrap();
            let mut last_guard = last_state.lock().unwrap();

            if *state_guard != current_state {
                *state_guard = current_state.clone();

                match current_state {
                    IdleState::Idle => {
                        tracing::info!("User became idle, triggering auto-pause");
                        on_idle(&app_handle);
                        broadcast.idle_state_change().broadcast(&app_handle, serde_json::json!({
                            "state": "idle",
                            "idle_seconds": self.get_idle_seconds().unwrap_or(0)
                        }));
                    }
                    IdleState::Active => {
                        if *last_guard == IdleState::Idle {
                            tracing::info!("User returned from idle, triggering auto-resume");
                            on_active(&app_handle);
                            broadcast.idle_state_change().broadcast(&app_handle, serde_json::json!({
                                "state": "active",
                                "idle_seconds": self.get_idle_seconds().unwrap_or(0)
                            }));
                        }
                    }
                }
            }

            *last_guard = current_state;
            drop(state_guard);
            drop(last_guard);

            // Check every second
            tokio::time::sleep(Duration::from_secs(1)).await;
        }

        tracing::debug!("Idle detection loop stopped");
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = IdleConfig::default();
        assert_eq!(config.idle_threshold_minutes, 5);
        assert!(config.auto_resume);
    }

    #[test]
    fn test_default_state() {
        let detector = IdleDetector::new();
        assert_eq!(detector.get_state(), IdleState::Active);
    }

    #[test]
    fn test_set_state() {
        let detector = IdleDetector::new();
        detector.set_state(IdleState::Idle);
        assert_eq!(detector.get_state(), IdleState::Idle);
        detector.set_state(IdleState::Active);
        assert_eq!(detector.get_state(), IdleState::Active);
    }

    // Platform-specific test - will pass on all platforms since it just checks it doesn't panic
    #[test]
    fn test_get_idle_time_doesnt_panic() {
        // This might fail if platform doesn't support, but shouldn't panic
        let _ = platform_get_idle_time();
    }
}
