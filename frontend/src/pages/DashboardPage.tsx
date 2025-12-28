import { useState, useEffect, useMemo } from 'react'
import { Monitor } from 'lucide-react'
import { PCGrid } from '@/components/PCGrid'
import { PCDetailPanel } from '@/components/PCDetailPanel'
import { PCStatusFilter, type FilterStatus } from '@/components/PCStatusFilter'
import { useCarrera } from '@/contexts/CarreraContext'
import type { PC } from '@/types'

// COMPUTADORAS FÍSICAS QUE EXISTEN EN EL LABORATORIO
// Estas SIEMPRE se muestran, sin importar si el backend está corriendo
const PHYSICAL_PCS: PC[] = [
  { id: 'pc-01', name: 'PC-LAB-01', ip: '192.168.1.101', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-02', name: 'PC-LAB-02', ip: '192.168.1.102', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-03', name: 'PC-LAB-03', ip: '192.168.1.103', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-04', name: 'PC-LAB-04', ip: '192.168.1.104', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-05', name: 'PC-LAB-05', ip: '192.168.1.105', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-06', name: 'PC-LAB-06', ip: '192.168.1.106', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-07', name: 'PC-LAB-07', ip: '192.168.1.107', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-08', name: 'PC-LAB-08', ip: '192.168.1.108', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-09', name: 'PC-LAB-09', ip: '192.168.1.109', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-10', name: 'PC-LAB-10', ip: '192.168.1.110', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-11', name: 'PC-LAB-11', ip: '192.168.1.111', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-12', name: 'PC-LAB-12', ip: '192.168.1.112', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-13', name: 'PC-LAB-13', ip: '192.168.1.113', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-14', name: 'PC-LAB-14', ip: '192.168.1.114', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-15', name: 'PC-LAB-15', ip: '192.168.1.115', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-16', name: 'PC-LAB-16', ip: '192.168.1.116', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-17', name: 'PC-LAB-17', ip: '192.168.1.117', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-18', name: 'PC-LAB-18', ip: '192.168.1.118', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-19', name: 'PC-LAB-19', ip: '192.168.1.119', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-20', name: 'PC-LAB-20', ip: '192.168.1.120', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-21', name: 'PC-LAB-21', ip: '192.168.1.121', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-22', name: 'PC-LAB-22', ip: '192.168.1.122', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-23', name: 'PC-LAB-23', ip: '192.168.1.123', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-24', name: 'PC-LAB-24', ip: '192.168.1.124', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-25', name: 'PC-LAB-25', ip: '192.168.1.125', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-26', name: 'PC-LAB-26', ip: '192.168.1.126', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-27', name: 'PC-LAB-27', ip: '192.168.1.127', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
  { id: 'pc-28', name: 'PC-LAB-28', ip: '192.168.1.128', status: 'offline', user: null, lastSeen: new Date(0), laboratoryId: 'lab-sistemas' },
];

export function DashboardPage() {
  // Inicializar con las computadoras físicas que SIEMPRE existen
  const [pcs, setPcs] = useState<PC[]>(PHYSICAL_PCS)
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

  // Stats - siempre usar el array real de PCs
  const stats = useMemo(() => {
    return {
      total: pcs.length,
      online: pcs.filter(pc => pc.status === 'online').length,
      offline: pcs.filter(pc => pc.status === 'offline').length,
      inUse: pcs.filter(pc => pc.status === 'inUse').length,
    }
  }, [pcs])

  // Poll server status - SOLO actualiza el estado de las PCs, no las crea/elimina
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.warn('VITE_API_URL no está configurado - PCs se mostrarán como offline');
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/monitoring/status`);
        if (!res.ok) {
          console.warn('Backend no responde - PCs se mantienen como offline');
          return;
        }
        const data: Record<string, { status: string; user?: string; last_seen: string; ip: string }> = await res.json();

        // ACTUALIZAR el estado de las PCs físicas que ya existen
        setPcs(prev =>
          prev.map(pc => {
            const statusData = data[pc.name];
            if (!statusData) {
              // Si no hay datos del backend, mantener offline
              return pc;
            }

            // Actualizar solo el estado, no crear/eliminar la PC
            return {
              ...pc,
              status: statusData.status as 'online' | 'offline' | 'inUse',
              user: statusData.user || null,
              lastSeen: statusData.last_seen ? new Date(statusData.last_seen) : pc.lastSeen,
            };
          })
        );
      } catch (err) {
        console.warn('Error conectando con backend - PCs se mantienen como offline:', err);
      }
    };

    fetchStatus();
    const id = setInterval(fetchStatus, 5000); // Poll cada 5 segundos
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-tech-text flex items-center gap-2">
            <Monitor className="h-6 w-6 text-tech-text" />
            {selectedCarrera?.name || 'Dashboard'}
          </h2>
          <p className="text-tech-textDim mt-1">
            Monitoreo en tiempo real de los clientes Ubuntu
          </p>
        </div>

        <PCStatusFilter
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          stats={stats}
        />

        <PCGrid pcs={pcs} onPCClick={handlePCClick} statusFilter={statusFilter} />
      </div>

      <PCDetailPanel
        pc={selectedPC}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
      />
    </>
  )
}
