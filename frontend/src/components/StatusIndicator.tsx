import type { PCStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: PCStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Configuración de estados con animaciones personalizadas
const statusConfig: Record<PCStatus, {
  color: string;
  label: string;
  animation: string;
  ringColor: string;
}> = {
  online: {
    color: 'bg-status-online',
    label: 'Conectado',
    animation: 'animate-status-online',
    ringColor: 'ring-status-online/30',
  },
  offline: {
    color: 'bg-status-offline',
    label: 'Sin Señal',
    animation: 'animate-status-offline',
    ringColor: 'ring-status-offline/20',
  },
  inUse: {
    color: 'bg-status-inUse',
    label: 'En Uso',
    animation: 'animate-status-inuse',
    ringColor: 'ring-status-inUse/30',
  },
  examMode: {
    color: 'bg-status-examMode',
    label: 'Modo Examen',
    animation: '',
    ringColor: 'ring-status-examMode/20',
  },
};

// Tamaños del indicador
const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function StatusIndicator({ status, showLabel = false, size = 'sm' }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      {/* Indicador con anillo exterior */}
      <div className="relative">
        {/* Anillo exterior sutil */}
        <div
          className={cn(
            'absolute inset-0 rounded-full ring-2',
            config.ringColor,
            config.animation
          )}
          style={{ transform: 'scale(1.5)' }}
        />
        {/* Punto central */}
        <div
          className={cn(
            'rounded-full relative z-10',
            sizeClasses[size],
            config.color,
            config.animation
          )}
        />
      </div>
      {showLabel && (
        <span className="text-sm text-tech-textDim font-medium">
          {config.label}
        </span>
      )}
    </div>
  );
}
