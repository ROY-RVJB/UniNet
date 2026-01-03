import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import type { LogEntry } from '@/types';

export function usePersonalLogs(hostname?: string, user?: string) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hostname && !user) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    // Prefer hostname as username (to match backend logic)
    if (hostname) params.append('username', hostname);
    else if (user) params.append('username', user);
    fetch(`${API_BASE_URL}/api/monitoring/logs?limit=100&${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('Error fetching logs');
        return res.json();
      })
      .then((data) => {
        // Normalizar igual que LogsPage
        setLogs(data.map((log: any, idx: number) => ({
          id: log.id || idx,
          timestamp: log.timestamp ? new Date(`1970-01-01T${log.timestamp}`) : new Date(),
          level: (log.level || 'info').toLowerCase(),
          source: log.category || log.carrera || 'backend',
          message: log.message || '',
        })));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [hostname, user]);

  return { logs, loading, error };
}
