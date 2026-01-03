import type { SystemMetrics } from '@/types';
import { Cpu, HardDrive, MemoryStick, Network, Activity } from 'lucide-react';

interface SystemMetricsPanelProps {
    metrics?: SystemMetrics;
}

export function SystemMetricsPanel({ metrics }: SystemMetricsPanelProps) {
    if (!metrics) {
        return (
            <div className="p-4 text-center text-gray-700 dark:text-gray-300">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Sin métricas disponibles</p>
                <p className="text-xs mt-1">El agente aún no ha enviado datos</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            {/* CPU */}
            <MetricCard
                icon={<Cpu className="w-5 h-5" />}
                title="CPU"
                value={`${metrics.cpu.percent}%`}
                progress={metrics.cpu.percent}
                details={`${metrics.cpu.cores} cores • Load: ${metrics.cpu.load_average[0].toFixed(2)}, ${metrics.cpu.load_average[1].toFixed(2)}, ${metrics.cpu.load_average[2].toFixed(2)}`}
                color="blue"
            />

            {/* RAM */}
            <MetricCard
                icon={<MemoryStick className="w-5 h-5" />}
                title="Memoria RAM"
                value={`${(metrics.ram.used / 1024).toFixed(1)} GB / ${(metrics.ram.total / 1024).toFixed(1)} GB`}
                progress={metrics.ram.percent}
                details={`${metrics.ram.percent.toFixed(1)}% usado • ${(metrics.ram.available / 1024).toFixed(1)} GB disponible`}
                color="green"
            />

            {/* Swap (solo si está en uso) */}
            {metrics.ram.swap_total > 0 && metrics.ram.swap_percent > 5 && (
                <MetricCard
                    icon={<MemoryStick className="w-5 h-5" />}
                    title="Swap"
                    value={`${(metrics.ram.swap_used / 1024).toFixed(1)} GB / ${(metrics.ram.swap_total / 1024).toFixed(1)} GB`}
                    progress={metrics.ram.swap_percent}
                    details={`${metrics.ram.swap_percent.toFixed(1)}% usado`}
                    color="yellow"
                />
            )}

            {/* Disco */}
            <MetricCard
                icon={<HardDrive className="w-5 h-5" />}
                title="Disco"
                value={`${(metrics.disk.used / 1024).toFixed(1)} GB / ${(metrics.disk.total / 1024).toFixed(1)} GB`}
                progress={metrics.disk.percent}
                details={`${metrics.disk.percent.toFixed(1)}% usado • ${(metrics.disk.free / 1024).toFixed(1)} GB libre`}
                color="purple"
            />

            {/* Red */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                    <Network className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Red</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="text-gray-700 dark:text-gray-300">↑ Enviado:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{(metrics.network.sent_total / 1024).toFixed(2)} GB</span>
                    </div>
                    <div>
                        <span className="text-gray-700 dark:text-gray-300">↓ Recibido:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{(metrics.network.recv_total / 1024).toFixed(2)} GB</span>
                    </div>
                </div>
            </div>

            {/* Procesos Top */}
            {metrics.top_processes && metrics.top_processes.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <Activity className="w-4 h-4" />
                        Procesos Top
                    </h4>
                    <div className="space-y-2">
                        {metrics.top_processes.map((proc) => (
                            <div key={proc.pid} className="flex items-center justify-between text-xs">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate text-gray-900 dark:text-gray-100">{proc.name}</div>
                                    <div className="text-gray-600 dark:text-gray-400 text-[10px]">
                                        PID: {proc.pid} • Usuario: {proc.user}
                                    </div>
                                </div>
                                <div className="flex gap-3 text-right ml-2">
                                    <div>
                                        <div className="font-medium text-blue-600 dark:text-blue-400">{proc.cpu_percent}%</div>
                                        <div className="text-gray-600 dark:text-gray-400">CPU</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-green-600 dark:text-green-400">{proc.mem_mb.toFixed(0)} MB</div>
                                        <div className="text-gray-600 dark:text-gray-400">RAM</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Componente auxiliar para mostrar una métrica con barra de progreso
interface MetricCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    progress: number;
    details?: string;
    color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
}

function MetricCard({ icon, title, value, progress, details, color = 'blue' }: MetricCardProps) {
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
    };

    const iconColorClasses = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        purple: 'text-purple-600',
        yellow: 'text-yellow-600',
        red: 'text-red-600',
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={iconColorClasses[color]}>{icon}</div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{title}</h4>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{value}</span>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </div>

            {details && (
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{details}</p>
            )}
        </div>
    );
}
