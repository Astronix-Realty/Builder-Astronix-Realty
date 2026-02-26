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
  // Calculate progress percentage for the continuous line
  // (currentStep - 1) / (totalSteps - 1) gives us 0%, 33%, 66%, 100% etc.
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <nav aria-label="Progress" className="w-full py-4 px-1">
      <div className="relative flex items-center justify-between w-full max-w-4xl mx-auto">

        {/* --- CONNECTING LINES --- */}
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 px-1">
          {/* 1. Gray Background Track */}
          <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />

          {/* 2. Animated Colored Fill */}
          <div
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>

        {/* --- STEP CIRCLES --- */}
        {steps.map((step) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id

          return (
            <div key={step.id} className="relative flex flex-col items-center group z-10">

              {/* Circle Node */}
              <div
                className={cn(
                  "relative flex items-center justify-center rounded-full transition-all duration-300 border-4",
                  // Sizing
                  "w-8 h-8 md:w-10 md:h-10",
                  // Colors & States
                  isCompleted
                    ? "bg-blue-600 border-blue-600 text-white scale-100"
                    : isActive
                      ? "bg-background border-blue-600 text-blue-600 scale-110 shadow-[0_0_0_4px_rgba(37,99,235,0.2)]"
                      : "bg-background border-slate-200 dark:border-slate-700 text-slate-400"
                )}
              >
                {/* Icon / Number */}
                <span className="flex items-center justify-center">
                  {isCompleted ? (
                    <Check className="h-4 w-4 md:h-5 md:w-5 animate-in zoom-in duration-300" strokeWidth={3} />
                  ) : (
                    <span className="text-xs md:text-sm font-bold">{step.id}</span>
                  )}
                </span>
              </div>

              {/* Text Label (Hidden on Mobile to keep UI clean, visible on Desktop) */}
              <div
                className={cn(
                  "absolute top-12 w-32 text-center hidden md:flex flex-col gap-0.5 transition-opacity duration-300",
                  isActive || isCompleted ? "opacity-100" : "opacity-50 group-hover:opacity-100"
                )}
              >
                <span className={cn(
                  "text-sm font-bold",
                  isActive ? "text-blue-600" : "text-foreground"
                )}>
                  {step.name}
                </span>

                {isActive && (
                  <span className="text-[10px] text-muted-foreground font-medium leading-tight">
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
