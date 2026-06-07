"use client"

import { Suspense } from "react"
import TeamPanelContent from "./team-panel-content"

export default function TeamPanelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">Loading Team Panel...</p>
        </div>
      </div>
    }>
      <TeamPanelContent />
    </Suspense>
  )
}
