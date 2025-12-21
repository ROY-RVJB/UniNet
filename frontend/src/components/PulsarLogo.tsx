import { useState } from 'react'

// ==========================================
// PulsarLogo - Logo con especificaciones Pulsar Engine
// ==========================================
// CAPA 01: Disco - rotacion 25s -> 3s en hover
// CAPA 02: Horizonte - box-shadow pulsante + scale 1.08
// CAPA 03: Singularidad - cubic-bezier elastico
// Transiciones escalonadas: Core 0s, Horizon 0.05s, Disk 0.1s

interface PulsarLogoProps {
  size?: number
  className?: string
  isHovered?: boolean // Control externo del hover
}

export function PulsarLogo({ size = 192, className, isHovered: externalHovered }: PulsarLogoProps) {
  const [internalHovered, setInternalHovered] = useState(false)
  // Usar hover externo si se proporciona, sino usar el interno
  const isHovered = externalHovered !== undefined ? externalHovered : internalHovered

  // Calcular tamaños proporcionales
  const diskSize = size
  const horizonSize = size * 0.7
  const coreSize = size * 0.375
  const fontSize = size * 0.125

  // Generar particulas orbitales
  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * 360
    const rad = (angle * Math.PI) / 180
    const radius = diskSize / 2 - 4
    const cx = diskSize / 2 + Math.cos(rad) * radius
    const cy = diskSize / 2 + Math.sin(rad) * radius
    const particleSize = 2 + (i % 3)
    const opacity = 0.5 + Math.sin(i * 0.5) * 0.3
    return { cx, cy, size: particleSize, opacity }
  })

  return (
    <div
      className={`relative flex items-center justify-center cursor-pointer ${className || ''}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => externalHovered === undefined && setInternalHovered(true)}
      onMouseLeave={() => externalHovered === undefined && setInternalHovered(false)}
    >
      {/* CAPA 01: DISCO DE ACRECION */}
      <div
        className="absolute"
        style={{
          width: diskSize,
          height: diskSize,
          // Transicion escalonada: delay 0.1s
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
          // Rotacion: 25s normal, 3s en hover
          animation: `pulsar-rotate ${isHovered ? '3s' : '25s'} linear infinite`,
        }}
      >
        <svg
          width={diskSize}
          height={diskSize}
          viewBox={`0 0 ${diskSize} ${diskSize}`}
          className="overflow-visible"
        >
          {/* Particulas orbitales */}
          {particles.map((p, i) => (
            <circle
              key={i}
              cx={p.cx}
              cy={p.cy}
              r={p.size}
              fill="white"
              opacity={isHovered ? p.opacity + 0.3 : p.opacity}
              style={{
                transition: 'opacity 0.3s ease',
              }}
            />
          ))}
          {/* Orbita punteada */}
          <circle
            cx={diskSize / 2}
            cy={diskSize / 2}
            r={diskSize / 2 - 20}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
        </svg>
      </div>

      {/* CAPA 02: HORIZONTE DE EVENTOS */}
      <div
        className="absolute rounded-full"
        style={{
          width: horizonSize,
          height: horizonSize,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          // Transicion escalonada: delay 0.05s
          transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s`,
          // Scale y glow en hover
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isHovered
            ? `0 0 20px rgba(255, 255, 255, 0.15),
               inset 0 0 15px rgba(255, 255, 255, 0.05)`
            : `0 0 10px rgba(255, 255, 255, 0.05),
               inset 0 0 5px rgba(255, 255, 255, 0.02)`,
        }}
      />

      {/* CAPA 03: SINGULARIDAD (CORE) */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: coreSize,
          height: coreSize,
          backgroundColor: isHovered ? '#ffffff' : '#000000',
          // Transicion escalonada: delay 0s (primero en reaccionar)
          transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0s`,
          transform: isHovered ? 'scale(0.9)' : 'scale(1)',
          boxShadow: isHovered
            ? `0 0 30px rgba(255, 255, 255, 0.4),
               0 0 60px rgba(255, 255, 255, 0.15)`
            : `inset 0 1px 4px rgba(255, 255, 255, 0.05),
               0 0 15px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {/* Monograma UN */}
        <span
          style={{
            fontSize: fontSize,
            fontWeight: 'bold',
            color: isHovered ? '#000000' : '#888888',
            letterSpacing: '0.05em',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isHovered ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          UN
        </span>
      </div>

      {/* Radiacion de Hawking (particulas escapando en hover) */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: 3,
                height: 3,
                left: `${25 + (i % 3) * 25}%`,
                top: `${20 + Math.floor(i / 3) * 60}%`,
                opacity: 0.6,
                animation: `pulsar-particle ${1 + i * 0.2}s ease-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Estilos CSS para animaciones */}
      <style>{`
        @keyframes pulsar-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulsar-particle {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 0.3; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
