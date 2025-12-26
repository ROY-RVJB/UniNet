import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, User, ChevronDown, LogOut } from 'lucide-react';
import { useCarrera } from '@/contexts/CarreraContext';
import { useAuth } from '@/contexts/AuthContext';
import { CarreraSelectorDropdown } from './CarreraSelectorDropdown';
import { UniNetLogo } from './UniNetLogo';

// ==========================================
// Navbar - Navegación horizontal estilo Vercel
// ==========================================

import type { UserRole } from '@/types/auth'

// Tabs con roles permitidos
// Docente puede ver Network y Logs pero filtrado por su carrera
const navTabs: { id: string; label: string; path: string; roles: UserRole[] }[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', roles: ['admin', 'docente'] },
  { id: 'users', label: 'Usuarios', path: '/users', roles: ['admin', 'docente'] },
  { id: 'network', label: 'Network', path: '/network', roles: ['admin', 'docente'] },
  { id: 'logs', label: 'Logs', path: '/logs', roles: ['admin', 'docente'] },
];

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isHome } = useCarrera();
  const { user, logout } = useAuth();
  const [isBrandHovered, setIsBrandHovered] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Check server status every 5 seconds
  useEffect(() => {
    const checkServer = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "http://10.12.195.223:4000";
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`${apiUrl}/health`, { 
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        setServerStatus(response.ok ? 'online' : 'offline');
      } catch {
        setServerStatus('offline');
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="sticky top-0 z-50 h-16 bg-black/80 backdrop-blur-md border-b border-tech-darkBorder">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Logo Singularidad + Texto con efecto bidireccional */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onMouseEnter={() => setIsBrandHovered(true)}
          onMouseLeave={() => setIsBrandHovered(false)}
        >
          <UniNetLogo size="sm" isHovered={isBrandHovered} />
          <span
            className="text-white font-semibold text-lg uppercase transition-all duration-500 ease-out"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              letterSpacing: isBrandHovered ? '0.2em' : '0.05em',
              transform: isBrandHovered ? 'scaleY(1.1)' : 'scaleY(1)',
            }}
          >
            UNINET
          </span>
        </div>

        {/* Center: Tabs + Lab Selector */}
        <div className="flex items-center gap-8">
          {/* Tabs - siempre visibles cuando el usuario está autenticado */}
          {user && (
            <div className="flex items-center gap-1">
              {navTabs
                .filter(tab => tab.roles.includes(user.role))
                .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`
                    relative px-4 py-2 text-sm font-medium rounded-md transition-colors
                    ${location.pathname === tab.path
                      ? 'text-white bg-white/10'
                      : 'text-tech-textDim hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {tab.label}
                  {/* Underline dentro del boton activo */}
                  {location.pathname === tab.path && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-white rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Carrera Selector - visible en Dashboard cuando hay usuario */}
          {user && location.pathname === '/dashboard' && <CarreraSelectorDropdown />}
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
                  <p className="text-sm font-medium text-white">{user?.username || 'Usuario'}</p>
                  <p className="text-xs text-tech-textDim capitalize">{user?.role || 'Sin rol'}</p>
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
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesion</span>
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
