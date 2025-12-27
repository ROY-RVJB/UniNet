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
const ALL_CARRERAS_VALUE = 'ALL'; // Valor especial para "Todas las Carreras"

interface CarreraContextType {
  carreras: Carrera[];              // Todas las carreras (para admin)
  availableCarreras: Carrera[];     // Carreras disponibles según rol
  selectedCarrera: Carrera | null;
  setSelectedCarrera: (carrera: Carrera | null) => void;
  isHome: boolean;
  userCarreras: Carrera[];          // Carreras del docente (vacío para admin)
  isRestricted: boolean;            // true si el usuario tiene restricción de carrera
  isCarreraReady: boolean;          // true cuando la carrera ha sido inicializada
}

const CarreraContext = createContext<CarreraContextType | undefined>(undefined);

interface CarreraProviderProps {
  children: ReactNode;
}

export function CarreraProvider({ children }: CarreraProviderProps) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [carreras] = useState<Carrera[]>(mockCarreras);
  const [selectedCarrera, setSelectedCarreraState] = useState<Carrera | null>(null);
  const [isCarreraReady, setIsCarreraReady] = useState(false);

  // Cargar carrera seleccionada de localStorage al inicio
  // Esperar a que Auth termine de cargar antes de inicializar
  useEffect(() => {
    // No hacer nada mientras auth está cargando
    if (isAuthLoading) {
      return;
    }

    // Si no está autenticado, marcar como listo (sin carrera)
    if (!isAuthenticated || !user) {
      setIsCarreraReady(true);
      return;
    }

    // Usuario autenticado - cargar carrera
    const saved = localStorage.getItem(SELECTED_CARRERA_KEY);

    if (saved) {
      // Caso especial: "Todas las Carreras" guardado como "ALL"
      if (saved === ALL_CARRERAS_VALUE) {
        // Admin eligió "Todas las Carreras" - mantener null
        setSelectedCarreraState(null);
        setIsCarreraReady(true);
        return;
      }

      try {
        const parsed = JSON.parse(saved);
        const found = carreras.find(c => c.id === parsed.id);
        if (found) {
          setSelectedCarreraState(found);
          setIsCarreraReady(true);
          return;
        }
      } catch {
        // Ignorar errores de parsing
      }
    }

    // Si no hay carrera guardada (primera vez), auto-seleccionar
    if (user.role === 'admin') {
      // Admin primera vez: seleccionar la primera carrera por defecto
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

    // Marcar como listo después de inicializar
    setIsCarreraReady(true);
  }, [isAuthLoading, isAuthenticated, user, carreras]);

  // Limpiar al hacer logout (NO al refrescar)
  // Solo borrar cuando auth terminó de cargar Y no está autenticado
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setSelectedCarreraState(null);
      setIsCarreraReady(false);
      localStorage.removeItem(SELECTED_CARRERA_KEY);
    }
  }, [isAuthLoading, isAuthenticated]);

  // Función para cambiar carrera (guarda en localStorage)
  const setSelectedCarrera = (carrera: Carrera | null) => {
    setSelectedCarreraState(carrera);
    if (carrera) {
      localStorage.setItem(SELECTED_CARRERA_KEY, JSON.stringify(carrera));
    } else {
      // Guardar "ALL" para representar "Todas las Carreras"
      // Así al refrescar se mantiene la selección
      localStorage.setItem(SELECTED_CARRERA_KEY, ALL_CARRERAS_VALUE);
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
        isCarreraReady,
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
