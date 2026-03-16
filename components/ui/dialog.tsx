'use client'

import * as React from "react"
import { useEffect, useCallback } from "react"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onOpenChange?.(false)
  }, [onOpenChange])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, handleEscape])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange?.(false)} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}

function DialogContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg ${className}`}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className}`} {...props} />
}

function DialogTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
}

function DialogFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className}`} {...props} />
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter }
