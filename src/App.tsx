import React, { Suspense, useEffect, useState, useRef, createContext, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { backgroundSkinConfigs } from './config/themes';
import { ToastProvider } from './components/ui/Toast';
import Sidebar from './components/Sidebar';
// Beta: Pet feature disabled - import PetMiniWidget from './components/PetMiniWidget';
import FocusStatusIndicator from './components/FocusStatusIndicator';
import FocusStartedModal from './components/FocusStartedModal';
import FocusCompletedModal from './components/FocusCompletedModal';
import DailyGoalAchievedModal from './components/DailyGoalAchievedModal';
import DailyReview from './components/DailyReview';
import { FocusModal } from './components/Focus';
import type { FocusWindowMode } from './components/Focus';
import { trackingService } from './services/trackingService';

// Re-export types & configs so existing pages importing from '../App' still work
export type { Theme, ColorTheme, BackgroundSkin } from './config/themes';
export { colorThemeConfigs, backgroundSkinConfigs } from './config/themes';

/* ── Global Focus Modal Context ── */
interface FocusModalContextType {
  openFocusModal: (mode?: FocusWindowMode) => void;
  closeFocusModal: () => void;
  isFocusModalOpen: boolean;
}

const FocusModalContext = createContext<FocusModalContextType>({
  openFocusModal: () => {},
  closeFocusModal: () => {},
  isFocusModalOpen: false,
});

export function useFocusModal() {
  return useContext(FocusModalContext);
}

/* ─ Lazy-loaded pages ── */
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Timeline = React.lazy(() => import('./pages/Timeline'));
const Task = React.lazy(() => import('./pages/Task'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Settings = React.lazy(() => import('./pages/Settings'));
// Legacy pages - hidden from navigation but still accessible
// Legacy FocusMode page - replaced by global FocusModal
// Beta: Disabled features - will be removed in future cleanup
// const Habits = React.lazy(() => import('./pages/Habits'));
// const VirtualPet = React.lazy(() => import('./pages/VirtualPet'));
// const Team = React.lazy(() => import('./pages/Team'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));

/* ── Loading fallback ── */
function PageLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        <span className="text-sm text-[var(--color-text-muted)]">{t('app.pageLoading')}</span>
      </div>
    </div>
  );
}

/* ── Beta: Pet feature disabled ── */
// function PetWidgetWrapper() {
//   const location = useLocation();
//   if (location.pathname === '/pet') return null;
//   return <PetMiniWidget />;
// }

/* ── Focus session popup orchestrator ── */
import type { AppState, Activity } from './store/useAppStore';
type ModalType = 'started' | 'completed' | 'goalAchieved' | 'dailyReview';

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function FocusPopupManager() {
  const focusState = useAppStore((s: AppState) => s.focusState);
  const focusSessions = useAppStore((s: AppState) => s.focusSessions);
  const focusSettings = useAppStore((s: AppState) => s.focusSettings);
  const activities = useAppStore((s: AppState) => s.activities);
  const dailyGoalMinutes = useAppStore((s: AppState) => s.dailyGoalMinutes);
  const guardianSettings = useAppStore((s: AppState) => s.guardianSettings);
  const lastDailyReviewDate = useAppStore((s: AppState) => s.lastDailyReviewDate);
  const lastGoalAchievedDate = useAppStore((s: AppState) => s.lastGoalAchievedDate);
  const setLastGoalAchievedDate = useAppStore((s: AppState) => s.setLastGoalAchievedDate);
  const { openFocusModal } = useFocusModal();

  // 🎯 Modal queue system - ensure only one modal shows at a time
  const [modalQueue, setModalQueue] = useState<ModalType[]>([]);
  const [completedStats, setCompletedStats] = useState({
    minutes: 0,
    sessions: 0,
    xp: 0,
    coins: 0,
  });

  const prevFocusState = useRef(focusState);

  // Calculate current active modal (first in queue)
  const activeModal = modalQueue[0] || null;

  // Add modal to queue - called by various triggers
  const addModalToQueue = useCallback((type: ModalType) => {
    setModalQueue(prev => {
      if (prev.includes(type)) return prev; // Avoid duplicates
      return [...prev, type];
    });
  }, []);

  // Close current modal and show next in queue
  const closeCurrentModal = useCallback(() => {
    setModalQueue(prev => prev.slice(1));
  }, []);

  // Show "started" modal when transitioning from idle → working
  useEffect(() => {
    if (prevFocusState.current === 'idle' && focusState === 'working') {
      addModalToQueue('started');
    }
    // Show "completed" modal when a work session ends (working → break/longBreak)
    if (
      prevFocusState.current === 'working' &&
      (focusState === 'break' || focusState === 'longBreak')
    ) {
      const mins = focusSettings.workMinutes;
      setCompletedStats({
        minutes: mins,
        sessions: focusSessions,
        xp: mins,
        coins: Math.floor(mins / 5),
      });
      addModalToQueue('completed');
    }
    prevFocusState.current = focusState;
  }, [focusState, focusSessions, focusSettings.workMinutes, addModalToQueue]);

  // Check daily goal achievement - only once per day
  useEffect(() => {
    const today = todayStr();
    // 只有今天还没显示过，并且真正达成目标时才触发
    if (lastGoalAchievedDate === today) return;

    const todayMinutes = activities.reduce(
      (sum: number, a: Activity) => sum + (a.duration || 0),
      0
    );
    if (todayMinutes >= dailyGoalMinutes && dailyGoalMinutes > 0) {
      setLastGoalAchievedDate(today);
      // Wait for other modals to complete first
      setTimeout(() => addModalToQueue('goalAchieved'), 2000);
    }
  }, [activities, dailyGoalMinutes, lastGoalAchievedDate, setLastGoalAchievedDate, addModalToQueue]);

  // Check Daily Review trigger: after 20:00, and not done today
  const dailyReviewShown = useRef(false);
  useEffect(() => {
    if (dailyReviewShown.current) return;
    const today = todayStr();
    const currentHour = new Date().getHours();

    if (
      guardianSettings.dailyReviewEnabled &&
      currentHour >= 20 &&
      lastDailyReviewDate !== today
    ) {
      dailyReviewShown.current = true;
      // Wait longer to ensure it shows after achievement modals
      setTimeout(() => addModalToQueue('dailyReview'), 5000);
    }
  }, [guardianSettings, lastDailyReviewDate, addModalToQueue]);

  return (
    <>
      <FocusStartedModal
        isOpen={activeModal === 'started'}
        onClose={closeCurrentModal}
        onViewSession={() => {
          closeCurrentModal();
          openFocusModal();
        }}
      />
      <FocusCompletedModal
        isOpen={activeModal === 'completed'}
        onClose={closeCurrentModal}
        sessionMinutes={completedStats.minutes}
        totalSessions={completedStats.sessions}
        xpGained={completedStats.xp}
        coinsGained={completedStats.coins}
      />
      <DailyGoalAchievedModal
        isOpen={activeModal === 'goalAchieved'}
        onClose={closeCurrentModal}
        totalMinutes={activities.reduce((sum, a) => sum + (a.duration || 0), 0)}
        goalMinutes={dailyGoalMinutes}
      />
      <DailyReview
        isOpen={activeModal === 'dailyReview'}
        onComplete={closeCurrentModal}
      />
    </>
  );
}

/* ── Main app content (inside Router) ── */
function AppContent() {
  const initialize = useAppStore((s: AppState) => s.initialize);
  const initialized = useAppStore((s: AppState) => s.initialized);
  const isFirstLaunch = useAppStore((s: AppState) => s.isFirstLaunch);
  const theme = useAppStore((s: AppState) => s.theme);
  const backgroundSkin = useAppStore((s: AppState) => s.backgroundSkin);
  const location = useLocation();
  const { t } = useTranslation();

  // 🎯 Global Focus Modal State
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [focusModalMode, setFocusModalMode] = useState<FocusWindowMode>('fullscreen');

  const openFocusModal = useCallback((mode: FocusWindowMode = 'fullscreen') => {
    setFocusModalMode(mode);
    setIsFocusModalOpen(true);
  }, []);

  const closeFocusModal = useCallback(() => {
    setIsFocusModalOpen(false);
  }, []);

  const focusModalContextValue = {
    openFocusModal,
    closeFocusModal,
    isFocusModalOpen,
  };

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Start AI tracking service when app initializes
  const isDark = theme === 'dark';
  const bgClass = backgroundSkinConfigs[backgroundSkin].getBgClass(isDark);

  // Start AI tracking service when app initializes
  useEffect(() => {
    if (initialized && !isFirstLaunch) {
      trackingService.start();
      return () => {
        trackingService.stop();
      };
    }
  }, [initialized, isFirstLaunch]);

  // Apply dark class to document root for CSS variables
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          <span className="text-[var(--color-text-muted)] text-sm">{t('app.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <FocusModalContext.Provider value={focusModalContextValue}>
      <div
        className={`flex h-screen ${bgClass} transition-colors duration-300 ${
          backgroundSkin === 'glass' ? 'glass-mode' : ''
        }`}
      >
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<PageLoader />}>
            <div key={location.pathname} className="page-transition">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/task" element={<Task />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                {/* Compatibility redirects for legacy URLs */}
                <Route path="/planner" element={<Navigate to="/task" replace />} />
                <Route path="/statistics" element={<Navigate to="/analytics" replace />} />
                <Route path="/tasks" element={<Navigate to="/task" replace />} />
                {/* Beta: Disabled legacy routes - will be removed in future cleanup */}
                <Route path="/focus" element={<Navigate to="/" replace />} />
                {/* <Route path="/habits" element={<Habits />} /> */}
                {/* <Route path="/pet" element={<VirtualPet />} /> */}
                {/* <Route path="/team" element={<Team />} /> */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
              </Routes>
            </div>
          </Suspense>
        </main>
      </div>
      {/* Beta: Pet feature disabled - <PetWidgetWrapper /> */}
      <FocusStatusIndicator />
      <FocusPopupManager />
      {/* 🎯 Global Focus Modal - accessible from anywhere */}
      <FocusModal
        isOpen={isFocusModalOpen}
        onClose={closeFocusModal}
        initialMode={focusModalMode}
      />
    </FocusModalContext.Provider>
  );
}

/* ── Root ── */
export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}
