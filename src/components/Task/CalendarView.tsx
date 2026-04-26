import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react'
import type { Task } from '../../services/dataService'
import { STATUS_CONFIG, getPriorityConfig } from '../../constants/task'

interface CalendarViewProps {
  tasks: Task[]
  onAddTask?: (date: string) => void
  onTaskClick?: (task: Task) => void
}

export default function CalendarView({ tasks, onAddTask, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startingDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const todayStr = new Date().toISOString().slice(0, 10)

  const days: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    tasks.forEach((task) => {
      if (task.dueDate) {
        if (!map[task.dueDate]) {
          map[task.dueDate] = []
        }
        map[task.dueDate].push(task)
      }
    })
    return map
  }, [tasks])

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月',
  ]

  const dayNames = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '2px solid #E8E6E1' }}
    >
      {/* Calendar Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: '#FAF8F5', borderBottom: '2px solid #E8E6E1' }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold" style={{ color: '#3A3638' }}>
            {year}年 {monthNames[month]}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 rounded-lg text-sm font-medium transition-all hover:bg-white"
            style={{ background: '#79BEEB', color: 'white' }}
          >
            今天
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-lg transition-all hover:bg-white"
          >
            <ChevronLeft size={20} style={{ color: '#5C5658' }} />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg transition-all hover:bg-white"
          >
            <ChevronRight size={20} style={{ color: '#5C5658' }} />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7">
        {dayNames.map((day, index) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-semibold"
            style={{
              color: index === 0 || index === 6 ? '#EF4444' : '#5C5658',
              background: '#FAF8F5',
              borderRight: index < 6 ? '1px solid #E8E6E1' : 'none',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const isWeekend = index % 7 === 0 || index % 7 === 6
          const dateStr = day ? formatDate(day) : ''
          const isToday = dateStr === todayStr
          const dayTasks = day ? tasksByDate[dateStr] || [] : []
          const completedCount = dayTasks.filter((t) => t.status === 'completed').length

          return (
            <div
              key={index}
              className="min-h-[100px] p-1 transition-all"
              style={{
                background: isToday
                  ? '#79BEEB15'
                  : isWeekend
                  ? '#FAF8F5'
                  : 'transparent',
                borderRight: index % 7 < 6 ? '1px solid #E8E6E1' : 'none',
                borderBottom: '1px solid #E8E6E1',
              }}
            >
              {day && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                      style={{
                        color: isToday
                          ? 'white'
                          : isWeekend
                          ? '#EF4444'
                          : '#3A3638',
                        background: isToday ? '#79BEEB' : 'transparent',
                      }}
                    >
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-xs" style={{ color: '#9E9899' }}>
                        {completedCount}/{dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="px-2 py-1 rounded-lg text-xs cursor-pointer transition-all hover:scale-[1.02] truncate"
                        style={{
                          background:
                            STATUS_CONFIG[task.status]?.bg || '#F3F4F6',
                          borderLeft: `3px solid ${
                            getPriorityConfig(task.priority).border
                          }`,
                          color: '#3A3638',
                        }}
                        onClick={() => onTaskClick?.(task)}
                        title={task.title}
                      >
                        <span className="truncate block">{task.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div
                        className="text-xs text-center py-1 cursor-pointer"
                        style={{ color: '#79BEEB' }}
                      >
                        +{dayTasks.length - 3} 更多
                      </div>
                    )}
                  </div>

                  <button
                    className="w-full mt-1 py-1 rounded-lg text-xs flex items-center justify-center gap-1 transition-all opacity-0 hover:opacity-100"
                    style={{ color: '#79BEEB' }}
                    onClick={() => onAddTask?.(dateStr)}
                  >
                    <Plus size={12} />
                    添加
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Tasks without due date */}
      <div
        className="p-4"
        style={{ background: '#FAF8F5', borderTop: '2px solid #E8E6E1' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} style={{ color: '#9E9899' }} />
          <h3 className="text-sm font-semibold" style={{ color: '#5C5658' }}>
            无截止日期的任务
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#E8E6E1', color: '#5C5658' }}>
            {tasks.filter((t) => !t.dueDate).length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tasks
            .filter((t) => !t.dueDate)
            .map((task) => (
              <div
                key={task.id}
                className="px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  background: STATUS_CONFIG[task.status]?.bg || '#F3F4F6',
                  borderLeft: `3px solid ${
                    getPriorityConfig(task.priority).border
                  }`,
                  color: '#3A3638',
                }}
                onClick={() => onTaskClick?.(task)}
              >
                {task.title}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
