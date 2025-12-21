import { ControlPanel } from '@/components/ControlPanel'

export function NetworkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-tech-text">
          Control de Red y Firewall
        </h2>
        <p className="text-tech-textDim mt-1">
          Netplan + UFW - Gestion remota via SSH
        </p>
      </div>

      <ControlPanel />
    </div>
  )
}
