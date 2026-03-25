"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export type DraftIds = {
  townshipId?: string
  projectId?: string
  towerId?: string
}

export type AutoDraftState = {
  draftIds: DraftIds
  isSaving: boolean
  lastSaved: Date | null
  draftError: string | null
  saveNow: () => Promise<void>
  clearDraft: () => void
}

const STORAGE_KEY_PREFIX = "astronix_draft"

function getDraftStorageKey(flowType: string, entity: string) {
  return `${STORAGE_KEY_PREFIX}_${flowType}_${entity}_id`
}

function loadDraftIds(flowType: string): DraftIds {
  if (typeof window === "undefined") return {}
  return {
    townshipId: localStorage.getItem(getDraftStorageKey(flowType, "township")) ?? undefined,
    projectId:  localStorage.getItem(getDraftStorageKey(flowType, "project")) ?? undefined,
    towerId:    localStorage.getItem(getDraftStorageKey(flowType, "tower")) ?? undefined,
  }
}

function saveDraftIdsToStorage(flowType: string, ids: DraftIds) {
  if (typeof window === "undefined") return
  if (ids.townshipId) localStorage.setItem(getDraftStorageKey(flowType, "township"), ids.townshipId)
  if (ids.projectId)  localStorage.setItem(getDraftStorageKey(flowType, "project"), ids.projectId)
  if (ids.towerId)    localStorage.setItem(getDraftStorageKey(flowType, "tower"), ids.towerId)
}

function clearDraftIdsFromStorage(flowType: string) {
  if (typeof window === "undefined") return
  localStorage.removeItem(getDraftStorageKey(flowType, "township"))
  localStorage.removeItem(getDraftStorageKey(flowType, "project"))
  localStorage.removeItem(getDraftStorageKey(flowType, "tower"))
}

interface UseAutoDraftOptions {
  flowType: "township" | "project" | "tower"
  currentStep: number
  state: any // The full WizardState
  debounceMs?: number
  enabled?: boolean
}

export function useAutoDraft({
  flowType,
  currentStep,
  state,
  debounceMs = 10000,
  enabled = true,
}: UseAutoDraftOptions): AutoDraftState {
  const [draftIds, setDraftIds] = useState<DraftIds>(() => loadDraftIds(flowType))
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftIdsRef = useRef<DraftIds>(draftIds)
  draftIdsRef.current = draftIds

  // ── Single entity save helper ──────────────────────────────────────────────
  const saveEntity = useCallback(async (
    entityType: "township" | "project" | "tower",
    existingId: string | undefined,
    payload: {
      name: string
      location?: { city?: string; state?: string }
      details: any
      parentId?: string | null
    }
  ): Promise<string> => {
    const safeName = payload.name?.trim() || `Untitled ${entityType}`

    if (existingId) {
      // PATCH — lightweight auto-save
      const res = await fetch(`/api/properties/${existingId}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: safeName,
          location: payload.location,
          details: payload.details,
          lastSavedStep: currentStep,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Auto-save patch failed")
      }
      return existingId
    } else {
      // POST — create new draft
      const body: any = {
        type: entityType,
        flowType,
        name: safeName,
        location: payload.location,
        details: payload.details,
        status: "draft",
        lastSavedStep: currentStep,
        ...(payload.parentId ? { parentId: payload.parentId } : {}),
      }
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || err.error || "Failed to create draft")
      }
      const data = await res.json()
      return data.property._id as string
    }
  }, [flowType, currentStep])

  // ── Core save function ─────────────────────────────────────────────────────
  const performSave = useCallback(async () => {
    if (!enabled) return
    setIsSaving(true)
    setDraftError(null)

    try {
      const newIds: DraftIds = { ...draftIdsRef.current }

      if (flowType === "township") {
        const tp = state.township
        const townshipId = await saveEntity("township", newIds.townshipId, {
          name: tp?.name,
          location: { city: tp?.city, state: tp?.state },
          details: tp,
        })
        newIds.townshipId = townshipId

        // Save first project if exists
        const proj = state.projects?.[0]
        if (proj) {
          const projectId = await saveEntity("project", newIds.projectId, {
            name: proj.name,
            location: { city: proj.city, state: proj.state },
            details: proj,
            parentId: townshipId,
          })
          newIds.projectId = projectId

          // Save first tower of that project if exists
          const tower = state.towers?.find((t: any) => t.projectId === proj.id)
          if (tower) {
            const towerId = await saveEntity("tower", newIds.towerId, {
              name: tower.name,
              details: { ...tower, unitConfig: state.towerUnitConfigs?.find((c: any) => c.towerId === tower.id) },
              parentId: projectId,
            })
            newIds.towerId = towerId
          }
        }
      } else if (flowType === "project") {
        const proj = state.projects?.[0]
        if (proj) {
          const projectId = await saveEntity("project", newIds.projectId, {
            name: proj.name,
            location: { city: proj.city, state: proj.state },
            details: proj,
            parentId: null,
          })
          newIds.projectId = projectId

          const tower = state.towers?.[0]
          if (tower) {
            const towerId = await saveEntity("tower", newIds.towerId, {
              name: tower.name,
              details: { ...tower, unitConfig: state.towerUnitConfigs?.[0] },
              parentId: projectId,
            })
            newIds.towerId = towerId
          }
        }
      } else if (flowType === "tower") {
        const tower = state.towers?.[0]
        if (tower) {
          const towerId = await saveEntity("tower", newIds.towerId, {
            name: tower.name,
            details: { ...tower, unitConfig: state.towerUnitConfigs?.[0] },
            parentId: null,
          })
          newIds.towerId = towerId
        }
      }

      setDraftIds(newIds)
      saveDraftIdsToStorage(flowType, newIds)
      setLastSaved(new Date())
    } catch (err: any) {
      console.error("[useAutoDraft] Save failed:", err)
      setDraftError(err.message || "Auto-save failed")
    } finally {
      setIsSaving(false)
    }
  }, [flowType, state, saveEntity, enabled])

  // ── Debounced auto-save on state change ───────────────────────────────────
  useEffect(() => {
    if (!enabled) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(performSave, debounceMs)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, currentStep, enabled])

  const saveNow = useCallback(async () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    await performSave()
  }, [performSave])

  const clearDraft = useCallback(() => {
    clearDraftIdsFromStorage(flowType)
    setDraftIds({})
    setLastSaved(null)
    setDraftError(null)
  }, [flowType])

  return { draftIds, isSaving, lastSaved, draftError, saveNow, clearDraft }
}
