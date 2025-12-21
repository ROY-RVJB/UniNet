import type { Faculty } from '@/types';
import { cn } from '@/lib/utils';

// ==========================================
// FacultyFilter - Chips de filtro por facultad
// ==========================================

interface FacultyFilterProps {
  selected: Faculty | 'todas';
  onSelect: (faculty: Faculty | 'todas') => void;
}

const FILTER_OPTIONS: { value: Faculty | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'ingenieria', label: 'Ingeniería' },
  { value: 'artes', label: 'Artes' },
  { value: 'ciencias', label: 'Ciencias' },
  { value: 'salud', label: 'Salud' },
];

export function FacultyFilter({ selected, onSelect }: FacultyFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={cn(
            // Base styles - outline sin relleno
            'px-3 py-1 text-xs rounded-full border transition-all duration-200',
            // Estado no seleccionado
            'border-border text-subtle hover:border-white/30 hover:text-white/70',
            // Estado seleccionado
            selected === option.value && 'border-white text-white'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
