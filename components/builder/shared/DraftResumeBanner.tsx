"use client"

import { useEffect, useState } from "react"
import { History, ArrowRight, Trash2, Loader2, Clock } from "lucide-react"

interface DraftInfo {
  _id: string
  name: string
  type: string
  flowType: string
  lastSavedStep: number
  updatedAt: string
  details?: any // Full WizardState snapshot
}

interface DraftResumeBannerProps {
  flowType: "township" | "project" | "tower"
  draftId?: string
  onResume: (draftData: any, step: number) => void
  onDiscard: () => void
}

export function DraftResumeBanner({ flowType, draftId, onResume, onDiscard }: DraftResumeBannerProps) {
  const [draft, setDraft] = useState<DraftInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!draftId) return

    const fetchDraftInfo = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/properties/${draftId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.property && data.property.status === "draft") {
            setDraft(data.property)
          }
        }
      } catch (e) {
        // Draft might be gone — silently ignore
      } finally {
        setIsLoading(false)
      }
    }

    fetchDraftInfo()
  }, [draftId])

  const handleResume = async () => {
    if (!draft) return
    setIsResuming(true)
    try {
      // `draft` already has `.details` from the initial fetch — no second request needed.
      // details is the full WizardState snapshot saved by useAutoDraft.
      const wizardState = draft.details

      if (!wizardState) {
        console.warn("[DraftResumeBanner] draft.details is empty — cannot restore")
        return
      }

      onResume(wizardState, draft.lastSavedStep || 1)
    } catch (e) {
      console.error("Failed to resume draft:", e)
    } finally {
      setIsResuming(false)
    }
  }

  const handleDiscard = () => {
    setDismissed(true)
    onDiscard()
  }

  if (dismissed || isLoading || !draft) return null

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="mx-4 mt-4 mb-0 sm:mx-6 sm:mt-5 animate-in slide-in-from-top-3 duration-300">
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl px-5 py-4 shadow-sm shadow-amber-100">
        {/* Icon */}
        <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <History className="w-5 h-5 text-amber-600" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900">
            Unsaved draft found
          </p>
          <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1.5">
            <span className="font-semibold truncate">"{draft.name}"</span>
            <span className="shrink-0 flex items-center gap-1 text-amber-500">
              <Clock className="w-3 h-3" />
              {timeAgo(draft.updatedAt)}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDiscard}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-200 px-4 py-2 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Start Fresh
          </button>
          <button
            type="button"
            onClick={handleResume}
            disabled={isResuming}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-300 disabled:opacity-60"
          >
            {isResuming ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
            Resume Draft
          </button>
        </div>
      </div>
    </div>
  )
}
