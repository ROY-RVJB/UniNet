import { Cpu } from 'lucide-react';

interface CPUDisplayProps {
    percent: number;
    cores: number;
}

export function CPUDisplay({ percent, cores }: CPUDisplayProps) {
    // Calculate circle properties
    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    // Determine color based on CPU usage
    const getColor = () => {
        if (percent >= 80) return '#ef4444'; // red-500
        if (percent >= 60) return '#f59e0b'; // amber-500
        return '#8b5cf6'; // purple-500
    };

    const color = getColor();

    return (
        <div className="bg-white/[0.02] rounded-lg p-6 border border-white/[0.08] shadow-[0_-1px_2px_0_rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4 text-zinc-500" />
                <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Processing Unit</h3>
            </div>

            <div className="flex items-center gap-6">
                {/* Circular Progress */}
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90">
                        {/* Background circle */}
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="8"
                            fill="none"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            stroke={color}
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                            style={{
                                filter: `drop-shadow(0 0 8px ${color}40)`
                            }}
                        />
                    </svg>

                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-white tabular-nums">{Math.round(percent)}%</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Load</span>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                    {/* Threads */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider">Threads</span>
                        <span className="text-sm font-semibold text-white">{cores} Active</span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/[0.05]" />

                    {/* Clock - We don't have this data, so we'll show cores instead */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider">Cores</span>
                        <span className="text-sm font-semibold text-white">{cores}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
