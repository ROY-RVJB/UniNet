import type { Carrera } from '@/types';
import { cn } from '@/lib/utils';
import {
  Monitor, Factory, TreePine, Calculator, Receipt,
  Briefcase, Scale, Heart, Stethoscope, Baby,
  GraduationCap, Mountain, Folder, Lock
} from 'lucide-react';

// Mapeo de Iconos
const iconMap: Record<string, React.ElementType> = {
  Monitor, Factory, TreePine, Calculator, Receipt,
  Briefcase, Scale, Heart, Stethoscope, Baby,
  GraduationCap, Mountain, Folder
};

// Colores de texto según facultad (solo para el texto pequeño)
const facultyColors: Record<string, string> = {
  "ingenieria": "text-blue-400",
  "ciencias": "text-cyan-400",
  "salud": "text-emerald-400",
  "artes": "text-pink-400",
  "general": "text-gray-400"
};

const facultyLabels: Record<string, string> = {
  "ingenieria": "Ingeniería",
  "ciencias": "Ciencias",
  "salud": "Salud",
  "artes": "Artes",
  "general": "General"
};

interface CarreraListItemProps {
  carrera: Carrera;
  isSelected?: boolean;
  isLocked?: boolean;
  onSelect?: () => void;
}

export function CarreraListItem({ carrera, isSelected, isLocked = false, onSelect }: CarreraListItemProps) {
  const IconComponent = iconMap[carrera.icon] || Folder;
  const facultyColor = facultyColors[carrera.faculty] || "text-gray-400";
  const facultyLabel = facultyLabels[carrera.faculty] || "General";

  return (
    <button
      onClick={onSelect}
      disabled={isLocked}
      className={cn(
        // BASE: Fila horizontal compacta
        "group flex items-center w-full gap-3 p-3 rounded-lg border text-left transition-all duration-200",
        
        // ESTADO SELECCIONADO (Borde azul y fondo suave azulado)
        isSelected 
          ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
          : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10",

        // ESTADO BLOQUEADO
        isLocked && "opacity-40 cursor-not-allowed grayscale"
      )}
    >
      {/* 1. CAJA DE ICONO (Cuadrada) */}
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-colors",
        isSelected ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-gray-300"
      )}>
        {isLocked ? <Lock className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
      </div>

      {/* 2. TEXTOS (Nombre y Facultad) */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Nombre de la carrera */}
        <span className={cn(
          "font-medium text-sm truncate",
          isSelected ? "text-white" : "text-gray-300 group-hover:text-white"
        )}>
          {carrera.name}
        </span>
        
        {/* Facultad y Estado */}
        <div className="flex items-center gap-2 mt-0.5">
          {/* Nombre de facultad con color */}
          <span className={cn("text-xs font-medium truncate", facultyColor)}>
            {facultyLabel}
          </span>
          
          {/* Separador punto */}
          <span className="text-gray-700 text-[10px]">•</span>

          {/* Estado Online/Offline pequeño */}
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              carrera.usersCount > 0 ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]" : "bg-gray-600"
            )} />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              {carrera.usersCount > 0 ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}