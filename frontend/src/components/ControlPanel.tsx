import { Card } from '@/components/ui/card';
import { Globe, Lock, AlertTriangle, FileText, Settings, Terminal, Loader2, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useCarrera } from '@/contexts/CarreraContext';

type LabMode = 'clase' | 'examen';

// Mapeo entre tu Backend (bloquear/desbloquear) y Frontend (examen/clase)
const MODE_TO_ACTION = {
  clase: 'desbloquear',
  examen: 'bloquear'
};

const ACTION_TO_MODE = {
  desbloquear: 'clase',
  bloquear: 'examen'
};

export function ControlPanel() {
  const [currentMode, setCurrentMode] = useState<LabMode>('clase');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ online: 0, inUse: 0, total: 0 });
  
  const { selectedCarrera } = useCarrera();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  // --- 1. Cargar estado inicial y estadísticas ---
  const fetchData = useCallback(async () => {
    if (!selectedCarrera?.id) return;

    try {
      const token = localStorage.getItem('uninet_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // A. Obtener Estado del Botón (Endpoint: /network/status)
      const statusRes = await fetch(`${apiUrl}/api/monitoring/network/status?carrera=${selectedCarrera.id}`, { headers });
      if (statusRes.ok) {
        const data = await statusRes.json();
        // Convertir "bloquear" -> "examen", "desbloquear" -> "clase"
        const mode = data.estado === 'bloquear' ? 'examen' : 'clase';
        setCurrentMode(mode);
      }

      // B. Obtener Estadísticas (Endpoint: /stats)
      const statsRes = await fetch(`${apiUrl}/api/monitoring/stats`, { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching network status:", error);
    }
  }, [apiUrl, selectedCarrera?.id]);

  // Ejecutar al montar o cambiar carrera
  useEffect(() => {
    fetchData();
    // Opcional: Polling cada 3 segundos para actualizar stats (detección rápida)
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);


  // --- 2. Cambiar Modo (El Botón) ---
  const handleModeChange = async (newMode: LabMode) => {
    if (newMode === currentMode || loading || !selectedCarrera?.id) return;

    setLoading(true);
    const action = MODE_TO_ACTION[newMode]; // 'bloquear' o 'desbloquear'

    try {
      const token = localStorage.getItem('uninet_token');
      
      // Llamada a tu endpoint POST /network/control_internet
      const res = await fetch(`${apiUrl}/api/monitoring/network/control_internet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gid_carrera: selectedCarrera.id, // Tu backend espera 'gid_carrera'
          accion: action                   // Tu backend espera 'accion'
        })
      });

      if (!res.ok) {
        throw new Error('Error al cambiar modo de red');
      }

      // Si todo sale bien, actualizamos la UI
      setCurrentMode(newMode);
      
      // Recargamos stats por si acaso
      fetchData();

    } catch (error) {
      console.error("Error changing network mode:", error);
      alert("Error al comunicar con el servidor de control");
    } finally {
      setLoading(false);
    }
  };

  const pcsCount = selectedCarrera?.pcsCount || 24;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna principal */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header Estado */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-tech-textDim mb-1">Modo Actual</p>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-tech-primary" />}
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">
              {currentMode === 'clase' ? 'Clase Normal' : 'Modo Examen'}
            </h2>
            <span className={`w-3 h-3 rounded-full transition-colors duration-300 ${currentMode === 'clase' ? 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`} />
          </div>
        </div>

        {/* Botones de Control */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Botón Modo Clase */}
          <button
            onClick={() => handleModeChange('clase')}
            disabled={loading}
            className={`
              relative text-left p-5 rounded-xl border-2 transition-all duration-200
              ${currentMode === 'clase'
                ? 'border-teal-400 bg-teal-400/10'
                : 'border-tech-darkBorder bg-tech-darkCard hover:border-tech-textDim opacity-60 hover:opacity-100'
              }
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${currentMode === 'clase' ? 'bg-teal-400/20' : 'bg-tech-hoverState'}`}>
                <Globe className={`h-6 w-6 ${currentMode === 'clase' ? 'text-teal-400' : 'text-tech-textDim'}`} />
              </div>
              {currentMode === 'clase' && (
                <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-teal-400 flex items-center justify-center animate-in fade-in zoom-in">
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${currentMode === 'clase' ? 'text-white' : 'text-tech-textDim'}`}>
              Modo Clase
            </h3>
            <p className="text-sm text-tech-textDim/80 mb-4">
              Acceso completo a internet.
            </p>
            <span className={`inline-block px-3 py-1 rounded text-xs font-mono font-medium ${currentMode === 'clase' ? 'bg-teal-400/20 text-teal-300' : 'bg-tech-hoverState text-tech-textDim'}`}>
              INTERNET: ON
            </span>
          </button>

          {/* Botón Modo Examen */}
          <button
            onClick={() => handleModeChange('examen')}
            disabled={loading}
            className={`
              relative text-left p-5 rounded-xl border-2 transition-all duration-200
              ${currentMode === 'examen'
                ? 'border-amber-400 bg-amber-400/10'
                : 'border-tech-darkBorder bg-tech-darkCard hover:border-tech-textDim opacity-60 hover:opacity-100'
              }
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${currentMode === 'examen' ? 'bg-amber-400/20' : 'bg-tech-hoverState'}`}>
                <Lock className={`h-6 w-6 ${currentMode === 'examen' ? 'text-amber-400' : 'text-tech-textDim'}`} />
              </div>
              {currentMode === 'examen' && (
                <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center animate-in fade-in zoom-in">
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${currentMode === 'examen' ? 'text-white' : 'text-tech-textDim'}`}>
              Modo Examen
            </h3>
            <p className="text-sm text-tech-textDim/80 mb-4">
              Bloqueo de internet. Solo Intranet.
            </p>
            <span className={`inline-block px-3 py-1 rounded text-xs font-mono font-medium ${currentMode === 'examen' ? 'bg-amber-400/20 text-amber-300' : 'bg-tech-hoverState text-tech-textDim'}`}>
              INTERNET: BLOCKED
            </span>
          </button>
        </div>

        {/* Zona de Peligro */}
        <div className="p-4 rounded-xl border border-amber-400/20 bg-amber-400/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-400 font-medium text-sm">Advertencia de Red</h4>
              <p className="text-xs text-tech-textDim mt-1 leading-relaxed">
                Cambiar el modo afectará inmediatamente a los equipos de <strong>{selectedCarrera?.name}</strong>.
                Si hay {stats.inUse} alumnos conectados, sus conexiones activas podrían interrumpirse.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div>
           <h3 className="text-white font-medium mb-3 text-sm">Herramientas de Diagnóstico</h3>
           <div className="flex flex-wrap gap-3">
             <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tech-darkCard border border-tech-darkBorder text-white text-xs hover:bg-tech-hoverState transition-colors">
               <RefreshCw className="h-3.5 w-3.5" />
               Actualizar Datos
             </button>
             <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tech-darkCard border border-tech-darkBorder text-white text-xs hover:bg-tech-hoverState transition-colors">
               <FileText className="h-3.5 w-3.5" />
               Ver Logs Backend
             </button>
           </div>
        </div>
      </div>

      {/* Sidebar derecha: Estadísticas Reales */}
      <div className="space-y-4">
        {/* Card: Estado del Firewall (Visual) */}
        <Card className="bg-tech-darkCard border-tech-darkBorder p-4">
          <h3 className="text-xs font-semibold text-tech-textDim uppercase tracking-wider mb-4">
            Reglas Activas ({currentMode})
          </h3>
          <div className="space-y-3 text-sm font-mono">
             <div className="flex justify-between">
                <span className="text-tech-textDim">IN (SSH)</span>
                <span className="text-teal-400">ALLOW</span>
             </div>
             <div className="flex justify-between">
                <span className="text-tech-textDim">OUT (Intranet)</span>
                <span className="text-teal-400">ALLOW</span>
             </div>
             <div className="flex justify-between border-t border-white/5 pt-2">
                <span className="text-tech-textDim">OUT (Internet)</span>
                <span className={currentMode === 'clase' ? 'text-teal-400' : 'text-red-400 font-bold'}>
                    {currentMode === 'clase' ? 'ALLOW' : 'DENY'}
                </span>
             </div>
          </div>
        </Card>

        {/* Card: Conexiones Activas (Datos Reales del Backend) */}
        <Card className="bg-tech-darkCard border-tech-darkBorder p-4">
          <h3 className="text-xs font-semibold text-tech-textDim uppercase tracking-wider mb-3">
            Conexiones Activas
          </h3>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-white">{stats.online + stats.inUse}</p>
            <span className="text-xs text-tech-textDim">equipos reportando</span>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
                <span className="text-tech-textDim">En uso (Alumnos):</span>
                <span className="text-white font-mono">{stats.inUse}</span>
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-tech-textDim">Libres (Login Screen):</span>
                <span className="text-white font-mono">{stats.online}</span>
            </div>
             <div className="flex justify-between text-xs">
                <span className="text-tech-textDim">Offline:</span>
                <span className="text-white/40 font-mono">{stats.offline}</span>
            </div>
          </div>
        </Card>

        {/* Info de la Carrera */}
        <Card className="bg-tech-darkCard border-tech-darkBorder p-4">
          <h3 className="text-xs font-semibold text-tech-textDim uppercase tracking-wider mb-3">
            Segmento de Red
          </h3>
          <p className="text-white font-medium text-sm">{selectedCarrera?.name || 'Seleccione Carrera'}</p>
          <p className="text-xs text-tech-textDim mt-1 font-mono">ID: {selectedCarrera?.id}</p>
          <p className="text-xs text-tech-textDim font-mono">Capacidad: {pcsCount} hosts</p>
        </Card>
      </div>
    </div>
  );
}