// ==========================================
// AtmosphericBackground - Blob atmosférico con color de facultad
// ==========================================

interface AtmosphericBackgroundProps {
  color: string;
}

export function AtmosphericBackground({ color }: AtmosphericBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Blob principal - esquina superior derecha */}
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full transition-colors duration-700 ease-in-out"
        style={{
          backgroundColor: color,
          filter: 'blur(120px)',
          opacity: 0.15,
        }}
      />
      {/* Blob secundario más pequeño - efecto de profundidad */}
      <div
        className="absolute top-20 right-20 w-[200px] h-[200px] rounded-full transition-colors duration-700 ease-in-out"
        style={{
          backgroundColor: color,
          filter: 'blur(80px)',
          opacity: 0.1,
        }}
      />
    </div>
  );
}
