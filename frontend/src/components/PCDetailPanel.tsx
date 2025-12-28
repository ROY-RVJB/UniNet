import type { PC, PCStatus } from '@/types';
import { cn } from '@/lib/utils';
import {
  X,
  Monitor,
  Wifi,
  WifiOff,
  Terminal,
  LogOut,
  AlertTriangle,
  User,
  Globe
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

// ==========================================
// PCDetailPanel - Panel lateral de detalles
// ==========================================

interface PCDetailPanelProps {
  pc: PC | null;
  isOpen: boolean;
  onClose: () => void;
}

// Configuración de estados
const statusConfig: Record<PCStatus, {
  label: string;
  color: string;
  bgColor: string;
  animation: string;
}> = {
  online: {
    label: 'Online',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500',
    animation: 'animate-status-online',
  },
  offline: {
    label: 'Offline',
    color: 'text-red-400',
    bgColor: 'bg-red-500',
    animation: 'animate-status-offline',
  },
  inUse: {
    label: 'En Uso',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500',
    animation: 'animate-status-inuse',
  },
  examMode: {
    label: 'Modo Examen',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500',
    animation: '',
  },
};

export function PCDetailPanel({ pc, isOpen, onClose }: PCDetailPanelProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (!pc) return;
    setLoadingLogs(true);
    const fetchLogs = async () => {
      try {
        // Buscar por usuario activo (uid) si existe
        let param = '';
        if (pc.user) {
          param = `&username=${encodeURIComponent(pc.user)}`;
        } else if (pc.name) {
          // Si no hay usuario, intentar filtrar por carrera si está disponible
          param = pc.carrera ? `&carrera=${encodeURIComponent(pc.carrera)}` : '';
        }
        const token = localStorage.getItem('uninet_token');
        const res = await fetch(`${apiUrl}/api/logs?limit=20${param}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch {}
      setLoadingLogs(false);
    };
    fetchLogs();
  }, [pc, apiUrl]);

  // Filtrar logs por tipo
  const filteredLogs = useMemo(() => {
    if (filterLevel === 'all') return logs;
    return logs.filter(log => (log.level || '').toLowerCase() === filterLevel);
  }, [logs, filterLevel]);

  if (!pc) return null;
  const status = statusConfig[pc.status];
  const isOffline = pc.status === 'offline';
  const hasUser = pc.status === 'inUse' && pc.user;

  // Handlers de acciones
  const handleSSH = () => {
    if (isOffline) return;
    // TODO: Implementar conexión SSH real
    console.log(`Conectando SSH a ${pc.ip}...`);
    alert(`SSH: ssh admin@${pc.ip}`);
  };

  const handleCloseSession = () => {
    if (!hasUser) return;
    // TODO: Implementar cierre de sesión real
    console.log(`Cerrando sesión de ${pc.user} en ${pc.name}...`);
    alert(`Cerrando sesión de ${pc.user}`);
  };

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

      {/* Panel lateral - Glassmorphism */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md z-50',
          // Glassmorphism effect
          'bg-black/70 backdrop-blur-xl',
          'border-l border-white/10',
          'shadow-[-20px_0_60px_rgba(0,0,0,0.5)]',
          // Animación
          'transform transition-all duration-300 ease-out',
          'flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header - con gradiente sutil */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Monitor className="w-8 h-8 text-white" />
              <div className="absolute -bottom-1 -right-1">
                {isOffline ? (
                  <WifiOff className="w-4 h-4 text-red-400" />
                ) : (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-mono font-bold text-white">{pc.name}</h2>
              <p className="text-sm text-white/50">Detalles del equipo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Logs recientes de este PC */}
        <div className="mt-6">
          <h4 className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-2">Logs recientes</h4>
          {/* Filtros de nivel */}
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => setFilterLevel('all')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${filterLevel === 'all' ? 'bg-tech-hoverState text-white' : 'text-tech-textDim hover:text-white'}`}
            >Todos</button>
            <button
              onClick={() => setFilterLevel('info')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${filterLevel === 'info' ? 'bg-teal-400/10 text-teal-400' : 'text-tech-textDim hover:text-white'}`}
            >Info</button>
            <button
              onClick={() => setFilterLevel('warn')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${filterLevel === 'warn' ? 'bg-amber-400/10 text-amber-400' : 'text-tech-textDim hover:text-white'}`}
            >Warn</button>
            <button
              onClick={() => setFilterLevel('error')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${filterLevel === 'error' ? 'bg-red-400/10 text-red-400' : 'text-tech-textDim hover:text-white'}`}
            >Error</button>
          </div>
          <div className="bg-black/30 rounded-lg p-2 max-h-40 overflow-y-auto border border-white/10">
            {loadingLogs ? (
              <div className="text-tech-textDim text-xs">Cargando logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-tech-textDim text-xs">Sin logs recientes para este equipo</div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div key={log.id || idx} className="flex gap-2 text-xs py-0.5 border-b border-white/5 last:border-b-0">
                  <span className="text-tech-textDim">{log.timestamp || ''}</span>
                  <span className="text-white">{log.message || JSON.stringify(log)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Estado - Glassmorphism card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50 uppercase tracking-wider">Estado</span>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-3 h-3 rounded-full',
                  status.bgColor,
                  status.animation
                )} />
                <span className={cn('font-medium', status.color)}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>

          {/* Información */}
          <div className="space-y-4">
            <h3 className="text-xs text-white/50 uppercase tracking-wider font-semibold">
              Información
            </h3>

            {/* IP */}
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-white/40" />
                <span className="text-white/70">Dirección IP</span>
              </div>
              <span className="font-mono text-white">{pc.ip}</span>
            </div>

            {/* Usuario */}
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-white/40" />
                <span className="text-white/70">Usuario</span>
              </div>
              <span className={cn(
                'font-medium',
                hasUser ? 'text-white' : 'text-white/40 italic'
              )}>
                {pc.user || 'Sin sesión'}
              </span>
            </div>

            {/* Última conexión */}
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-white/40" />
                <span className="text-white/70">Última conexión</span>
              </div>
              <span className="text-white/60 text-sm">
                {pc.lastSeen ? formatLastSeen(pc.lastSeen) : '—'}
              </span>
            </div>
          </div>

          {/* Mensaje de PC offline - Glassmorphism */}
          {isOffline && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-500/20 shadow-lg shadow-red-500/5">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">PC no disponible</p>
                <p className="text-sm text-red-400/70 mt-1">
                  Este equipo está apagado o sin conexión de red.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Acciones - Footer con glassmorphism */}
        <div className="p-6 border-t border-white/10 space-y-3 bg-gradient-to-t from-black/50 to-transparent">
          {/* Botón SSH - Glassmorphism */}
          <button
            onClick={handleSSH}
            disabled={isOffline}
            className={cn(
              'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all',
              isOffline
                ? 'bg-white/5 backdrop-blur-sm text-white/30 cursor-not-allowed border border-white/5'
                : 'bg-white text-black hover:bg-white/90 hover:shadow-lg hover:shadow-white/20'
            )}
          >
            <Terminal className="w-5 h-5" />
            Conectar SSH
          </button>

          {/* Botón Cerrar Sesión - solo si hay usuario - Glassmorphism */}
          {hasUser && (
            <button
              onClick={handleCloseSession}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium
                         bg-amber-500/10 backdrop-blur-sm text-amber-400 border border-amber-500/20
                         hover:bg-amber-500/20 hover:shadow-lg hover:shadow-amber-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión de {pc.user}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// Helper para formatear última conexión
function formatLastSeen(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Hace un momento';
  if (minutes === 1) return 'Hace 1 minuto';
  if (minutes < 60) return `Hace ${minutes} minutos`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'Hace 1 hora';
  if (hours < 24) return `Hace ${hours} horas`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hace 1 día';
  return `Hace ${days} días`;
}
