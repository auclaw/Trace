import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const paddingMap: Record<string, string> = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
};

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
  style: styleProp,
}: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      data-card
      style={{
        background: 'linear-gradient(180deg, var(--color-bg-surface-1) 0%, var(--color-bg-surface-2) 100%)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        transition: 'box-shadow 200ms cubic-bezier(0.4,0,0.2,1), transform 200ms cubic-bezier(0.4,0,0.2,1)',
        ...styleProp,
      }}
      className={[
        paddingMap[padding],
        hover ? 'hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-[2px]' : '',
        onClick ? 'cursor-pointer' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
