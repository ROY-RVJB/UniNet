import type { LogEntry, LogLevel } from '@/types';
import { Card } from '@/components/ui/card';
import {
  Pause,
  Play,
  Download,
  Search,
  AlertCircle,
  AlertTriangle,
  Info,
  Filter
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';

interface LogViewerProps {
  logs: LogEntry[];
}

// Configuración de niveles
const levelConfig: Record<LogLevel, { icon: React.ElementType; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  warn: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
};

type FilterLevel = 'all' | LogLevel;

export function LogViewer({ logs }: LogViewerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const consoleRef = useRef<HTMLDivElement>(null);

  // Filtrar logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
      const matchesSearch = searchQuery === '' ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [logs, filterLevel, searchQuery]);

  // Stats de logs
  const logStats = useMemo(() => ({
    total: logs.length,
    info: logs.filter(l => l.level === 'info').length,
    warn: logs.filter(l => l.level === 'warn').length,
    error: logs.filter(l => l.level === 'error').length,
  }), [logs]);

  // Auto-scroll al final cuando llegan nuevos logs
  useEffect(() => {
    if (!isPaused && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [filteredLogs, isPaused]);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleDownload = () => {
    const logText = filteredLogs
      .map((log) => `[${formatTimestamp(log.timestamp)}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`)
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filtros de nivel */}
        <div className="flex items-center gap-1 p-1 bg-tech-darkCard rounded-lg border border-tech-darkBorder">
          <button
            onClick={() => setFilterLevel('all')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filterLevel === 'all'
                ? 'bg-tech-hoverState text-white'
                : 'text-tech-textDim hover:text-white'
            }`}
          >
            Todos
            <span className="ml-2 text-xs opacity-60">{logStats.total}</span>
          </button>
          <button
            onClick={() => setFilterLevel('info')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filterLevel === 'info'
                ? 'bg-teal-400/10 text-teal-400'
                : 'text-tech-textDim hover:text-white'
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            Info
            <span className="text-xs opacity-60">{logStats.info}</span>
          </button>
          <button
            onClick={() => setFilterLevel('warn')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filterLevel === 'warn'
                ? 'bg-amber-400/10 text-amber-400'
                : 'text-tech-textDim hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Warn
            <span className="text-xs opacity-60">{logStats.warn}</span>
          </button>
          <button
            onClick={() => setFilterLevel('error')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filterLevel === 'error'
                ? 'bg-red-400/10 text-red-400'
                : 'text-tech-textDim hover:text-white'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Error
            <span className="text-xs opacity-60">{logStats.error}</span>
          </button>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              isPaused
                ? 'border-teal-400 text-teal-400 bg-teal-400/10'
                : 'border-tech-darkBorder text-tech-textDim hover:text-white hover:bg-tech-hoverState'
            }`}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? 'Reanudar' : 'Pausar'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-tech-darkBorder text-tech-textDim text-sm hover:text-white hover:bg-tech-hoverState transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tech-textDim" />
        <input
          type="text"
          placeholder="Buscar en logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-tech-darkCard border border-tech-darkBorder rounded-lg text-white text-sm placeholder:text-tech-textDim focus:outline-none focus:border-tech-textDim transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-tech-textDim hover:text-white"
          >
            ×
          </button>
        )}
      </div>

      {/* Consola de logs */}
      <Card className="bg-tech-darkCard border-tech-darkBorder overflow-hidden">
        <div
          ref={consoleRef}
          className="bg-black/50 p-4 h-96 overflow-auto font-mono text-xs scrollbar-thin"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-tech-textDim">
              <Filter className="h-8 w-8 mb-2 opacity-50" />
              <p>No hay logs que coincidan con los filtros</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const config = levelConfig[log.level];
              const Icon = config.icon;
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 px-2 py-1.5 rounded hover:bg-white/5 transition-colors group"
                >
                  {/* Timestamp */}
                  <span className="text-tech-textDim whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                  </span>

                  {/* Level badge */}
                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${config.bg} ${config.color} whitespace-nowrap`}>
                    <Icon className="h-3 w-3" />
                    <span className="uppercase text-[10px] font-semibold">{log.level}</span>
                  </span>

                  {/* Source */}
                  <span className="text-tech-textDim whitespace-nowrap">
                    [{log.source}]
                  </span>

                  {/* Message */}
                  <span className="text-white break-all">
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer con info */}
        <div className="px-4 py-2 border-t border-tech-darkBorder flex items-center justify-between text-xs text-tech-textDim">
          <span>
            Mostrando {filteredLogs.length} de {logs.length} logs
          </span>
          <span className={isPaused ? 'text-amber-400' : 'text-teal-400'}>
            {isPaused ? '⏸ Pausado' : '● En vivo'}
          </span>
        </div>
      </Card>
    </div>
  );
}
