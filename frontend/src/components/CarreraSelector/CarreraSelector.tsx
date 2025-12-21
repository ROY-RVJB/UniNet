import { useState, useMemo, useEffect } from 'react';
import type { Carrera, Faculty } from '@/types';
import { useCarrera } from '@/contexts/CarreraContext';
import { FacultyFilter } from './FacultyFilter';
import { CarreraList } from './CarreraList';
import { CarreraDetail } from './CarreraDetail';

// ==========================================
// CarreraSelector - Layout de dos paneles
// ==========================================

export function CarreraSelector() {
  const { availableCarreras, isRestricted } = useCarrera();
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | 'todas'>('todas');

  // Inicializar con la primera carrera disponible
  useEffect(() => {
    if (availableCarreras.length > 0 && !selectedCarrera) {
      setSelectedCarrera(availableCarreras[0]);
    }
  }, [availableCarreras, selectedCarrera]);

  // Filtrar carreras por facultad (solo aplica si no está restringido)
  const filteredCarreras = useMemo(() => {
    if (isRestricted) {
      // Docente: solo ve su carrera, ignorar filtro de facultad
      return availableCarreras;
    }
    if (selectedFaculty === 'todas') {
      return availableCarreras;
    }
    return availableCarreras.filter((c) => c.faculty === selectedFaculty);
  }, [selectedFaculty, availableCarreras, isRestricted]);

  // Total de carreras para el contador
  const totalCarreras = filteredCarreras.length;

  return (
    <div className="bg-black">
      {/* Layout de dos columnas con altura fija */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 h-[calc(100vh-180px)]">
        {/* Panel Izquierdo - Lista con scroll propio */}
        <div className="flex flex-col bg-black border border-border rounded-lg overflow-hidden min-h-0">
          {/* Header del panel - fijo */}
          <div className="flex-shrink-0 p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-subtle uppercase tracking-wider">
                {isRestricted ? 'Tu Carrera Asignada' : 'Nodos de Infraestructura'}
              </h2>
              {!isRestricted && (
                <span className="text-xs text-subtle">
                  {totalCarreras} Unidades
                </span>
              )}
            </div>
            {/* Filtros por facultad - solo para admin */}
            {!isRestricted && (
              <FacultyFilter
                selected={selectedFaculty}
                onSelect={setSelectedFaculty}
              />
            )}
          </div>
          {/* Lista de carreras - scrolleable */}
          <CarreraList
            carreras={filteredCarreras}
            selectedId={selectedCarrera?.id ?? null}
            onSelect={setSelectedCarrera}
          />
        </div>

        {/* Panel Derecho - Detalle con scroll propio */}
        <div className="min-h-0 overflow-hidden">
          <CarreraDetail carrera={selectedCarrera} />
        </div>
      </div>
    </div>
  );
}
