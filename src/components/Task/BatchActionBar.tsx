import { CheckSquare, Square, Trash2, Archive, X, Loader2 } from 'lucide-react'

interface BatchActionBarProps {
  selectedCount: number
  totalCount: number
  loading: boolean
  onSelectAll: () => void
  onClearSelection: () => void
  onBatchComplete: () => void
  onBatchDelete: () => void
  onBatchArchive: () => void
}

export default function BatchActionBar({
  selectedCount,
  totalCount,
  loading,
  onSelectAll,
  onClearSelection,
  onBatchComplete,
  onBatchDelete,
  onBatchArchive,
}: BatchActionBarProps) {
  if (selectedCount === 0) return null

  const isAllSelected = selectedCount === totalCount

  return (
    <div
      className="sticky bottom-0 z-20 p-4 transition-all duration-300"
      style={{
        background: 'var(--color-bg-surface-1)',
        border: '2px solid var(--color-accent)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 -4px 20px rgba(121, 190, 235, 0.2)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:opacity-80"
            style={{ background: 'var(--color-bg-surface-2)' }}
          >
            {isAllSelected ? (
              <CheckSquare size={18} style={{ color: 'var(--color-accent)' }} />
            ) : (
              <Square size={18} style={{ color: 'var(--color-text-muted)' }} />
            )}
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              已选择 {selectedCount} / {totalCount} 项
            </span>
          </button>

          <button
            onClick={onClearSelection}
            className="p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
            title="取消选择"
          >
            <X size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Batch complete */}
          <button
            onClick={onBatchComplete}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-success)', borderRadius: 'var(--radius-lg)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
            批量完成
          </button>

          {/* Batch archive */}
          <button
            onClick={onBatchArchive}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-bg-surface-2)', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-lg)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}
            归档
          </button>

          {/* Batch delete */}
          <button
            onClick={onBatchDelete}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-danger)', borderRadius: 'var(--radius-lg)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            删除
          </button>
        </div>
      </div>
    </div>
  )
}
