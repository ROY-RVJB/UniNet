import type { Carrera } from '@/types';
import { CarreraListItem } from './CarreraListItem';
import { useCarrera } from '@/contexts/CarreraContext';
import { useAuth } from '@/contexts/AuthContext';

interface CarreraListProps {
  carreras: Carrera[];
  selectedId?: string | null; 
  onSelect?: (carrera: Carrera) => void; 
}

export function CarreraList({ carreras, selectedId, onSelect }: CarreraListProps) {
  const { selectedCarrera: carreraActiva } = useCarrera();
  const { user } = useAuth();
  const isDocente = user?.role === 'docente';

  return (
    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      <div className="space-y-1">
        {carreras.map((carrera) => {
          // Para docentes: bloquear carreras que no son la activa
          const isLocked = !!(isDocente && carreraActiva && carrera.id !== carreraActiva.id);

          return (
            <CarreraListItem
              key={carrera.id}
              carrera={carrera}
              isSelected={carrera.id === selectedId}
              isLocked={isLocked}
              onSelect={() => onSelect && onSelect(carrera)}
            />
          );
        })}
      </div>
    </div>
  );
}