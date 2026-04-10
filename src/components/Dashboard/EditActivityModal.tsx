// Edit Activity Modal
// Splitted from Dashboard.tsx

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Activity, ActivityCategory } from '../../services/dataService'
import { Modal, Button } from '../../components/ui'
import Input from '../../components/ui/Input'

const CATEGORIES: ActivityCategory[] = [
  '开发', '工作', '学习', '会议', '休息', '娱乐', '运动', '阅读', '其他',
]

interface EditActivityModalProps {
  activity: Activity
  onClose: () => void
  onSave: (id: string, updates: Partial<Activity>) => void
  onDelete: (id: string) => void
}

export default function EditActivityModal({
  activity,
  onClose,
  onSave,
  onDelete,
}: EditActivityModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(activity.name)
  const [category, setCategory] = useState<ActivityCategory>(activity.category)
  const [startTime, setStartTime] = useState(activity.startTime.slice(0, 16))
  const [endTime, setEndTime] = useState(activity.endTime.slice(0, 16))
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = () => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const duration = Math.round((end.getTime() - start.getTime()) / 60000)
    onSave(activity.id, {
      name,
      category,
      startTime: startTime + ':00',
      endTime: endTime + ':00',
      duration: Math.max(1, duration),
    })
    onClose()
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('dashboard.editActivity')}
      footer={
        <>
          {confirmDelete ? (
            <>
              <span className="text-sm text-red-500 mr-auto">{t('dashboard.confirmDelete')}</span>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>{t('common.cancel')}</Button>
              <Button variant="danger" size="sm" onClick={() => { onDelete(activity.id); onClose() }}>{t('common.delete')}</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                {t('common.delete')}
              </Button>
              <div className="flex-1" />
              <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
              <Button size="sm" onClick={handleSave}>{t('common.save')}</Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <Input label={t('dashboard.activityName')} value={name} onChange={setName} placeholder={t('dashboard.activityName')} />
        <div>
          <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-2">{t('dashboard.category')}</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={[
                  'px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer',
                  cat === category
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium'
                    : 'border-[var(--color-border-subtle)]/50 text-[var(--color-text-secondary)] hover:border-[var(--color-border-subtle)]',
                ].join(' ')}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1">{t('dashboard.startTime')}</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-transparent border-b-2 border-[var(--color-border-subtle)]/50 focus:border-[var(--color-accent)] text-[var(--color-text-primary)] text-sm py-2 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1">{t('dashboard.endTime')}</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-transparent border-b-2 border-[var(--color-border-subtle)]/50 focus:border-[var(--color-accent)] text-[var(--color-text-primary)] text-sm py-2 outline-none"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
