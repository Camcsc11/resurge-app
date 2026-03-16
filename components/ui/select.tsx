'use client'

import * as React from "react"
import { useState, useRef, useEffect } from "react"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

interface SelectContextType {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType>({
  open: false,
  setOpen: () => {},
})

function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false)
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className = '', children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext)
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      >
        {children}
        <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext)
  return <span className={value ? '' : 'text-muted-foreground'}>{value || placeholder}</span>
}

function SelectContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = React.useContext(SelectContext)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md ${className}`}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

function SelectItem({ value: itemValue, className = '', children, ...props }: SelectItemProps) {
  const { value, onValueChange, setOpen } = React.useContext(SelectContext)
  const isSelected = value === itemValue

  return (
    <div
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-accent' : ''} ${className}`}
      onClick={() => {
        onValueChange?.(itemValue)
        setOpen(false)
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
