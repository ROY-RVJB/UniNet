import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { GraduationCap, ChevronRight, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CarreraAsignada } from '@/types/auth'

// ==========================================
// CarreraSelectModal - Selector post-login
// Solo aparece para docentes con múltiples carreras
// ==========================================

type ModalState = 'selecting' | 'confirming' | 'success' | 'closing'

export function CarreraSelectModal() {
  const { user, needsCarreraSelection, selectCarrera } = useAuth()
  const [selectedCarrera, setSelectedCarrera] = useState<CarreraAsignada | null>(null)
  const [modalState, setModalState] = useState<ModalState>('selecting')
  const [shouldRender, setShouldRender] = useState(false)

  // Controlar el render con animación de entrada
  useEffect(() => {
    if (needsCarreraSelection && user && user.carreras.length > 0) {
      setShouldRender(true)
      setModalState('selecting')
    }
  }, [needsCarreraSelection, user])

  // No mostrar si no es necesario
  if (!shouldRender || !user || user.carreras.length === 0) {
    return null
  }

  const handleSelect = (carrera: CarreraAsignada) => {
    if (modalState === 'selecting') {
      setSelectedCarrera(carrera)
    }
  }

  const handleConfirm = () => {
    if (selectedCarrera && modalState === 'selecting') {
      // Fase 1: Confirming (botón cambia)
      setModalState('confirming')

      // Fase 2: Success (mostrar check)
      setTimeout(() => {
        setModalState('success')
      }, 400)

      // Fase 3: Closing (desvanecer)
      setTimeout(() => {
        setModalState('closing')
      }, 1000)

      // Fase 4: Cerrar y navegar
      setTimeout(() => {
        selectCarrera(selectedCarrera)
        setShouldRender(false)
        setModalState('selecting')
      }, 1400)
    }
  }

  const isClosing = modalState === 'closing'
  const isSuccess = modalState === 'success' || modalState === 'closing'
  const isProcessing = modalState !== 'selecting'

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300",
          isClosing ? "opacity-0" : "opacity-100 animate-in fade-in-0"
        )}
      />

      {/* Modal */}
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
          isClosing
            ? "opacity-0 scale-95"
            : "opacity-100 scale-100 animate-in fade-in-0 zoom-in-95"
        )}
      >
        <div className="bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header - cambia en estado de éxito */}
          <div className="px-6 pt-6 pb-4 text-center">
            <div
              className={cn(
                "w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-500",
                isSuccess
                  ? "bg-emerald-500/20 scale-110"
                  : "bg-white/5"
              )}
            >
              {isSuccess ? (
                <Check className="w-6 h-6 text-emerald-400 animate-in zoom-in-50 duration-300" />
              ) : (
                <GraduationCap className="w-6 h-6 text-white/70" />
              )}
            </div>
            <h2
              className={cn(
                "text-lg font-medium transition-all duration-300",
                isSuccess ? "text-emerald-400" : "text-white"
              )}
            >
              {isSuccess ? "¡Listo!" : "Selecciona tu carrera"}
            </h2>
            <p className="text-sm text-white/40 mt-1 transition-all duration-300">
              {isSuccess
                ? selectedCarrera?.nombre
                : `Tienes acceso a ${user.carreras.length} carreras`
              }
            </p>
          </div>

          {/* Lista de carreras - se oculta en éxito */}
          <div
            className={cn(
              "px-4 pb-4 transition-all duration-300",
              isSuccess ? "max-h-0 opacity-0 pb-0 overflow-hidden" : "max-h-[300px] opacity-100 overflow-y-auto"
            )}
          >
            <div className="space-y-2 pr-1">
              {user.carreras.map((carrera) => {
                const isSelected = selectedCarrera?.id === carrera.id
                return (
                  <button
                    key={carrera.id}
                    onClick={() => handleSelect(carrera)}
                    disabled={isProcessing}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-left transition-all duration-200",
                      "flex items-center justify-between group",
                      "disabled:pointer-events-none",
                      isSelected
                        ? "bg-white text-black"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <span className="text-sm font-medium truncate pr-2">
                      {carrera.nombre}
                    </span>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-transform",
                        isSelected ? "text-black" : "text-white/30 group-hover:text-white/50",
                        isSelected && "translate-x-1"
                      )}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer - botón cambia en estados */}
          <div
            className={cn(
              "px-6 py-4 border-t border-white/10 transition-all duration-300",
              isSuccess && "border-transparent"
            )}
          >
            <button
              onClick={handleConfirm}
              disabled={!selectedCarrera || isProcessing}
              className={cn(
                "w-full py-3 rounded-xl text-sm font-medium transition-all duration-300",
                "flex items-center justify-center gap-2",
                isSuccess
                  ? "bg-emerald-500/20 text-emerald-400 cursor-default"
                  : selectedCarrera && !isProcessing
                    ? "bg-white text-black hover:bg-white/90 active:scale-[0.98]"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
              )}
            >
              {modalState === 'confirming' && (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Preparando...
                </>
              )}
              {isSuccess && (
                <>
                  <Sparkles className="w-4 h-4" />
                  Ingresando
                </>
              )}
              {modalState === 'selecting' && "Continuar"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
