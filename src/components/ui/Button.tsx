import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2.5',
};

const variantBase = 'shadow-[var(--shadow-xs)]';

const variantStyles: Record<string, string> = {
  primary: [
    variantBase,
    'bg-[var(--color-accent)] text-white',
    'hover:brightness-110 hover:shadow-[var(--shadow-accent)]',
    'disabled:opacity-40 disabled:hover:brightness-100 disabled:hover:shadow-[var(--shadow-xs)]',
  ].join(' '),
  secondary: [
    variantBase,
    'border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)]',
    'text-[var(--color-text-primary)]',
    'hover:bg-[var(--color-accent-soft)] hover:border-[var(--color-accent)]',
    'disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-[var(--color-border-subtle)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--color-text-secondary)]',
    'hover:bg-[var(--color-bg-surface-2)] hover:text-[var(--color-text-primary)]',
    'disabled:opacity-40 disabled:hover:bg-transparent',
  ].join(' '),
  danger: [
    variantBase,
    'bg-[var(--color-danger)] text-white',
    'hover:brightness-110 hover:shadow-lg hover:shadow-red-600/20',
    'disabled:opacity-40 disabled:hover:brightness-100 disabled:hover:shadow-[var(--shadow-xs)]',
  ].join(' '),
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? 'h-4 w-4'}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
      />
    </svg>
  );
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  icon,
  loading = false,
  fullWidth = false,
  type = 'button',
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded-full font-medium',
        'transition-all duration-200 ease-out',
        'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50',
        'select-none cursor-pointer',
        isDisabled ? 'pointer-events-none' : '',
        sizeStyles[size],
        variantStyles[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {loading ? (
        <Spinner className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
