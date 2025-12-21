import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';

// ==========================================
// ConfirmModal - Modal de confirmación minimalista
// ==========================================

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
}

const variantStyles = {
  danger: {
    icon: 'text-red-400',
    iconBg: 'bg-red-400/10',
    button: 'bg-red-500 hover:bg-red-600 text-white',
  },
  warning: {
    icon: 'text-amber-400',
    iconBg: 'bg-amber-400/10',
    button: 'bg-amber-500 hover:bg-amber-600 text-black',
  },
  default: {
    icon: 'text-white/70',
    iconBg: 'bg-white/10',
    button: 'bg-white hover:bg-white/90 text-black',
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const styles = variantStyles[variant];

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error en confirmación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 duration-150"
      >
        <div className="bg-black border border-white/10 rounded-lg shadow-2xl overflow-hidden">
          {/* Content */}
          <div className="p-6">
            {/* Icon + Title */}
            <div className="flex items-start gap-4">
              <div className={cn('p-2 rounded-lg', styles.iconBg)}>
                <AlertTriangle className={cn('h-5 w-5', styles.icon)} />
              </div>
              <div className="flex-1 pt-0.5">
                <h3 className="text-base font-medium text-white">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                'text-white/70 hover:text-white hover:bg-white/5',
                'border border-white/10 hover:border-white/20',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                styles.button
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Procesando...</span>
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
