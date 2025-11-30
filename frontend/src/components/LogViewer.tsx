import type  { LogEntry } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pause, Play, Download } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface LogViewerProps {
  logs: LogEntry[];
}

export function LogViewer({ logs }: LogViewerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando llegan nuevos logs
  useEffect(() => {
    if (!isPaused && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-status-offline';
      case 'warn':
        return 'text-status-inUse';
      default:
        return 'text-tech-blue';
    }
  };

  const handleDownload = () => {
    const logText = logs
      .map((log) => `[${formatTimestamp(log.timestamp)}] [${log.source}] ${log.message}`)
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-tech-darkCard border-tech-darkBorder">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-tech-text">Auditoría de Seguridad</CardTitle>
            <CardDescription>
              Visualización remota de /var/log/auth.log y servicios
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="border-tech-darkBorder text-tech-textDim"
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Reanudar
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="border-tech-darkBorder text-tech-textDim"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={consoleRef}
          className="bg-black rounded-lg p-4 h-96 overflow-auto font-mono text-xs"
        >
          {logs.map((log) => (
            <div
              key={log.id}
              className="hover:bg-tech-hoverState px-2 py-1 rounded transition-colors"
            >
              <span className="text-tech-textDim">[{formatTimestamp(log.timestamp)}]</span>{' '}
              <span className="text-tech-textDim">[{log.source}]</span>{' '}
              <span className={getLevelColor(log.level) === 'text-tech-blue' ? 'text-tech-text' : getLevelColor(log.level)}>{log.message}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
