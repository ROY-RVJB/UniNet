import type { PC } from '@/types';
import { cn } from '@/lib/utils';
import {
  X,
  Monitor,
  Wifi,
  AlertTriangle,
  User,
  Globe
} from 'lucide-react';
import { SystemMetricsPanel } from './SystemMetrics';
import { StatusIndicator } from './StatusIndicator';
import { TitaniumIcon } from './TitaniumIcon';
import { useState, useEffect } from 'react';

// ==========================================
// PCDetailPanel - Panel lateral de detalles
// ==========================================

interface PCDetailPanelProps {
  pc: PC | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PCDetailPanel({ pc, isOpen, onClose }: PCDetailPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [prevMetricsTimestamp, setPrevMetricsTimestamp] = useState<string | undefined>();

  // Detect when metrics update
  useEffect(() => {
    if (pc?.metricsTimestamp && pc.metricsTimestamp !== prevMetricsTimestamp) {
      setIsUpdating(true);
      setPrevMetricsTimestamp(pc.metricsTimestamp);

      // Pulse for 300ms
      const timer = setTimeout(() => setIsUpdating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [pc?.metricsTimestamp, prevMetricsTimestamp]);

  if (!pc) return null;

  const isOffline = pc.status === 'offline';
  const hasUser = pc.status === 'inUse' && pc.user;

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel lateral - True Resend Style */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-2xl z-50',
          'bg-black',
          'border-l border-white/[0.08]',
          'shadow-2xl shadow-black/80',
          'transition-transform duration-300 ease-out',
          'flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header - True Resend Style */}
        <div className="p-6 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center border border-white/[0.08]">
                <Monitor className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <div className="flex items-center">
                  <h2 className="text-xl font-semibold text-white">{pc.name}</h2>
                  {/* Live Update Indicator */}
                  {isUpdating && (
                    <div className="flex items-center gap-1.5 ml-3">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-semibold">Live</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-zinc-500">Detalles del equipo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors border border-transparent hover:border-white/[0.08]"
            >
              <X className="w-5 h-5 text-zinc-500 hover:text-zinc-300 transition-colors" />
            </button>
          </div>
        </div>


        {/* Contenido */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Estado - True Resend Style */}
          <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.08] shadow-[0_-1px_2px_0_rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Estado</span>
              <StatusIndicator status={pc.status} size="md" />
            </div>
          </div>

          {/* Información */}
          <div className="space-y-4">
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Información</h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Dirección IP */}
              <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.08] hover:border-white/[0.12] transition-all shadow-[0_-1px_2px_0_rgba(255,255,255,0.05)]">
                <div className="flex justify-center mb-3">
                  <TitaniumIcon icon={Globe} color="#3b82f6" />
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 font-medium text-center">IP Address</div>
                <div className="font-mono text-sm text-white font-medium text-center">{pc.ip}</div>
              </div>

              {/* Hostname */}
              <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.08] hover:border-white/[0.12] transition-all shadow-[0_-1px_2px_0_rgba(255,255,255,0.05)]">
                <div className="flex justify-center mb-3">
                  <TitaniumIcon icon={Monitor} color="#a855f7" />
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 font-medium text-center">Hostname</div>
                <div className="font-mono text-sm text-white font-medium text-center">{pc.name}</div>
              </div>
            </div>

            {/* Usuario */}
            <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.08] hover:border-white/[0.12] transition-all shadow-[0_-1px_2px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-3">
                <TitaniumIcon icon={User} color="#10b981" />
                <div className="flex-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Current User</div>
                  <div className={cn(
                    'font-medium text-sm mt-0.5',
                    hasUser ? 'text-white' : 'text-zinc-600 italic'
                  )}>
                    {pc.user || 'No active session'}
                  </div>
                </div>
              </div>
            </div>

            {/* Última conexión */}
            <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.08] hover:border-white/[0.12] transition-all shadow-[0_-1px_2px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-3">
                <TitaniumIcon icon={Wifi} color="#14b8a6" />
                <div className="flex-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Last Seen</div>
                  <div className="text-sm text-white font-medium mt-0.5">
                    {pc.lastSeen ? new Date(pc.lastSeen).toLocaleString('es-ES') : 'Just now'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas del Sistema */}
          {pc.metrics && (
            <div className="space-y-4">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Métricas del Sistema</h3>
              <SystemMetricsPanel metrics={pc.metrics} />
            </div>
          )}

          {/* Advertencia si está offline */}
          {isOffline && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 shadow-[0_-1px_2px_0_rgba(239,68,68,0.1)]">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">Equipo sin conexión</p>
                <p className="text-xs text-red-400/70 mt-1">
                  El equipo no ha enviado señal recientemente. Verifica la conexión de red.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
