//! Multi-subscriber broadcast channel
//! Used for sending state updates (like pomodoro ticks) to multiple frontend subscribers

use std::sync::{Arc, Mutex};
use std::collections::HashMap;

type Callback = Arc<dyn Fn(&tauri::AppHandle, serde_json::Value) + Send + Sync>;

/// Broadcast channel for sending events to multiple subscribers
#[derive(Clone, Default)]
pub struct BroadcastChannel {
    subscribers: Arc<Mutex<HashMap<String, Callback>>>,
}

impl BroadcastChannel {
    /// Create a new broadcast channel
    pub fn new() -> Self {
        Self {
            subscribers: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Subscribe to the broadcast channel
    /// Returns the subscription ID for unsubscription
    pub fn subscribe(&self, id: String, callback: Callback) {
        let mut subs = self.subscribers.lock().unwrap();
        subs.insert(id, callback);
    }

    /// Unsubscribe from the broadcast channel
    pub fn unsubscribe(&self, id: &str) {
        let mut subs = self.subscribers.lock().unwrap();
        subs.remove(id);
    }

    /// Broadcast an event to all subscribers
    pub fn broadcast(&self, app_handle: &tauri::AppHandle, event: serde_json::Value) {
        let subs = self.subscribers.lock().unwrap();

        for (_, callback) in subs.iter() {
            callback(app_handle, event.clone());
        }
    }

    /// Get the number of current subscribers
    pub fn count(&self) -> usize {
        let subs = self.subscribers.lock().unwrap();
        subs.len()
    }
}

/// Global broadcast channels for different event types
#[derive(Clone, Default)]
pub struct BroadcastManager {
    pomodoro_tick: Arc<BroadcastChannel>,
    pomodoro_state_change: Arc<BroadcastChannel>,
    idle_state_change: Arc<BroadcastChannel>,
    tracking_state_change: Arc<BroadcastChannel>,
}

impl BroadcastManager {
    pub fn new() -> Self {
        Self {
            pomodoro_tick: Arc::new(BroadcastChannel::new()),
            pomodoro_state_change: Arc::new(BroadcastChannel::new()),
            idle_state_change: Arc::new(BroadcastChannel::new()),
            tracking_state_change: Arc::new(BroadcastChannel::new()),
        }
    }

    /// Get the pomodoro tick broadcast channel
    pub fn pomodoro_tick(&self) -> &Arc<BroadcastChannel> {
        &self.pomodoro_tick
    }

    /// Get the pomodoro state change broadcast channel
    pub fn pomodoro_state_change(&self) -> &Arc<BroadcastChannel> {
        &self.pomodoro_state_change
    }

    /// Get the idle state change broadcast channel
    pub fn idle_state_change(&self) -> &Arc<BroadcastChannel> {
        &self.idle_state_change
    }

    /// Get the tracking state change broadcast channel
    pub fn tracking_state_change(&self) -> &Arc<BroadcastChannel> {
        &self.tracking_state_change
    }
}
