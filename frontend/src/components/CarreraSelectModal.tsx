import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { GraduationCap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CarreraAsignada } from '@/types/auth'

// ==========================================
// CarreraSelectModal - Selector post-login
// Solo aparece para docentes con múltiples carreras
// ==========================================

export function CarreraSelectModal() {
  const { user, needsCarreraSelection, selectCarrera } = useAuth()
  const [selectedCarrera, setSelectedCarrera] = useState<CarreraAsignada | null>(null)

  // No mostrar si no es necesario
  if (!needsCarreraSelection || !user || user.carreras.length === 0) {
    return null
  }

  const handleSelect = (carrera: CarreraAsignada) => {
    setSelectedCarrera(carrera)
  }

  const handleConfirm = () => {
    if (selectedCarrera) {
      selectCarrera(selectedCarrera)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-150" />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 duration-150">
        <div className="bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white/70" />
            </div>
            <h2 className="text-lg font-medium text-white">
              Selecciona tu carrera
            </h2>
            <p className="text-sm text-white/40 mt-1">
              Tienes acceso a {user.carreras.length} carreras
            </p>
          </div>

          {/* Lista de carreras */}
          <div className="px-4 pb-4">
            <div className="space-y-2">
              {user.carreras.map((carrera) => {
                const isSelected = selectedCarrera?.id === carrera.id
                return (
                  <button
                    key={carrera.id}
                    onClick={() => handleSelect(carrera)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-left transition-all duration-200",
                      "flex items-center justify-between group",
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

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10">
            <button
              onClick={handleConfirm}
              disabled={!selectedCarrera}
              className={cn(
                "w-full py-3 rounded-xl text-sm font-medium transition-all duration-200",
                selectedCarrera
                  ? "bg-white text-black hover:bg-white/90 active:scale-[0.98]"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              )}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
