import { LogViewer } from '@/components/LogViewer'
import { mockLogs } from '@/data/mockData'

export function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-tech-text">
          Logs del Sistema
        </h2>
        <p className="text-tech-textDim mt-1">
          Journalctl -f - Monitoreo en tiempo real
        </p>
      </div>

      <LogViewer logs={mockLogs} />
    </div>
  )
}
