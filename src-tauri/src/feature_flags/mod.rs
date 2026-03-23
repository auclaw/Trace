//! Runtime feature flags
//! Stores feature flag state, loads from settings, saves back to settings

use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// All available feature flags
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum FeatureFlag {
    KeyboardShortcuts,
    FocusMode,
    Pomodoro,
    PdfExport,
    OnboardingTour,
    IdleDetection,
}

impl FeatureFlag {
    /// Convert from string key
    pub fn from_key(key: &str) -> Option<Self> {
        match key {
            "keyboardShortcuts" => Some(Self::KeyboardShortcuts),
            "focusMode" => Some(Self::FocusMode),
            "pomodoro" => Some(Self::Pomodoro),
            "pdfExport" => Some(Self::PdfExport),
            "onboardingTour" => Some(Self::OnboardingTour),
            "idleDetection" => Some(Self::IdleDetection),
            _ => None,
        }
    }

    /// Convert to string key
    pub fn to_key(&self) -> &'static str {
        match self {
            Self::KeyboardShortcuts => "keyboardShortcuts",
            Self::FocusMode => "focusMode",
            Self::Pomodoro => "pomodoro",
            Self::PdfExport => "pdfExport",
            Self::OnboardingTour => "onboardingTour",
            Self::IdleDetection => "idleDetection",
        }
    }

    /// Get human-readable name
    pub fn name(&self) -> &'static str {
        match self {
            Self::KeyboardShortcuts => "键盘快捷键",
            Self::FocusMode => "专注模式",
            Self::Pomodoro => "番茄工作法",
            Self::PdfExport => "PDF 导出",
            Self::OnboardingTour => "首次使用导览",
            Self::IdleDetection => "自动空闲检测",
        }
    }

    /// Get description
    pub fn description(&self) -> &'static str {
        match self {
            Self::KeyboardShortcuts => "全局键盘快捷键 - Space 暂停/继续，n 新建任务，d 仪表盘，s 设置",
            Self::FocusMode => "专注模式 - distraction-free 全窗口专注视图",
            Self::Pomodoro => "番茄工作法 - 25/5 倒计时专注工作法",
            Self::PdfExport => "PDF 导出 - 导出每日/每周汇总报表",
            Self::OnboardingTour => "首次使用导览 - 新用户交互式产品介绍",
            Self::IdleDetection => "自动空闲检测 - 超过 5 分钟无操作自动暂停追踪",
        }
    }
}

/// Default all features enabled
impl Default for FeatureFlagState {
    fn default() -> Self {
        let mut state = HashMap::new();
        state.insert(FeatureFlag::KeyboardShortcuts, true);
        state.insert(FeatureFlag::FocusMode, true);
        state.insert(FeatureFlag::Pomodoro, true);
        state.insert(FeatureFlag::PdfExport, true);
        state.insert(FeatureFlag::OnboardingTour, true);
        state.insert(FeatureFlag::IdleDetection, true);
        Self {
            state: Arc::new(Mutex::new(state)),
        }
    }
}

/// Feature flag state container with thread-safe access
#[derive(Clone)]
pub struct FeatureFlagState {
    state: Arc<Mutex<HashMap<FeatureFlag, bool>>>,
}

impl FeatureFlagState {
    /// Create a new feature flag state with defaults
    pub fn new() -> Self {
        Self::default()
    }

    /// Check if a feature is enabled
    pub fn is_enabled(&self, flag: FeatureFlag) -> bool {
        let state = self.state.lock().unwrap();
        *state.get(&flag).unwrap_or(&true)
    }

    /// Set a feature flag state
    pub fn set_enabled(&self, flag: FeatureFlag, enabled: bool) {
        let mut state = self.state.lock().unwrap();
        state.insert(flag, enabled);
    }

    /// Toggle a feature flag
    pub fn toggle(&self, flag: FeatureFlag) -> bool {
        let mut state = self.state.lock().unwrap();
        let current = state.get(&flag).copied().unwrap_or(true);
        let new_state = !current;
        state.insert(flag, new_state);
        new_state
    }

    /// Get all flags with their current state
    pub fn get_all(&self) -> Vec<(FeatureFlag, bool)> {
        let state = self.state.lock().unwrap();
        state.iter().map(|(k, v)| (k.clone(), *v)).collect()
    }

    /// Merge from frontend HashMap (string key to boolean)
    pub fn merge_from_frontend(&self, frontend: &HashMap<String, bool>) {
        let mut state = self.state.lock().unwrap();
        for (key, enabled) in frontend {
            if let Some(flag) = FeatureFlag::from_key(key) {
                state.insert(flag, *enabled);
            }
        }
    }

    /// Convert to HashMap for frontend
    pub fn to_frontend_map(&self) -> HashMap<String, bool> {
        let state = self.state.lock().unwrap();
        let mut map = HashMap::new();
        for (flag, enabled) in state.iter() {
            map.insert(flag.to_key().to_string(), *enabled);
        }
        map
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_all_enabled() {
        let flags = FeatureFlagState::default();
        assert_eq!(flags.is_enabled(FeatureFlag::KeyboardShortcuts), true);
        assert_eq!(flags.is_enabled(FeatureFlag::Pomodoro), true);
        assert_eq!(flags.is_enabled(FeatureFlag::IdleDetection), true);
    }

    #[test]
    fn test_set_and_get() {
        let flags = FeatureFlagState::new();
        flags.set_enabled(FeatureFlag::Pomodoro, false);
        assert_eq!(flags.is_enabled(FeatureFlag::Pomodoro), false);
        flags.set_enabled(FeatureFlag::Pomodoro, true);
        assert_eq!(flags.is_enabled(FeatureFlag::Pomodoro), true);
    }

    #[test]
    fn test_toggle() {
        let flags = FeatureFlagState::new();
        let initial = flags.is_enabled(FeatureFlag::Pomodoro);
        let toggled = flags.toggle(FeatureFlag::Pomodoro);
        assert_eq!(toggled, !initial);
        assert_eq!(flags.is_enabled(FeatureFlag::Pomodoro), !initial);
    }

    #[test]
    fn test_key_conversion() {
        for flag in [
            FeatureFlag::KeyboardShortcuts,
            FeatureFlag::FocusMode,
            FeatureFlag::Pomodoro,
            FeatureFlag::PdfExport,
            FeatureFlag::OnboardingTour,
            FeatureFlag::IdleDetection,
        ] {
            let key = flag.to_key();
            let parsed = FeatureFlag::from_key(key);
            assert_eq!(parsed, Some(flag));
        }
    }
}
