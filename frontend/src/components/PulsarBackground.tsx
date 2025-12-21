import { useEffect, useRef } from 'react'

// ==========================================
// PulsarBackground - Ondas sutiles + Estrellas flotantes
// ==========================================
// Combinacion: ondas menos frecuentes + estrellas en movimiento

interface PulsarBackgroundProps {
  className?: string
}

interface Wave {
  radius: number
  opacity: number
  maxRadius: number
  speed: number
}

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  speedX: number
  speedY: number
  baseOpacity: number
}

export function PulsarBackground({ className }: PulsarBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // === ONDAS (menos frecuentes) ===
    const waves: Wave[] = []
    const maxWaves = 3
    const waveInterval = 4000 // Nueva onda cada 4 segundos

    const createWave = () => {
      if (waves.length < maxWaves) {
        waves.push({
          radius: 80,
          opacity: 0.15,
          maxRadius: Math.max(canvas.width, canvas.height) * 0.7,
          speed: 1
        })
      }
    }

    createWave()
    const waveTimer = setInterval(createWave, waveInterval)

    // === ESTRELLAS FLOTANTES ===
    const stars: Star[] = []
    for (let i = 0; i < 50; i++) {
      const baseOpacity = 0.1 + Math.random() * 0.25
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 0.5 + Math.random() * 1.5,
        opacity: baseOpacity,
        baseOpacity: baseOpacity,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3
      })
    }

    let time = 0

    const render = () => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // Limpiar con negro
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // === DIBUJAR ESTRELLAS FLOTANTES ===
      stars.forEach((star) => {
        // Mover estrella
        star.x += star.speedX
        star.y += star.speedY

        // Wrap around (aparecer del otro lado)
        if (star.x < 0) star.x = canvas.width
        if (star.x > canvas.width) star.x = 0
        if (star.y < 0) star.y = canvas.height
        if (star.y > canvas.height) star.y = 0

        // Parpadeo sutil
        const flicker = 0.7 + Math.sin(time * 0.5 + star.x * 0.02 + star.y * 0.02) * 0.3
        star.opacity = star.baseOpacity * flicker

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()
      })

      // === DIBUJAR ONDAS ===
      for (let i = waves.length - 1; i >= 0; i--) {
        const wave = waves[i]

        // Expandir onda
        wave.radius += wave.speed

        // Fade out cuadratico
        const progress = wave.radius / wave.maxRadius
        wave.opacity = 0.12 * (1 - progress) * (1 - progress)

        // Eliminar ondas invisibles
        if (wave.radius >= wave.maxRadius || wave.opacity <= 0.005) {
          waves.splice(i, 1)
          continue
        }

        // Onda principal
        ctx.beginPath()
        ctx.arc(centerX, centerY, wave.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255, 255, 255, ${wave.opacity})`
        ctx.lineWidth = 1
        ctx.stroke()

        // Onda secundaria sutil
        if (wave.radius > 20) {
          ctx.beginPath()
          ctx.arc(centerX, centerY, wave.radius - 8, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255, 255, 255, ${wave.opacity * 0.4})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      time += 0.016
      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationRef.current)
      clearInterval(waveTimer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className || ''}`}
      style={{ background: 'black' }}
    />
  )
}
