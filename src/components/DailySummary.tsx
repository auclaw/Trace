import { useMemo, useCallback } from 'react';
import { Modal, Button, Badge, Progress } from '../components/ui';
import dataService from '../services/dataService';
import { useAppStore } from '../store/useAppStore';
import type { AppState, FocusSession } from '../store/useAppStore';
import { CATEGORY_COLORS } from '../config/themes';

// ─── Types ───
interface DailySummaryProps {
  isOpen: boolean;
  onClose: () => void;
  date?: string;
}

// ─── Helpers ───
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}分钟`;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}

function formatMinutesShort(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── AI Summary generation (simulated) ───
function generateAISummary(
  totalMinutes: number,
  categories: Record<string, number>,
  goalPct: number,
  completedTasks: number,
): string {
  const deepWork = (categories['开发'] || 0) + (categories['学习'] || 0) + (categories['阅读'] || 0);
  const deepPct = totalMinutes > 0 ? Math.round((deepWork / totalMinutes) * 100) : 0;

  if (goalPct >= 100 && deepPct >= 50) {
    return `今天效率不错！深度工作占比${deepPct}%，完成了${completedTasks}项任务。继续保持！`;
  }
  if (goalPct >= 80) {
    return `今天表现良好，目标完成${goalPct}%。深度工作占比${deepPct}%，还可以再提升。`;
  }
  if (goalPct >= 50) {
    return `今天完成了一半目标，深度工作${formatMinutesShort(deepWork)}。明天试着减少会议时间。`;
  }
  return `今天比较轻松，记录了${formatMinutes(totalMinutes)}。明天可以制定更明确的计划。`;
}

function generateSuggestions(categories: Record<string, number>, goalPct: number): string[] {
  const suggestions: string[] = [];
  const meetingMin = categories['会议'] || 0;
  const restMin = categories['休息'] || 0;
  const deepWork = (categories['开发'] || 0) + (categories['学习'] || 0);

  if (meetingMin > 120) suggestions.push('尝试减少会议时间，合并短会议');
  if (restMin < 30) suggestions.push('增加适当休息，保持可持续产出');
  if (deepWork < 120) suggestions.push('安排2小时以上的深度工作时段');
  if (goalPct < 80) suggestions.push('提前规划明天的时间块，设定优先级');
  if (suggestions.length === 0) suggestions.push('保持今天的节奏，非常棒！');
  suggestions.push('早起30分钟做最重要的任务');
  return suggestions.slice(0, 3);
}

// ─── CSS-only Donut Chart ───
function DonutChart({
  segments,
  size = 140,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s: number, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: 'var(--color-bg-surface-2)',
        }}
      >
        <span className="text-xs text-[var(--color-text-muted)]">暂无数据</span>
      </div>
    );
  }

  let accumulated = 0;
  const gradientStops = segments.flatMap((seg) => {
    const start = (accumulated / total) * 100;
    accumulated += seg.value;
    const end = (accumulated / total) * 100;
    return [`${seg.color} ${start}%`, `${seg.color} ${end}%`];
  });

  const innerSize = size * 0.6;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${gradientStops.join(', ')})`,
        }}
      />
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: innerSize,
          height: innerSize,
          background: 'var(--color-bg-surface-1)',
        }}
      >
        <div className="text-center">
          <div className="text-lg font-bold text-[var(--color-text-primary)]">{formatMinutesShort(total)}</div>
          <div className="text-[10px] text-[var(--color-text-muted)]">总计</div>
        </div>
      </div>
    </div>
  );
}

// ─── SVG Progress Ring ───
function ProgressRing({
  percentage,
  size = 100,
  strokeWidth = 8,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={strokeWidth}
          opacity={0.25}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
          {Math.round(clamped)}%
        </span>
        <span className="text-[10px] text-[var(--color-text-muted)]">目标完成</span>
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function DailySummary({ isOpen, onClose, date }: DailySummaryProps) {
  const dateStr = date || todayStr();
  const tasks = useAppStore((s: AppState) => s.tasks);
  const habits = useAppStore((s: AppState) => s.habits);
  const dailyGoalMinutes = useAppStore((s: AppState) => s.dailyGoalMinutes);
  const addToast = useAppStore((s: AppState) => s.addToast);

  const data = useMemo(() => {
    if (!isOpen) return null;

    const stats = dataService.getDailyStats(dateStr);
    const activities = dataService.getActivities(dateStr);
    const focusSessions = dataService.getFocusSessions(dateStr);
    const pet = dataService.getPet();

    // Focus / break time
    const focusMinutes = focusSessions
      .filter((s: FocusSession) => s.type === 'work' && s.completed)
      .reduce((sum: number, s: FocusSession) => sum + s.duration, 0);
    const breakMinutes = focusSessions
      .filter((s: FocusSession) => s.type === 'break' || s.type === 'longBreak')
      .reduce((sum: number, s: FocusSession) => sum + s.duration, 0);

    // Goal completion
    const goalPct = dailyGoalMinutes > 0 ? Math.round((stats.totalMinutes / dailyGoalMinutes) * 100) : 0;

    // Task stats
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = tasks.length;

    // Habits for today
    const habitsCompleted = habits.filter((h) => {
      const checkin = h.checkins[dateStr];
      if (!checkin) return false;
      if (h.targetCount > 1) return checkin >= h.targetCount;
      if (h.targetMinutes > 0) return checkin >= h.targetMinutes;
      return checkin > 0;
    }).length;

    // Category segments for donut
    const segments = Object.entries(stats.categories)
      .map(([label, value]) => ({
        label,
        value,
        color: CATEGORY_COLORS[label] || '#94a3b8',
      }))
      .sort((a, b) => b.value - a.value);

    // AI summary
    const aiSummary = generateAISummary(stats.totalMinutes, stats.categories, goalPct, completedTasks);
    const suggestions = generateSuggestions(stats.categories, goalPct);

    return {
      ...stats,
      focusMinutes,
      breakMinutes,
      goalPct,
      completedTasks,
      totalTasks,
      habitsCompleted,
      habitsTotal: habits.length,
      segments,
      pet,
      aiSummary,
      suggestions,
      activities,
    };
  }, [isOpen, dateStr, tasks, habits, dailyGoalMinutes]);

  const handleExportJSON = useCallback(() => {
    if (!data) return;
    const exportPayload = {
      date: dateStr,
      totalMinutes: data.totalMinutes,
      focusMinutes: data.focusMinutes,
      breakMinutes: data.breakMinutes,
      goalCompletion: data.goalPct,
      completedTasks: data.completedTasks,
      habitsCompleted: data.habitsCompleted,
      categories: data.categories,
      activities: data.activities.map((a) => ({
        name: a.name,
        category: a.category,
        duration: a.duration,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
      aiSummary: data.aiSummary,
      suggestions: data.suggestions,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-daily-summary-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', '导出成功！');
  }, [data, dateStr, addToast]);

  const handleShare = useCallback(() => {
    if (!data) return;
    const text = [
      `Trace 每日总结 - ${dateStr}`,
      `总工作时间: ${formatMinutes(data.totalMinutes)}`,
      `目标完成: ${data.goalPct}%`,
      `完成任务: ${data.completedTasks}/${data.totalTasks}`,
      `AI评价: ${data.aiSummary}`,
    ].join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      addToast('success', '已复制到剪贴板！');
    }
  }, [data, dateStr, addToast]);

  if (!data) return null;

  const displayDate = new Date(dateStr + 'T00:00:00');
  const dateLabel = displayDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex items-center gap-2 w-full justify-between">
          <span className="text-xs text-[var(--color-text-muted)]">Trace Daily Summary</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              分享
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportJSON}>
              导出 JSON
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      }
    >
      <div className="daily-summary-content space-y-5">
        {/* ── Header ── */}
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-soft))',
          }}
        >
          <div className="text-sm font-medium text-[var(--color-accent)]" style={{ opacity: 0.7 }}>
            每日总结
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{dateLabel}</h3>
          <p
            className="text-sm mt-2 leading-relaxed text-[var(--color-text-secondary)]"
            style={{ maxWidth: 360, margin: '8px auto 0' }}
          >
            {data.aiSummary}
          </p>
        </div>

        {/* ── Time Metrics Row ── */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            label="总工作时间"
            value={formatMinutes(data.totalMinutes)}
            icon="&#128337;"
            gradient="linear-gradient(135deg, #f97316, #fb923c)"
          />
          <MetricCard
            label="专注时间"
            value={formatMinutes(data.focusMinutes)}
            icon="&#127919;"
            gradient="linear-gradient(135deg, #6366f1, #818cf8)"
          />
          <MetricCard
            label="休息时间"
            value={formatMinutes(data.breakMinutes)}
            icon="&#9749;"
            gradient="linear-gradient(135deg, #22c55e, #4ade80)"
          />
        </div>

        {/* ── Goal + Donut Row ── */}
        <div className="grid grid-cols-2 gap-4">
          {/* Goal Completion */}
          <div
            className="rounded-2xl p-4 flex flex-col items-center justify-center"
            style={{
              background: 'var(--color-bg-surface-2)',
              border: '1px solid var(--color-border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <ProgressRing percentage={data.goalPct} size={96} strokeWidth={7} />
            <div className="mt-2 text-xs text-[var(--color-text-muted)]">
              {formatMinutes(data.totalMinutes)} / {formatMinutes(dailyGoalMinutes)}
            </div>
          </div>

          {/* Category Donut */}
          <div
            className="rounded-2xl p-4 flex flex-col items-center justify-center"
            style={{
              background: 'var(--color-bg-surface-2)',
              border: '1px solid var(--color-border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <DonutChart segments={data.segments} size={96} />
            <div className="mt-2 text-xs text-[var(--color-text-muted)]">
              {data.activityCount} 项活动
            </div>
          </div>
        </div>

        {/* ── Top Categories ── */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'var(--color-bg-surface-2)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">分类详情</h4>
          <div className="space-y-2.5">
            {data.segments.slice(0, 5).map((seg) => {
              const pct = data.totalMinutes > 0 ? Math.round((seg.value / data.totalMinutes) * 100) : 0;
              return (
                <div key={seg.label} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: seg.color }}
                  />
                  <span className="text-xs text-[var(--color-text-secondary)] w-12 flex-shrink-0">
                    {seg.label}
                  </span>
                  <div className="flex-1">
                    <Progress value={pct} color={seg.color} size="sm" />
                  </div>
                  <span className="text-xs font-medium text-[var(--color-text-primary)] tabular-nums w-16 text-right">
                    {formatMinutesShort(seg.value)} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tasks & Habits Row ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tasks */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'var(--color-bg-surface-2)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">任务完成</h4>
              <Badge variant={data.completedTasks >= data.totalTasks ? 'success' : 'accent'}>
                {data.completedTasks}/{data.totalTasks}
              </Badge>
            </div>
            <div className="metric-value text-2xl font-bold text-[var(--color-text-primary)] mb-1">
              {data.completedTasks}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">项任务已完成</div>
            <Progress
              value={data.totalTasks > 0 ? (data.completedTasks / data.totalTasks) * 100 : 0}
              size="sm"
              className="mt-3"
            />
          </div>

          {/* Habits */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'var(--color-bg-surface-2)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">习惯打卡</h4>
              <Badge variant={data.habitsCompleted >= data.habitsTotal ? 'success' : 'warning'}>
                {data.habitsCompleted}/{data.habitsTotal}
              </Badge>
            </div>
            <div className="metric-value text-2xl font-bold text-[var(--color-text-primary)] mb-1">
              {data.habitsCompleted}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">项习惯已完成</div>
            <Progress
              value={data.habitsTotal > 0 ? (data.habitsCompleted / data.habitsTotal) * 100 : 0}
              color="var(--color-success)"
              size="sm"
              className="mt-3"
            />
          </div>
        </div>

        {/* ── Pet Status ── */}
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent-soft), transparent)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <div className="text-3xl flex-shrink-0">
            {data.pet.type === 'cat' ? '\uD83D\uDC31' : data.pet.type === 'dog' ? '\uD83D\uDC36' : '\uD83D\uDC30'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                {data.pet.name}
              </span>
              <Badge variant="accent">Lv.{data.pet.level}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--color-text-muted)]">心情</span>
                <Progress value={data.pet.mood} size="sm" color="#f59e0b" className="w-16" />
                <span className="text-[10px] tabular-nums text-[var(--color-text-muted)]">{data.pet.mood}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--color-text-muted)]">饱腹</span>
                <Progress value={data.pet.hunger} size="sm" color="#22c55e" className="w-16" />
                <span className="text-[10px] tabular-nums text-[var(--color-text-muted)]">{data.pet.hunger}%</span>
              </div>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-1">
              金币 {data.pet.coins} &middot; 经验 {data.pet.xp}/{data.pet.level * 100}
            </div>
          </div>
        </div>

        {/* ── Tomorrow Suggestions ── */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'var(--color-bg-surface-2)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2.5">
            &#10024; 明日建议
          </h4>
          <ul className="space-y-2">
            {data.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                  style={{
                    background: 'var(--color-accent-soft)',
                    color: 'var(--color-accent)',
                  }}
                >
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        .daily-summary-content .metric-value {
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }
        .daily-summary-content > div {
          animation: dsSectionIn 350ms ease-out both;
        }
        .daily-summary-content > div:nth-child(1) { animation-delay: 0ms; }
        .daily-summary-content > div:nth-child(2) { animation-delay: 50ms; }
        .daily-summary-content > div:nth-child(3) { animation-delay: 100ms; }
        .daily-summary-content > div:nth-child(4) { animation-delay: 150ms; }
        .daily-summary-content > div:nth-child(5) { animation-delay: 200ms; }
        .daily-summary-content > div:nth-child(6) { animation-delay: 250ms; }
        .daily-summary-content > div:nth-child(7) { animation-delay: 300ms; }
        .daily-summary-content > div:nth-child(8) { animation-delay: 350ms; }
        @keyframes dsSectionIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Modal>
  );
}

// ─── Metric Card sub-component ───
function MetricCard({
  label,
  value,
  icon,
  gradient,
}: {
  label: string;
  value: string;
  icon: string;
  gradient: string;
}) {
  return (
    <div
      className="rounded-2xl p-3.5 text-center"
      style={{
        background: gradient,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}
    >
      <div className="text-lg mb-1" dangerouslySetInnerHTML={{ __html: icon }} />
      <div className="metric-value text-sm font-bold text-white leading-tight">{value}</div>
      <div className="text-[10px] text-white/70 mt-0.5">{label}</div>
    </div>
  );
}
