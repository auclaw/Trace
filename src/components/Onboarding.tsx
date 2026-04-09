import { useState, useEffect } from 'react'
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

const PET_OPTIONS: { type: PetType; emoji: string; label: string; defaultName: string }[] = [
  { type: 'cat', emoji: '\u{1F431}', label: '猫咪', defaultName: '小橘' },
  { type: 'dog', emoji: '\u{1F436}', label: '狗狗', defaultName: '旺财' },
  { type: 'rabbit', emoji: '\u{1F430}', label: '兔兔', defaultName: '团团' },
]

const GOAL_PRESETS = [
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
  { label: '6h', minutes: 360 },
  { label: '8h', minutes: 480 },
]

const MODULE_INFO: { id: string; icon: string; label: string; desc: string }[] = [
  { id: 'timeline', icon: '\u{1F4C5}', label: '时间线', desc: '记录每日时间分配' },
  { id: 'planner', icon: '\u{1F4CB}', label: '计划器', desc: '管理待办任务与日程' },
  { id: 'focus', icon: '\u{1F3AF}', label: '专注模式', desc: '番茄钟式深度工作' },
  { id: 'habits', icon: '\u{2705}', label: '习惯追踪', desc: '建立并坚持好习惯' },
  { id: 'statistics', icon: '\u{1F4CA}', label: '数据统计', desc: '可视化你的时间数据' },
  { id: 'pet', icon: '\u{1F43E}', label: '虚拟宠物', desc: '专注越多宠物越开心' },
]

const PRIVACY_LEVELS: { key: 'basic' | 'standard' | 'detailed'; label: string; desc: string }[] = [
  { key: 'basic', label: '基础', desc: '仅追踪当前活动的应用名称' },
  { key: 'standard', label: '标准', desc: '追踪应用名称 + 窗口标题' },
  { key: 'detailed', label: '详细', desc: '追踪应用 + 标题 + URL + 内容摘要（需额外权限）' },
]

export default function Onboarding() {
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
    localStorage.setItem('merize-privacy-level', state.privacyLevel)
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
                  ← 上一步
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
                  下一步 →
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
          <div className="text-2xl">🌱</div>
          <div className="w-1 h-8 rounded-full" style={{ background: '#22c55e' }} />
        </div>
      </div>

      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        欢迎来到 Merize! 🌟
      </h1>
      <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        你的AI智能时间管理助手<br />
        <span className="text-sm">让每一分钟都有意义</span>
      </p>

      <button
        onClick={onStart}
        className="mt-4 px-10 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 75%, #fff))`,
          boxShadow: `0 6px 20px ${accent}40`,
        }}
      >
        开始设置 →
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
          选择你的伙伴 🐾
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          它会陪你一起专注成长
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
                {pet.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Pet name input */}
      <div className="mt-2">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          给它起个名字
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
          placeholder="输入宠物昵称..."
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
  const hours = state.dailyGoalMinutes / 60
  return (
    <div className="flex-1 flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          每天想专注多久？ ⏱️
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          设定一个适合自己的目标，之后随时调整
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
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>小时/天</span>
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
          <span>1h</span>
          <span>10h</span>
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
  return (
    <div className="flex-1 flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          选择你的主题 🎨
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          挑选一个最适合你的风格
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
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>☀️ 浅色</span>
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
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>🌙 深色</span>
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
          选择你需要的功能模块 🧩
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          全部默认开启，按需关闭
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
              <span className="text-xl mt-0.5">{mod.icon}</span>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold"
                  style={{ color: isOn ? accent : 'var(--color-text-primary)' }}
                >
                  {mod.label}
                </div>
                <div className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {mod.desc}
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
  return (
    <div className="flex-1 flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          选择监控程度 🛡️
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          数据始终保存在本地，你完全掌控
        </p>
      </div>

      {/* Shield animation */}
      <div className="flex justify-center my-2">
        <div
          className="w-16 h-16 flex items-center justify-center text-3xl"
          style={{ animation: 'onb-shield-pulse 2s ease-in-out infinite' }}
        >
          🛡️
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
                  {level.label}
                </div>
                <div className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {level.desc}
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
  const petOption = PET_OPTIONS.find((p) => p.type === state.petType)!
  const [showBubble, setShowBubble] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowBubble(true), 600)
    return () => clearTimeout(t)
  }, [])

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
            你好！我是{state.petName}~ 💕
            {/* Speech bubble tail */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45"
              style={{ background: 'var(--color-bg-surface-2, #f5f5f5)' }}
            />
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text-primary)' }}>
        一切就绪！ 🎉
      </h1>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        {state.petName}已经迫不及待地想陪你专注了<br />
        每天{state.dailyGoalMinutes / 60}小时，我们一起加油！
      </p>

      <button
        onClick={onComplete}
        className="mt-4 px-12 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 75%, #fff))`,
          boxShadow: `0 6px 24px ${accent}40`,
        }}
      >
        开始使用 Merize 🚀
      </button>
    </div>
  )
}
