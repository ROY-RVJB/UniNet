import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useLaboratory } from '@/contexts/LaboratoryContext';
import type { Laboratory } from '@/types';

// ==========================================
// LabSelector - Dropdown para seleccionar laboratorio
// ==========================================

// Mapeo de colores de laboratorio a clases de Tailwind
const labColorClasses: Record<string, string> = {
  sistemas: 'bg-lab-sistemas',
  redes: 'bg-lab-redes',
  diseno: 'bg-lab-diseno',
  finanzas: 'bg-lab-finanzas',
  desarrollo: 'bg-lab-desarrollo',
  ciencias: 'bg-lab-ciencias',
  medicina: 'bg-lab-medicina',
  derecho: 'bg-lab-derecho',
};

// Color del dot de estado
const statusColors: Record<string, string> = {
  online: 'bg-status-online',
  offline: 'bg-status-offline',
  partial: 'bg-status-inUse',
};

export function LabSelector() {
  const { laboratories, selectedLab, setSelectedLab } = useLaboratory();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lab: Laboratory | null) => {
    setSelectedLab(lab);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button - ancho fijo para evitar desplazamiento de tabs */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 w-56 rounded-md border border-tech-darkBorder hover:border-tech-textDim transition-colors"
      >
        {selectedLab ? (
          <>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[selectedLab.status]}`} />
            <span className="text-white text-sm truncate flex-1 text-left">{selectedLab.name}</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-tech-textDim" />
            <span className="text-white text-sm truncate flex-1 text-left">Todos los Laboratorios</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-tech-textDim flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-56 bg-tech-darkCard border border-tech-darkBorder rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-tech-darkBorder">
            <span className="text-xs font-medium text-tech-textDim uppercase tracking-wide">
              Seleccionar Laboratorio
            </span>
          </div>

          {/* Options */}
          <div className="max-h-80 overflow-y-auto py-1 scrollbar-thin">
            {/* Option: Todos */}
            <button
              onClick={() => handleSelect(null)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 text-left
                hover:bg-white/5 transition-colors
                ${!selectedLab ? 'bg-white/5' : ''}
              `}
            >
              <div className="w-6 h-6 rounded bg-tech-darkBorder flex items-center justify-center">
                <span className="text-xs font-bold text-tech-textDim">All</span>
              </div>
              <div className="flex-1">
                <span className="text-sm text-white">Todos los Laboratorios</span>
              </div>
              {!selectedLab && (
                <Check className="w-4 h-4 text-status-online" />
              )}
            </button>

            {/* Lab Options */}
            {laboratories.map((lab) => (
              <button
                key={lab.id}
                onClick={() => handleSelect(lab)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-left
                  hover:bg-white/5 transition-colors
                  ${selectedLab?.id === lab.id ? 'bg-white/5' : ''}
                `}
              >
                {/* Color indicator */}
                <div className={`w-6 h-6 rounded ${labColorClasses[lab.color]} flex items-center justify-center`}>
                  <span className="text-xs font-bold text-white">
                    {lab.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Lab info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white truncate">{lab.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColors[lab.status]}`} />
                  </div>
                  <span className="text-xs text-tech-textDim">{lab.faculty}</span>
                </div>

                {/* Checkmark */}
                {selectedLab?.id === lab.id && (
                  <Check className="w-4 h-4 text-status-online flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Footer: Create new */}
          <div className="border-t border-tech-darkBorder px-3 py-2">
            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-tech-textDim hover:text-white transition-colors rounded hover:bg-white/5">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Crear nuevo laboratorio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
