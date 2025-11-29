import type { PC } from '@/types';
import { PCCard } from './PCCard';

interface PCGridProps {
  pcs: PC[];
  onPCClick?: (pc: PC) => void;
}

export function PCGrid({ pcs, onPCClick }: PCGridProps) {
  if (pcs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-tech-textDim">
        <p>No se detectaron computadoras en el laboratorio</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {pcs.map((pc) => (
        <PCCard
          key={pc.id}
          pc={pc}
          onClick={() => onPCClick?.(pc)}
        />
      ))}
    </div>
  );
}
