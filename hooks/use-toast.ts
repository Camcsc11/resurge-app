'use client'

import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastInput {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = 'default' }: ToastInput) => {
    const id = String(toastCount++)
    const newToast = { id, title, description, variant }
    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)

    return { id, dismiss: () => setToasts((prev) => prev.filter((t) => t.id !== id)) }
  }, [])

  return { toast, toasts }
}
