import { Search, Bell, User } from 'lucide-react';
import { useLaboratory } from '@/contexts/LaboratoryContext';
import { LabSelector } from './LabSelector';

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

        {/* Right: Icons */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-tech-textDim hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-tech-textDim hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            {/* Notification dot */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button className="w-8 h-8 rounded-full bg-tech-darkCard border border-tech-darkBorder flex items-center justify-center hover:border-tech-textDim transition-colors">
            <User className="w-4 h-4 text-tech-textDim" />
          </button>
        </div>
      </div>

    </nav>
  );
}
