import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TitaniumIconProps {
    icon: LucideIcon;
    color: string; // Hex color for the theme (e.g., '#3b82f6' for blue)
    className?: string;
}

export function TitaniumIcon({ icon: Icon, color, className }: TitaniumIconProps) {
    // Convert hex to RGB for use in rgba
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 136, g: 0, b: 255 }; // Default purple
    };

    const rgb = hexToRgb(color);
    const colorRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
    const gradientId = `gradient-${color.replace('#', '')}`;

    return (
        <div className={cn("relative w-12 h-12", className)}>
            {/* SVG gradient definition */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#888888', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Main container with subtle bottom line */}
            <div
                className="relative w-full h-full rounded-xl overflow-hidden"
                style={{
                    background: `radial-gradient(circle at 30% 30%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) 0%, rgba(13, 13, 13, 0.8) 60%)`,
                    transformStyle: 'preserve-3d',
                    boxShadow: `
            0 2px 0 ${colorRgba},
            0 4px 8px -2px #000
          `
                }}
            >
                {/* Composite border (pseudo-element effect) */}
                <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                        padding: '2px',
                        background: `linear-gradient(
              45deg,
              ${color} 0%,
              #333333 35%,
              #333333 65%,
              #ffffff 100%
            )`,
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude'
                    }}
                />

                {/* Internal ray texture */}
                <div
                    className="absolute inset-0 rounded-xl opacity-25 z-10"
                    style={{
                        background: `repeating-conic-gradient(
              from 45deg,
              transparent 0deg,
              ${colorRgba} 3.1deg,
              transparent 6deg
            )`,
                        maskImage: 'radial-gradient(circle, transparent 20%, black 80%)'
                    }}
                />

                {/* Icon with gradient fill */}
                <div
                    className="absolute inset-0 flex items-center justify-center z-20"
                    style={{
                        filter: 'drop-shadow(0 8px 6px rgba(0,0,0,0.4))'
                    }}
                >
                    <Icon
                        className="w-6 h-6"
                        strokeWidth={2}
                        style={{
                            stroke: `url(#${gradientId})`,
                            fill: 'none'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
