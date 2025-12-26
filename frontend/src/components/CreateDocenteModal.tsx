import * as React from "react"
import { cn } from "@/lib/utils"
import { X, Loader2, Eye, EyeOff, Check } from "lucide-react"
import type { DocenteFormData } from "./DocentesTable"

// ==========================================
// CreateDocenteModal - Crear Docente del Sistema
// Estilo minimalista Vercel
// ==========================================

interface CreateDocenteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: DocenteFormData) => Promise<void>
}

interface FormErrors {
  username?: string
  full_name?: string
  email?: string
  password?: string
  confirmPassword?: string
  carreras?: string
}

// Lista de carreras disponibles
const CARRERAS_DISPONIBLES = [
  { id: "carrera-administracion", nombre: "Administración y Negocios Internacionales" },
  { id: "carrera-contabilidad", nombre: "Contabilidad y Finanzas" },
  { id: "carrera-derecho", nombre: "Derecho y Ciencias Políticas" },
  { id: "carrera-ecoturismo", nombre: "Ecoturismo" },
  { id: "carrera-inicial", nombre: "Educación Inicial y Especial" },
  { id: "carrera-matematicas", nombre: "Educación Matemáticas y Computación" },
  { id: "carrera-primaria", nombre: "Educación Primaria e Informática" },
  { id: "carrera-enfermeria", nombre: "Enfermería" },
  { id: "carrera-agroindustrial", nombre: "Ingeniería Agroindustrial" },
  { id: "carrera-sistemas", nombre: "Ingeniería de Sistemas e Informática" },
  { id: "carrera-forestal", nombre: "Ingeniería Forestal y Medio Ambiente" },
  { id: "carrera-veterinaria", nombre: "Medicina Veterinaria y Zootecnia" },
]

// Input minimalista
function MinimalInput({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  error?: string
  disabled?: boolean
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

export function CreateDocenteModal({ isOpen, onClose, onSubmit }: CreateDocenteModalProps) {
  const [formData, setFormData] = React.useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    carreras: [] as string[],
  })
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})

  // Reset form al cerrar
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        username: "",
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        carreras: [],
      })
      setErrors({})
      setTouched({})
      setIsLoading(false)
    }
  }, [isOpen])

  // Validaciones
  const validateField = (field: string, value: string | string[]): string | undefined => {
    switch (field) {
      case "username":
        if (typeof value !== 'string') return undefined
        if (!value.trim()) return "Usuario requerido"
        if (value.length < 3) return "Mínimo 3 caracteres"
        if (!/^[a-z0-9._-]+$/.test(value)) return "Solo minúsculas, números, puntos, guiones"
        return undefined

      case "full_name":
        if (typeof value !== 'string') return undefined
        if (!value.trim()) return "Nombre requerido"
        if (value.length < 3) return "Mínimo 3 caracteres"
        return undefined

      case "email":
        if (typeof value !== 'string') return undefined
        if (!value.trim()) return "Email requerido"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email inválido"
        return undefined

      case "password":
        if (typeof value !== 'string') return undefined
        if (!value) return "Contraseña requerida"
        if (value.length < 6) return "Mínimo 6 caracteres"
        return undefined

      case "confirmPassword":
        if (typeof value !== 'string') return undefined
        if (!value) return "Confirmar contraseña"
        if (value !== formData.password) return "Las contraseñas no coinciden"
        return undefined

      case "carreras":
        if (!Array.isArray(value)) return undefined
        if (value.length === 0) return "Selecciona al menos una carrera"
        return undefined

      default:
        return undefined
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    const usernameError = validateField("username", formData.username)
    if (usernameError) newErrors.username = usernameError

    const fullNameError = validateField("full_name", formData.full_name)
    if (fullNameError) newErrors.full_name = fullNameError

    const emailError = validateField("email", formData.email)
    if (emailError) newErrors.email = emailError

    const passwordError = validateField("password", formData.password)
    if (passwordError) newErrors.password = passwordError

    const confirmError = validateField("confirmPassword", formData.confirmPassword)
    if (confirmError) newErrors.confirmPassword = confirmError

    const carrerasError = validateField("carreras", formData.carreras)
    if (carrerasError) newErrors.carreras = carrerasError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const value = formData[field as keyof typeof formData]
    const error = validateField(field, value as string)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const toggleCarrera = (carreraId: string) => {
    setFormData(prev => {
      const newCarreras = prev.carreras.includes(carreraId)
        ? prev.carreras.filter(c => c !== carreraId)
        : [...prev.carreras, carreraId]
      return { ...prev, carreras: newCarreras }
    })

    if (touched.carreras) {
      const newCarreras = formData.carreras.includes(carreraId)
        ? formData.carreras.filter(c => c !== carreraId)
        : [...formData.carreras, carreraId]
      const error = validateField("carreras", newCarreras)
      setErrors(prev => ({ ...prev, carreras: error }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setTouched({
      username: true,
      full_name: true,
      email: true,
      password: true,
      confirmPassword: true,
      carreras: true,
    })

    if (!validateForm()) return

    setIsLoading(true)
    try {
      await onSubmit({
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        carreras: formData.carreras,
      })
      onClose()
    } catch (error) {
      console.error("Error creating docente:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = React.useMemo(() => {
    return (
      formData.username.trim().length >= 3 &&
      formData.full_name.trim().length >= 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      formData.password.length >= 6 &&
      formData.confirmPassword === formData.password &&
      formData.carreras.length > 0
    )
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
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="bg-black border border-white/10 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-base font-medium text-white">
              Nuevo Docente
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
              placeholder="jperez"
              value={formData.username}
              onChange={(v) => handleChange("username", v)}
              onBlur={() => handleBlur("username")}
              error={touched.username ? errors.username : undefined}
              disabled={isLoading}
            />

            {/* Nombre completo */}
            <MinimalInput
              label="Nombre Completo"
              placeholder="José Pérez García"
              value={formData.full_name}
              onChange={(v) => handleChange("full_name", v)}
              onBlur={() => handleBlur("full_name")}
              error={touched.full_name ? errors.full_name : undefined}
              disabled={isLoading}
            />

            {/* Email */}
            <MinimalInput
              label="Email"
              type="email"
              placeholder="jperez@unamad.edu.pe"
              value={formData.email}
              onChange={(v) => handleChange("email", v)}
              onBlur={() => handleBlur("email")}
              error={touched.email ? errors.email : undefined}
              disabled={isLoading}
            />

            {/* Contraseñas */}
            <div className="grid grid-cols-2 gap-3">
              <MinimalInput
                label="Contraseña"
                type="password"
                placeholder="••••••"
                value={formData.password}
                onChange={(v) => handleChange("password", v)}
                onBlur={() => handleBlur("password")}
                error={touched.password ? errors.password : undefined}
                disabled={isLoading}
              />

              <MinimalInput
                label="Confirmar"
                type="password"
                placeholder="••••••"
                value={formData.confirmPassword}
                onChange={(v) => handleChange("confirmPassword", v)}
                onBlur={() => handleBlur("confirmPassword")}
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                disabled={isLoading}
              />
            </div>

            {/* Carreras (checkboxes) */}
            <div className="space-y-2">
              <label className="block text-sm text-white/50">
                Carreras Asignadas
              </label>
              <div className="border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                {CARRERAS_DISPONIBLES.map((carrera) => {
                  const isSelected = formData.carreras.includes(carrera.id)
                  return (
                    <button
                      key={carrera.id}
                      type="button"
                      onClick={() => toggleCarrera(carrera.id)}
                      disabled={isLoading}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-left text-sm transition-colors",
                        "flex items-center justify-between",
                        "disabled:opacity-50",
                        isSelected
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <span className="truncate pr-2">{carrera.nombre}</span>
                      {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
              {touched.carreras && errors.carreras && (
                <p className="text-xs text-red-400">{errors.carreras}</p>
              )}
              {formData.carreras.length > 0 && (
                <p className="text-xs text-white/40">
                  {formData.carreras.length} carrera{formData.carreras.length !== 1 ? 's' : ''} seleccionada{formData.carreras.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

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
                  "Crear Docente"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
