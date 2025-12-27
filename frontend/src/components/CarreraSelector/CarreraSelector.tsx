import { useState, useEffect } from 'react';
import { CarreraList } from './CarreraList';
import { CarreraDetail } from './CarreraDetail'; // Asumo que tienes este componente basado en tu imagen
import type { Carrera } from '@/types'; // O define la interfaz aquí si no la tienes en types

// Asegúrate de que esta línea empiece con "export function" (NO default)
export function CarreraSelector() {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null);

  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const response = await fetch(`${baseUrl}/api/carreras/listar`);
        
        if (!response.ok) throw new Error('Error de red');
        
        const data = await response.json();
        setCarreras(data);
        
        // Opcional: Seleccionar la primera carrera automáticamente al cargar
        if (data.length > 0) {
           setSelectedCarrera(data[0]);
        }
      } catch (error) {
        console.error("Error cargando carreras:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarreras();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-400">Cargando sistema...</div>;

  return (
    // CONTENEDOR PRINCIPAL: Divide la pantalla en 2 paneles
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      
      {/* 🟢 PANEL IZQUIERDO (SIDEBAR) */}
      <div className="w-80 flex flex-col border-r border-white/10 bg-black/20">
        
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-white/5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Nodos (LDAP)
          </h2>
          {/* Aquí podrías poner tus filtros (Todas, Ingeniería, etc.) si los tienes */}
          <div className="flex gap-2">
             <span className="text-xs bg-white/10 px-2 py-1 rounded text-white">Todas</span>
          </div>
        </div>

        {/* Lista Scrollable */}
        <div className="flex-1 overflow-hidden">
          <CarreraList 
            carreras={carreras} 
            selectedId={selectedCarrera?.id}
            onSelect={setSelectedCarrera}
          />
        </div>
      </div>

      {/* 🔵 PANEL DERECHO (DETALLES) */}
      <div className="flex-1 overflow-y-auto bg-black/40 p-6">
        {selectedCarrera ? (
          <CarreraDetail carrera={selectedCarrera} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Selecciona una carrera para ver detalles
          </div>
        )}
      </div>
      
    </div>
  );
}