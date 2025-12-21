import { useState, useEffect, useMemo } from 'react'
import { Monitor } from 'lucide-react'
import { PCGrid } from '@/components/PCGrid'
import { PCDetailPanel } from '@/components/PCDetailPanel'
import { PCStatusFilter, type FilterStatus } from '@/components/PCStatusFilter'
import { mockPCs } from '@/data/mockData'
import { useCarrera } from '@/contexts/CarreraContext'
import type { PC } from '@/types'

export function DashboardPage() {
  const [pcs, setPcs] = useState<PC[]>(mockPCs)
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

  // Filtrar PCs por estado
  const filteredPCs = useMemo(() => {
    if (statusFilter === 'all') return pcs
    return pcs.filter(pc => pc.status === statusFilter)
  }, [pcs, statusFilter])

  // Stats
  const stats = useMemo(() => {
    if (selectedCarrera) {
      return {
        total: selectedCarrera.pcsCount,
        online: Math.floor(selectedCarrera.pcsCount * 0.7),
        offline: Math.floor(selectedCarrera.pcsCount * 0.1),
        inUse: Math.floor(selectedCarrera.pcsCount * 0.2),
      }
    }
    return {
      total: pcs.length,
      online: pcs.filter(pc => pc.status === 'online').length,
      offline: pcs.filter(pc => pc.status === 'offline').length,
      inUse: pcs.filter(pc => pc.status === 'inUse').length,
    }
  }, [pcs, selectedCarrera])

  // Poll server status
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_STATUS_SERVER_URL || 'http://172.29.137.160:4000/api/status'

    const fetchStatus = async () => {
      try {
        const res = await fetch(serverUrl)
        if (!res.ok) return
        const data = await res.json()

        setPcs(prev =>
          prev.map(pc => {
            const s = data.find((d: { ip: string }) => d.ip === pc.ip)
            if (!s) return pc
            return {
              ...pc,
              status: s.alive ? 'online' : 'offline',
              lastSeen: s.lastSeen ? new Date(s.lastSeen) : pc.lastSeen,
            } as PC
          })
        )
      } catch {
        // Silently fail
      }
    }

    fetchStatus()
    const id = setInterval(fetchStatus, 2000)
    return () => clearInterval(id)
  }, [])

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

        <PCGrid pcs={filteredPCs} onPCClick={handlePCClick} />
      </div>

      <PCDetailPanel
        pc={selectedPC}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
      />
    </>
  )
}
