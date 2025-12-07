import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, Circle } from "lucide-react"

export interface RadioCardOption {
  value: string
  label: string
  description?: string
}

export interface RadioCardGroupProps {
  label?: string
  options: RadioCardOption[]
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
}

const RadioCardGroup = React.forwardRef<HTMLDivElement, RadioCardGroupProps>(
  ({ label, options, value, onChange, error, disabled }, ref) => {
    return (
      <div ref={ref} className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-medium uppercase tracking-wider text-subtle">
            {label}
          </label>
        )}

        <div className="flex gap-3">
          {options.map((option) => {
            const isSelected = value === option.value

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => onChange?.(option.value)}
                className={cn(
                  // Base styles
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200",
                  "text-sm font-medium",

                  // Estados
                  !isSelected && !disabled && [
                    "border-border",
                    "bg-transparent",
                    "text-subtle",
                    "hover:border-subtle hover:text-tech-text",
                  ],

                  // Selected state
                  isSelected && !disabled && [
                    "border-tech-text",
                    "bg-tech-text",
                    "text-black",
                  ],

                  // Disabled state
                  disabled && [
                    "border-border",
                    "bg-tech-hoverState",
                    "text-subtle",
                    "cursor-not-allowed opacity-60",
                  ],

                  // Error state
                  error && !isSelected && "border-amber-500/50"
                )}
              >
                {isSelected ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>

        {/* Mensaje de error */}
        {error && (
          <p className="text-xs text-amber-500">{error}</p>
        )}
      </div>
    )
  }
)
RadioCardGroup.displayName = "RadioCardGroup"

export { RadioCardGroup }
