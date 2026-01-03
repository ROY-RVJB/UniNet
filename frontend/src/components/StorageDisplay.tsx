import { HardDrive } from 'lucide-react';

interface StorageDisplayProps {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    percent: number;
}

export function StorageDisplay({ totalGB, usedGB, freeGB, percent }: StorageDisplayProps) {
    // Determine color based on usage
    const getUsedColor = () => {
        if (percent >= 90) return { from: '#ef4444', to: '#dc2626' }; // red
        if (percent >= 80) return { from: '#f59e0b', to: '#d97706' }; // amber
        return { from: '#8b5cf6', to: '#7c3aed' }; // purple
    };

    const usedColor = getUsedColor();

    return (
        <div className="bg-white/[0.02] rounded-lg p-6 border border-white/[0.08] shadow-[0_-1px_2px_0_rgba(255,255,255,0.05)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-zinc-500" />
                    <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Storage</h3>
                </div>

                {/* READ/WRITE Indicators */}
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider">
                    <span className="text-zinc-600">● READ</span>
                    <span className="text-zinc-600">● WRITE</span>
                </div>
            </div>

            {/* Segmented Bar */}
            <div className="mb-4">
                <div className="h-8 rounded-md overflow-hidden flex border border-white/[0.08] bg-black/20">
                    {/* USED Segment */}
                    <div
                        className="relative flex items-center justify-center text-[10px] font-semibold text-white uppercase tracking-wider transition-all duration-500"
                        style={{
                            width: `${percent}%`,
                            background: `linear-gradient(135deg, ${usedColor.from} 0%, ${usedColor.to} 100%)`,
                            boxShadow: `0 0 12px ${usedColor.from}40`
                        }}
                    >
                        {percent > 15 && 'USED'}
                    </div>

                    {/* FREE Segment */}
                    <div
                        className="relative flex items-center justify-center text-[10px] font-semibold text-white uppercase tracking-wider transition-all duration-500"
                        style={{
                            width: `${100 - percent}%`,
                            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                            boxShadow: '0 0 12px rgba(6, 182, 212, 0.25)'
                        }}
                    >
                        {(100 - percent) > 15 && 'FREE'}
                    </div>
                </div>
            </div>

            {/* Disk Information Grid */}
            <div className="grid grid-cols-3 gap-4 text-xs">
                {/* Mount Point */}
                <div>
                    <div className="text-zinc-500 uppercase tracking-wider text-[10px] mb-1">Mount Point</div>
                    <div className="text-white font-mono">/</div>
                </div>

                {/* File System */}
                <div>
                    <div className="text-zinc-500 uppercase tracking-wider text-[10px] mb-1">File System</div>
                    <div className="text-white font-mono">EXT4</div>
                </div>

                {/* Status */}
                <div>
                    <div className="text-zinc-500 uppercase tracking-wider text-[10px] mb-1">Status</div>
                    <div className="text-emerald-500 font-semibold">HEALTHY</div>
                </div>
            </div>

            {/* Storage Stats */}
            <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                <div className="text-xs">
                    <span className="text-zinc-500">Used: </span>
                    <span className="text-white font-semibold">{usedGB.toFixed(1)} GB</span>
                </div>
                <div className="text-xs">
                    <span className="text-zinc-500">Free: </span>
                    <span className="text-white font-semibold">{freeGB.toFixed(1)} GB</span>
                </div>
                <div className="text-xs">
                    <span className="text-zinc-500">Total: </span>
                    <span className="text-white font-semibold">{totalGB.toFixed(1)} GB</span>
                </div>
            </div>
        </div>
    );
}
