import type { Carrera } from '@/types';
import { CarreraListItem } from './CarreraListItem';

// ==========================================
// CarreraList - Lista scrolleable de carreras
// ==========================================

interface CarreraListProps {
  carreras: Carrera[];
  selectedId: string | null;
  onSelect: (carrera: Carrera) => void;
}

export function CarreraList({ carreras, selectedId, onSelect }: CarreraListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
      <div className="space-y-1">
        {carreras.map((carrera) => (
          <CarreraListItem
            key={carrera.id}
            carrera={carrera}
            isSelected={carrera.id === selectedId}
            onSelect={() => onSelect(carrera)}
          />
        ))}
      </div>
    </div>
  );
}
