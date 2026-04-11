import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { Card, Button } from '../../components/ui'
import { useAppStore } from '../../store/useAppStore'
import type { DailyStat } from '../../services/dataService'

interface DailyInsightsCardProps {
  dailyStats: DailyStat
  today: string
}

export default function DailyInsightsCard({ dailyStats, today }: DailyInsightsCardProps) {
  const { t } = useTranslation()
  const [aiPersonalizedInsights, setAiPersonalizedInsights] = useState<string>('')
  const [generatingInsights, setGeneratingInsights] = useState(false)
  const addToast = useAppStore((s) => s.addToast)

  const generatePersonalizedInsights = useCallback(async () => {
    setGeneratingInsights(true)
    try {
      // Import dynamically to avoid circular dependency
      const dataService = (await import('../../services/dataService')).default
      // Collect daily data
      const focusSessions = await dataService.getFocusSessions(today)
      const completedFocusSessions = focusSessions.filter((s: { completed: boolean, type: string }) => s.completed && s.type === 'work')
      const totalFocusMinutes = completedFocusSessions.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0)

      // Convert categories to array format
      const byCategory = Object.entries(dailyStats.categories).map(([category, minutes]) => ({
        category,
        minutes,
      }))

      const dailyData = {
        total_minutes: dailyStats.totalMinutes,
        by_category: byCategory,
        focus_sessions: completedFocusSessions.length,
        total_focus_minutes: totalFocusMinutes,
      }

      const response = await fetch('/api/ai/daily-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_data: dailyData }),
      })

      const data = await response.json()
      if (data.code === 200) {
        setAiPersonalizedInsights(data.data.insights)
        addToast('success', t('dashboard.insightsGenerated'))
      } else {
        addToast('error', t('dashboard.insightsFailed'))
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error('Failed to generate insights:', e)
      addToast('error', t('dashboard.insightsFailed'))
    } finally {
      setGeneratingInsights(false)
    }
  }, [dailyStats, today, addToast, t])

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            {t('dashboard.aiTitle')}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {t('dashboard.aiDescription')}
          </p>
        </div>
        <Sparkles size={20} style={{ color: 'var(--color-accent)' }} />
      </div>

      {aiPersonalizedInsights ? (
        <div className="bg-[var(--color-bg-surface-2)] rounded-lg p-4 text-sm leading-relaxed text-[var(--color-text-primary)] whitespace-pre-line">
          {aiPersonalizedInsights}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">{t('dashboard.aiNoData')}</p>
      )}

      <Button
        variant="primary"
        size="sm"
        onClick={generatePersonalizedInsights}
        disabled={generatingInsights}
        className="w-full sm:w-auto"
      >
        {generatingInsights ? t('dashboard.generating') : t('dashboard.generateInsights')}
      </Button>
    </Card>
  )
}
