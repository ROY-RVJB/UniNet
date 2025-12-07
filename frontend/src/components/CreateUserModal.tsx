import * as React from "react"
import { cn } from "@/lib/utils"
import { FormInput } from "@/components/ui/form-input"
import { RadioCardGroup } from "@/components/ui/radio-card-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, User, UserCircle, Loader2, GraduationCap } from "lucide-react"

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

const GROUP_OPTIONS = [
  { value: "5000", label: "Alumnos" },
  { value: "6000", label: "Docentes" },
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
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] duration-200">
        <div className="bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-tech-text">
              Crear Usuario LDAP
            </h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 rounded-lg text-subtle hover:text-tech-text hover:bg-tech-hoverState transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Usuario */}
            <FormInput
              label="Usuario *"
              placeholder="juan.perez"
              icon={<User className="h-4 w-4 text-subtle" />}
              value={formData.username}
              onChange={(value) => handleChange("username", value)}
              onBlur={() => handleBlur("username")}
              error={touched.username ? errors.username : undefined}
              disabled={isLoading}
              autoComplete="off"
            />

            {/* Nombre completo */}
            <FormInput
              label="Nombre completo *"
              placeholder="Juan Pérez García"
              icon={<UserCircle className="h-4 w-4 text-subtle" />}
              value={formData.fullName}
              onChange={(value) => handleChange("fullName", value)}
              onBlur={() => handleBlur("fullName")}
              error={touched.fullName ? errors.fullName : undefined}
              disabled={isLoading}
              autoComplete="off"
            />

            {/* Contraseña */}
            <FormInput
              label="Contraseña *"
              type="password"
              placeholder="••••••••"
              showPasswordStrength
              value={formData.password}
              onChange={(value) => handleChange("password", value)}
              onBlur={() => handleBlur("password")}
              error={touched.password ? errors.password : undefined}
              disabled={isLoading}
              autoComplete="new-password"
            />

            {/* Confirmar contraseña */}
            <FormInput
              label="Confirmar contraseña *"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(value) => handleChange("confirmPassword", value)}
              onBlur={() => handleBlur("confirmPassword")}
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              disabled={isLoading}
              autoComplete="new-password"
            />

            {/* Grupo */}
            <RadioCardGroup
              label="Grupo *"
              options={GROUP_OPTIONS}
              value={formData.group}
              onChange={(value) => handleChange("group", value)}
              error={touched.group ? errors.group : undefined}
              disabled={isLoading}
            />

            {/* Carrera - Solo visible para Alumnos */}
            {formData.group === "5000" && (
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-subtle">
                  Carrera Profesional *
                </label>
                <Select
                  value={formData.carrera}
                  onValueChange={(value) => handleChange("carrera", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className={cn(
                    touched.carrera && errors.carrera && "border-status-offline"
                  )}>
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4 text-subtle" />
                      <SelectValue placeholder="Seleccionar carrera..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {CARRERA_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.carrera && errors.carrera && (
                  <p className="text-xs text-status-offline animate-in fade-in-0 slide-in-from-top-1 duration-200">
                    {errors.carrera}
                  </p>
                )}
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className={cn(
                  "flex-1 h-11 border-border text-tech-text",
                  "hover:bg-tech-hoverState hover:text-tech-text"
                )}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={cn(
                  "flex-1 h-11 font-semibold transition-all duration-200",
                  isFormValid && !isLoading
                    ? "bg-tech-text text-black hover:bg-tech-textDim"
                    : "bg-border text-subtle cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Usuario"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
