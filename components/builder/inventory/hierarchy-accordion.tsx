"use client"

import { ChevronDown, Building2, Layers, Building } from "lucide-react"
import { cn } from "@/lib/utils"

interface HierarchyAccordionProps {
  title: string
  count: number
  subCount?: string
  level: 'township' | 'project' | 'tower'
  isExpanded: boolean
  onToggle: () => void
  children?: React.ReactNode
  badge?: React.ReactNode
}

const levelStyles = {
  township: {
    container: "bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/50",
    header: "hover:bg-violet-100/50 dark:hover:bg-violet-900/30",
    title: "text-slate-900 dark:text-white",
    icon: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-100 dark:bg-violet-900/50",
    padding: "p-4",
  },
  project: {
    container: "bg-blue-50/30 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 ml-4",
    header: "hover:bg-blue-100/30 dark:hover:bg-blue-900/20",
    title: "text-slate-800 dark:text-slate-100",
    icon: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100/70 dark:bg-blue-900/40",
    padding: "p-3",
  },
  tower: {
    container: "bg-indigo-50/20 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/20 ml-8",
    header: "hover:bg-indigo-100/20 dark:hover:bg-indigo-900/20",
    title: "text-slate-700 dark:text-slate-200",
    icon: "text-indigo-600 dark:text-indigo-400",
    badge: "bg-indigo-100/50 dark:bg-indigo-900/30",
    padding: "p-2.5",
  },
}

const IconMap = {
  township: Layers,
  project: Building2,
  tower: Building,
}

export function HierarchyAccordion({
  title,
  count,
  subCount,
  level,
  isExpanded,
  onToggle,
  children,
  badge,
}: HierarchyAccordionProps) {
  const style = levelStyles[level]
  const Icon = IconMap[level]

  return (
    <div className={cn("rounded-lg border-l-4 transition-all", style.container, {
      'border-l-violet-500': level === 'township',
      'border-l-blue-500': level === 'project',
      'border-l-indigo-500': level === 'tower',
    })}>
      {/* Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between transition-colors rounded-t-lg",
          style.header,
          style.padding,
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded ? 'rotate-0' : '-rotate-90',
                style.icon,
              )}
            />
            <Icon className={cn("h-5 w-5", style.icon)} />
          </div>

          <div className="flex flex-col items-start min-w-0">
            <h3 className={cn(
              "font-bold text-sm truncate",
              style.title,
              { 'text-base': level === 'township', 'text-sm': level === 'project', 'text-xs': level === 'tower' }
            )}>
              {title}
            </h3>
            {subCount && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {subCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          <div className={cn(
            "px-2 py-1 rounded-md text-xs font-bold text-white whitespace-nowrap",
            {
              'bg-violet-600 dark:bg-violet-700': level === 'township',
              'bg-blue-600 dark:bg-blue-700': level === 'project',
              'bg-indigo-600 dark:bg-indigo-700': level === 'tower',
            }
          )}>
            {count}
          </div>
          {badge}
        </div>
      </button>

      {/* Content */}
      {isExpanded && children && (
        <div className={cn("border-t border-current border-opacity-10 space-y-2", style.padding)}>
          {children}
        </div>
      )}
    </div>
  )
}
