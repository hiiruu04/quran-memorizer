import React, { createContext, useContext, useState, useCallback } from "react"
import { XCircle, CheckCircle, AlertCircle, X } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = { id, type, message }
    setToasts((prev) => [...prev, newToast])

    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }, [removeToast])

  const showSuccess = useCallback((message: string) => showToast("success", message), [showToast])
  const showError = useCallback((message: string) => showToast("error", message), [showToast])
  const showInfo = useCallback((message: string) => showToast("info", message), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const styles = {
    success: "bg-green-500 text-white border-green-600",
    error: "bg-red-500 text-white border-red-600",
    info: "bg-blue-500 text-white border-blue-600",
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />,
  }

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md animate-in slide-in-from-right-full ${styles[toast.type]}`}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
