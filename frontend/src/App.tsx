import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { PCGrid } from '@/components/PCGrid';
import { ControlPanel } from '@/components/ControlPanel';
import { LogViewer } from '@/components/LogViewer';
import { UserTable } from '@/components/UserTable';
import { LabGrid } from '@/components/LabGrid';
import { mockPCs, mockLogs, mockUsers } from '@/data/mockData';
import type { PC, LDAPUser } from '@/types';
import { useLaboratory } from '@/contexts/LaboratoryContext';
import { Monitor } from 'lucide-react';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [pcs, setPcs] = useState<PC[]>(mockPCs);
  const [users, setUsers] = useState<LDAPUser[]>(mockUsers);
  const [, setServerOnline] = useState(false);
  const { selectedLab, isHome } = useLaboratory();

  const handlePCClick = (_pc: PC) => {
    // TODO: Implementar modal de detalles del PC
  };

  // Filtrar PCs por laboratorio seleccionado
  const filteredPCs = useMemo(() => {
    if (!selectedLab) return pcs;
    return pcs.filter(pc => pc.laboratoryId === selectedLab.id);
  }, [pcs, selectedLab]);

  // Stats del laboratorio seleccionado
  const labStats = useMemo(() => {
    const labPCs = filteredPCs;
    return {
      total: labPCs.length,
      online: labPCs.filter(pc => pc.status === 'online').length,
      offline: labPCs.filter(pc => pc.status === 'offline').length,
      inUse: labPCs.filter(pc => pc.status === 'inUse').length,
    };
  }, [filteredPCs]);

  // Filtrar usuarios por laboratorio seleccionado
  const filteredUsers = useMemo(() => {
    if (!selectedLab) return users;
    return users.filter(user => user.laboratoryId === selectedLab.id);
  }, [users, selectedLab]);

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
        {/* Home: Grid de Laboratorios */}
        {isHome && <LabGrid />}

        {/* Lab Selected: mostrar secciones */}
        {!isHome && (
          <>
            {/* Dashboard Section */}
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                {/* Header con nombre del lab */}
                <div>
                  <h2 className="text-2xl font-bold text-tech-text flex items-center gap-2">
                    <Monitor className="h-6 w-6 text-tech-text" />
                    {selectedLab?.name || 'Dashboard'}
                  </h2>
                  <p className="text-tech-textDim mt-1">
                    Monitoreo en tiempo real de los clientes Ubuntu
                  </p>
                </div>

                {/* Stats mini */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-online" />
                    <span className="text-tech-textDim">Online:</span>
                    <span className="text-white font-medium">{labStats.online}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-offline" />
                    <span className="text-tech-textDim">Offline:</span>
                    <span className="text-white font-medium">{labStats.offline}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-inUse" />
                    <span className="text-tech-textDim">En uso:</span>
                    <span className="text-white font-medium">{labStats.inUse}</span>
                  </div>
                  <div className="text-tech-textDim">
                    Total: <span className="text-white font-medium">{labStats.total}</span>
                  </div>
                </div>

                <PCGrid pcs={filteredPCs} onPCClick={handlePCClick} />
              </div>
            )}

            {/* Users Section */}
            {activeSection === 'users' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-tech-text">
                    Gestión de Usuarios
                  </h2>
                  <p className="text-tech-textDim mt-1">
                    Administración de usuarios en OpenLDAP
                  </p>
                </div>

                <UserTable users={filteredUsers} onRefresh={fetchUsers} />
              </div>
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
    </div>
  );
}

export default App;
