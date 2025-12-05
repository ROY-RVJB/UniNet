import { useState } from 'react';
import { LayoutDashboard, Users, Network, Terminal, Server, ChevronRight, Atom } from 'lucide-react';

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'users', icon: Users, label: 'Usuarios (LDAP)' },
  { id: 'network', icon: Network, label: 'Red & Firewall' },
  { id: 'logs', icon: Terminal, label: 'Logs' },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  serverOnline: boolean;
  serverIP: string;
}

export function Sidebar({ activeSection, onSectionChange, serverOnline, serverIP }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`
      ${isCollapsed ? 'w-20' : 'w-64'}
      bg-tech-dark border-r border-tech-darkBorder flex flex-col
      transition-all duration-300 ease-out relative
    `}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="
          absolute -right-3 top-8 z-10
          w-6 h-6 rounded-full
          bg-tech-darkCard border border-tech-darkBorder
          flex items-center justify-center
          text-tech-textDim hover:text-tech-text hover:bg-tech-hoverState
          transition-all duration-200
          outline-none focus:outline-none
        "
      >
        <ChevronRight className={`
          h-4 w-4 transition-transform duration-300
          ${isCollapsed ? 'rotate-0' : 'rotate-180'}
        `} />
      </button>

      {/* Brand */}
      <div className={`py-6 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <div className={`
          flex items-center gap-3 overflow-hidden
          ${isCollapsed ? 'justify-center' : 'px-4'}
        `}>
          <Atom className="h-6 w-6 flex-shrink-0 text-tech-text" />
          <span className={`
            text-xl font-bold text-tech-text whitespace-nowrap transition-all duration-300
            ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
          `}>
            UniNet
          </span>
        </div>
      </div>

      {/* Menu Items - Kinetic Pill Navigation */}
      <nav className={`flex-1 space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <div key={item.id} className="relative">
              {/* Marker azul - FUERA del botón */}
              <div className={`
                absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-6
                bg-tech-blue rounded-full
                transition-transform duration-200 ease-out origin-center
                ${isActive ? 'scale-y-100' : 'scale-y-0'}
              `} />

              {/* Botón con pill effect */}
              <button
                onClick={() => onSectionChange(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`
                  w-full flex items-center gap-3 py-3 text-left
                  rounded-lg transition-all duration-200 ease-out
                  outline-none focus:outline-none focus:ring-0
                  ${isCollapsed ? 'justify-center px-0' : 'px-4'}
                  ${isActive
                    ? 'bg-[#0d0d0d] border border-[#2a2a2a]'
                    : 'border border-transparent hover:bg-white/[0.08]'
                  }
                  ${!isCollapsed && !isActive ? 'hover:translate-x-1.5' : ''}
                  ${isActive
                    ? 'text-tech-text'
                    : 'text-tech-textDim hover:text-tech-text'
                  }
                `}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-tech-blue' : ''
                }`} />
                <span className={`
                  font-medium whitespace-nowrap overflow-hidden transition-all duration-300
                  ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
                `}>
                  {item.label}
                </span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className={`border-t border-tech-darkBorder ${isCollapsed ? 'p-4' : 'p-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="relative flex-shrink-0">
            <Server className={`h-5 w-5 transition-colors ${
              serverOnline
                ? 'text-status-online'
                : 'text-status-offline'
            }`} />
            <div className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${
              serverOnline
                ? 'bg-status-online animate-pulse'
                : 'bg-status-offline'
            }`} />
          </div>
          <div className={`
            flex flex-col overflow-hidden transition-all duration-300
            ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
          `}>
            <span className={`text-sm font-medium whitespace-nowrap transition-colors ${
              serverOnline
                ? 'text-status-online'
                : 'text-status-offline'
            }`}>
              {serverOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
            <span className="text-xs text-tech-textDim whitespace-nowrap">{serverIP}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
