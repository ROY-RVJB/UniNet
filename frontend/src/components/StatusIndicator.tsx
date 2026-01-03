import type { PCStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: PCStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Configuración de badges estilo Resend
const statusConfig: Record<PCStatus, {
  bgColor: string;
  textColor: string;
  label: string;
}> = {
  online: {
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
    label: 'Online',
  },
  offline: {
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-500',
    label: 'Offline',
  },
  inUse: {
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-500',
    label: 'En Uso',
  },
  examMode: {
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-500',
    label: 'Examen',
  },
};

// Tamaños del badge
const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function StatusIndicator({ status, showLabel = true, size = 'md' }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium tracking-wide',
        config.bgColor,
        config.textColor,
        sizeClasses[size]
      )}
    >
      {showLabel && config.label}
    </div>
  );
}
