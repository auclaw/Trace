// 交互式首次使用导览组件
// 高亮显示关键功能，引导新用户了解产品

import { useState, useEffect, useCallback, useRef } from 'react'

export interface TourStep {
  // CSS selector for the element to highlight
  target: string
  // Title for this step
  title: string
  // Description/content
  content: string
  // Placement: 'top' | 'bottom' | 'left' | 'right'
  placement: 'top' | 'bottom' | 'left' | 'right'
}

interface OnboardingTourProps {
  steps: TourStep[]
  onComplete: () => void
  onSkip: () => void
  isOpen: boolean
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps,
  onComplete,
  onSkip,
  isOpen
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Recalculate position when step changes or window resizes
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !steps[currentStep]) {
      setTargetRect(null)
      return
    }

    const element = document.querySelector(steps[currentStep].target)
    if (element) {
      const rect = element.getBoundingClientRect()
      // Add some padding
      setTargetRect(rect)
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      setTargetRect(null)
    }
  }, [currentStep, steps, isOpen])

  useEffect(() => {
    updateTargetPosition()
    window.addEventListener('resize', updateTargetPosition)
    return () => window.removeEventListener('resize', updateTargetPosition)
  }, [updateTargetPosition])

  if (!isOpen || steps.length === 0) {
    return null
  }

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  // Calculate popup position based on placement
  const getPopupStyle = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }

    const spacing = 16
    const popupWidth = Math.min(320, window.innerWidth - 32)
    const popupHeight = 180

    let top: number
    let left: number

    switch (step.placement) {
      case 'top':
        top = targetRect.top - popupHeight - spacing
        left = targetRect.left + (targetRect.width - popupWidth) / 2
        break
      case 'bottom':
        top = targetRect.bottom + spacing
        left = targetRect.left + (targetRect.width - popupWidth) / 2
        break
      case 'left':
        top = targetRect.top + (targetRect.height - popupHeight) / 2
        left = targetRect.left - popupWidth - spacing
        break
      case 'right':
        top = targetRect.top + (targetRect.height - popupHeight) / 2
        left = targetRect.right + spacing
        break
      default:
        top = targetRect.bottom + spacing
        left = targetRect.left + (targetRect.width - popupWidth) / 2
    }

    // Keep popup within viewport
    if (left < 16) left = 16
    if (left + popupWidth > window.innerWidth - 16) {
      left = window.innerWidth - popupWidth - 16
    }
    if (top < 16) top = targetRect.bottom + spacing

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${popupWidth}px`
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Click overlay background to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onSkip()
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      {/* Cutout hole around target */}
      {targetRect && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ mixBlendMode: 'multiply' }}
        >
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.8)"
          />
          <rect
            x={targetRect.left - 4}
            y={targetRect.top - 4}
            width={targetRect.width + 8}
            height={targetRect.height + 8}
            rx="8"
            fill="transparent"
            stroke="transparent"
          />
          {/* Use clip-path to create the hole */}
        </svg>
      )}

      {/* Highlight border around target */}
      {targetRect && (
        <div
          className="absolute pointer-events-none border-2 border-primary rounded-lg animate-pulse"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8
          }}
        />
      )}

      {/* Popup content */}
      <div
        className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 border border-gray-200 dark:border-gray-700"
        style={getPopupStyle()}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === currentStep
                    ? 'bg-primary'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
          {step.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {step.content}
        </p>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <div>
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                上一步
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSkip}
              className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              跳过
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              {isLastStep ? '完成' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingTour

// Default tour steps for Trace app
export const getDefaultTourSteps = (): TourStep[] => [
  {
    target: '[data-tour="dashboard"]',
    title: '欢迎使用 时迹',
    content: 'Trace 是一款自动时间追踪工具，帮你记录每天的时间都花在了哪里。让我们快速了解一下核心功能吧！',
    placement: 'bottom'
  },
  {
    target: '[data-tour="tracking-status"]',
    title: '自动追踪',
    content: 'Trace 会在后台自动记录你在每个应用上花费的时间，无需手动打卡。',
    placement: 'bottom'
  },
  {
    target: '[data-tour="planner"]',
    title: '任务规划',
    content: '在这里创建你今天的任务清单，保持专注。',
    placement: 'left'
  },
  {
    target: '[data-tour="calendar"]',
    title: '历史统计',
    content: '查看每天/每周/每月的时间分布，了解你的时间使用习惯。',
    placement: 'top'
  },
  {
    target: '[data-tour="focus-mode"]',
    title: '专注模式',
    content: '进入专注模式，搭配番茄工作法，帮你心无旁骛完成工作。',
    placement: 'left'
  },
  {
    target: '[data-tour="settings"]',
    title: '个性化设置',
    content: '在这里可以设置 API key、调整偏好设置，开启/关闭实验性功能。',
    placement: 'top'
  }
]
