import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  /* lock body scroll */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className={[
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'backdrop-blur-sm',
        'animate-[fadeIn_200ms_ease-out]',
      ].join(' ')}
      style={{ background: 'rgba(44, 24, 16, 0.4)' }}
    >
      <div
        ref={panelRef}
        className={[
          'w-full relative',
          'rounded-2xl',
          'animate-[scaleIn_200ms_ease-out]',
          sizeStyles[size],
        ].join(' ')}
        style={{
          background: 'var(--color-bg-surface-1)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-xl)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]/40">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              {title}
            </h2>
            <CloseButton onClick={onClose} />
          </div>
        )}

        {/* Close button when no title */}
        {!title && (
          <div className="absolute top-3 right-3 z-10">
            <CloseButton onClick={onClose} />
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--color-border-subtle)]/40">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close"
      className={[
        'flex items-center justify-center w-8 h-8 rounded-lg',
        'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
        'hover:bg-[var(--color-bg-surface-2)]',
        'transition-colors duration-150 cursor-pointer',
      ].join(' ')}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    </button>
  );
}
