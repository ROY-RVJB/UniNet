import type { SystemMetrics } from '@/types';
import { Network, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CPUDisplay } from './CPUDisplay';
import { MemoryBitfield } from './MemoryBitfield';
import { StorageDisplay } from './StorageDisplay';

interface SystemMetricsPanelProps {
    metrics?: SystemMetrics;
}

export function SystemMetricsPanel({ metrics }: SystemMetricsPanelProps) {
    if (!metrics) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                <Activity className="w-6 h-6 mb-3 animate-pulse opacity-50" />
                <p className="text-sm font-medium">Waiting for data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 px-1">
            {/* CPU Display - Full Width */}
            <CPUDisplay
                percent={metrics.cpu.percent}
                cores={metrics.cpu.cores}
            />

            {/* Memory Bitfield - Full Width */}
            <MemoryBitfield
                totalGB={metrics.ram.total / 1024}
                usedGB={metrics.ram.used / 1024}
                percent={metrics.ram.percent}
            />

            {/* Storage - Full Width */}
            <StorageDisplay
                totalGB={metrics.disk.total / 1024}
                usedGB={metrics.disk.used / 1024}
                freeGB={metrics.disk.free / 1024}
                percent={metrics.disk.percent}
            />

            {/* Red - Estilo Linear */}
            <div className="bg-black/20 rounded-lg p-4 border border-white/5 flex flex-col justify-between h-full hover:border-white/10 transition-colors">
                <div className="flex items-center gap-2 mb-3 text-zinc-400">
                    <Network className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wider">Network</span>
                </div>

                <div className="space-y-3 mt-auto">
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                            <ArrowUp className="w-3 h-3 group-hover:text-zinc-300 transition-colors" />
                            <span className="text-[10px] uppercase tracking-wider">Up</span>
                        </div>
                        <span className="font-mono text-sm text-zinc-200">
                            {(metrics.network.sent_total / 1024).toFixed(2)} <span className="text-xs text-zinc-600">GB</span>
                        </span>
                    </div>

                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                            <ArrowDown className="w-3 h-3 group-hover:text-zinc-300 transition-colors" />
                            <span className="text-[10px] uppercase tracking-wider">Down</span>
                        </div>
                        <span className="font-mono text-sm text-zinc-200">
                            {(metrics.network.recv_total / 1024).toFixed(2)} <span className="text-xs text-zinc-600">GB</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Swap Warning - Linear Alert Style */}
            {metrics.ram.swap_total > 0 && metrics.ram.swap_percent > 10 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-3 flex items-start gap-3">
                    <Activity className="w-4 h-4 text-amber-500 mt-0.5" />
                    <div>
                        <p className="text-xs font-medium text-amber-500">High Swap Usage</p>
                        <p className="text-[10px] text-amber-500/70 mt-0.5">
                            System is using {metrics.ram.swap_percent}% of swap memory. Performance may be degraded.
                        </p>
                    </div>
                </div>
            )}

            {/* Top Processes - Table Style */}
            {metrics.top_processes && metrics.top_processes.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <Activity className="w-3.5 h-3.5 text-zinc-500" />
                        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Top Processes</h4>
                    </div>

                    <div className="border border-white/5 rounded-lg bg-black/20 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider">
                                    <th className="py-2 px-3 font-medium">Name</th>
                                    <th className="py-2 px-3 font-medium text-right">CPU</th>
                                    <th className="py-2 px-3 font-medium text-right">RAM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {metrics.top_processes.map((proc) => (
                                    <tr key={proc.pid} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-2 px-3">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-zinc-200 font-medium truncate max-w-[100px] group-hover:text-white transition-colors">
                                                    {proc.name}
                                                </span>
                                                <span className="text-[10px] text-zinc-600 font-mono">
                                                    {proc.user}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                            <span className={cn(
                                                "text-xs font-mono tabular-nums",
                                                proc.cpu_percent > 50 ? "text-amber-500" : "text-zinc-400"
                                            )}>
                                                {proc.cpu_percent.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                            <span className="text-xs font-mono text-zinc-400 tabular-nums">
                                                {proc.mem_mb.toFixed(0)} MB
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// Minimalist Ring Chart
// ==========================================
