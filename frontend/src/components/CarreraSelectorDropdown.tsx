import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useCarrera } from '@/contexts/CarreraContext';
import { FACULTY_COLORS } from '@/data/mockData';
import type { Carrera } from '@/types';

// ==========================================
// CarreraSelectorDropdown - Dropdown para navbar
// ==========================================

const statusColors: Record<string, string> = {
  online: 'bg-status-online',
  offline: 'bg-status-offline',
  partial: 'bg-status-inUse',
};

export function CarreraSelectorDropdown() {
  const { carreras, selectedCarrera, setSelectedCarrera } = useCarrera();
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

  const handleSelect = (carrera: Carrera | null) => {
    setSelectedCarrera(carrera);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 w-56 rounded-md border border-tech-darkBorder hover:border-tech-textDim transition-colors"
      >
        {selectedCarrera ? (
          <>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[selectedCarrera.status]}`} />
            <span className="text-white text-sm truncate flex-1 text-left">{selectedCarrera.name}</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-status-online" />
            <span className="text-white text-sm truncate flex-1 text-left">Todas las Carreras</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-tech-textDim flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-72 bg-black border border-tech-darkBorder rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-tech-darkBorder">
            <span className="text-xs font-medium text-tech-textDim uppercase tracking-wide">
              Seleccionar Carrera
            </span>
          </div>

          {/* Options */}
          <div className="max-h-80 overflow-y-auto py-1 scrollbar-thin">
            {/* Option: Todas */}
            <button
              onClick={() => handleSelect(null)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 text-left
                hover:bg-white/5 transition-colors
                ${!selectedCarrera ? 'bg-white/5' : ''}
              `}
            >
              <div className="w-6 h-6 rounded bg-tech-darkBorder flex items-center justify-center">
                <span className="text-xs font-bold text-tech-textDim">All</span>
              </div>
              <div className="flex-1">
                <span className="text-sm text-white">Todas las Carreras</span>
              </div>
              {!selectedCarrera && (
                <Check className="w-4 h-4 text-status-online" />
              )}
            </button>

            {/* Carrera Options */}
            {carreras.map((carrera) => {
              const facultyColor = FACULTY_COLORS[carrera.faculty];
              return (
                <button
                  key={carrera.id}
                  onClick={() => handleSelect(carrera)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-left
                    hover:bg-white/5 transition-colors
                    ${selectedCarrera?.id === carrera.id ? 'bg-white/5' : ''}
                  `}
                >
                  {/* Color indicator */}
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ backgroundColor: facultyColor }}
                  >
                    <span className="text-xs font-bold text-white">
                      {carrera.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>

                  {/* Carrera info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white truncate">{carrera.name}</span>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColors[carrera.status]}`} />
                    </div>
                  </div>

                  {/* Checkmark */}
                  {selectedCarrera?.id === carrera.id && (
                    <Check className="w-4 h-4 text-status-online flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
