import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Info, AlertCircle, Skull, Filter, Search, Download, CheckCircle2 } from 'lucide-react';
import { SecurityAlertsPanel } from '@/components/SecurityAlertsPanel';
import { PCDetailPanel } from '@/components/PCDetailPanel';
import type { AlertSeverity, PC } from '@/types';

export function SecurityDashboardPage() {
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pcs, setPcs] = useState<PC[]>([]);
  const [selectedPC, setSelectedPC] = useState<PC | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  // Fetch PCs para poder mostrar los detalles
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) return;

    const fetchPCs = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/monitoring/status`);
        if (!res.ok) return;
        
        const data: Array<{
          id: string;
          name: string;
          ip: string;
          status: 'online' | 'offline' | 'inUse';
          user: string | null;
          lastSeen: string;
          carrera?: string;
        }> = await res.json();

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
      } catch (err) {
        console.error('Error fetching PCs:', err);
      }
    };

    fetchPCs();
    const interval = setInterval(fetchPCs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePCClick = (pcId: string) => {
    console.log('🎯 handlePCClick llamado con pcId:', pcId);
    console.log('📊 PCs disponibles:', pcs.map(p => ({ id: p.id, name: p.name })));
    
    const pc = pcs.find(p => p.id === pcId);
    console.log('🔍 PC encontrada:', pc);
    
    if (pc) {
      console.log('✅ Abriendo panel para PC:', pc.name);
      setSelectedPC(pc);
      setIsDetailPanelOpen(true);
    } else {
      console.warn('⚠️ No se encontró la PC con id:', pcId);
      console.log('💡 Tip: Los IDs disponibles son:', pcs.map(p => p.id));
    }
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setTimeout(() => setSelectedPC(null), 300);
  };

  // Stats mock
  const stats = {
    total: 127,
    critical: 3,
    high: 8,
    medium: 15,
    low: 45,
    acknowledged: 56,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Centro de Seguridad</h1>
            <p className="text-sm text-gray-400">
              Sistema de Detección de Intrusos (IDS) - Suricata
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          Exportar Reporte
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total */}
        <div className="bg-black border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs uppercase">Total</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>

        {/* Critical */}
        <div className="bg-black border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <Skull className="w-4 h-4" />
            <span className="text-xs uppercase">Críticas</span>
          </div>
          <p className="text-3xl font-bold text-red-500">{stats.critical}</p>
        </div>

        {/* High */}
        <div className="bg-black border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs uppercase">Altas</span>
          </div>
          <p className="text-3xl font-bold text-orange-500">{stats.high}</p>
        </div>

        {/* Medium */}
        <div className="bg-black border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs uppercase">Medias</span>
          </div>
          <p className="text-3xl font-bold text-yellow-500">{stats.medium}</p>
        </div>

        {/* Low */}
        <div className="bg-black border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Info className="w-4 h-4" />
            <span className="text-xs uppercase">Bajas</span>
          </div>
          <p className="text-3xl font-bold text-blue-500">{stats.low}</p>
        </div>

        {/* Acknowledged */}
        <div className="bg-black border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs uppercase">Resueltas</span>
          </div>
          <p className="text-3xl font-bold text-green-500">{stats.acknowledged}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar alertas por PC, IP, descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black border border-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'all')}
            className="px-4 py-2 bg-black border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las Severidades</option>
            <option value="critical">Críticas</option>
            <option value="high">Altas</option>
            <option value="medium">Medias</option>
            <option value="low">Bajas</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts Panel */}
      <SecurityAlertsPanel onPCClick={handlePCClick} />

      {/* Panel de Detalle de PC */}
      <PCDetailPanel
        pc={selectedPC}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
      />
    </div>
  );
}
