import { useNavigate } from 'react-router-dom';
import type { Carrera } from '@/types';
import { FACULTY_COLORS, FACULTY_LABELS } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { AnimatedDottedLine } from './AnimatedDottedLine';
import { AtmosphericBackground } from './AtmosphericBackground';
import { useCarrera } from '@/contexts/CarreraContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Monitor,
  Factory,
  TreePine,
  Calculator,
  Receipt,
  Briefcase,
  Scale,
  Heart,
  Stethoscope,
  Baby,
  GraduationCap,
  Mountain,
  MonitorSmartphone,
  Users,
  Circle,
  Lock,
} from 'lucide-react';

// ==========================================
// CarreraDetail - Panel derecho con detalle
// ==========================================

// Mapeo de iconos
const iconMap: Record<string, React.ElementType> = {
  Monitor,
  Factory,
  TreePine,
  Calculator,
  Receipt,
  Briefcase,
  Scale,
  Heart,
  Stethoscope,
  Baby,
  GraduationCap,
  Mountain,
};

// Configuración de estados con animaciones
const statusConfig: Record<string, { color: string; bgColor: string; label: string; animation: string }> = {
  online: { color: 'text-status-online', bgColor: 'bg-status-online', label: 'Online', animation: 'animate-status-online' },
  offline: { color: 'text-status-offline', bgColor: 'bg-status-offline', label: 'Offline', animation: 'animate-status-offline' },
  partial: { color: 'text-status-inUse', bgColor: 'bg-status-inUse', label: 'Parcial', animation: 'animate-status-inuse' },
};

interface CarreraDetailProps {
  carrera: Carrera | null;
}

export function CarreraDetail({ carrera }: CarreraDetailProps) {
  const navigate = useNavigate();
  const { setSelectedCarrera, selectedCarrera: carreraActiva } = useCarrera();
  const { user } = useAuth();

  // Docente solo puede gestionar su carrera activa (la que seleccionó al iniciar sesión)
  const isDocente = user?.role === 'docente';
  const isLocked = !!(isDocente && carreraActiva && carrera?.id !== carreraActiva.id);

  const handleGestionarDashboard = () => {
    if (carrera && !isLocked) {
      setSelectedCarrera(carrera);
      navigate('/dashboard');
    }
  };

  if (!carrera) {
    return (
      <div className="flex items-center justify-center h-full bg-black rounded-lg border border-border overflow-hidden">
        <p className="text-subtle">Selecciona una carrera</p>
      </div>
    );
  }

  const IconComponent = iconMap[carrera.icon] || Monitor;
  const facultyColor = FACULTY_COLORS[carrera.faculty];
  const facultyLabel = FACULTY_LABELS[carrera.faculty];
  const status = statusConfig[carrera.status] || statusConfig.offline;

  // Calcular tiempo desde última sincronización
  const getTimeSinceSync = () => {
    if (!carrera.lastSync) return 'Sin datos';
    const diff = Date.now() - carrera.lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'hace menos de 1 minuto';
    if (minutes === 1) return 'hace 1 minuto';
    if (minutes < 60) return `hace ${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'hace 1 hora';
    return `hace ${hours} horas`;
  };

  return (
    <div className="relative h-full bg-black rounded-lg border border-border overflow-hidden">
      {/* Fondo atmosférico con blob de color */}
      <AtmosphericBackground color={facultyColor} />

      {/* Contenido con scroll propio */}
      <div className="relative z-10 h-full flex flex-col p-6 overflow-y-auto scrollbar-thin">
        {/* Zona Superior - Header */}
        <div className="mb-8">
          {/* Icono grande + Nombre */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="p-4 rounded-xl bg-white/5"
              style={{ color: facultyColor }}
            >
              <IconComponent className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2 uppercase tracking-wide">
                {carrera.name}
              </h1>
              <div className="flex items-center gap-3">
                {/* Badge facultad */}
                <span
                  className="text-sm px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${facultyColor}20`,
                    color: facultyColor,
                  }}
                >
                  {facultyLabel}
                </span>
                {/* Estado con indicador animado */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    status.bgColor,
                    status.animation
                  )} />
                  <span className={cn('text-sm font-medium', status.color)}>
                    {status.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Node ID */}
          {carrera.nodeId && (
            <p className="text-xs text-subtle font-mono">
              {carrera.nodeId}
            </p>
          )}
        </div>

        {/* Separador - Línea punteada animada */}
        <div className="mb-8">
          <AnimatedDottedLine />
        </div>

        {/* Zona Inferior - Estadísticas */}
        <div className="flex-1 flex flex-col">
          {/* Cards de estadísticas */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Card PCs */}
            <div className="bg-black border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-subtle mb-2">
                <MonitorSmartphone className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Total PCs</span>
              </div>
              <p className="text-4xl font-bold text-white font-mono">
                {carrera.pcsCount}
              </p>
            </div>

            {/* Card Usuarios */}
            <div className="bg-black border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-subtle mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Total Usuarios</span>
              </div>
              <p className="text-4xl font-bold text-white font-mono">
                {carrera.usersCount}
              </p>
            </div>
          </div>

          {/* Última sincronización */}
          <p className="text-xs text-subtle text-center">
            Última sincronización: {getTimeSinceSync()}
          </p>
        </div>
      </div>

      {/* Botón Gestionar - Posición fija inferior derecha */}
      <button
        onClick={handleGestionarDashboard}
        disabled={isLocked}
        className={cn(
          "absolute bottom-6 right-6 z-20 flex items-center gap-4 px-10 py-5",
          "font-medium rounded-xl transition-colors shadow-lg",
          isLocked
            ? "bg-white/20 text-white/50 cursor-not-allowed"
            : "bg-white text-black hover:bg-white/90"
        )}
      >
        {isLocked ? (
          <Lock className="w-6 h-6" strokeWidth={2} />
        ) : (
          <Circle className="w-6 h-6" strokeWidth={2} />
        )}
        <span className="text-sm font-semibold tracking-wide uppercase">
          {isLocked ? 'Carrera Bloqueada' : 'Gestionar Dashboard'}
        </span>
      </button>

      {/* Mensaje para docentes cuando está bloqueado */}
      {isLocked && (
        <div className="absolute bottom-6 left-6 z-20 text-xs text-white/40">
          Para cambiar de carrera, cierra sesión
        </div>
      )}
    </div>
  );
}
