import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Carrera } from '@/types';
import { mockCarreras } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

// ==========================================
// Carrera Context - Estado Global de Carreras
// ACTUALIZADO: Compatible con nuevo AuthContext
// ==========================================

const SELECTED_CARRERA_KEY = 'uninet_selected_carrera';

interface CarreraContextType {
  carreras: Carrera[];              // Todas las carreras (para admin)
  availableCarreras: Carrera[];     // Carreras disponibles según rol
  selectedCarrera: Carrera | null;
  setSelectedCarrera: (carrera: Carrera | null) => void;
  isHome: boolean;
  userCarreras: Carrera[];          // Carreras del docente (vacío para admin)
  isRestricted: boolean;            // true si el usuario tiene restricción de carrera
}

const CarreraContext = createContext<CarreraContextType | undefined>(undefined);

interface CarreraProviderProps {
  children: ReactNode;
}

export function CarreraProvider({ children }: CarreraProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [carreras] = useState<Carrera[]>(mockCarreras);
  const [selectedCarrera, setSelectedCarreraState] = useState<Carrera | null>(null);

  // Cargar carrera seleccionada de localStorage al inicio
  useEffect(() => {
    if (isAuthenticated && user) {
      const saved = localStorage.getItem(SELECTED_CARRERA_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const found = carreras.find(c => c.id === parsed.id);
          if (found) {
            setSelectedCarreraState(found);
            return;
          }
        } catch {
          // Ignorar errores de parsing
        }
      }

      // Si no hay carrera guardada, auto-seleccionar para admin
      // o la primera carrera disponible para docente
      if (user.role === 'admin') {
        // Admin: seleccionar la primera carrera por defecto
        if (carreras.length > 0) {
          setSelectedCarreraState(carreras[0]);
          localStorage.setItem(SELECTED_CARRERA_KEY, JSON.stringify(carreras[0]));
        }
      } else if (user.role === 'docente' && user.carrera_activa) {
        // Docente: usar su carrera activa
        const found = carreras.find(c => c.id === user.carrera_activa?.id);
        if (found) {
          setSelectedCarreraState(found);
          localStorage.setItem(SELECTED_CARRERA_KEY, JSON.stringify(found));
        }
      }
    }
  }, [isAuthenticated, user, carreras]);

  // Limpiar al hacer logout
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedCarreraState(null);
      localStorage.removeItem(SELECTED_CARRERA_KEY);
    }
  }, [isAuthenticated]);

  // Función para cambiar carrera (guarda en localStorage)
  const setSelectedCarrera = (carrera: Carrera | null) => {
    setSelectedCarreraState(carrera);
    if (carrera) {
      localStorage.setItem(SELECTED_CARRERA_KEY, JSON.stringify(carrera));
    } else {
      localStorage.removeItem(SELECTED_CARRERA_KEY);
    }
  };

  // isHome ahora considera si el usuario está autenticado
  // Admin siempre tiene carrera seleccionada, así que nunca está en "home"
  const isHome = !isAuthenticated || selectedCarrera === null;

  // Carreras del docente (mapeadas desde auth)
  const userCarreras = useMemo(() => {
    if (user?.role === 'docente' && user.carreras && user.carreras.length > 0) {
      // Mapear las carreras del auth a las carreras completas
      return user.carreras
        .map(uc => carreras.find(c => c.id === uc.id))
        .filter((c): c is Carrera => c !== undefined);
    }
    return [];
  }, [user, carreras]);

  // Carreras disponibles según el rol
  const availableCarreras = useMemo(() => {
    // Admin ve todas las carreras
    if (user?.role === 'admin') {
      return carreras;
    }
    // Docente solo ve sus carreras asignadas
    if (user?.role === 'docente' && userCarreras.length > 0) {
      return userCarreras;
    }
    // Sin usuario o sin carrera asignada - mostrar todas
    return carreras;
  }, [user, carreras, userCarreras]);

  // Si el usuario tiene restricción de carrera
  const isRestricted = user?.role === 'docente' && userCarreras.length > 0;

  return (
    <CarreraContext.Provider
      value={{
        carreras,
        availableCarreras,
        selectedCarrera,
        setSelectedCarrera,
        isHome,
        userCarreras,
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
