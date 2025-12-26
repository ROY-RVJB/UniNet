import type { Carrera } from '@/types';
import { FACULTY_COLORS, FACULTY_LABELS } from '@/data/mockData';
import { cn } from '@/lib/utils';
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
  Lock,
} from 'lucide-react';

// ==========================================
// CarreraListItem - Item individual de la lista
// ==========================================

// Mapeo de nombres de icono a componentes Lucide
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
const statusConfig: Record<string, { color: string; label: string; animation: string }> = {
  online: { color: 'bg-status-online', label: 'Online', animation: 'animate-status-online' },
  offline: { color: 'bg-status-offline', label: 'Offline', animation: 'animate-status-offline' },
  partial: { color: 'bg-status-inUse', label: 'Parcial', animation: 'animate-status-inuse' },
};

interface CarreraListItemProps {
  carrera: Carrera;
  isSelected: boolean;
  isLocked?: boolean;
  onSelect: () => void;
}

export function CarreraListItem({ carrera, isSelected, isLocked = false, onSelect }: CarreraListItemProps) {
  const IconComponent = iconMap[carrera.icon] || Monitor;
  const facultyColor = FACULTY_COLORS[carrera.faculty];
  const facultyLabel = FACULTY_LABELS[carrera.faculty];
  const status = statusConfig[carrera.status] || statusConfig.offline;

  // Estilo de glow dinámico basado en color de facultad (solo si no está bloqueado)
  const glowStyle = isSelected && !isLocked
    ? { boxShadow: `0 0 20px ${facultyColor}30, 0 0 40px ${facultyColor}15` }
    : undefined;

  return (
    <button
      onClick={onSelect}
      style={glowStyle}
      className={cn(
        // Base
        'w-full text-left p-3 rounded-lg transition-all duration-200',
        'border border-transparent',
        // Bloqueado
        isLocked && 'opacity-50',
        // Hover (solo si no está bloqueado)
        !isLocked && 'hover:bg-white/5',
        // Seleccionado
        isSelected && !isLocked && 'bg-white/5 border-white/20'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icono */}
        <div
          className="p-2 rounded-lg bg-white/5 shrink-0"
          style={{ color: facultyColor }}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Nombre + Badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white truncate">
              {carrera.name}
            </span>
          </div>

          {/* Facultad badge */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${facultyColor}20`,
                color: facultyColor,
              }}
            >
              {facultyLabel}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-subtle">
            <div className="flex items-center gap-1">
              <MonitorSmartphone className="w-3.5 h-3.5" />
              <span>{carrera.pcsCount} PCs</span>
            </div>
            {/* Status indicator con animación (oculto si bloqueado) */}
            {!isLocked && (
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  status.color,
                  status.animation
                )} />
                <span>{status.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Candado para carreras bloqueadas */}
        {isLocked && (
          <div className="flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-white/30" />
          </div>
        )}
      </div>
    </button>
  );
}
