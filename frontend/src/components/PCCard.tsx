import type { PC, PCStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, User, Wifi, WifiOff } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { cn } from '@/lib/utils';

interface PCCardProps {
  pc: PC;
  onClick?: () => void;
}

// Configuración de colores por estado para el efecto atmospheric
const statusColors: Record<PCStatus, {
  blob: string;
  border: string;
  icon: string;
}> = {
  online: {
    blob: 'bg-emerald-500',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    icon: 'text-emerald-400',
  },
  offline: {
    blob: 'bg-red-500',
    border: 'border-red-500/10 hover:border-red-500/20',
    icon: 'text-red-400/60',
  },
  inUse: {
    blob: 'bg-amber-500',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    icon: 'text-amber-400',
  },
  examMode: {
    blob: 'bg-purple-500',
    border: 'border-purple-500/20 hover:border-purple-500/30',
    icon: 'text-purple-400',
  },
};

export function PCCard({ pc, onClick }: PCCardProps) {
  const colors = statusColors[pc.status];
  const isOffline = pc.status === 'offline';

  return (
    <Card
      className={cn(
        'relative overflow-hidden cursor-pointer transition-all duration-300',
        'bg-[#0a0a0a] border',
        'hover:-translate-y-1',
        colors.border
      )}
      onClick={onClick}
    >
      {/* Blob atmosférico - efecto de color sutil */}
      <div
        className={cn(
          'absolute -top-8 -right-8 w-24 h-24 rounded-full blur-[40px] opacity-20 transition-opacity duration-500',
          colors.blob,
          isOffline && 'opacity-10'
        )}
      />

      {/* Contenido */}
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between mb-3">
          {/* Icono de monitor con indicador de conexión */}
          <div className="relative">
            <Monitor
              className={cn(
                'h-10 w-10 transition-colors duration-300',
                isOffline ? 'text-tech-textDim/50' : 'text-tech-text'
              )}
            />
            {/* Mini icono de wifi en esquina */}
            <div className="absolute -bottom-1 -right-1">
              {isOffline ? (
                <WifiOff className="h-3 w-3 text-red-400/60" />
              ) : (
                <Wifi className={cn('h-3 w-3', colors.icon)} />
              )}
            </div>
          </div>
          <StatusIndicator status={pc.status} size="md" />
        </div>

        {/* Nombre en tipografía mono */}
        <CardTitle
          className={cn(
            'font-mono text-lg tracking-wide',
            isOffline ? 'text-tech-textDim/70' : 'text-tech-text'
          )}
        >
          {pc.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 relative z-10">
        {/* Usuario */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3.5 w-3.5 text-tech-textDim" />
          <span
            className={cn(
              'truncate',
              pc.user ? 'text-tech-text' : 'text-tech-textDim/60 italic'
            )}
          >
            {pc.user || 'Sin sesión'}
          </span>
        </div>

        {/* IP en tipografía mono */}
        <p className="font-mono text-xs text-tech-textDim/80 tracking-wider">
          {pc.ip}
        </p>

        {/* Línea de estado sutil en la parte inferior */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 h-0.5 opacity-60',
            colors.blob
          )}
        />
      </CardContent>
    </Card>
  );
}
