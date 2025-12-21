import { Search, Bell, User, ChevronDown } from 'lucide-react';
import { useLaboratory } from '@/contexts/LaboratoryContext';
import { LabSelector } from './LabSelector';
import { useState, useEffect } from 'react';

// ==========================================
// Navbar - Navegación horizontal estilo Vercel
// ==========================================

interface NavbarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navTabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Usuarios' },
  { id: 'network', label: 'Network' },
  { id: 'logs', label: 'Logs' },
];

export function Navbar({ activeSection, onSectionChange }: NavbarProps) {
  const { isHome } = useLaboratory();
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Check server status every 10 seconds
  useEffect(() => {
    const checkServer = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://172.29.137.160:4000';
        const response = await fetch(`${apiUrl}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        setServerStatus(response.ok ? 'online' : 'offline');
      } catch {
        setServerStatus('offline');
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="sticky top-0 z-50 h-16 bg-black/80 backdrop-blur-md border-b border-tech-darkBorder">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">UN</span>
          </div>
          <span className="text-white font-semibold text-lg">UniNet</span>
        </div>

        {/* Center: Tabs + Lab Selector */}
        <div className="flex items-center gap-8">
          {/* Tabs - solo visibles cuando hay lab seleccionado */}
          {!isHome && (
            <div className="flex items-center gap-1">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onSectionChange(tab.id)}
                  className={`
                    relative px-4 py-2 text-sm font-medium rounded-md transition-colors
                    ${activeSection === tab.id
                      ? 'text-white bg-white/10'
                      : 'text-tech-textDim hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {tab.label}
                  {/* Underline dentro del botón activo */}
                  {activeSection === tab.id && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-white rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Lab Selector */}
          <LabSelector />
        </div>

        {/* Right: Server Status + Profile */}
        <div className="flex items-center gap-4">
          {/* Server Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-tech-darkCard border border-tech-darkBorder">
            <div className={`w-2 h-2 rounded-full ${
              serverStatus === 'online' ? 'bg-green-500 animate-pulse' :
              serverStatus === 'offline' ? 'bg-red-500' :
              'bg-yellow-500 animate-pulse'
            }`} />
            <span className="text-xs font-medium text-tech-textDim">
              {serverStatus === 'online' ? 'Online' :
               serverStatus === 'offline' ? 'Offline' :
               'Checking...'}
            </span>
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-tech-darkCard border border-tech-darkBorder hover:border-tech-textDim transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-tech-text/20 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-tech-text" />
              </div>
              <ChevronDown className={`w-4 h-4 text-tech-textDim transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-56 bg-tech-darkCard border border-tech-darkBorder rounded-lg shadow-xl overflow-hidden">
                <div className="p-3 border-b border-tech-darkBorder">
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-tech-textDim">admin@uninet.com</p>
                </div>
                <div className="p-1">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-tech-textDim hover:bg-white/5 hover:text-white rounded transition-colors">
                    <Search className="w-4 h-4" />
                    <span>Buscar</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-tech-textDim hover:bg-white/5 hover:text-white rounded transition-colors relative">
                    <Bell className="w-4 h-4" />
                    <span>Notificaciones</span>
                    <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
                  </button>
                  <div className="my-1 h-px bg-tech-darkBorder" />
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-tech-textDim hover:bg-white/5 hover:text-white rounded transition-colors">
                    <User className="w-4 h-4" />
                    <span>Perfil</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </nav>
  );
}
