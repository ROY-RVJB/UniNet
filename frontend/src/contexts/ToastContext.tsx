import * as React from "react"
import { ToastContainer } from "@/components/ui/toast"
import type { ToastProps, ToastType } from "@/components/ui/toast"

interface ToastContextValue {
  showToast: (type: ToastType, message: string, duration?: number) => string
  hideToast: (id: string) => void
  toasts: ToastProps[]
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

let toastIdCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const hideToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = React.useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = `toast-${++toastIdCounter}`
      const toast: ToastProps = { id, type, message, duration }

      setToasts((prev) => [...prev, toast])

      // Auto-dismiss para success y error (no para loading)
      if (type !== "loading") {
        const dismissTime = duration || (type === "success" ? 3000 : 5000)
        setTimeout(() => {
          hideToast(id)
        }, dismissTime)
      }

      return id
    },
    [hideToast]
  )

  const value = React.useMemo(
    () => ({ showToast, hideToast, toasts }),
    [showToast, hideToast, toasts]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
