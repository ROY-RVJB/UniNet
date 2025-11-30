import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { PCGrid } from '@/components/PCGrid';
import { ControlPanel } from '@/components/ControlPanel';
import { LogViewer } from '@/components/LogViewer';
import { UserTable } from '@/components/UserTable';
import { mockPCs, mockLogs, mockUsers } from '@/data/mockData';
import type  { PC } from '@/types';
import { Monitor } from 'lucide-react';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [pcs, setPcs] = useState<PC[]>(mockPCs);
  const [serverOnline, setServerOnline] = useState(false);
  const [serverIP] = useState('172.29.137.160');

  const handlePCClick = (pc: PC) => {
    console.log('PC clicked:', pc);
  };

  // Poll server status API and update pc statuses
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_STATUS_SERVER_URL || 'http://172.29.137.160:4000/status';

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
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-screen bg-tech-dark">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        serverOnline={serverOnline}
        serverIP={serverIP}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">

          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-tech-text flex items-center gap-2">
                  <Monitor className="h-6 w-6 text-tech-text" />
                  Estado de Laboratorio
                </h2>
                <p className="text-tech-textDim mt-1">
                  Monitoreo en tiempo real de los clientes Ubuntu
                </p>
              </div>

              <PCGrid pcs={pcs} onPCClick={handlePCClick} />
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

              <UserTable users={mockUsers} />
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

        </div>
      </div>
    </div>
  );
}

export default App;
