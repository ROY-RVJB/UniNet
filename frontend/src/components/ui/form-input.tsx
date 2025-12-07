import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Check, AlertTriangle, Lock } from "lucide-react"

export interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  icon?: React.ReactNode
  showPasswordStrength?: boolean
  onChange?: (value: string) => void
}

// Calcular fortaleza de contraseña
const getPasswordStrength = (password: string): { level: number; label: string } => {
  if (!password) return { level: 0, label: '' }

  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { level: 1, label: 'Muy débil' }
  if (score === 2) return { level: 2, label: 'Débil' }
  if (score === 3) return { level: 3, label: 'Media' }
  if (score === 4) return { level: 4, label: 'Fuerte' }
  return { level: 5, label: 'Muy fuerte' }
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({
    className,
    type = "text",
    label,
    error,
    icon,
    showPasswordStrength = false,
    disabled,
    value,
    onChange,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)

    const isPassword = type === "password"
    const inputType = isPassword && showPassword ? "text" : type
    const hasValue = value && String(value).length > 0
    const hasError = !!error

    const passwordStrength = showPasswordStrength && isPassword && hasValue
      ? getPasswordStrength(String(value))
      : null

    // Determinar el icono de estado
    const getStateIcon = () => {
      if (disabled) return <Lock className="h-4 w-4 text-subtle" />
      if (hasError) return <AlertTriangle className="h-4 w-4 text-amber-500" />
      if (hasValue && !isFocused) return <Check className="h-4 w-4 text-status-online" />
      return icon
    }

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-medium uppercase tracking-wider text-subtle">
            {label}
          </label>
        )}

        <div className="relative">
          {/* Icono izquierdo */}
          {(icon || hasError || hasValue || disabled) && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {getStateIcon()}
            </div>
          )}

          <input
            type={inputType}
            ref={ref}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              // Base styles
              "flex h-12 w-full rounded-lg border bg-surface px-4 py-3 text-sm text-tech-text transition-all duration-200",
              "placeholder:text-subtle",
              "focus:outline-none",

              // Padding para iconos
              (icon || hasError || hasValue || disabled) && "pl-10",
              isPassword && "pr-10",

              // Estados
              !hasError && !disabled && [
                "border-border",
                "hover:border-subtle",
                "focus:border-tech-text focus:ring-1 focus:ring-tech-text/20",
              ],

              // Error state
              hasError && [
                "border-amber-500",
                "focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20",
              ],

              // Disabled state
              disabled && [
                "border-border",
                "bg-tech-hoverState",
                "text-subtle",
                "cursor-not-allowed opacity-60",
              ],

              className
            )}
            {...props}
          />

          {/* Toggle visibilidad contraseña */}
          {isPassword && !disabled && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-tech-text transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Barra de fortaleza de contraseña */}
        {passwordStrength && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    passwordStrength.level >= level
                      ? level <= 1
                        ? "bg-status-offline"
                        : level <= 2
                        ? "bg-amber-500"
                        : level <= 3
                        ? "bg-status-inUse"
                        : "bg-status-online"
                      : "bg-border"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-subtle">
              Fortaleza {passwordStrength.label.toLowerCase()}
            </p>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <p className="text-xs text-subtle flex items-center gap-1">
            <span>{error}</span>
          </p>
        )}
      </div>
    )
  }
)
FormInput.displayName = "FormInput"

export { FormInput }
