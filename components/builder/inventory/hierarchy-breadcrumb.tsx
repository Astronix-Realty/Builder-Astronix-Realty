"use client"

import { ChevronRight, Home } from "lucide-react"

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
}

interface HierarchyBreadcrumbProps {
  items: BreadcrumbItem[]
  location?: { city?: string; state?: string }
}

export function HierarchyBreadcrumb({ items, location }: HierarchyBreadcrumbProps) {
  if (!items.length) return null

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-800 flex-wrap">
      <Home className="h-3.5 w-3.5 text-slate-400 shrink-0" />

      {items.map((item, idx) => {
        const IconComponent = item.icon
        return (
          <div key={item.label} className="flex items-center gap-1.5">
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 shrink-0" />}

            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline"
              >
                {IconComponent && <IconComponent className="h-3.5 w-3.5 inline mr-1" />}
                {item.label}
              </button>
            ) : (
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {IconComponent && <IconComponent className="h-3.5 w-3.5 inline mr-1" />}
                {item.label}
              </span>
            )}
          </div>
        )
      })}

      {location?.city && (
        <>
          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-1" />
          <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
            📍 {location.city}
            {location.state && `, ${location.state}`}
          </span>
        </>
      )}
    </div>
  )
}
