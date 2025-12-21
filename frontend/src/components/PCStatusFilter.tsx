import type { PCStatus } from '@/types';
import { cn } from '@/lib/utils';

// ==========================================
// PCStatusFilter - Filtros por estado de PC
// ==========================================

export type FilterStatus = PCStatus | 'all';

interface PCStatusFilterProps {
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  stats: {
    total: number;
    online: number;
    offline: number;
    inUse: number;
  };
}

// Configuración de filtros
const filterConfig: {
  key: FilterStatus;
  label: string;
  color: string;
  bgActive: string;
  borderActive: string;
}[] = [
  {
    key: 'all',
    label: 'Todas',
    color: 'bg-white',
    bgActive: 'bg-white/10',
    borderActive: 'border-white/40',
  },
  {
    key: 'online',
    label: 'Online',
    color: 'bg-emerald-500',
    bgActive: 'bg-emerald-500/10',
    borderActive: 'border-emerald-500/40',
  },
  {
    key: 'offline',
    label: 'Offline',
    color: 'bg-red-500',
    bgActive: 'bg-red-500/10',
    borderActive: 'border-red-500/40',
  },
  {
    key: 'inUse',
    label: 'En Uso',
    color: 'bg-amber-500',
    bgActive: 'bg-amber-500/10',
    borderActive: 'border-amber-500/40',
  },
];

export function PCStatusFilter({ activeFilter, onFilterChange, stats }: PCStatusFilterProps) {
  const getCount = (key: FilterStatus): number => {
    switch (key) {
      case 'all': return stats.total;
      case 'online': return stats.online;
      case 'offline': return stats.offline;
      case 'inUse': return stats.inUse;
      default: return 0;
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filterConfig.map((filter) => {
        const isActive = activeFilter === filter.key;
        const count = getCount(filter.key);

        return (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
              'border transition-all duration-200',
              isActive
                ? cn(filter.bgActive, filter.borderActive, 'text-white')
                : 'bg-transparent border-white/10 text-white/60 hover:bg-white/5 hover:text-white/80'
            )}
          >
            {/* Indicador de color */}
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                filter.color,
                isActive && filter.key !== 'all' && 'animate-pulse'
              )}
            />
            {/* Label */}
            <span>{filter.label}</span>
            {/* Contador */}
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-xs font-mono',
                isActive ? 'bg-white/10' : 'bg-white/5'
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
