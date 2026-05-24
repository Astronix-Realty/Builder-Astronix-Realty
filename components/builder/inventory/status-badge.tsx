"use client"

import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"

interface StatusBadgeProps {
  units: number
  subText?: string
  isExpanded?: boolean
  onClick?: () => void
  variant?: 'township' | 'project' | 'tower'
}

const variantStyles = {
  township: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-800",
  project: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  tower: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800",
}

export function StatusBadge({
  units,
  subText,
  isExpanded = false,
  onClick,
  variant = 'township'
}: StatusBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${variantStyles[variant]} hover:scale-105`}
    >
      {isExpanded !== undefined && (
        <ChevronDown
          className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
        />
      )}
      <span>{units} Units</span>
      {subText && <span className="text-[10px] font-semibold opacity-75">{subText}</span>}
    </button>
  )
}
