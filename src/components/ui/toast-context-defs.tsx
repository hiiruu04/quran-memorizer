import { createContext } from "react"

export type ToastType = "success" | "error" | "info"

export interface Toast {
  id: string
  type: ToastType
  message: string
}

export interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)
