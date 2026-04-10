import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  ClipboardList,
  Target,
  CheckCircle2,
  BarChart3,
  Cat,
  Sprout,
  Shield,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { colorThemeConfigs, DEFAULT_MODULES } from '../config/themes'
import type { ColorTheme } from '../config/themes'

type PetType = 'cat' | 'dog' | 'rabbit'

interface OnboardingState {
  petType: PetType
  petName: string
  dailyGoalMinutes: number
  colorTheme: ColorTheme
  darkMode: boolean
  activeModules: string[]
  privacyLevel: 'basic' | 'standard' | 'detailed'
}

const TOTAL_STEPS = 7
const THEME_KEYS = Object.keys(colorThemeConfigs) as ColorTheme[]

const PET_OPTIONS: { type: PetType; emoji: string; labelKey: string; defaultName: string }[] = [
  { type: 'cat', emoji: '\u{1F431}', labelKey: 'pet.types.cat', defaultName: '小橘' },
  { type: 'dog', emoji: '\u{1F436}', labelKey: 'pet.types.dog', defaultName: '旺财' },
  { type: 'rabbit', emoji: '\u{1F430}', labelKey: 'pet.types.rabbit', defaultName: '团团' },
]

const GOAL_PRESETS = [
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
  { label: '6h', minutes: 360 },
  { label: '8h', minutes: 480 },
]

const MODULE_INFO: { id: string; icon: React.ReactNode; labelKey: string; descKey: string }[] = [
  { id: 'timeline', icon: <Calendar size={20} />, labelKey: 'nav.timeline', descKey: 'onboarding.moduleTimelineDesc' },
  { id: 'planner', icon: <ClipboardList size={20} />, labelKey: 'nav.planner', descKey: 'onboarding.modulePlannerDesc' },
  { id: 'focus', icon: <Target size={20} />, labelKey: 'nav.focus', descKey: 'onboarding.moduleFocusDesc' },
  { id: 'habits', icon: <CheckCircle2 size={20} />, labelKey: 'nav.habits', descKey: 'onboarding.moduleHabitsDesc' },
  { id: 'statistics', icon: <BarChart3 size={20} />, labelKey: 'nav.statistics', descKey: 'onboarding.moduleStatsDesc' },
  { id: 'pet', icon: <Cat size={20} />, labelKey: 'nav.pet', descKey: 'onboarding.modulePetDesc' },
]

const PRIVACY_LEVELS: { key: 'basic' | 'standard' | 'detailed'; labelKey: string; descKey: string }[] = [
  { key: 'basic', labelKey: 'timeline.basic', descKey: 'settings.privacyBasic' },
  { key: 'standard', labelKey: 'timeline.standard', descKey: 'settings.privacyStandard' },
  { key: 'detailed', labelKey: 'timeline.detailed', descKey: 'settings.privacyDetailed' },
]

export default function Onboarding() {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animating, setAnimating] = useState(false)
  const [state, setState] = useState<OnboardingState>({
    petType: 'cat',
    petName: '小橘',
    dailyGoalMinutes: 480,
    colorTheme: 'orange',
    darkMode: false,
    activeModules: DEFAULT_MODULES.filter((m) => !['dashboard', 'settings'].includes(m)),
    privacyLevel: 'standard',
  })

  const store = useAppStore()

  const goNext = () => {
    if (animating || step >= TOTAL_STEPS - 1) return
    setDirection('next')
    setAnimating(true)
    setTimeout(() => { setStep((s) => s + 1); setAnimating(false) }, 300)
  }

  const goBack = () => {
    if (animating || step <= 0) return
    setDirection('prev')
    setAnimating(true)
    setTimeout(() => { setStep((s) => s - 1); setAnimating(false) }, 300)
  }

  const handleComplete = () => {
    store.setColorTheme(state.colorTheme)
    store.setTheme(state.darkMode ? 'dark' : 'light')
    store.setActiveModules(['dashboard', ...state.activeModules, 'settings'])
    store.setDailyGoalMinutes(state.dailyGoalMinutes)
    store.renamePet(state.petName)
    // Pet type is set via dataService directly - store the preference
    localStorage.setItem('trace-privacy-level', state.privacyLevel)
    store.completeFirstLaunch()
  }

  // Live preview theme changes
  useEffect(() => {
    const config = colorThemeConfigs[state.colorTheme]
    document.documentElement.style.setProperty('--color-accent', config.accent)
    document.documentElement.style.setProperty('--color-accent-soft', config.accentSoft)
    document.documentElement.classList.toggle('dark', state.darkMode)
  }, [state.colorTheme, state.darkMode])

  const accent = colorThemeConfigs[state.colorTheme].accent

  const slideClass = animating
    ? direction === 'next'
      ? 'onb-slide-out-left'
      : 'onb-slide-out-right'
    : 'onb-slide-in'

  const renderStep = () => {
    switch (step) {
      case 0: return <StepWelcome onStart={goNext} accent={accent} />
      case 1: return <StepPet state={state} setState={setState} />
      case 2: return <StepGoal state={state} setState={setState} accent={accent} />
      case 3: return <StepTheme state={state} setState={setState} />
      case 4: return <StepModules state={state} setState={setState} accent={accent} />
      case 5: return <StepPrivacy state={state} setState={setState} accent={accent} />
      case 6: return <StepDone state={state} onComplete={handleComplete} accent={accent} />
      default: return null
    }
  }

  return (
    <>
      <style>{onboardingCSS}</style>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: 'rgba(44, 24, 16, 0.45)', backdropFilter: 'blur(16px)' }}
      >
        <div
          className="relative w-full max-w-lg mx-4 overflow-hidden onb-scale-in"
          style={{
            background: 'var(--color-bg-surface-1)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-[var(--color-border-subtle)]">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
                background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 70%, #fff))`,
              }}
            />
          </div>

          {/* Content area */}
          <div className={`px-8 py-6 min-h-[420px] flex flex-col ${slideClass}`}>
            {renderStep()}
          </div>

          {/* Footer: dots + nav */}
          <div className="px-8 pb-6 flex items-center justify-between">
            {/* Back button */}
            <div className="w-20">
              {step > 0 && step < TOTAL_STEPS - 1 && (
                <button
                  onClick={goBack}
                  className="text-sm font-medium transition-colors cursor-pointer"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  ← {t('common.back')}
                </button>
              )}
            </div>

            {/* Progress dots */}
            <div className="flex gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 24 : 8,
                    height: 8,
                    background: i === step ? accent : i < step ? `${accent}66` : 'var(--color-border-default)',
                  }}
                />
              ))}
            </div>

            {/* Next button */}
            <div className="w-20 flex justify-end">
              {step > 0 && step < TOTAL_STEPS - 1 && (
                <button
                  onClick={goNext}
                  className="text-sm font-semibold transition-colors cursor-pointer"
                  style={{ color: accent }}
                >
                  {t('common.next')} →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── CSS for animations ── */
const onboardingCSS = `
  @keyframes onb-scale-in {
    from { opacity: 0; transform: scale(0.92); }
    to { opacity: 1; transform: scale(1); }
  }
  .onb-scale-in { animation: onb-scale-in 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }

  @keyframes onb-slide-in {
    from { opacity: 0; transform: translateX(0); }
    to { opacity: 1; transform: translateX(0); }
  }
  .onb-slide-in { animation: onb-slide-in 0.3s ease forwards; }

  @keyframes onb-slide-out-left {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(-30px); }
  }
  .onb-slide-out-left { animation: onb-slide-out-left 0.3s ease forwards; }

  @keyframes onb-slide-out-right {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(30px); }
  }
  .onb-slide-out-right { animation: onb-slide-out-right 0.3s ease forwards; }

  @keyframes onb-clock-tick {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(180deg); }
  }

  @keyframes onb-grow {
    0% { transform: scaleY(0.3); opacity: 0.3; }
    60% { transform: scaleY(1.05); opacity: 1; }
    100% { transform: scaleY(1); opacity: 1; }
  }

  @keyframes onb-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  @keyframes onb-pulse-ring {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(1.6); opacity: 0; }
  }

  @keyframes onb-shield-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.06); }
  }

  @keyframes onb-bounce-in {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes onb-confetti {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(-60px) rotate(360deg); opacity: 0; }
  }

  .onb-float { animation: onb-float 3s ease-in-out infinite; }
`

/* ── Step 1: Welcome ── */
function StepWelcome({ onStart, accent }: { onStart: () => void; accent: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
      {/* Animated clock + plant illustration */}
      <div className="relative w-32 h-32 mb-2">
        {/* Clock face */}
        <div
          className="absolute inset-0 rounded-full border-4 flex items-center justify-center"
          style={{ borderColor: accent, background: `${accent}10` }}
        >
          {/* Clock hand */}
          <div
            className="absolute w-1 rounded-full origin-bottom"
            style={{
              height: '28px',
              bottom: '50%',
              left: 'calc(50% - 2px)',
              background: accent,
              animation: 'onb-clock-tick 3s ease-in-out infinite',
              transformOrigin: 'bottom center',
            }}
          />
          {/* Center dot */}
          <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
        </div>
        {/* Growing plant beside clock */}
        <div
          className="absolute -right-3 bottom-0 flex flex-col items-center"
          style={{ animation: 'onb-grow 2s ease-out forwards', transformOrigin: 'bottom' }}
        >
          <div className="text-2xl" style={{ color: '#22c55e' }}><Sprout size={28} /></div>
          <div className="w-1 h-8 rounded-full" style={{ background: '#22c55e' }} />
        </div>
      </div>

      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {t('onboarding.welcome')} 🌟
      </h1>
      <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        {t('onboarding.welcomeSubtitle1')}<br />
        <span className="text-sm">{t('settings.tagline')}</span>
      </p>

      <button
        onClick={onStart}
        className="mt-4 px-10 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 75%, #fff))`,
          boxShadow: `0 6px 20px ${accent}40`,
        }}
      >
        {t('onboarding.getStarted')} →
      </button>
    </div>
  )
}

/* ── Step 2: Choose Pet ── */
function StepPet({
  state,
  setState,
}: {
  state: OnboardingState
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>
}) {
  const { t } = useTranslation()
  const handlePetSelect = (type: PetType) => {
    const option = PET_OPTIONS.find((p) => p.type === type)!
    setState((s) => ({
      ...s,
      petType: type,
      petName: s.petName === PET_OPTIONS.find((p) => p.type === s.petType)?.defaultName ? option.defaultName : s.petName,
    }))
  }

  return (
    <div className="flex-1 flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('onboarding.choosePetTitle')} 🐾
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('onboarding.choosePetSubtitle')}
        </p>
      </div>

      {/* Pet cards */}
      <div className="grid grid-cols-3 gap-3">
        {PET_OPTIONS.map((pet) => {
          const isSel = state.petType === pet.type
          return (
            <button
              key={pet.type}
              onClick={() => handlePetSelect(pet.type)}
              className="flex flex-col items-center gap-2 py-5 px-3 rounded-2xl transition-all duration-200 cursor-pointer"
              style={{
                background: isSel ? 'var(--color-accent-soft, rgba(249,115,22,0.1))' : 'var(--color-bg-surface-2, #f5f5f5)',
                border: isSel ? '2px solid var(--color-accent)' : '2px solid transparent',
                transform: isSel ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              {/* Pixel-style pet preview */}
              <div
                className="text-5xl transition-transform duration-300"
                style={{
                  filter: isSel ? 'none' : 'grayscale(0.3)',
                  imageRendering: 'pixelated',
                  animation: isSel ? 'onb-float 2s ease-in-out infinite' : 'none',
                }}
              >
                {pet.emoji}
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: isSel ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
              >
                {t(pet.labelKey)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Pet name input */}
      <div className="mt-2">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          {t('pet.namingTitle').replace('!', '')}
        </label>
        <input
          type="text"
          value={state.petName}
          onChange={(e) => setState((s) => ({ ...s, petName: e.target.value }))}
          maxLength={10}
          className="w-full px-4 py-3 rounded-xl text-base outline-none transition-all duration-200"
          style={{
            background: 'var(--color-bg-surface-2, #f5f5f5)',
            border: '2px solid var(--color-border-subtle)',
            color: 'var(--color-text-primary)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--color-border-subtle)')}
          placeholder={t('pet.namePlaceholder')}
        />
      </div>
    </div>
  )
}

/* ── Step 3: Daily Goal ── */
function StepGoal({
  state,
  setState,
  accent,
}: {
  state: OnboardingState
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>
  accent: string
}) {
  const { t } = useTranslation()
  const hours = state.dailyGoalMinutes / 60
  return (
    <div className="flex-1 flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('onboarding.dailyGoalTitle')} ⏱️
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('onboarding.dailyGoalSubtitle')}
        </p>
      </div>

      {/* Visual ring */}
      <div className="flex justify-center my-4">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-border-subtle)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={accent}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(hours / 10) * 327} 327`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: accent }}>{hours}</span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('common.hours')}/{t('common.day')}</span>
          </div>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-4 gap-3">
        {GOAL_PRESETS.map((preset) => {
          const isSel = state.dailyGoalMinutes === preset.minutes
          return (
            <button
              key={preset.minutes}
              onClick={() => setState((s) => ({ ...s, dailyGoalMinutes: preset.minutes }))}
              className="py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: isSel
                  ? `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 75%, #fff))`
                  : 'var(--color-bg-surface-2, #f5f5f5)',
                color: isSel ? '#fff' : 'var(--color-text-secondary)',
                boxShadow: isSel ? `0 4px 12px ${accent}30` : 'none',
                transform: isSel ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      {/* Slider */}
      <div className="px-1">
        <input
          type="range"
          min={60}
          max={600}
          step={30}
          value={state.dailyGoalMinutes}
          onChange={(e) => setState((s) => ({ ...s, dailyGoalMinutes: Number(e.target.value) }))}
          className="w-full accent-[var(--color-accent)] cursor-pointer"
          style={{ accentColor: accent }}
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          <span>1{t('common.hours')}</span>
          <span>10{t('common.hours')}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Step 4: Theme ── */
function StepTheme({
  state,
  setState,
}: {
  state: OnboardingState
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>
}) {
  const { t } = useTranslation()
  return (
    <div className="flex-1 flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('onboarding.chooseThemeTitle')} 🎨
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('onboarding.chooseThemeSubtitle')}
        </p>
      </div>

      {/* Color swatches */}
      <div className="grid grid-cols-5 gap-3 mt-2">
        {THEME_KEYS.map((key) => {
          const config = colorThemeConfigs[key]
          const isSel = state.colorTheme === key
          return (
            <button
              key={key}
              onClick={() => setState((s) => ({ ...s, colorTheme: key }))}
              className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl transition-all duration-200 cursor-pointer"
              style={{
                background: isSel ? config.accentSoft : 'transparent',
                border: isSel ? `2px solid ${config.accent}` : '2px solid transparent',
                transform: isSel ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-full transition-shadow duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${config.accent}, color-mix(in srgb, ${config.accent} 70%, #fff))`,
                    boxShadow: isSel ? `0 4px 14px ${config.accent}44` : 'var(--shadow-sm)',
                  }}
                />
                {isSel && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 10l4 4 6-7" />
                    </svg>
                  </span>
                )}
              </div>
              <span
                className="text-xs font-medium text-center leading-tight"
                style={{ color: isSel ? config.accent : 'var(--color-text-secondary)' }}
              >
                {config.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Light/Dark toggle */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>☀️ {t('onboarding.lightMode')}</span>
        <button
          onClick={() => setState((s) => ({ ...s, darkMode: !s.darkMode }))}
          className="relative w-14 h-7 rounded-full transition-colors duration-300 cursor-pointer"
          style={{ background: state.darkMode ? colorThemeConfigs[state.colorTheme].accent : 'var(--color-border-default)' }}
        >
          <div
            className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
            style={{ left: state.darkMode ? '30px' : '2px' }}
          />
        </button>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>🌙 {t('onboarding.darkMode')}</span>
      </div>

      {/* Live preview card */}
      <div
        className="mt-3 p-4 rounded-xl transition-all duration-300"
        style={{
          background: state.darkMode ? '#1a1614' : '#fffefb',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg" style={{ background: colorThemeConfigs[state.colorTheme].accent }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: state.darkMode ? '#f5f5f5' : '#1a1a1a' }}>
              {colorThemeConfigs[state.colorTheme].name}
            </div>
            <div className="text-xs" style={{ color: state.darkMode ? '#888' : '#999' }}>
              {colorThemeConfigs[state.colorTheme].description}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Step 5: Modules ── */
function StepModules({
  state,
  setState,
  accent,
}: {
  state: OnboardingState
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>
  accent: string
}) {
  const { t } = useTranslation()
  const toggle = (id: string) => {
    setState((s) => ({
      ...s,
      activeModules: s.activeModules.includes(id)
        ? s.activeModules.filter((m) => m !== id)
        : [...s.activeModules, id],
    }))
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('onboarding.chooseModulesTitle')} 🧩
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('onboarding.chooseModulesSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-1">
        {MODULE_INFO.map((mod) => {
          const isOn = state.activeModules.includes(mod.id)
          return (
            <button
              key={mod.id}
              onClick={() => toggle(mod.id)}
              className="flex items-start gap-3 p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer"
              style={{
                background: isOn ? `${accent}0D` : 'var(--color-bg-surface-2, #f5f5f5)',
                border: isOn ? `2px solid ${accent}` : '2px solid transparent',
              }}
            >
              <span className="mt-0.5" style={{ color: isOn ? accent : 'var(--color-text-muted)' }}>{mod.icon}</span>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold"
                  style={{ color: isOn ? accent : 'var(--color-text-primary)' }}
                >
                  {t(mod.labelKey)}
                </div>
                <div className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {t(mod.descKey)}
                </div>
              </div>
              {/* Toggle indicator */}
              <div
                className="mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  background: isOn ? accent : 'var(--color-border-default)',
                }}
              >
                {isOn && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 6l2 2 4-4" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Step 6: Privacy ── */
function StepPrivacy({
  state,
  setState,
  accent,
}: {
  state: OnboardingState
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>
  accent: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex-1 flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('onboarding.choosePrivacyTitle')} 🛡️
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('onboarding.choosePrivacySubtitle')}
        </p>
      </div>

      {/* Shield animation */}
      <div className="flex justify-center my-2">
        <div
          className="w-16 h-16 flex items-center justify-center"
          style={{ animation: 'onb-shield-pulse 2s ease-in-out infinite', color: 'var(--color-accent)' }}
        >
          <Shield size={32} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {PRIVACY_LEVELS.map((level, idx) => {
          const isSel = state.privacyLevel === level.key
          const shieldBars = idx + 1
          return (
            <button
              key={level.key}
              onClick={() => setState((s) => ({ ...s, privacyLevel: level.key }))}
              className="flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200 cursor-pointer"
              style={{
                background: isSel ? `${accent}0D` : 'var(--color-bg-surface-2, #f5f5f5)',
                border: isSel ? `2px solid ${accent}` : '2px solid transparent',
              }}
            >
              {/* Level indicator bars */}
              <div className="flex gap-1 flex-shrink-0">
                {[1, 2, 3].map((bar) => (
                  <div
                    key={bar}
                    className="w-1.5 rounded-full transition-all duration-200"
                    style={{
                      height: `${bar * 8 + 8}px`,
                      background: bar <= shieldBars
                        ? isSel ? accent : 'var(--color-text-muted)'
                        : 'var(--color-border-default)',
                    }}
                  />
                ))}
              </div>
              <div className="flex-1">
                <div
                  className="text-sm font-semibold"
                  style={{ color: isSel ? accent : 'var(--color-text-primary)' }}
                >
                  {t(level.labelKey)}
                </div>
                <div className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {t(level.descKey)}
                </div>
              </div>
              {/* Radio */}
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{ borderColor: isSel ? accent : 'var(--color-border-default)' }}
              >
                {isSel && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Step 7: All Done ── */
function StepDone({
  state,
  onComplete,
  accent,
}: {
  state: OnboardingState
  onComplete: () => void
  accent: string
}) {
  const { t } = useTranslation()
  const petOption = PET_OPTIONS.find((p) => p.type === state.petType)!
  const [showBubble, setShowBubble] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowBubble(true), 600)
    return () => clearTimeout(t)
  }, [])

  const hours = state.dailyGoalMinutes / 60
  const doneMessage = t('onboarding.doneMessage', {
    petName: state.petName,
    hours: hours,
  })

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
      {/* Confetti dots */}
      <div className="relative w-full h-0">
        {['🎊', '✨', '🎉', '⭐', '💫'].map((c, i) => (
          <span
            key={i}
            className="absolute text-lg"
            style={{
              left: `${15 + i * 17}%`,
              top: '-10px',
              animation: `onb-confetti 2s ease-out ${i * 0.2}s infinite`,
            }}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Pet with speech bubble */}
      <div className="relative mt-6">
        <div
          className="text-7xl"
          style={{ animation: 'onb-bounce-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}
        >
          {petOption.emoji}
        </div>
        {showBubble && (
          <div
            className="absolute -top-14 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap"
            style={{
              background: 'var(--color-bg-surface-2, #f5f5f5)',
              color: 'var(--color-text-primary)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              animation: 'onb-bounce-in 0.4s ease forwards',
            }}
          >
            {t('pet.dialogue.welcome', { name: state.petName })}
            {/* Speech bubble tail */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45"
              style={{ background: 'var(--color-bg-surface-2, #f5f5f5)' }}
            />
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text-primary)' }}>
        {t('onboarding.doneTitle')} 🎉
      </h1>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}
        dangerouslySetInnerHTML={{
          __html: doneMessage.replace('{petName}', state.petName).replace('{hours}', String(hours))
        }}
      />

      <button
        onClick={onComplete}
        className="mt-4 px-12 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 75%, #fff))`,
          boxShadow: `0 6px 24px ${accent}40`,
        }}
      >
        {t('onboarding.getStarted')} Merize 🚀
      </button>
    </div>
  )
}
