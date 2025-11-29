import { LayoutDashboard, Users, Network, Terminal } from 'lucide-react';

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
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <div className="w-64 bg-tech-dark border-r border-tech-darkBorder flex flex-col">
      {/* Brand */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-tech-text flex items-center gap-2">
          <Network className="h-6 w-6" />
          UniNet Admin
        </h1>
      </div>

      {/* Menu Items */}
      <nav className="flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-6 py-3 text-left transition-all
                ${
                  isActive
                    ? 'bg-tech-hoverState text-tech-text border-l-4 border-tech-blue'
                    : 'text-tech-textDim hover:bg-tech-hoverState hover:text-tech-text'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-6 border-t border-tech-darkBorder">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-status-online animate-pulse" />
          <span className="text-tech-textDim">Servidor: ONLINE</span>
        </div>
        <p className="text-xs text-tech-textDim mt-1">192.168.1.10</p>
      </div>
    </div>
  );
}
