import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Carrera } from '@/types';
import { mockCarreras } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

// ==========================================
// Carrera Context - Estado Global de Carreras
// ==========================================

interface CarreraContextType {
  carreras: Carrera[];              // Todas las carreras (para admin)
  availableCarreras: Carrera[];     // Carreras disponibles según rol
  selectedCarrera: Carrera | null;
  setSelectedCarrera: (carrera: Carrera | null) => void;
  isHome: boolean;
  userCarrera: Carrera | null;      // Carrera del docente (null para admin)
  isRestricted: boolean;            // true si el usuario tiene restricción de carrera
}

const CarreraContext = createContext<CarreraContextType | undefined>(undefined);

interface CarreraProviderProps {
  children: ReactNode;
}

export function CarreraProvider({ children }: CarreraProviderProps) {
  const { user } = useAuth();
  const [carreras] = useState<Carrera[]>(mockCarreras);
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null);

  const isHome = selectedCarrera === null;

  // Resetear carrera seleccionada cuando cambia el usuario (logout/login)
  useEffect(() => {
    setSelectedCarrera(null);
  }, [user?.username, user?.carrera_id]);

  // Carrera del docente (basada en carrera_id del login)
  const userCarrera = useMemo(() => {
    if (user?.role === 'docente' && user.carrera_id) {
      return carreras.find(c => c.id === user.carrera_id) || null;
    }
    return null;
  }, [user, carreras]);

  // Carreras disponibles según el rol
  const availableCarreras = useMemo(() => {
    // Admin ve todas las carreras
    if (user?.role === 'admin') {
      return carreras;
    }
    // Docente solo ve su carrera asignada
    if (user?.role === 'docente' && userCarrera) {
      return [userCarrera];
    }
    // Sin usuario o sin carrera asignada
    return carreras;
  }, [user, carreras, userCarrera]);

  // Si el usuario tiene restricción de carrera
  const isRestricted = user?.role === 'docente' && !!userCarrera;

  return (
    <CarreraContext.Provider
      value={{
        carreras,
        availableCarreras,
        selectedCarrera,
        setSelectedCarrera,
        isHome,
        userCarrera,
        isRestricted,
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
