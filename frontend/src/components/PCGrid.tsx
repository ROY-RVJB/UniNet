import type { PC, PCStatus } from '@/types';
import { PCCard } from './PCCard';
import { LayoutGrid } from 'lucide-react';

type FilterStatus = PCStatus | 'all';

interface PCGridProps {
  pcs: PC[];
  onPCClick?: (pc: PC) => void;
  statusFilter?: FilterStatus;
}

// Divide el array en chunks de tamaño específico
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Nombres de sectores
const sectorNames = ['Sector A', 'Sector B', 'Sector C', 'Sector D', 'Sector E'];

export function PCGrid({ pcs, onPCClick, statusFilter = 'all' }: PCGridProps) {
  if (pcs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-tech-textDim">
        <p>No se detectaron computadoras en el laboratorio</p>
      </div>
    );
  }

  // Primero dividir en sectores, luego filtrar dentro de cada sector
  const blocks = chunkArray(pcs, 10);

  // Filtrar sectores que tengan al menos una PC visible
  const visibleBlocks = blocks.map((blockPcs, blockIndex) => {
    const filteredPcs = statusFilter === 'all'
      ? blockPcs
      : blockPcs.filter(pc => pc.status === statusFilter);
    return { blockPcs: filteredPcs, blockIndex };
  }).filter(block => block.blockPcs.length > 0);

  if (visibleBlocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-tech-textDim">
        <p>No hay computadoras con este estado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {visibleBlocks.map(({ blockPcs, blockIndex }) => {
        return (
          <div
            key={blockIndex}
            className="flex flex-col gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]"
          >
            {/* Header del sector */}
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <LayoutGrid className="w-4 h-4 text-tech-textDim" />
              <span className="text-white font-medium">{sectorNames[blockIndex]}</span>
            </div>

            {/* Grid de PCs del sector */}
            <div className="grid grid-cols-2 gap-3">
              {blockPcs.map((pc) => (
                <PCCard
                  key={pc.id}
                  pc={pc}
                  onClick={() => onPCClick?.(pc)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
