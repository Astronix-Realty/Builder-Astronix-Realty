"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp } from "lucide-react"

export type SectionId = string

export interface CollapsibleSectionProps {
  id: SectionId
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  openIds: SectionId[]
  setOpenIds: React.Dispatch<React.SetStateAction<SectionId[]>>
  children: React.ReactNode
  variant?: "default" | "compact"
}

export function CollapsibleSection({
  id,
  title,
  description,
  icon: Icon,
  badge,
  openIds,
  setOpenIds,
  children,
  variant = "default",
}: CollapsibleSectionProps) {
  const isOpen = openIds.includes(id)

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden mb-3">
        <button
          type="button"
          onClick={() =>
            setOpenIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-white text-xs tracking-tight">
                  {title}
                </span>
                {badge && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold uppercase">
                    {badge}
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          )}
        </button>
        {isOpen && (
          <div className="px-4 pb-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() =>
          setOpenIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
          )
        }
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:bg-slate-800/50 transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#1A3C8C] dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-white dark:text-blue-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {title}
              </span>
              {badge && (
                <Badge className="bg-[#2BB673]/10 dark:bg-emerald-900/20 text-[#2BB673] dark:text-emerald-400 border-0 text-[10px] font-bold">
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {description}
              </p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-slate-800">
          {children}
        </div>
      )}
    </div>
  )
}

export function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && (
        <p className="text-[11px] text-gray-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  )
}

export function FormGrid({
  cols = 2,
  children,
}: {
  cols?: 1 | 2 | 3
  children: React.ReactNode
}) {
  return (
    <div
      className={`grid gap-4 ${
        cols === 1
          ? "grid-cols-1"
          : cols === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2"
      }`}
    >
      {children}
    </div>
  )
}

export function FormSectionTitle({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between pb-1 mb-2 border-b border-gray-100 dark:border-slate-800">
      <span className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
        {title}
      </span>
      {action && <div>{action}</div>}
    </div>
  )
}
