import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, Loader2, AlertTriangle, X } from "lucide-react"

export type ToastType = "success" | "loading" | "error"

export interface ToastProps {
  id: string
  type: ToastType
  message: string
  duration?: number
  onClose?: (id: string) => void
}

const toastStyles: Record<ToastType, { container: string; icon: React.ReactNode }> = {
  success: {
    container: "bg-[#2a2a2a] text-white",
    icon: <Check className="h-4 w-4" />,
  },
  loading: {
    container: "bg-[#e0e0e0] text-[#666666] border border-[#cccccc]",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
  error: {
    container: "bg-[#f5f5f5] text-[#333333] border border-[#dddddd]",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
}

export function Toast({ id, type, message, onClose }: ToastProps) {
  const style = toastStyles[type]

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg",
        "animate-in slide-in-from-top-2 fade-in-0 duration-300",
        "min-w-[200px] max-w-[400px]",
        style.container
      )}
    >
      <span className="flex-shrink-0">{style.icon}</span>
      <span className="text-sm font-medium flex-1">{message}</span>
      {type !== "loading" && onClose && (
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 p-0.5 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// Toast Container - donde se renderizan los toasts
export function ToastContainer({ toasts, onClose }: { toasts: ToastProps[]; onClose: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  )
}
