import * as React from "react"
import { cn } from "@/lib/utils"
import { X, Loader2, Eye, EyeOff, Check, AlertCircle } from "lucide-react"

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: UserFormData) => Promise<void>
  carreraCode: string // Código LDAP de la carrera (5001-5012)
}

export interface UserFormData {
  codigo: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  username: string
  email: string
  dni: string
  password: string
  confirmPassword: string
  carrera: string // Código LDAP asignado dinámicamente según dashboard - no visible en UI
}

interface FormErrors {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  codigo?: string
  nombres?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  username?: string
  email?: string
  dni?: string
  password?: string
  confirmPassword?: string
  carrera?: string
}

// ==========================================
// CreateUserModal - Estilo Minimalista Vercel
// ==========================================

// Carrera se asigna automáticamente según dashboard activo (carreraCode prop)

// ==========================================
// Utilidades para generar username
// ==========================================

/**
 * Normaliza texto removiendo tildes y caracteres especiales
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-z]/g, '') // Solo letras
}

/**
 * Genera username desde nombres y apellidos
 * Formato: nombre.apellidopaterno
 */
function generateUsername(
  nombres: string,
  apellidoPaterno: string
): string {
  if (!nombres.trim() || !apellidoPaterno.trim()) return ""

  const nombre = normalizeText(nombres.split(' ')[0]) // Primer nombre
  const paterno = normalizeText(apellidoPaterno)

  return `${nombre}.${paterno}`
}

/**
 * Genera username con código como sufijo
 * Formato: nombre.apellidopaterno1234 (últimos 4 dígitos del código)
 */
function generateUsernameWithCode(
  nombres: string,
  apellidoPaterno: string,
  codigo: string
): string {
  if (!codigo.trim()) return generateUsername(nombres, apellidoPaterno)
  
  const baseUsername = generateUsername(nombres, apellidoPaterno)
  const codigoSuffix = codigo.slice(-4) // Últimos 4 dígitos
  
  return `${baseUsername}${codigoSuffix}`
}

/**
 * Simula verificación de disponibilidad de username
 * TODO: Conectar con backend real
 */
async function checkUsernameAvailability(username: string): Promise<boolean> {
  // Simulación de llamada API con delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Por ahora, simular que algunos usernames están ocupados
  const ocupados = ['juan.perez', 'maria.torres', 'jose.gomez']
  return !ocupados.includes(username)
}

// ==========================================
// Componentes UI
// ==========================================

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

export function CreateUserModal({ isOpen, onClose, onSubmit, carreraCode }: CreateUserModalProps) {
  const [formData, setFormData] = React.useState<UserFormData>({
    codigo: "",
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    username: "",
    email: "",
    dni: "",
    password: "",
    confirmPassword: "",
    carrera: carreraCode, // Usar código de carrera del dashboard activo
  })
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const [usernameStatus, setUsernameStatus] = React.useState<{
    checking: boolean
    available: boolean | null
    usedCode: boolean // Si usó código como sufijo
  }>({
    checking: false,
    available: null,
    usedCode: false,
  })
  const [usernameManuallyEdited, setUsernameManuallyEdited] = React.useState(false)

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) return // Solo actuar cuando se abre

    // Al abrir el modal, resetear con carrera ya asignada
    setFormData({
      codigo: "",
      nombres: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      username: "",
      email: "",
      dni: "",
      password: "",
      confirmPassword: "",
      carrera: carreraCode,
    })
    setErrors({})
    setTouched({})
    setIsLoading(false)
    setUsernameStatus({ checking: false, available: null, usedCode: false })
    setUsernameManuallyEdited(false)
  }, [isOpen, carreraCode])

  // Auto-generar username cuando cambian nombres o apellidos
  React.useEffect(() => {
    if (usernameManuallyEdited) return // No auto-generar si el usuario editó manualmente
    if (!formData.nombres.trim() || !formData.apellidoPaterno.trim()) return

    const checkAndGenerate = async () => {
      // Generar username base
      const baseUsername = generateUsername(formData.nombres, formData.apellidoPaterno)
      
      setUsernameStatus(prev => ({ ...prev, checking: true }))
      
      // Verificar disponibilidad
      const available = await checkUsernameAvailability(baseUsername)
      
      if (available) {
        // Username disponible
        setFormData(prev => ({
          ...prev,
          username: baseUsername,
          email: `${baseUsername}@universidad.edu.pe`
        }))
        setUsernameStatus({ checking: false, available: true, usedCode: false })
      } else if (formData.codigo.trim()) {
        // Username ocupado, intentar con código
        const usernameWithCode = generateUsernameWithCode(
          formData.nombres,
          formData.apellidoPaterno,
          formData.codigo
        )
        const availableWithCode = await checkUsernameAvailability(usernameWithCode)
        
        setFormData(prev => ({
          ...prev,
          username: usernameWithCode,
          email: `${usernameWithCode}@universidad.edu.pe`
        }))
        setUsernameStatus({ 
          checking: false, 
          available: availableWithCode, 
          usedCode: true 
        })
      } else {
        // Username ocupado y no hay código para usar
        setFormData(prev => ({
          ...prev,
          username: baseUsername,
          email: `${baseUsername}@universidad.edu.pe`
        }))
        setUsernameStatus({ checking: false, available: false, usedCode: false })
      }
    }

    checkAndGenerate()
  }, [formData.nombres, formData.apellidoPaterno, formData.codigo, usernameManuallyEdited])

  // Validaciones
  const validateField = (field: keyof UserFormData, value: string): string | undefined => {
    switch (field) {
      case "codigo":
        if (!value.trim()) return "Este campo es obligatorio"
        if (value.length < 8) return "Mínimo 8 caracteres"
        if (!/^[0-9]+$/.test(value)) return "Solo números"
        return undefined

      case "nombres":
        if (!value.trim()) return "Este campo es obligatorio"
        if (value.length < 2) return "Mínimo 2 caracteres"
        return undefined

      case "apellidoPaterno":
        if (!value.trim()) return "Este campo es obligatorio"
        if (value.length < 2) return "Mínimo 2 caracteres"
        return undefined

      case "apellidoMaterno":
        if (!value.trim()) return "Este campo es obligatorio"
        if (value.length < 2) return "Mínimo 2 caracteres"
        return undefined

      case "username":
        if (!value.trim()) return "Este campo es obligatorio"
        if (value.length < 3) return "Mínimo 3 caracteres"
        if (!/^[a-z0-9._-]+$/.test(value)) return "Solo letras minúsculas, números, puntos, guiones"
        if (usernameStatus.available === false) return "Este usuario ya existe"
        return undefined

      case "dni":
        if (!value.trim()) return "Este campo es obligatorio"
        if (value.length !== 8) return "El DNI debe tener 8 dígitos"
        if (!/^[0-9]+$/.test(value)) return "Solo números"
        return undefined

      case "password":
        if (!value) return "Este campo es obligatorio"
        if (value.length < 6) return "Mínimo 6 caracteres"
        return undefined

      case "confirmPassword":
        if (!value) return "Este campo es obligatorio"
        if (value !== formData.password) return "Las contraseñas no coinciden"
        return undefined

      // carrera ya no se valida porque se asigna automáticamente
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
      
      // Si cambia username manualmente, actualizar email
      if (field === "username") {
        newData.email = `${value}@universidad.edu.pe`
        setUsernameManuallyEdited(true)
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
      codigo: true,
      nombres: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      username: true,
      dni: true,
      password: true,
      confirmPassword: true,
      // carrera no se marca porque ya está asignada automáticamente
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
    return (
      formData.codigo.trim().length >= 8 &&
      formData.nombres.trim().length >= 2 &&
      formData.apellidoPaterno.trim().length >= 2 &&
      formData.apellidoMaterno.trim().length >= 2 &&
      formData.username.trim().length >= 3 &&
      formData.dni.length === 8 &&
      formData.password.length >= 6 &&
      formData.confirmPassword === formData.password &&
      // carrera siempre es "5010", no necesita validación
      usernameStatus.available !== false &&
      !usernameStatus.checking
    )
  }, [formData, usernameStatus])

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
              Nuevo Alumno
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
            {/* Código de estudiante */}
            <MinimalInput
              label="Código de Estudiante"
              placeholder="2024010123"
              value={formData.codigo}
              onChange={(value) => handleChange("codigo", value)}
              onBlur={() => handleBlur("codigo")}
              error={touched.codigo ? errors.codigo : undefined}
              disabled={isLoading}
              autoComplete="off"
            />

            {/* Nombres */}
            <MinimalInput
              label="Nombre(s)"
              placeholder="Juan Carlos"
              value={formData.nombres}
              onChange={(value) => handleChange("nombres", value)}
              onBlur={() => handleBlur("nombres")}
              error={touched.nombres ? errors.nombres : undefined}
              disabled={isLoading}
              autoComplete="off"
            />

            {/* Apellidos en grid */}
            <div className="grid grid-cols-2 gap-3">
              <MinimalInput
                label="Apellido Paterno"
                placeholder="Pérez"
                value={formData.apellidoPaterno}
                onChange={(value) => handleChange("apellidoPaterno", value)}
                onBlur={() => handleBlur("apellidoPaterno")}
                error={touched.apellidoPaterno ? errors.apellidoPaterno : undefined}
                disabled={isLoading}
                autoComplete="off"
              />

              <MinimalInput
                label="Apellido Materno"
                placeholder="García"
                value={formData.apellidoMaterno}
                onChange={(value) => handleChange("apellidoMaterno", value)}
                onBlur={() => handleBlur("apellidoMaterno")}
                error={touched.apellidoMaterno ? errors.apellidoMaterno : undefined}
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            {/* Username (Auto-generado) */}
            <div className="space-y-1.5">
              <label className="block text-sm text-white/50">
                Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  onBlur={() => handleBlur("username")}
                  placeholder="Generando..."
                  disabled={isLoading || usernameStatus.checking}
                  className={cn(
                    "w-full px-3 py-2 pr-10 text-sm text-white",
                    "bg-transparent border rounded-lg",
                    "placeholder:text-white/20",
                    "focus:outline-none transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    errors.username
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 focus:border-white/30"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus.checking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white/30" />
                  ) : usernameStatus.available === true ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : usernameStatus.available === false ? (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  ) : null}
                </div>
              </div>
              {touched.username && errors.username && (
                <p className="text-xs text-red-400">{errors.username}</p>
              )}
              {usernameStatus.usedCode && (
                <p className="text-xs text-yellow-400">
                  ℹ️ Se agregó código porque el usuario base ya existe
                </p>
              )}
            </div>

            {/* DNI */}
            <MinimalInput
              label="DNI"
              placeholder="72345678"
              value={formData.dni}
              onChange={(value) => handleChange("dni", value)}
              onBlur={() => handleBlur("dni")}
              error={touched.dni ? errors.dni : undefined}
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

            {/* Carrera asignada automáticamente a 5010 (Ingeniería de Sistemas) - no visible */}

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
                  "Crear Alumno"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
