// ==========================================
// AnimatedDottedLine - Línea punteada con marching ants + luz
// ==========================================

export function AnimatedDottedLine() {
  return (
    <div className="relative w-full h-[2px]">
      {/* Capa 1: Puntos que caminan (marching ants) */}
      <div
        className="absolute inset-0 animate-march"
        style={{
          background: '#444',
          maskImage: `repeating-linear-gradient(
            90deg,
            black 0px,
            black 6px,
            transparent 6px,
            transparent 12px
          )`,
          WebkitMaskImage: `repeating-linear-gradient(
            90deg,
            black 0px,
            black 6px,
            transparent 6px,
            transparent 12px
          )`,
          maskSize: '12px 100%',
          WebkitMaskSize: '12px 100%',
        }}
      />
      {/* Capa 2: Luz que viaja y revela */}
      <div
        className="absolute inset-0 animate-light-sweep"
        style={{
          background: `linear-gradient(
            90deg,
            transparent 0%,
            transparent 40%,
            #fff 50%,
            transparent 60%,
            transparent 100%
          )`,
          backgroundSize: '200% 100%',
          maskImage: `repeating-linear-gradient(
            90deg,
            black 0px,
            black 6px,
            transparent 6px,
            transparent 12px
          )`,
          WebkitMaskImage: `repeating-linear-gradient(
            90deg,
            black 0px,
            black 6px,
            transparent 6px,
            transparent 12px
          )`,
        }}
      />
    </div>
  );
}
