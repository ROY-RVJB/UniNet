import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PulsarBackground } from '@/components/PulsarBackground'
import { PulsarLogo } from '@/components/PulsarLogo'
import { Loader2, AlertCircle, User, Lock, Eye, EyeOff } from 'lucide-react'

// ==========================================
// LoginPage - Simplificado (solo user + pass)
// El backend determina el rol y carreras
// ==========================================

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLogoHovered, setIsLogoHovered] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError('Ingrese usuario y contraseña')
      return
    }

    try {
      await login({ username, password })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Estilos para override del autofill del navegador */}
      <style>{`
        .login-input {
          background-color: rgba(20, 20, 20, 1) !important;
          color: #d4d4d8 !important;
          -webkit-text-fill-color: #d4d4d8 !important;
          caret-color: #d4d4d8 !important;
        }

        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus,
        .login-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgba(20, 20, 20, 1) inset !important;
          -webkit-text-fill-color: #d4d4d8 !important;
          background-color: rgba(20, 20, 20, 1) !important;
          transition: background-color 9999s ease-in-out 0s, color 9999s ease-in-out 0s;
          color: #d4d4d8 !important;
        }

        .login-input:focus {
          background-color: rgba(20, 20, 20, 1) !important;
          color: #d4d4d8 !important;
          -webkit-text-fill-color: #d4d4d8 !important;
        }
      `}</style>

      {/* Fondo Pulsar con Canvas API */}
      <PulsarBackground />

      {/* Contenedor principal con efecto de hover */}
      <div
        className="relative z-10 w-full max-w-md transition-all duration-500 ease-out"
        style={{
          transform: isLogoHovered ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {/* Card contenedora */}
        <div
          className="relative rounded-3xl p-8 transition-all duration-500"
          style={{
            backgroundColor: 'rgba(10, 10, 10, 0.8)',
            border: `1px solid ${isLogoHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)'}`,
            boxShadow: isLogoHovered
              ? '0 0 60px rgba(255, 255, 255, 0.05), inset 0 0 30px rgba(255, 255, 255, 0.02)'
              : '0 0 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Logo Pulsar */}
          <div
            className="flex flex-col items-center"
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            <PulsarLogo size={220} isHovered={isLogoHovered} />
          </div>

          {/* Titulo */}
          <div className="text-center mt-6 mb-8">
            <h1 className="text-2xl font-semibold text-white tracking-widest uppercase">
              UniNet
            </h1>
            <p className="text-xs text-zinc-500 mt-2 tracking-wider">
              Sistema de Gestión de Laboratorios
            </p>
          </div>

          {/* Separador */}
          <div
            className="h-px mb-6 transition-all duration-500"
            style={{
              background: isLogoHovered
                ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
            }}
          />

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Usuario */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-xs text-zinc-500 uppercase tracking-wider">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingrese su usuario"
                  disabled={isLoading}
                  autoComplete="username"
                  spellCheck="false"
                  className="login-input w-full pl-10 pr-4 py-3 border border-zinc-800/50 rounded-xl
                           placeholder-zinc-600 text-sm
                           focus:outline-none focus:border-zinc-600
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-300"
                />
              </div>
            </div>

            {/* Contrasena */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs text-zinc-500 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  disabled={isLoading}
                  autoComplete="current-password"
                  spellCheck="false"
                  className="login-input w-full pl-10 pr-12 py-3 border border-zinc-800/50 rounded-xl
                           placeholder-zinc-600 text-sm
                           focus:outline-none focus:border-zinc-600
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Boton submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 bg-white text-black font-medium rounded-xl
                       hover:bg-zinc-200 active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          {/* Separador inferior */}
          <div
            className="h-px mt-6 mb-4"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
            }}
          />

          {/* Footer dentro del card */}
          <p className="text-center text-[10px] text-zinc-600 tracking-wider uppercase">
            Universidad Nacional Amazonica de Madre de Dios
          </p>
        </div>
      </div>
    </div>
  )
}
