import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, Lock } from 'lucide-react';
import { useCarrera } from '@/contexts/CarreraContext';
import { useAuth } from '@/contexts/AuthContext';
import { FACULTY_COLORS } from '@/data/mockData';
import type { Carrera } from '@/types';

// ==========================================
// CarreraSelectorDropdown - Dropdown para navbar
// Docentes: Ve todas las carreras pero solo puede usar la seleccionada
// Admin: Puede cambiar entre todas las carreras
// ==========================================

const statusColors: Record<string, string> = {
  online: 'bg-status-online',
  offline: 'bg-status-offline',
  partial: 'bg-status-inUse',
};

export function CarreraSelectorDropdown() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { availableCarreras, selectedCarrera, setSelectedCarrera} = useCarrera();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Docente tiene restricción de carrera
  const isDocente = user?.role === 'docente';

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
    // Docente solo puede seleccionar su carrera asignada
    if (isDocente && carrera && carrera.id !== selectedCarrera?.id) {
      return; // No permitir cambio
    }

    setIsOpen(false);

    // Si selecciona "Todas/Inicio" -> ir al Home
    if (carrera === null) {
      // Para docentes: NO borrar la carrera, solo navegar
      if (!isDocente) {
        setSelectedCarrera(null);
      }
      navigate('/');
    } else {
      // Selecciona una carrera -> ir al Dashboard
      setSelectedCarrera(carrera);
      navigate('/dashboard');
    }
  };

  // Docentes: solo sus carreras asignadas
  // Admin: todas las carreras
  const carrerasToShow = availableCarreras;

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
              {isDocente
                ? (carrerasToShow.length > 1 ? 'Tus Carreras' : 'Tu Carrera')
                : 'Seleccionar Carrera'}
            </span>
          </div>

          {/* Options */}
          <div className="max-h-80 overflow-y-auto py-1 scrollbar-thin">
            {/* Option: Todas las Carreras - Navega al Home */}
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
                <span className="text-sm text-white">
                  {isDocente ? 'Inicio' : 'Todas las Carreras'}
                </span>
              </div>
              {!selectedCarrera && (
                <Check className="w-4 h-4 text-status-online" />
              )}
            </button>

            {/* Carrera Options */}
            {carrerasToShow.map((carrera) => {
              const facultyColor = FACULTY_COLORS[carrera.faculty];
              const isSelected = selectedCarrera?.id === carrera.id;
              // Docente: solo puede clickear su carrera seleccionada
              const isLocked = isDocente && !isSelected;

              return (
                <button
                  key={carrera.id}
                  onClick={() => !isLocked && handleSelect(carrera)}
                  disabled={isLocked}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                    ${isLocked
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-white/5 cursor-pointer'
                    }
                    ${isSelected ? 'bg-white/5' : ''}
                  `}
                >
                  {/* Color indicator */}
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center ${isLocked ? 'opacity-50' : ''}`}
                    style={{ backgroundColor: facultyColor }}
                  >
                    <span className="text-xs font-bold text-white">
                      {carrera.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>

                  {/* Carrera info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm truncate ${isLocked ? 'text-white/50' : 'text-white'}`}>
                        {carrera.name}
                      </span>
                      {!isLocked && (
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColors[carrera.status]}`} />
                      )}
                    </div>
                  </div>

                  {/* Candado o Checkmark */}
                  {isLocked ? (
                    <Lock className="w-4 h-4 text-white/30 flex-shrink-0" />
                  ) : isSelected ? (
                    <Check className="w-4 h-4 text-status-online flex-shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Footer hint para docentes */}
          {isDocente && (
            <div className="px-3 py-2 border-t border-tech-darkBorder">
              <span className="text-xs text-white/30">
                Para cambiar de carrera, cierra sesión
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
