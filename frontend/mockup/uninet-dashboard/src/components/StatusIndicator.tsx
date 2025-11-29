import type { PCStatus } from '@/types';

interface StatusIndicatorProps {
  status: PCStatus;
  showLabel?: boolean;
}

export function StatusIndicator({ status, showLabel = false }: StatusIndicatorProps) {
  const statusConfig = {
    online: {
      color: 'bg-status-online',
      label: 'Conectado',
      animate: true,
    },
    offline: {
      color: 'bg-status-offline',
      label: 'Sin Señal',
      animate: false,
    },
    inUse: {
      color: 'bg-status-inUse',
      label: 'En Uso',
      animate: true,
    },
    examMode: {
      color: 'bg-status-examMode',
      label: 'Modo Examen',
      animate: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2 w-2 rounded-full ${config.color} ${
          config.animate ? 'animate-pulse' : ''
        }`}
      />
      {showLabel && (
        <span className="text-sm text-tech-textDim">{config.label}</span>
      )}
    </div>
  );
}
