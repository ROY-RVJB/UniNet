import * as React from "react"
import { cn } from "@/lib/utils"
import { X, Loader2, Eye, EyeOff, Check } from "lucide-react"
import type { DocenteFormData, DocenteSistema } from "./DocentesTable"

// ==========================================
// EditDocenteModal - Editar Docente del Sistema
// Estilo minimalista consistente
// ==========================================

interface EditDocenteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<DocenteFormData>) => Promise<void>
  docente: DocenteSistema | null
}

interface FormErrors {
  full_name?: string
  email?: string
  password?: string
  confirmPassword?: string
  carreras?: string
}

// Lista de carreras disponibles (IDs LDAP oficiales UNAMAD)
const CARRERAS_DISPONIBLES = [
  { id: "5001", nombre: "Administración y Negocios Internacionales" },
  { id: "5002", nombre: "Contabilidad y Finanzas" },
  { id: "5003", nombre: "Derecho y Ciencias Políticas" },
  { id: "5004", nombre: "Ecoturismo" },
  { id: "5005", nombre: "Educación" },
  { id: "5006", nombre: "Enfermería" },
  { id: "5007", nombre: "Ingeniería Agroindustrial" },
  { id: "5008", nombre: "Ingeniería Ambiental" },
  { id: "5009", nombre: "Ingeniería Forestal y Medio Ambiente" },
  { id: "5010", nombre: "Ingeniería de Sistemas e Informática" },
  { id: "5011", nombre: "Medicina Veterinaria y Zootecnia" },
  { id: "5012", nombre: "Obstetricia" },
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
  readOnly,
  hint,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  error?: string
  disabled?: boolean
  readOnly?: boolean
  hint?: string
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
          readOnly={readOnly}
          className={cn(
            "docente-input w-full px-3 py-2 text-sm text-white select-text",
            "bg-transparent border rounded-lg",
            "placeholder:text-white/20",
            "focus:outline-none transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
             readOnly && "text-white/50 cursor-not-allowed bg-white/5",
            error
              ? "border-red-500/50 focus:border-red-500"
              : "border-white/10 focus:border-white/30"
          )}
        />
        {isPassword && !readOnly && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
       {hint && !error && (
        <p className="text-xs text-white/30">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}

export function EditDocenteModal({ isOpen, onClose, onSubmit, docente }: EditDocenteModalProps) {
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

  // Cargar datos al abrir
  React.useEffect(() => {
    if (isOpen && docente) {
      setFormData({
        username: docente.username,
        full_name: docente.full_name || "",
        email: docente.email || "",
        password: "",
        confirmPassword: "",
        carreras: docente.carreras.map(c => c.id),
      })
      setErrors({})
      setTouched({})
      setIsLoading(false)
    }
  }, [isOpen, docente])

  // Validaciones
  const validateField = (field: string, value: string | string[]): string | undefined => {
    switch (field) {
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
        // Opcional en edit
        if (value && value.length < 6) return "Mínimo 6 caracteres"
        return undefined

      case "confirmPassword":
        if (typeof value !== 'string') return undefined
        if (formData.password && !value) return "Confirmar contraseña"
        if (value && value !== formData.password) return "Las contraseñas no coinciden"
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
      
       if (field === "password" && touched.confirmPassword) {
        const confirmError = validateField("confirmPassword", formData.confirmPassword)
        setErrors(prev => ({ ...prev, confirmPassword: confirmError }))
      }
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
      full_name: true,
      email: true,
      password: true,
      confirmPassword: true,
      carreras: true,
    })

    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Solo enviar campos necesarios
      const payload: Partial<DocenteFormData> = {
        full_name: formData.full_name,
        email: formData.email,
        carreras: formData.carreras
      }
      
      if (formData.password) {
        payload.password = formData.password
      }

      await onSubmit(payload)
      onClose()
    } catch (error) {
      console.error("Error updating docente:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = React.useMemo(() => {
    const basicValid = 
      formData.full_name.trim().length >= 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      formData.carreras.length > 0

    if (formData.password) {
        return basicValid && 
            formData.password.length >= 6 && 
            formData.password === formData.confirmPassword
    }

    return basicValid
  }, [formData])

  if (!isOpen || !docente) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
      />

      {/* Estilos para override del autofill del navegador */}
      <style>{`
        .docente-input {
          caret-color: #ffffff !important;
        }
        .docente-input::placeholder {
          color: rgba(255, 255, 255, 0.2) !important;
          -webkit-text-fill-color: rgba(255, 255, 255, 0.2) !important;
        }
        .docente-input:-webkit-autofill,
        .docente-input:-webkit-autofill:hover,
        .docente-input:-webkit-autofill:focus,
        .docente-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #000000 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          background-color: #000000 !important;
          transition: background-color 9999s ease-in-out 0s, color 9999s ease-in-out 0s;
          color: #ffffff !important;
        }
        /* Scrollbar minimalista oscuro */
        .carreras-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .carreras-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .carreras-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }
        .carreras-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="bg-black border border-white/10 rounded-lg shadow-2xl overflow-hidden select-none">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-base font-medium text-white">
              Editar Docente
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
            {/* Usuario - ReadOnly */}
            <MinimalInput
              label="Usuario"
              value={formData.username}
              onChange={() => {}}
              readOnly
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

            <div className="pt-2">
              <p className="text-xs text-white/30">
                Dejar en blanco para mantener la contraseña actual
              </p>
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-2 gap-3">
              <MinimalInput
                label="Nueva Contraseña"
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
              <label className="flex items-center gap-2 text-sm text-white/50">
                Carreras Asignadas
                {formData.carreras.length > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                    {formData.carreras.length}
                  </span>
                )}
              </label>
              <div className="carreras-scroll border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
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
                    Guardando...
                  </span>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
