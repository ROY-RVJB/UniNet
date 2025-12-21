import { useState } from 'react';
import { cn } from '@/lib/utils';

// ==========================================
// UniNetLogo v2.0 - Singularidad Mejorada
// ==========================================
// Mejoras:
// - Disco con partículas SVG de tamaño variable
// - Horizonte con gradiente radial
// - Core con sombra OLED profunda
// - Glow sincronizado con pulso
// - Estados de red opcionales
// - Easing tipo spring

interface UniNetLogoProps {
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'processing';
  className?: string;
  /** Control externo del estado hover (para hover bidireccional) */
  isHovered?: boolean;
}

const sizeConfig = {
  sm: {
    container: 48,
    disk: 48,
    horizon: 34,
    core: 22,
    text: 'text-[9px]',
    particles: 10,
    particleSize: [1.2, 2.2, 1.7],
  },
  md: {
    container: 80,
    disk: 80,
    horizon: 56,
    core: 36,
    text: 'text-sm',
    particles: 12,
    particleSize: [2, 3, 2.5],
  },
  lg: {
    container: 192,
    disk: 192,
    horizon: 128,
    core: 72,
    text: 'text-2xl',
    particles: 16,
    particleSize: [3, 5, 4],
  },
};

// Colores de estado
const statusColors = {
  online: { glow: 'rgba(16, 185, 129, 0.4)', border: 'rgba(16, 185, 129, 0.6)' },
  offline: { glow: 'rgba(239, 68, 68, 0.3)', border: 'rgba(239, 68, 68, 0.5)' },
  processing: { glow: 'rgba(245, 158, 11, 0.4)', border: 'rgba(245, 158, 11, 0.6)' },
};

// Genera partículas orbitales con tamaños variables
function generateParticles(count: number, _radius: number, sizes: number[]) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 360;
    const sizeIndex = i % sizes.length;
    const size = sizes[sizeIndex];
    // Opacidad más alta para blancos puros (0.6-0.9)
    const opacity = 0.6 + (Math.sin(i * 0.5) * 0.3);
    particles.push({ angle, size, opacity });
  }
  return particles;
}

export function UniNetLogo({ size = 'sm', status, className, isHovered: externalHovered }: UniNetLogoProps) {
  const [internalHovered, setInternalHovered] = useState(false);
  // Usar hover externo si se proporciona, sino usar el interno
  const isHovered = externalHovered !== undefined ? externalHovered : internalHovered;

  const config = sizeConfig[size];
  const particles = generateParticles(config.particles, config.disk / 2, config.particleSize);

  const statusStyle = status ? statusColors[status] : null;
  const isProcessing = status === 'processing';

  return (
    <div
      className={cn(
        'relative flex items-center justify-center cursor-pointer',
        className
      )}
      style={{
        width: config.container,
        height: config.container,
      }}
      onMouseEnter={() => setInternalHovered(true)}
      onMouseLeave={() => setInternalHovered(false)}
    >
      {/* Layer 1: Disco de Acreción con Partículas SVG */}
      <div
        className={cn(
          'absolute',
          isHovered || isProcessing ? 'animate-logo-orbit-fast' : 'animate-logo-orbit'
        )}
        style={{
          width: config.disk,
          height: config.disk,
          transition: 'opacity 0.5s ease',
          opacity: isHovered ? 0.8 : 1,
        }}
      >
        <svg
          width={config.disk}
          height={config.disk}
          viewBox={`0 0 ${config.disk} ${config.disk}`}
          className="overflow-visible"
        >
          {particles.map((p, i) => {
            const rad = (p.angle * Math.PI) / 180;
            const r = (config.disk / 2) - 2;
            const cx = config.disk / 2 + Math.cos(rad) * r;
            const cy = config.disk / 2 + Math.sin(rad) * r;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={p.size}
                fill="white"
                opacity={isHovered ? p.opacity + 0.2 : p.opacity}
                style={{
                  transition: 'opacity 0.3s ease',
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Layer 2: Horizonte de Sucesos con Gradiente */}
      <div
        className="absolute rounded-full animate-logo-pulse"
        style={{
          width: config.horizon,
          height: config.horizon,
          // Borde blanco más visible
          border: `1px solid ${statusStyle?.border || 'rgba(255, 255, 255, 0.4)'}`,
          // Glow sincronizado - más intenso
          boxShadow: isHovered
            ? `0 0 25px ${statusStyle?.glow || 'rgba(255, 255, 255, 0.5)'},
               0 0 50px ${statusStyle?.glow || 'rgba(255, 255, 255, 0.2)'}`
            : `0 0 12px ${statusStyle?.glow || 'rgba(255, 255, 255, 0.15)'}`,
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Layer 3: Singularidad Central OLED */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: config.core,
          height: config.core,
          // Fondo negro OLED profundo
          backgroundColor: isHovered ? '#ffffff' : '#000000',
          // Sombra interna para profundidad OLED
          boxShadow: isHovered
            ? `0 0 50px rgba(255, 255, 255, 1),
               0 0 100px rgba(255, 255, 255, 0.5),
               inset 0 0 20px rgba(0, 0, 0, 0.5)`
            : `inset 0 2px 4px rgba(255, 255, 255, 0.1),
               inset 0 -2px 4px rgba(0, 0, 0, 0.8),
               0 0 20px rgba(0, 0, 0, 0.5)`,
          // Transformación con spring
          transform: isHovered ? 'scale(0.85)' : 'scale(1)',
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Monograma UN */}
        <span
          className={cn(
            'font-bold tracking-tight select-none',
            config.text
          )}
          style={{
            color: isHovered ? '#000000' : '#888888',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            textShadow: isHovered
              ? 'none'
              : '0 0 8px rgba(255, 255, 255, 0.2)',
          }}
        >
          UN
        </span>
      </div>

      {/* Layer 4: Radiación de Hawking (partículas escapando) - Solo en hover */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-ping"
              style={{
                width: 2,
                height: 2,
                left: `${30 + i * 20}%`,
                top: `${20 + i * 25}%`,
                opacity: 0.4,
                animationDuration: `${1 + i * 0.5}s`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
