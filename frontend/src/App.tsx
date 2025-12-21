import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { PCGrid } from '@/components/PCGrid';
import { PCDetailPanel } from '@/components/PCDetailPanel';
import { PCStatusFilter, type FilterStatus } from '@/components/PCStatusFilter';
import { ControlPanel } from '@/components/ControlPanel';
import { LogViewer } from '@/components/LogViewer';
import { UserTable } from '@/components/UserTable';
import { CarreraSelector } from '@/components/CarreraSelector';
import { mockPCs, mockLogs, mockUsers } from '@/data/mockData';
import type { PC, LDAPUser } from '@/types';
import { useCarrera } from '@/contexts/CarreraContext';
import { Monitor } from 'lucide-react';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [pcs, setPcs] = useState<PC[]>(mockPCs);
  const [users, setUsers] = useState<LDAPUser[]>(mockUsers);
  const [, setServerOnline] = useState(false);
  const { selectedCarrera, isHome } = useCarrera();

  // Estado para el panel de detalles de PC
  const [selectedPC, setSelectedPC] = useState<PC | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  // Estado para filtro de PCs por estado
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const handlePCClick = (pc: PC) => {
    setSelectedPC(pc);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    // Delay para permitir animación de cierre
    setTimeout(() => setSelectedPC(null), 300);
  };

  // Filtrar PCs por carrera seleccionada y por estado
  const filteredPCs = useMemo(() => {
    // TODO: Vincular PCs con carreras cuando se implemente
    let filtered = pcs;

    // Aplicar filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pc => pc.status === statusFilter);
    }

    return filtered;
  }, [pcs, statusFilter]);

  // Stats de la carrera seleccionada
  const carreraStats = useMemo(() => {
    if (selectedCarrera) {
      return {
        total: selectedCarrera.pcsCount,
        online: Math.floor(selectedCarrera.pcsCount * 0.7),
        offline: Math.floor(selectedCarrera.pcsCount * 0.1),
        inUse: Math.floor(selectedCarrera.pcsCount * 0.2),
      };
    }
    const allPCs = filteredPCs;
    return {
      total: allPCs.length,
      online: allPCs.filter(pc => pc.status === 'online').length,
      offline: allPCs.filter(pc => pc.status === 'offline').length,
      inUse: allPCs.filter(pc => pc.status === 'inUse').length,
    };
  }, [filteredPCs, selectedCarrera]);

  // Filtrar usuarios (por ahora muestra todos)
  const filteredUsers = useMemo(() => {
    // TODO: Vincular usuarios con carreras cuando se implemente
    return users;
  }, [users]);

  // Poll server status API and update pc statuses
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_STATUS_SERVER_URL || 'http://172.29.137.160:4000/api/status';

    const fetchStatus = async () => {
      try {
        const res = await fetch(serverUrl);
        if (!res.ok) {
          setServerOnline(false);
          return;
        }
        const data = await res.json();
        setServerOnline(true);
        
        setPcs((prev) =>
          prev.map((pc) => {
            const s = data.find((d: any) => d.ip === pc.ip);
            if (!s) return pc;
            return {
              ...pc,
              status: s.alive ? 'online' : 'offline',
              lastSeen: s.lastSeen ? new Date(s.lastSeen) : pc.lastSeen,
            } as PC;
          })
        );
      } catch (err) {
        console.error('Error fetching status:', err);
        setServerOnline(false);
      }
    };

    fetchStatus();
    const id = setInterval(fetchStatus, 2000); // Polling cada 2 segundos (más rápido)
    return () => clearInterval(id);
  }, []);

  // Fetch users from LDAP API
  const fetchUsers = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://172.29.137.160:4000';
    try {
      const res = await fetch(`${apiUrl}/api/users/list`);
      if (!res.ok) {
        console.error('Error fetching users:', res.statusText);
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    if (activeSection === 'users') {
      fetchUsers();
    }
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Navbar */}
      <Navbar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content */}
      <main className="px-6 py-8 flex-1">
        {/* Home: Selector de Carreras */}
        {isHome && <CarreraSelector />}

        {/* Carrera Selected: mostrar secciones */}
        {!isHome && (
          <>
            {/* Dashboard Section */}
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                {/* Header con nombre de la carrera */}
                <div>
                  <h2 className="text-2xl font-bold text-tech-text flex items-center gap-2">
                    <Monitor className="h-6 w-6 text-tech-text" />
                    {selectedCarrera?.name || 'Dashboard'}
                  </h2>
                  <p className="text-tech-textDim mt-1">
                    Monitoreo en tiempo real de los clientes Ubuntu
                  </p>
                </div>

                {/* Filtros por estado */}
                <PCStatusFilter
                  activeFilter={statusFilter}
                  onFilterChange={setStatusFilter}
                  stats={carreraStats}
                />

                <PCGrid pcs={filteredPCs} onPCClick={handlePCClick} />
              </div>
            )}

            {/* Users Section */}
            {activeSection === 'users' && (
              <UserTable users={filteredUsers} onRefresh={fetchUsers} />
            )}

            {/* Network Section */}
            {activeSection === 'network' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-tech-text">
                    Control de Red y Firewall
                  </h2>
                  <p className="text-tech-textDim mt-1">
                    Netplan + UFW - Gestión remota via SSH
                  </p>
                </div>

                <ControlPanel />
              </div>
            )}

            {/* Logs Section */}
            {activeSection === 'logs' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-tech-text">
                    Logs del Sistema
                  </h2>
                  <p className="text-tech-textDim mt-1">
                    Journalctl -f - Monitoreo en tiempo real
                  </p>
                </div>

                <LogViewer logs={mockLogs} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-tech-darkBorder py-6 px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-6 text-sm text-tech-textDim">
            <a href="#" className="hover:text-white transition-colors">Documentación</a>
            <a href="#" className="hover:text-white transition-colors">Soporte</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
          </div>
          <p className="text-xs text-tech-textDim">
            UniNet v3.0.1 • Powered by Vercel Design System
          </p>
        </div>
      </footer>

      {/* Panel lateral de detalles de PC */}
      <PCDetailPanel
        pc={selectedPC}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
      />
    </div>
  );
}

export default App;
