import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Laboratory } from '@/types';
import { mockLaboratories } from '@/data/mockData';

// ==========================================
// Laboratory Context - Estado Global
// ==========================================

interface LaboratoryContextType {
  laboratories: Laboratory[];
  selectedLab: Laboratory | null;
  setSelectedLab: (lab: Laboratory | null) => void;
  isHome: boolean; // true cuando no hay lab seleccionado (vista home)
}

const LaboratoryContext = createContext<LaboratoryContextType | undefined>(undefined);

interface LaboratoryProviderProps {
  children: ReactNode;
}

export function LaboratoryProvider({ children }: LaboratoryProviderProps) {
  const [laboratories] = useState<Laboratory[]>(mockLaboratories);
  const [selectedLab, setSelectedLab] = useState<Laboratory | null>(null);

  const isHome = selectedLab === null;

  return (
    <LaboratoryContext.Provider
      value={{
        laboratories,
        selectedLab,
        setSelectedLab,
        isHome,
      }}
    >
      {children}
    </LaboratoryContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de laboratorios
 */
export function useLaboratory() {
  const context = useContext(LaboratoryContext);
  if (context === undefined) {
    throw new Error('useLaboratory must be used within a LaboratoryProvider');
  }
  return context;
}
