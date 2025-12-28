import type { PC, PCStatus } from '@/types';
import { PCCard } from './PCCard';

type FilterStatus = PCStatus | 'all';

interface PCGridProps {
  pcs: PC[];
  onPCClick?: (pc: PC) => void;
  statusFilter?: FilterStatus;
}

export function PCGrid({ pcs, onPCClick, statusFilter = 'all' }: PCGridProps) {
  // Filtrar PCs por estado
  const filteredPCs = statusFilter === 'all'
    ? pcs
    : pcs.filter(pc => pc.status === statusFilter);

  if (filteredPCs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-tech-textDim">
        <p>No hay computadoras con este estado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {filteredPCs.map((pc) => (
        <PCCard
          key={pc.id}
          pc={pc}
          onClick={() => onPCClick?.(pc)}
        />
      ))}
    </div>
  );
}
