import type { Laboratory } from '@/types';
import { useLaboratory } from '@/contexts/LaboratoryContext';
import {
  Monitor,
  Network,
  Palette,
  TrendingUp,
  Code,
  Atom,
  Stethoscope,
  Scale,
  Users,
  MonitorSmartphone
} from 'lucide-react';

// ==========================================
// LabCard - Card para cada laboratorio en Home
// ==========================================

// Mapeo de nombres de icono a componentes Lucide
const iconMap: Record<string, React.ElementType> = {
  Monitor,
  Network,
  Palette,
  TrendingUp,
  Code,
  Atom,
  Stethoscope,
  Scale,
};

// Mapeo de colores de laboratorio a clases de Tailwind (borde izquierdo)
const labBorderColors: Record<string, string> = {
  sistemas: 'border-l-lab-sistemas',
  redes: 'border-l-lab-redes',
  diseno: 'border-l-lab-diseno',
  finanzas: 'border-l-lab-finanzas',
  desarrollo: 'border-l-lab-desarrollo',
  ciencias: 'border-l-lab-ciencias',
  medicina: 'border-l-lab-medicina',
  derecho: 'border-l-lab-derecho',
};

// Mapeo de colores para el icono
const labIconColors: Record<string, string> = {
  sistemas: 'text-lab-sistemas',
  redes: 'text-lab-redes',
  diseno: 'text-lab-diseno',
  finanzas: 'text-lab-finanzas',
  desarrollo: 'text-lab-desarrollo',
  ciencias: 'text-lab-ciencias',
  medicina: 'text-lab-medicina',
  derecho: 'text-lab-derecho',
};

// Color del badge de estado
const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  online: { bg: 'bg-status-online/10', text: 'text-status-online', label: 'Online' },
  offline: { bg: 'bg-status-offline/10', text: 'text-status-offline', label: 'Offline' },
  partial: { bg: 'bg-status-inUse/10', text: 'text-status-inUse', label: 'Parcial' },
};

interface LabCardProps {
  lab: Laboratory;
}

export function LabCard({ lab }: LabCardProps) {
  const { setSelectedLab } = useLaboratory();
  const IconComponent = iconMap[lab.icon] || Monitor;
  const borderColor = labBorderColors[lab.color] || 'border-l-white';
  const iconColor = labIconColors[lab.color] || 'text-white';
  const status = statusConfig[lab.status] || statusConfig.offline;

  const handleClick = () => {
    setSelectedLab(lab);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full text-left p-5 rounded-lg
        bg-tech-darkCard border border-tech-darkBorder border-l-4 ${borderColor}
        hover:bg-tech-hoverState hover:border-tech-textDim/50
        transition-all duration-200 group
      `}
    >
      {/* Header: Icono + Status */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg bg-white/5 ${iconColor}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Nombre y Facultad */}
      <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-tech-text transition-colors">
        {lab.name}
      </h3>
      <p className="text-tech-textDim text-sm mb-4">
        {lab.faculty}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-tech-darkBorder">
        <div className="flex items-center gap-1.5">
          <MonitorSmartphone className="w-4 h-4 text-tech-textDim" />
          <span className="text-sm text-tech-text font-medium">{lab.pcsCount}</span>
          <span className="text-xs text-tech-textDim">PCs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-tech-textDim" />
          <span className="text-sm text-tech-text font-medium">{lab.usersCount}</span>
          <span className="text-xs text-tech-textDim">Usuarios</span>
        </div>
      </div>
    </button>
  );
}
