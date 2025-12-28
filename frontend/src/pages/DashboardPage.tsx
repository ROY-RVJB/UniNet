import { useState, useEffect, useMemo } from 'react'
import { Monitor } from 'lucide-react'
import { PCGrid } from '@/components/PCGrid'
import { PCDetailPanel } from '@/components/PCDetailPanel'
import { PCStatusFilter, type FilterStatus } from '@/components/PCStatusFilter'
import { useCarrera } from '@/contexts/CarreraContext'
import type { PC } from '@/types'

export function DashboardPage() {
  // Estado dinámico de PCs - se obtiene del backend
  const [pcs, setPcs] = useState<PC[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { selectedCarrera } = useCarrera()

  // Estado para el panel de detalles de PC
  const [selectedPC, setSelectedPC] = useState<PC | null>(null)
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)

  // Estado para filtro de PCs por estado
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  const handlePCClick = (pc: PC) => {
    setSelectedPC(pc)
    setIsDetailPanelOpen(true)
  }

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false)
    setTimeout(() => setSelectedPC(null), 300)
  }

  // Ya no filtramos aquí - PCGrid maneja el filtro internamente
  // para mantener las PCs en sus sectores originales

  // Stats
  const stats = useMemo(() => {
    return {
      total: pcs.length,
      online: pcs.filter(pc => pc.status === 'online').length,
      offline: pcs.filter(pc => pc.status === 'offline').length,
      inUse: pcs.filter(pc => pc.status === 'inUse').length,
    }
  }, [pcs])

  // Fetch dinámico de PCs desde el backend
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.error('VITE_API_URL no está configurado');
      setIsLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        // Construir URL con filtro de carrera si está seleccionada
        let url = `${apiUrl}/api/status`;
        if (selectedCarrera) {
          url += `?carrera=${selectedCarrera.id}`;
        }
        
        const res = await fetch(url);
        if (!res.ok) {
          console.warn('Backend no responde:', res.status);
          setIsLoading(false);
          return;
        }
        
        const data: Array<{
          id: string;
          name: string;
          ip: string;
          status: 'online' | 'offline' | 'inUse';
          user: string | null;
          lastSeen: string;
          carrera?: string;
        }> = await res.json();

        // Transformar datos del backend al formato del frontend
        const transformedPCs: PC[] = data.map(pc => ({
          id: pc.id,
          name: pc.name,
          ip: pc.ip,
          status: pc.status,
          user: pc.user,
          lastSeen: new Date(pc.lastSeen),
          laboratoryId: `lab-${pc.carrera || '5010'}`,
          carrera: pc.carrera,
        }));

        setPcs(transformedPCs);
        setIsLoading(false);
      } catch (err) {
        console.error('Error conectando con backend:', err);
        setIsLoading(false);
      }
    };

    // Fetch inicial
    fetchStatus();

    // Polling cada 10 segundos para actualizar el estado
    const interval = setInterval(fetchStatus, 10000);

    return () => clearInterval(interval);
  }, [selectedCarrera]); // Re-fetch cuando cambie la carrera seleccionada

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-gray-400">
                {selectedCarrera ? selectedCarrera.name : 'Monitoreo en tiempo real de los clientes Ubuntu'}
              </p>
            </div>
          </div>
        </div>

        {/* Mostrar mensaje si no hay PCs */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Cargando equipos...</p>
          </div>
        ) : pcs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hay equipos registrados</p>
            <p className="text-sm mt-2">Los equipos aparecerán automáticamente cuando envíen su primer heartbeat</p>
          </div>
        ) : (
          <>
            <PCStatusFilter
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
              stats={stats}
            />

            <PCGrid pcs={pcs} onPCClick={handlePCClick} statusFilter={statusFilter} />
          </>
        )}
      </div>

      <PCDetailPanel
        pc={selectedPC}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
      />
    </>
  )
}
