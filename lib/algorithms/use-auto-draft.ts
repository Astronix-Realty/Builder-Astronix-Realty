"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export type DraftIds = {
  townshipId?: string
  projectId?: string
  towerId?: string
  projectMap?: Record<string, string>
  towerMap?: Record<string, string>
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
  
  let projectMap = {}
  let towerMap = {}
  try {
     const pStr = localStorage.getItem(getDraftStorageKey(flowType, "projectMap"))
     if (pStr) projectMap = JSON.parse(pStr)
  } catch (e) {}

  try {
     const tStr = localStorage.getItem(getDraftStorageKey(flowType, "towerMap"))
     if (tStr) towerMap = JSON.parse(tStr)
  } catch (e) {}

  return {
    townshipId: localStorage.getItem(getDraftStorageKey(flowType, "township")) ?? undefined,
    projectId:  localStorage.getItem(getDraftStorageKey(flowType, "project")) ?? undefined,
    towerId:    localStorage.getItem(getDraftStorageKey(flowType, "tower")) ?? undefined,
    projectMap,
    towerMap,
  }
}

function saveDraftIdsToStorage(flowType: string, ids: DraftIds) {
  if (typeof window === "undefined") return
  if (ids.townshipId) localStorage.setItem(getDraftStorageKey(flowType, "township"), ids.townshipId)
  if (ids.projectId)  localStorage.setItem(getDraftStorageKey(flowType, "project"), ids.projectId)
  if (ids.towerId)    localStorage.setItem(getDraftStorageKey(flowType, "tower"), ids.towerId)
  if (ids.projectMap) localStorage.setItem(getDraftStorageKey(flowType, "projectMap"), JSON.stringify(ids.projectMap))
  if (ids.towerMap)   localStorage.setItem(getDraftStorageKey(flowType, "towerMap"), JSON.stringify(ids.towerMap))
}

function clearDraftIdsFromStorage(flowType: string) {
  if (typeof window === "undefined") return
  localStorage.removeItem(getDraftStorageKey(flowType, "township"))
  localStorage.removeItem(getDraftStorageKey(flowType, "project"))
  localStorage.removeItem(getDraftStorageKey(flowType, "tower"))
  localStorage.removeItem(getDraftStorageKey(flowType, "projectMap"))
  localStorage.removeItem(getDraftStorageKey(flowType, "towerMap"))
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

  // ── Sync from DB State if localStorage is empty ───────────────────────────
  useEffect(() => {
    if (state?._autoDraftIds) {
      const currentIds = draftIdsRef.current
      if (!currentIds.townshipId && !currentIds.projectId && !currentIds.towerId) {
        setDraftIds(state._autoDraftIds)
        draftIdsRef.current = state._autoDraftIds
        saveDraftIdsToStorage(flowType, state._autoDraftIds)
      }
    }
  }, [state, flowType])

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
    // Normalize location — always send an object, never undefined
    const safeLocation = payload.location ?? {}

    if (existingId) {
      // PATCH — lightweight auto-save
      const res = await fetch(`/api/properties/${existingId}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: safeName,
          location: safeLocation,
          details: payload.details ?? {},
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
      // flowType comes from the hook's closure — always defined via UseAutoDraftOptions.
      // Log a warning in development if it somehow slips through as undefined.
      if (process.env.NODE_ENV !== "production" && !flowType) {
        console.warn("[useAutoDraft] saveEntity called with no flowType — defaulting to entityType:", entityType)
      }
      const resolvedFlowType = flowType || entityType  // Fallback: entity's own type

      const body: Record<string, any> = {
        type: entityType,
        flowType: resolvedFlowType,
        name: safeName,
        location: safeLocation,
        details: payload.details ?? {},
        status: "draft",
        lastSavedStep: currentStep,
      }
      if (payload.parentId) body.parentId = payload.parentId

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

    // Guard: skip if there is truly nothing worth saving yet so we don't
    // POST blank drafts on the very first render before the user types anything.
    const hasAnythingToSave =
      (flowType === "township" && (state.township?.name?.trim() || state.projects?.length > 0)) ||
      (flowType === "project"  && state.projects?.[0]?.name?.trim()) ||
      (flowType === "tower"    && state.towers?.[0]?.name?.trim())
    if (!hasAnythingToSave) return

    setIsSaving(true)
    setDraftError(null)

    try {
      const newIds: DraftIds = { ...draftIdsRef.current }

      // ── IMPORTANT: always persist the FULL WizardState in `details`. ──────
      // DraftResumeBanner passes data.property.details directly to setState,
      // which expects the full WizardState shape. If we store only a flat
      // entity object (e.g. `tp`, `proj`, `tower`), the wizard state cannot
      // be restored correctly.
      const fullStateSnapshot = state

      if (flowType === "township") {
        const tp = state.township
        const townshipId = await saveEntity("township", newIds.townshipId, {
          name: tp?.name,
          location: { city: tp?.city, state: tp?.state },
          details: fullStateSnapshot,   // ← full WizardState
        })
        newIds.townshipId = townshipId

        const currentProjectMap = newIds.projectMap || {}
        const currentTowerMap = newIds.towerMap || {}

        // Save ALL projects (instead of just the first one)
        for (const proj of state.projects || []) {
          const projectLocation = {
            city: proj.city || tp?.city,
            state: proj.state || tp?.state
          }
          const mappedProjectId = currentProjectMap[proj.id];
          const projectId = await saveEntity("project", mappedProjectId, {
            name: proj.name,
            location: projectLocation,
            details: fullStateSnapshot, // ← full WizardState
            parentId: townshipId,
          })
          currentProjectMap[proj.id] = projectId

          // Save ALL towers of THIS project
          const projectTowers = (state.towers || []).filter((t: any) => t.projectId === proj.id)
          for (const tower of projectTowers) {
            const mappedTowerId = currentTowerMap[tower.id];
            const towerId = await saveEntity("tower", mappedTowerId, {
              name: tower.name,
              location: projectLocation, // Inherit from project (which inherited from township)
              details: fullStateSnapshot, // ← full WizardState
              parentId: projectId,
            })
            currentTowerMap[tower.id] = towerId
          }
        }
        newIds.projectMap = currentProjectMap
        newIds.towerMap = currentTowerMap
        
        // Also keep the root projectId reference for backwards-compatibility checking 
        // to appease `app/builder/page.tsx`'s draft check logic.
        if (state.projects?.[0] && currentProjectMap[state.projects[0].id]) {
           newIds.projectId = currentProjectMap[state.projects[0].id];
        }

      } else if (flowType === "project") {
        const currentProjectMap = newIds.projectMap || {}
        const currentTowerMap = newIds.towerMap || {}

        // Normally Project flow has 1 project, but handle any existing projects correctly
        for (const proj of state.projects || []) {
          const projectLocation = { city: proj.city, state: proj.state }
          const mappedProjectId = currentProjectMap[proj.id];
          const projectId = await saveEntity("project", mappedProjectId, {
            name: proj.name,
            location: projectLocation,
            details: fullStateSnapshot, // ← full WizardState
            parentId: null,
          })
          currentProjectMap[proj.id] = projectId

          // Save ALL towers ofTHIS project
          const projectTowers = (state.towers || []).filter((t: any) => t.projectId === proj.id)
          for (const tower of projectTowers) {
            const mappedTowerId = currentTowerMap[tower.id]
            const towerId = await saveEntity("tower", mappedTowerId, {
              name: tower.name,
              location: projectLocation, // Inherit from project
              details: fullStateSnapshot, // ← full WizardState
              parentId: projectId,
            })
            currentTowerMap[tower.id] = towerId
          }
        }
        
        newIds.projectMap = currentProjectMap
        newIds.towerMap = currentTowerMap
        
        // Root projectId compatibility
        if (state.projects?.[0] && currentProjectMap[state.projects[0].id]) {
           newIds.projectId = currentProjectMap[state.projects[0].id];
        }

      } else if (flowType === "tower") {
        const currentTowerMap = newIds.towerMap || {}
        
        for (const tower of state.towers || []) {
          const towerLocation = { 
            city: (tower as any).city || state.township?.city, 
            state: (tower as any).state || state.township?.state 
          }
          const mappedTowerId = currentTowerMap[tower.id]
          const towerId = await saveEntity("tower", mappedTowerId, {
            name: tower.name,
            location: towerLocation,
            details: fullStateSnapshot, // ← full WizardState
            parentId: null,
          })
          currentTowerMap[tower.id] = towerId
        }

        newIds.towerMap = currentTowerMap
        
        // Root towerId compatibility
        if (state.towers?.[0] && currentTowerMap[state.towers[0].id]) {
           newIds.towerId = currentTowerMap[state.towers[0].id];
        }
      }
      
      // Perform one quick update to the root document to persist the completed `_autoDraftIds` map 
      // safely inside `details` so it can survive clears of localStorage.
      const rootId = flowType === "township" ? newIds.townshipId : (flowType === "project" ? newIds.projectId : newIds.towerId);
      if (rootId) {
         fetch(`/api/properties/${rootId}/draft`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              details: { ...fullStateSnapshot, _autoDraftIds: newIds },
              lastSavedStep: currentStep
            })
         }).catch(e => console.error("Failed to commit draftIds", e));
      }

      setDraftIds(newIds)
      saveDraftIdsToStorage(flowType, newIds)
      setLastSaved(new Date())
    } catch (err: any) {
      if (err.message === "Draft not found or already published" || err.message === "Auto-save patch failed") {
         // Gracefully handle race conditions where draft was just cleared or published.
         clearDraftIdsFromStorage(flowType)
         setDraftIds({})
         return // Exit without angry console logs
      }
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
    // ── Delete draft docs from MongoDB ─────────────────────────────────────
    // Fire-and-forget: UI clears instantly; API call runs in background.
    // The endpoint is idempotent — safe to call even if the doc is already gone.
    const ids = draftIdsRef.current
    
    // Deleting the root gracefully deletes all nested entities via secureDeleteProperty
    let rootIdsToDelete: string[] = []
    if (flowType === "township" && ids.townshipId) {
      rootIdsToDelete.push(ids.townshipId)
    } else if (flowType === "project" && ids.projectId) {
      rootIdsToDelete.push(ids.projectId)
    } else if (flowType === "tower" && ids.towerId) {
      rootIdsToDelete.push(ids.towerId)
    }

    if (rootIdsToDelete.length === 0) {
      // Fallback
      rootIdsToDelete = [ids.townshipId, ids.projectId, ids.towerId].filter(Boolean) as string[]
    }

    rootIdsToDelete.forEach((draftId) => {
      fetch(`/api/properties/${draftId}/draft`, { method: "DELETE" }).catch((err) => {
        console.warn(`[clearDraft] Failed to delete draft ${draftId} from DB:`, err)
      })
    })

    // ── Clear localStorage immediately ──────────────────────────────────────
    clearDraftIdsFromStorage(flowType)
    setDraftIds({})
    setLastSaved(null)
    setDraftError(null)
  }, [flowType])

  return { draftIds, isSaving, lastSaved, draftError, saveNow, clearDraft }
}
