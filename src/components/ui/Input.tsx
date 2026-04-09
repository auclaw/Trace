import React, { useId } from 'react';

interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  className?: string;
  rows?: number;
}

export default function Input({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  icon,
  error,
  disabled = false,
  multiline = false,
  className = '',
  rows = 3,
}: InputProps) {
  const id = useId();
  const hasValue = value.length > 0;

  const sharedClasses = [
    'w-full bg-transparent',
    'text-[var(--color-text-primary)] text-sm',
    'border-b-2 transition-colors duration-200',
    'outline-none',
    'placeholder:text-[var(--color-text-muted)]/60',
    error
      ? 'border-red-500/70 focus:border-red-500'
      : 'border-[var(--color-border-subtle)]/50 focus:border-[var(--color-accent)]',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    icon ? 'pl-8' : '',
    label ? 'pt-5 pb-2' : 'py-2.5',
  ].join(' ');

  return (
    <div className={`relative ${className}`}>
      {/* Icon */}
      {icon && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
          {icon}
        </span>
      )}

      {/* Float label */}
      {label && (
        <label
          htmlFor={id}
          className={[
            'absolute left-0 pointer-events-none',
            'transition-all duration-200 origin-left',
            icon ? 'pl-8' : '',
            hasValue || placeholder
              ? 'top-0 text-[10px] font-medium text-[var(--color-text-muted)]'
              : 'top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]',
            /* focus-within on parent shifts the label up via group */
          ].join(' ')}
        >
          {label}
        </label>
      )}

      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`${sharedClasses} resize-y min-h-[2.5rem]`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={sharedClasses}
        />
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
