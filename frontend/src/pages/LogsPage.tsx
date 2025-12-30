import { LogViewer } from '@/components/LogViewer'
import { useEffect, useState } from 'react';

interface CarreraOption {
  value: string;
  label: string;
}

export function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carreras, setCarreras] = useState<CarreraOption[]>([]);
  const [selectedCarrera, setSelectedCarrera] = useState<string>('');
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  // Obtener carreras disponibles
  // Carreras hardcodeadas para compatibilidad con backend actual
  useEffect(() => {
    setCarreras([
      { value: '5010', label: 'Ingeniería de Sistemas' },
      { value: '5001', label: 'Administración' },
      { value: '5002', label: 'Contabilidad' },
      { value: '5003', label: 'Derecho' },
      { value: '5004', label: 'Ecoturismo' },
      { value: '5005', label: 'Educación Inicial' },
      { value: '5006', label: 'Educación Matemáticas' },
      { value: '5007', label: 'Educación Primaria' },
      { value: '5008', label: 'Enfermería' },
      { value: '5009', label: 'Ingeniería Agroindustrial' },
      { value: '5011', label: 'Ingeniería Forestal' },
      { value: '5012', label: 'Medicina Veterinaria' },
    ]);
  }, []);

  // Obtener logs filtrados por carrera
  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('uninet_token');
        // Siempre enviar carrera (por defecto 5010 si no hay selección)
        const carreraValue = selectedCarrera || '5010';
        const res = await fetch(`${apiUrl}/api/monitoring/logs?limit=500&carrera=${encodeURIComponent(carreraValue)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          // Normalizar logs para LogViewer
          const normalized = data.map((log, idx) => ({
            id: log.id || idx,
            timestamp: log.timestamp ? new Date(`1970-01-01T${log.timestamp}`) : new Date(),
            level: (log.level || 'info').toLowerCase(),
            source: log.category || log.carrera || 'backend',
            message: log.message || '',
          }));
          if (isMounted) setLogs(normalized);
        }
      } catch (e) {
        // opcional: manejar error
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLogs();
    // Opcional: polling cada 10s
    const interval = setInterval(fetchLogs, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [apiUrl, selectedCarrera]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-tech-text">
          Logs del Sistema
        </h2>
        <p className="text-tech-textDim mt-1">
          Journalctl -f - Monitoreo en tiempo real
        </p>
        {/* Filtro de carrera */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-tech-textDim">Filtrar por carrera:</span>
          <select
            className="bg-tech-darkCard border border-tech-darkBorder rounded px-2 py-1 text-white text-sm"
            value={selectedCarrera}
            onChange={e => setSelectedCarrera(e.target.value)}
          >
            <option value="">Todas</option>
            {carreras.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-tech-textDim">Cargando logs...</div>
      ) : (
        <LogViewer logs={logs} />
      )}
    </div>
  );
}
