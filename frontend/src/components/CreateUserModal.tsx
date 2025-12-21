import * as React from "react"
import { cn } from "@/lib/utils"
import { X, Loader2, Eye, EyeOff, ChevronDown } from "lucide-react"

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: UserFormData) => Promise<void>
}

export interface UserFormData {
  username: string
  fullName: string
  password: string
  confirmPassword: string
  group: string
  carrera: string
}

interface FormErrors {
  username?: string
  fullName?: string
  password?: string
  confirmPassword?: string
  group?: string
  carrera?: string
}

// ==========================================
// CreateUserModal - Estilo Minimalista Vercel
// ==========================================

const GROUP_OPTIONS = [
  { value: "5000", label: "Alumno" },
  { value: "6000", label: "Docente" },
]

const CARRERA_OPTIONS = [
  { value: "5001", label: "Administración y Negocios Internacionales" },
  { value: "5002", label: "Contabilidad y Finanzas" },
  { value: "5003", label: "Derecho y Ciencias Políticas" },
  { value: "5004", label: "Ecoturismo" },
  { value: "5005", label: "Educación Inicial y Especial" },
  { value: "5006", label: "Educación Matemáticas y Computación" },
  { value: "5007", label: "Educación Primaria e Informática" },
  { value: "5008", label: "Enfermería" },
  { value: "5009", label: "Ingeniería Agroindustrial" },
  { value: "5010", label: "Ingeniería de Sistemas e Informática" },
  { value: "5011", label: "Ingeniería Forestal y Medio Ambiente" },
  { value: "5012", label: "Medicina Veterinaria y Zootecnia" },
]

// Input minimalista reutilizable
function MinimalInput({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled,
  autoComplete,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  error?: string
  disabled?: boolean
  autoComplete?: string
}) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isPassword = type === "password"
  const inputType = isPassword ? (showPassword ? "text" : "password") : type

  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-white/50">
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            "w-full px-3 py-2 text-sm text-white",
            "bg-transparent border rounded-lg",
            "placeholder:text-white/20",
            "focus:outline-none transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-red-500/50 focus:border-red-500"
              : "border-white/10 focus:border-white/30"
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}

// Command Menu Select - Estilo Vercel/Linear
function CommandSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Buscar...",
  error,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [highlightedIndex, setHighlightedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === value)

  // Filtrar opciones con fuzzy search simple
  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options
    const query = search.toLowerCase()
    return options.filter(option =>
      option.label.toLowerCase().includes(query)
    )
  }, [options, search])

  // Reset highlight cuando cambia el filtro
  React.useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredOptions])

  // Scroll al item destacado
  React.useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlighted) {
        highlighted.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex, isOpen])

  // Focus input al abrir
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
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
          setIsOpen(false)
          setSearch("")
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        setSearch("")
        break
    }
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearch("")
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-white/50">
        {label}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 text-sm text-left",
          "bg-transparent border rounded-lg",
          "focus:outline-none transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "flex items-center justify-between",
          error
            ? "border-red-500/50"
            : "border-white/10 hover:border-white/20"
        )}
      >
        <span className={selectedOption ? "text-white" : "text-white/20"}>
          {selectedOption?.label || "Seleccionar..."}
        </span>
        <ChevronDown className="h-4 w-4 text-white/30" />
      </button>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Command Menu Modal */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-100"
            onClick={() => {
              setIsOpen(false)
              setSearch("")
            }}
          />

          {/* Command Panel */}
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 duration-100">
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
                      className={cn(
                        "w-full px-3 py-2.5 text-sm text-left flex items-center justify-between transition-colors",
                        index === highlightedIndex
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/5"
                      )}
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
    </div>
  )
}

export function CreateUserModal({ isOpen, onClose, onSubmit }: CreateUserModalProps) {
  const [formData, setFormData] = React.useState<UserFormData>({
    username: "",
    fullName: "",
    password: "",
    confirmPassword: "",
    group: "5000", // Default: Alumnos
    carrera: "", // Solo requerido para Alumnos
  })
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        username: "",
        fullName: "",
        password: "",
        confirmPassword: "",
        group: "5000",
        carrera: "",
      })
      setErrors({})
      setTouched({})
      setIsLoading(false)
    }
  }, [isOpen])

  // Validaciones
  const validateField = (field: keyof UserFormData, value: string): string | undefined => {
    switch (field) {
      case "username":
        if (!value.trim()) return "Este campo es obligatorio"
        if (value.length < 3) return "Mínimo 3 caracteres"
        if (!/^[a-z0-9._-]+$/.test(value)) return "Solo letras minúsculas, números, puntos, guiones"
        return undefined

      case "fullName":
        if (!value.trim()) return "Este campo es obligatorio"
        if (value.length < 2) return "Mínimo 2 caracteres"
        return undefined

      case "password":
        if (!value) return "Este campo es obligatorio"
        if (value.length < 6) return "Mínimo 6 caracteres"
        return undefined

      case "confirmPassword":
        if (!value) return "Este campo es obligatorio"
        if (value !== formData.password) return "Las contraseñas no coinciden"
        return undefined

      case "group":
        if (!value) return "Selecciona un grupo"
        return undefined

      case "carrera":
        // Solo requerido si es Alumno
        if (formData.group === "5000" && !value) return "Selecciona una carrera"
        return undefined

      default:
        return undefined
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    Object.keys(formData).forEach((key) => {
      const field = key as keyof UserFormData
      const error = validateField(field, formData[field])
      if (error) newErrors[field] = error
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Si cambia a Docente, limpiar carrera
      if (field === "group" && value === "6000") {
        newData.carrera = ""
      }

      return newData
    })

    // Validar en tiempo real si el campo ya fue tocado
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: error }))

      // Re-validar confirmPassword si cambia password
      if (field === "password" && touched.confirmPassword) {
        const confirmError = validateField("confirmPassword", formData.confirmPassword)
        setErrors((prev) => ({ ...prev, confirmPassword: confirmError }))
      }

      // Limpiar error de carrera si cambia a Docente
      if (field === "group" && value === "6000") {
        setErrors((prev) => ({ ...prev, carrera: undefined }))
      }
    }
  }

  const handleBlur = (field: keyof UserFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field])
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Marcar todos los campos como tocados
    setTouched({
      username: true,
      fullName: true,
      password: true,
      confirmPassword: true,
      group: true,
      carrera: true,
    })

    if (!validateForm()) return

    setIsLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error("Error creating user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = React.useMemo(() => {
    const baseValid =
      formData.username.trim().length >= 3 &&
      formData.fullName.trim().length >= 2 &&
      formData.password.length >= 6 &&
      formData.confirmPassword === formData.password &&
      formData.group !== ""

    // Si es Alumno, también debe tener carrera seleccionada
    if (formData.group === "5000") {
      return baseValid && formData.carrera !== ""
    }

    return baseValid
  }, [formData])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 duration-150">
        <div className="bg-black border border-white/10 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-base font-medium text-white">
              Nuevo Usuario
            </h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Usuario */}
            <MinimalInput
              label="Usuario"
              placeholder="juan.perez"
              value={formData.username}
              onChange={(value) => handleChange("username", value)}
              onBlur={() => handleBlur("username")}
              error={touched.username ? errors.username : undefined}
              disabled={isLoading}
              autoComplete="off"
            />

            {/* Nombre completo */}
            <MinimalInput
              label="Nombre completo"
              placeholder="Juan Pérez García"
              value={formData.fullName}
              onChange={(value) => handleChange("fullName", value)}
              onBlur={() => handleBlur("fullName")}
              error={touched.fullName ? errors.fullName : undefined}
              disabled={isLoading}
              autoComplete="off"
            />

            {/* Contraseñas en grid */}
            <div className="grid grid-cols-2 gap-3">
              <MinimalInput
                label="Contraseña"
                type="password"
                placeholder="••••••"
                value={formData.password}
                onChange={(value) => handleChange("password", value)}
                onBlur={() => handleBlur("password")}
                error={touched.password ? errors.password : undefined}
                disabled={isLoading}
                autoComplete="new-password"
              />

              <MinimalInput
                label="Confirmar"
                type="password"
                placeholder="••••••"
                value={formData.confirmPassword}
                onChange={(value) => handleChange("confirmPassword", value)}
                onBlur={() => handleBlur("confirmPassword")}
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            {/* Tipo de usuario - Pills inline */}
            <div className="space-y-1.5">
              <label className="block text-sm text-white/50">
                Tipo
              </label>
              <div className="flex gap-2">
                {GROUP_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange("group", option.value)}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      "border disabled:opacity-50",
                      formData.group === option.value
                        ? "bg-white text-black border-white"
                        : "text-white/50 border-white/10 hover:text-white hover:border-white/20"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Carrera - Solo visible para Alumnos */}
            {formData.group === "5000" && (
              <CommandSelect
                label="Carrera"
                value={formData.carrera}
                onChange={(value) => handleChange("carrera", value)}
                options={CARRERA_OPTIONS}
                placeholder="Buscar carrera..."
                error={touched.carrera ? errors.carrera : undefined}
                disabled={isLoading}
              />
            )}

            {/* Footer buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  "text-white/70 hover:text-white",
                  "border border-white/10 hover:border-white/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  "disabled:cursor-not-allowed",
                  isFormValid && !isLoading
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-white/10 text-white/30"
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando...
                  </span>
                ) : (
                  "Crear"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
