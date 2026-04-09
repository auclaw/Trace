import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      ].join(' ')}
    >
      <div
        className={[
          'flex items-center justify-center w-20 h-20 rounded-2xl mb-5',
          'bg-[var(--color-bg-surface-2)] text-4xl',
        ].join(' ')}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] max-w-xs leading-relaxed mb-5">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
