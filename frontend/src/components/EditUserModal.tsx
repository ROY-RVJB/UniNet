import * as React from "react"
import { cn } from "@/lib/utils"
import { X, Loader2, Eye, EyeOff } from "lucide-react"
import type { LDAPUser } from "@/types"

// ==========================================
// EditUserModal - Editar usuario existente
// ==========================================

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: EditUserFormData) => Promise<void>
  user: LDAPUser | null
}

export interface EditUserFormData {
  username: string
  fullName: string
  password?: string
  confirmPassword?: string
}

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
            "w-full px-3 py-2 text-sm text-white",
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

export function EditUserModal({ isOpen, onClose, onSubmit, user }: EditUserModalProps) {
  const [formData, setFormData] = React.useState<EditUserFormData>({
    username: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = React.useState<Partial<EditUserFormData>>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})

  // Cargar datos del usuario cuando se abre el modal
  React.useEffect(() => {
    if (isOpen && user) {
      setFormData({
        username: user.username,
        fullName: user.full_name || "",
        password: "",
        confirmPassword: "",
      })
      setErrors({})
      setTouched({})
      setIsLoading(false)
    }
  }, [isOpen, user])

  // Validaciones
  const validateField = (field: keyof EditUserFormData, value: string): string | undefined => {
    switch (field) {
      case "fullName":
        if (!value.trim()) return "Este campo es obligatorio"
        if (value.length < 2) return "Mínimo 2 caracteres"
        return undefined

      case "password":
        // Password es opcional en edición, pero si se llena debe tener min 6
        if (value && value.length < 6) return "Mínimo 6 caracteres"
        return undefined

      case "confirmPassword":
        if (formData.password && !value) return "Confirma la contraseña"
        if (value && value !== formData.password) return "Las contraseñas no coinciden"
        return undefined

      default:
        return undefined
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<EditUserFormData> = {}

    const fullNameError = validateField("fullName", formData.fullName)
    if (fullNameError) newErrors.fullName = fullNameError

    const passwordError = validateField("password", formData.password || "")
    if (passwordError) newErrors.password = passwordError

    const confirmError = validateField("confirmPassword", formData.confirmPassword || "")
    if (confirmError) newErrors.confirmPassword = confirmError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof EditUserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))

      // Re-validar confirmPassword si cambia password
      if (field === "password" && touched.confirmPassword) {
        const confirmError = validateField("confirmPassword", formData.confirmPassword || "")
        setErrors(prev => ({ ...prev, confirmPassword: confirmError }))
      }
    }
  }

  const handleBlur = (field: keyof EditUserFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field] || "")
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setTouched({
      fullName: true,
      password: true,
      confirmPassword: true,
    })

    if (!validateForm()) return

    setIsLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = React.useMemo(() => {
    const nameValid = formData.fullName.trim().length >= 2

    // Si hay password, debe tener confirmación válida
    if (formData.password) {
      return nameValid &&
        formData.password.length >= 6 &&
        formData.confirmPassword === formData.password
    }

    return nameValid
  }, [formData])

  if (!isOpen || !user) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 duration-150">
        <div className="bg-black border border-white/10 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-base font-medium text-white">
              Editar Usuario
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
            {/* Username - Read only */}
            <MinimalInput
              label="Usuario"
              value={formData.username}
              onChange={() => {}}
              readOnly
              disabled={isLoading}
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
            />

            {/* Separator */}
            <div className="pt-2">
              <p className="text-xs text-white/30">
                Dejar en blanco para mantener la contraseña actual
              </p>
            </div>

            {/* Contraseñas en grid */}
            <div className="grid grid-cols-2 gap-3">
              <MinimalInput
                label="Nueva contraseña"
                type="password"
                placeholder="••••••"
                value={formData.password || ""}
                onChange={(value) => handleChange("password", value)}
                onBlur={() => handleBlur("password")}
                error={touched.password ? errors.password : undefined}
                disabled={isLoading}
              />

              <MinimalInput
                label="Confirmar"
                type="password"
                placeholder="••••••"
                value={formData.confirmPassword || ""}
                onChange={(value) => handleChange("confirmPassword", value)}
                onBlur={() => handleBlur("confirmPassword")}
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                disabled={isLoading}
              />
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
                  "Guardar"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
