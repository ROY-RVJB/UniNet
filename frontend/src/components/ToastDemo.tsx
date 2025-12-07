import { useToast } from "@/contexts/ToastContext"
import { Button } from "@/components/ui/button"
import { Check, Loader2, AlertTriangle } from "lucide-react"

export function ToastDemo() {
  const { showToast, hideToast } = useToast()

  const handleSuccess = () => {
    showToast("success", "Acción completada con éxito")
  }

  const handleLoading = () => {
    const id = showToast("loading", "Procesando solicitud...")
    // Simular que termina después de 3 segundos
    setTimeout(() => {
      hideToast(id)
      showToast("success", "Proceso completado")
    }, 3000)
  }

  const handleError = () => {
    showToast("error", "Error de conexión")
  }

  const handleAll = () => {
    showToast("success", "Acción completada con éxito")
    setTimeout(() => showToast("loading", "Procesando solicitud..."), 300)
    setTimeout(() => showToast("error", "Error de conexión"), 600)
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium uppercase tracking-wider text-subtle mb-4">
        Toast Notifications Demo
      </h3>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleSuccess}
          className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white"
        >
          <Check className="h-4 w-4 mr-2" />
          Toast Éxito
        </Button>
        <Button
          onClick={handleLoading}
          variant="outline"
          className="border-border text-tech-text hover:bg-tech-hoverState"
        >
          <Loader2 className="h-4 w-4 mr-2" />
          Toast Loading
        </Button>
        <Button
          onClick={handleError}
          variant="outline"
          className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Toast Error
        </Button>
        <Button
          onClick={handleAll}
          className="bg-tech-blue hover:bg-tech-blueDim text-white"
        >
          Mostrar Todos
        </Button>
      </div>
    </div>
  )
}
