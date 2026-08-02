"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: number
  name: string
  description: string
}

interface ProgressBarProps {
  steps: Step[]
  currentStep: number
}

export function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <nav aria-label="Progress" className="w-full py-2 sm:py-3 px-1">
      <div className="relative flex items-center justify-between w-full">

        {/* ─── CONNECTOR TRACK ─── */}
        <div className="absolute top-[18px] sm:top-[20px] left-0 w-full pointer-events-none px-0">
          {/* Gray background track */}
          <div className="h-[3px] w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
          {/* Animated colored fill */}
          <div
            className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-[#1A3C8C] via-blue-500 to-blue-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(37,99,235,0.5)]"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>

        {/* ─── STEP NODES ─── */}
        {steps.map((step) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id

          return (
            <div key={step.id} className="relative flex flex-col items-center z-10 min-w-0">

              {/* Circle */}
              <div
                className={cn(
                  // Base
                  "relative flex items-center justify-center rounded-full transition-all duration-300 border-2 font-bold select-none",
                  // Size — scales with screen
                  "w-9 h-9 sm:w-10 sm:h-10 2xl:w-12 2xl:h-12",
                  // State colors
                  isCompleted
                    ? "bg-[#1A3C8C] dark:bg-blue-600 border-[#1A3C8C] dark:border-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : isActive
                    ? "bg-white dark:bg-slate-900 border-[#1A3C8C] dark:border-blue-500 text-[#1A3C8C] dark:text-blue-400 shadow-[0_0_0_4px_rgba(26,60,140,0.15)] dark:shadow-[0_0_0_4px_rgba(26,60,140,0.3)] scale-110"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5" strokeWidth={3} />
                ) : (
                  <span className="text-[11px] sm:text-xs 2xl:text-sm font-black">{step.id}</span>
                )}

                {/* Active pulse ring */}
                {isActive && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-[#1A3C8C]/20 dark:bg-blue-400/20 pointer-events-none" />
                )}
              </div>

              {/* Label — always visible on small screens (compact), full on md+ */}
              <div
                className={cn(
                  "mt-1.5 text-center transition-all duration-300 leading-tight",
                  // Sizing
                  "max-w-[50px] sm:max-w-[80px] 2xl:max-w-[100px]",
                  isActive || isCompleted ? "opacity-100" : "opacity-40"
                )}
              >
                {/* Step name — visible at all sizes */}
                <span
                  className={cn(
                    "block truncate font-bold",
                    // Responsive text size
                    "text-[9px] sm:text-[10px] 2xl:text-xs",
                    isActive
                      ? "text-[#1A3C8C] dark:text-blue-400"
                      : isCompleted
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-400"
                  )}
                >
                  {step.name}
                </span>

                {/* Description — only on md+ */}
                {isActive && (
                  <span className="hidden sm:block text-[8px] 2xl:text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
