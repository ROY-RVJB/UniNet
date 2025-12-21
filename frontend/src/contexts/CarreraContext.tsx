import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Carrera } from '@/types';
import { mockCarreras } from '@/data/mockData';

// ==========================================
// Carrera Context - Estado Global de Carreras
// ==========================================

interface CarreraContextType {
  carreras: Carrera[];
  selectedCarrera: Carrera | null;
  setSelectedCarrera: (carrera: Carrera | null) => void;
  isHome: boolean;
}

const CarreraContext = createContext<CarreraContextType | undefined>(undefined);

interface CarreraProviderProps {
  children: ReactNode;
}

export function CarreraProvider({ children }: CarreraProviderProps) {
  const [carreras] = useState<Carrera[]>(mockCarreras);
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null);

  const isHome = selectedCarrera === null;

  return (
    <CarreraContext.Provider
      value={{
        carreras,
        selectedCarrera,
        setSelectedCarrera,
        isHome,
      }}
    >
      {children}
    </CarreraContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de carreras
 */
export function useCarrera() {
  const context = useContext(CarreraContext);
  if (context === undefined) {
    throw new Error('useCarrera must be used within a CarreraProvider');
  }
  return context;
}
