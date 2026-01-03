import { MemoryStick } from 'lucide-react';

interface MemoryBitfieldProps {
    totalGB: number;
    usedGB: number;
    percent: number;
}

export function MemoryBitfield({ totalGB, usedGB, percent }: MemoryBitfieldProps) {
    // Calculate number of blocks (we'll use 50 blocks total for a nice grid)
    const totalBlocks = 50;
    const usedBlocks = Math.round((percent / 100) * totalBlocks);

    // Create array of blocks
    const blocks = Array.from({ length: totalBlocks }, (_, i) => ({
        id: i,
        isUsed: i < usedBlocks
    }));

    return (
        <div className="bg-white/[0.02] rounded-lg p-6 border border-white/[0.08] shadow-[0_-1px_2px_0_rgba(255,255,255,0.05)]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <MemoryStick className="w-4 h-4 text-zinc-500" />
                <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Memory</h3>
            </div>

            <div className="space-y-4">
                {/* States Legend */}
                <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm bg-red-500"></div>
                        <span className="text-zinc-400">
                            <span className="font-semibold text-white">Active</span>
                            <span className="text-zinc-600 ml-1">— Used</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm bg-zinc-700"></div>
                        <span className="text-zinc-400">
                            <span className="font-semibold text-white">Inactive</span>
                            <span className="text-zinc-600 ml-1">— Free</span>
                        </span>
                    </div>
                </div>

                {/* Bitfield Grid */}
                <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Allocation</span>
                        <span className="text-xs text-zinc-400 font-mono">{usedBlocks}/{totalBlocks} Blocks</span>
                    </div>

                    <div className="grid grid-cols-10 gap-1">
                        {blocks.map((block) => (
                            <div
                                key={block.id}
                                className={`
                  h-2 rounded-sm transition-all duration-300
                  ${block.isUsed
                                        ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.3)]'
                                        : 'bg-zinc-800/50 border border-zinc-700/30'
                                    }
                `}
                            />
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="mt-4 pt-4 border-t border-white/[0.05]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500 uppercase tracking-wider">Component: LFD_MATRIX_GRID</span>
                            <span className="text-xs font-mono text-zinc-400">
                                <span className="text-red-400">{usedGB.toFixed(1)} GB</span>
                                <span className="text-zinc-600"> + </span>
                                <span className="text-zinc-500">{(totalGB - usedGB).toFixed(1)} GB</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
