import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PulsarBackground } from '@/components/PulsarBackground'
import { PulsarLogo } from '@/components/PulsarLogo'
import { Loader2, AlertCircle, User, Lock, ChevronDown, Check, GraduationCap, X } from 'lucide-react'

// Opciones de carrera (IDs alineados con mockCarreras)
const CARRERA_OPTIONS = [
  { value: 'carrera-administracion', label: 'Administración y Negocios Internacionales' },
  { value: 'carrera-contabilidad', label: 'Contabilidad y Finanzas' },
  { value: 'carrera-derecho', label: 'Derecho y Ciencias Políticas' },
  { value: 'carrera-ecoturismo', label: 'Ecoturismo' },
  { value: 'carrera-inicial', label: 'Educación Inicial y Especial' },
  { value: 'carrera-matematicas', label: 'Educación Matemáticas y Computación' },
  { value: 'carrera-primaria', label: 'Educación Primaria e Informática' },
  { value: 'carrera-enfermeria', label: 'Enfermería' },
  { value: 'carrera-agroindustrial', label: 'Ingeniería Agroindustrial' },
  { value: 'carrera-sistemas', label: 'Ingeniería de Sistemas e Informática' },
  { value: 'carrera-forestal', label: 'Ingeniería Forestal y Medio Ambiente' },
  { value: 'carrera-veterinaria', label: 'Medicina Veterinaria y Zootecnia' },
]

// ==========================================
// CommandSelect - Selector estilo Command Menu
// ==========================================
interface CommandSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function CommandSelect({
  value,
  onChange,
  options,
  placeholder = "Buscar...",
  disabled,
  isOpen,
  onOpenChange,
}: CommandSelectProps) {
  const [search, setSearch] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === value)

  // Filtrar opciones con búsqueda
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    const query = search.toLowerCase()
    return options.filter(option =>
      option.label.toLowerCase().includes(query)
    )
  }, [options, search])

  // Reset highlight cuando cambia el filtro
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredOptions])

  // Scroll al item destacado
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlighted) {
        highlighted.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex, isOpen])

  // Focus input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setSearch("")
      setHighlightedIndex(0)
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex(i =>
          i < filteredOptions.length - 1 ? i + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex(i =>
          i > 0 ? i - 1 : filteredOptions.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].value)
          onOpenChange(false)
          setSearch("")
        }
        break
      case "Escape":
        e.preventDefault()
        onOpenChange(false)
        setSearch("")
        break
    }
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    onOpenChange(false)
    setSearch("")
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && onOpenChange(true)}
        disabled={disabled}
        className="w-full pl-10 pr-10 py-3 border border-zinc-800/50 rounded-xl
                 text-left text-sm cursor-pointer
                 focus:outline-none focus:border-zinc-600
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-300"
        style={{ backgroundColor: 'transparent' }}
      >
        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <span className={value ? 'text-zinc-300 truncate block pr-6' : 'text-zinc-600'}>
          {selectedOption?.label || 'Seleccionar carrera'}
        </span>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
      </button>

      {/* Command Menu Modal */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-100"
            onClick={() => {
              onOpenChange(false)
              setSearch("")
            }}
          />

          {/* Command Panel */}
          <div className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 duration-100">
            <div
              className="bg-black border border-white/10 rounded-lg shadow-2xl overflow-hidden"
              onKeyDown={handleKeyDown}
            >
              {/* Search input */}
              <div className="flex items-center px-3 border-b border-white/10">
                <svg
                  className="h-4 w-4 text-white/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 px-3 py-3 text-sm text-white bg-transparent placeholder:text-white/30 focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="p-1 text-white/30 hover:text-white/60"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Options list */}
              <div
                ref={listRef}
                className="max-h-72 overflow-y-auto py-2 scrollbar-thin"
              >
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-white/30">
                    No se encontraron resultados
                  </div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full px-3 py-2.5 text-sm text-left flex items-center justify-between transition-colors
                        ${index === highlightedIndex
                          ? 'bg-white/10 text-white'
                          : 'text-white/70 hover:bg-white/5'
                        }`}
                    >
                      <span>{option.label}</span>
                      {option.value === value && (
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="px-3 py-2 border-t border-white/10 flex items-center gap-4 text-xs text-white/30">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↑↓</kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↵</kbd>
                  seleccionar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">esc</kbd>
                  cerrar
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [carrera, setCarrera] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLogoHovered, setIsLogoHovered] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isCarreraDropdownOpen, setIsCarreraDropdownOpen] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  const userOptions = [
    { value: 'administrador', label: 'Administrador', icon: '👤' },
    { value: 'docente', label: 'Docente', icon: '👨‍🏫' },
  ]

  // Cerrar dropdown de usuario al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Limpiar carrera si cambia de docente a admin
  useEffect(() => {
    if (username !== 'docente') {
      setCarrera('')
    }
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError('Ingrese usuario y contraseña')
      return
    }

    if (username === 'docente' && !carrera) {
      setError('Seleccione una carrera')
      return
    }

    try {
      await login({ username, password, carrera_id: carrera || undefined })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Estilos para override del autofill del navegador */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
          -webkit-text-fill-color: #d4d4d8 !important;
          background-color: transparent !important;
          transition: background-color 5000s ease-in-out 0s;
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

            {/* Usuario - Custom Dropdown */}
            <div className="space-y-2">
              <label className="block text-xs text-zinc-500 uppercase tracking-wider">
                Usuario
              </label>
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => !isLoading && setIsUserDropdownOpen(!isUserDropdownOpen)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-3 border border-zinc-800/50 rounded-xl
                           text-left text-sm cursor-pointer
                           focus:outline-none focus:border-zinc-600
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-300"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <span className={username ? 'text-zinc-300' : 'text-zinc-600'}>
                    {username ? userOptions.find(o => o.value === username)?.label : 'Seleccionar usuario'}
                  </span>
                  <ChevronDown
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div
                    className="absolute top-full left-0 right-0 mt-2 py-1 rounded-xl border border-zinc-800/80 shadow-xl z-50 overflow-hidden"
                    style={{ backgroundColor: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)' }}
                  >
                    {userOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setUsername(option.value)
                          setIsUserDropdownOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors
                          ${username === option.value ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        <span className="text-base">{option.icon}</span>
                        <span className="flex-1">{option.label}</span>
                        {username === option.value && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Carrera - Solo visible para Docente (Command Select) */}
            {username === 'docente' && (
              <div className="space-y-2">
                <label className="block text-xs text-zinc-500 uppercase tracking-wider">
                  Carrera
                </label>
                <div className="relative">
                  <CommandSelect
                    value={carrera}
                    onChange={setCarrera}
                    options={CARRERA_OPTIONS}
                    placeholder="Buscar carrera..."
                    disabled={isLoading}
                    isOpen={isCarreraDropdownOpen}
                    onOpenChange={setIsCarreraDropdownOpen}
                  />
                </div>
              </div>
            )}

            {/* Contrasena */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs text-zinc-500 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  disabled={isLoading}
                  autoComplete="off"
                  style={{ backgroundColor: 'transparent' }}
                  className="w-full pl-10 pr-4 py-3 border border-zinc-800/50 rounded-xl
                           text-zinc-300 placeholder-zinc-600 text-sm
                           focus:outline-none focus:border-zinc-600
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-300
                           autofill:bg-transparent autofill:text-zinc-300"
                />
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
