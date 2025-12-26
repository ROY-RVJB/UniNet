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
    // CAMBIO: Usamos 'flex-col' y 'space-y-2' para hacer una lista vertical limpia
    <div className="flex flex-col space-y-2 p-2 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      {carreras.map((carrera) => {
        const isLocked = isDocente && carreraActiva && carrera.id !== carreraActiva.id;

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
  );
}