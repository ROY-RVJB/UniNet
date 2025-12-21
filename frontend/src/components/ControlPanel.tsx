import { Card } from '@/components/ui/card';
import { Globe, Lock, AlertTriangle, FileText, Settings, Terminal } from 'lucide-react';
import { useState } from 'react';
import { useCarrera } from '@/contexts/CarreraContext';

type LabMode = 'clase' | 'examen';

// Reglas de firewall mock
const firewallRules = {
  clase: [
    { action: 'ALLOW', rule: 'IN 22/tcp' },
    { action: 'ALLOW', rule: 'OUT 80/tcp' },
    { action: 'ALLOW', rule: 'OUT 443/tcp' },
    { action: 'ALLOW', rule: 'OUT 10.0.0.5 (Moodle)' },
  ],
  examen: [
    { action: 'ALLOW', rule: 'IN 22/tcp' },
    { action: 'DENY', rule: 'OUT 80/tcp' },
    { action: 'DENY', rule: 'OUT 443/tcp' },
    { action: 'ALLOW', rule: 'OUT 10.0.0.5 (Moodle)' },
  ],
};

export function ControlPanel() {
  const [currentMode, setCurrentMode] = useState<LabMode>('clase');
  const { selectedCarrera } = useCarrera();

  const handleModeChange = (mode: LabMode) => {
    if (mode === currentMode) return;
    setCurrentMode(mode);
  };

  const rules = firewallRules[currentMode];
  const pcsCount = selectedCarrera?.pcsCount || 24;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna principal */}
      <div className="lg:col-span-2 space-y-6">
        {/* Estado actual */}
        <div>
          <p className="text-sm text-tech-textDim mb-1">Modo Actual</p>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">
              {currentMode === 'clase' ? 'Clase Normal' : 'Modo Examen'}
            </h2>
            <span className={`w-3 h-3 rounded-full ${currentMode === 'clase' ? 'bg-teal-400' : 'bg-amber-400'}`} />
          </div>
        </div>

        {/* Cards de modo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Modo Clase */}
          <button
            onClick={() => handleModeChange('clase')}
            className={`
              text-left p-5 rounded-xl border-2 transition-all
              ${currentMode === 'clase'
                ? 'border-teal-400 bg-teal-400/5'
                : 'border-tech-darkBorder bg-tech-darkCard hover:border-tech-textDim'
              }
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${currentMode === 'clase' ? 'bg-teal-400/10' : 'bg-tech-hoverState'}`}>
                <Globe className={`h-6 w-6 ${currentMode === 'clase' ? 'text-teal-400' : 'text-tech-textDim'}`} />
              </div>
              {currentMode === 'clase' && (
                <div className="w-6 h-6 rounded-full bg-teal-400 flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${currentMode === 'clase' ? 'text-white' : 'text-tech-textDim'}`}>
              Modo Clase
            </h3>
            <p className={`text-sm mb-4 ${currentMode === 'clase' ? 'text-tech-textDim' : 'text-tech-textDim/70'}`}>
              Acceso completo a internet para investigación y uso general.
            </p>
            <span className={`
              inline-block px-3 py-1.5 rounded text-xs font-mono
              ${currentMode === 'clase' ? 'bg-teal-400/10 text-teal-400' : 'bg-tech-hoverState text-tech-textDim'}
            `}>
              UFW: ALLOW OUTGOING
            </span>
          </button>

          {/* Modo Examen */}
          <button
            onClick={() => handleModeChange('examen')}
            className={`
              text-left p-5 rounded-xl border-2 transition-all
              ${currentMode === 'examen'
                ? 'border-amber-400 bg-amber-400/5'
                : 'border-tech-darkBorder bg-tech-darkCard hover:border-tech-textDim'
              }
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${currentMode === 'examen' ? 'bg-amber-400/10' : 'bg-tech-hoverState'}`}>
                <Lock className={`h-6 w-6 ${currentMode === 'examen' ? 'text-amber-400' : 'text-tech-textDim'}`} />
              </div>
              {currentMode === 'examen' && (
                <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${currentMode === 'examen' ? 'text-white' : 'text-tech-textDim'}`}>
              Modo Examen
            </h3>
            <p className={`text-sm mb-4 ${currentMode === 'examen' ? 'text-tech-textDim' : 'text-tech-textDim/70'}`}>
              Bloqueo de internet. Solo acceso a Intranet y Moodle.
            </p>
            <span className={`
              inline-block px-3 py-1.5 rounded text-xs font-mono
              ${currentMode === 'examen' ? 'bg-amber-400/10 text-amber-400' : 'bg-tech-hoverState text-tech-textDim'}
            `}>
              UFW: DENY OUTGOING
            </span>
          </button>
        </div>

        {/* Zona de Peligro */}
        <div className="p-4 rounded-xl border border-amber-400/30 bg-amber-400/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-400 font-medium">Zona de Peligro</h4>
              <p className="text-sm text-tech-textDim mt-1">
                Cambiar el modo de red afectará inmediatamente a las {pcsCount} PCs conectadas.
                Las sesiones SSH activas podrían desconectarse.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones Avanzadas */}
        <div>
          <h3 className="text-white font-medium mb-3">Acciones Avanzadas</h3>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tech-darkCard border border-tech-darkBorder text-white text-sm hover:bg-tech-hoverState transition-colors">
              <FileText className="h-4 w-4" />
              Ver Logs UFW
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tech-darkCard border border-tech-darkBorder text-white text-sm hover:bg-tech-hoverState transition-colors">
              <Settings className="h-4 w-4" />
              Configurar Netplan
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tech-darkCard border border-tech-darkBorder text-white text-sm hover:bg-tech-hoverState transition-colors">
              <Terminal className="h-4 w-4" />
              SSH Terminal
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar derecha */}
      <div className="space-y-4">
        {/* Estado del Firewall */}
        <Card className="bg-tech-darkCard border-tech-darkBorder p-4">
          <h3 className="text-xs font-semibold text-tech-textDim uppercase tracking-wider mb-4">
            Estado del Firewall
          </h3>
          <div className="space-y-3">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className={rule.action === 'ALLOW' ? 'text-teal-400' : 'text-amber-400'}>
                  {rule.action}
                </span>
                <span className="text-tech-textDim font-mono text-xs">{rule.rule}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Conexiones Activas */}
        <Card className="bg-tech-darkCard border-tech-darkBorder p-4">
          <h3 className="text-xs font-semibold text-tech-textDim uppercase tracking-wider mb-3">
            Conexiones Activas
          </h3>
          <p className="text-4xl font-bold text-white mb-1">142</p>
          <p className="text-sm text-tech-textDim">Sockets establecidos actualmente.</p>
        </Card>

        {/* Info de la Carrera */}
        <Card className="bg-tech-darkCard border-tech-darkBorder p-4">
          <h3 className="text-xs font-semibold text-tech-textDim uppercase tracking-wider mb-3">
            Carrera
          </h3>
          <p className="text-white font-medium">{selectedCarrera?.name || 'No seleccionado'}</p>
          <p className="text-sm text-tech-textDim mt-1">{pcsCount} equipos conectados</p>
        </Card>
      </div>
    </div>
  );
}
