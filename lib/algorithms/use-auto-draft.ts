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
  saveNow: () => Promise<DraftIds | undefined>
  clearDraft: () => void
}

const STORAGE_KEY_PREFIX = "astronix_draft"

function getDraftStorageKey(flowType: string, entity: string) {
  return `${STORAGE_KEY_PREFIX}_${flowType}_${entity}_id`
}

function loadDraftIds(flowType: string, forcedRootId?: string | null): DraftIds {
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

  const ids: DraftIds = {
    townshipId: localStorage.getItem(getDraftStorageKey(flowType, "township")) ?? undefined,
    projectId:  localStorage.getItem(getDraftStorageKey(flowType, "project")) ?? undefined,
    towerId:    localStorage.getItem(getDraftStorageKey(flowType, "tower")) ?? undefined,
    projectMap,
    towerMap,
  }

  // If a forcedRootId is provided or if edit param is in URL, it ALWAYS wins over localStorage.
  const activeRootId = forcedRootId || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("edit") : null)

  if (activeRootId) {
    if (flowType === "township") ids.townshipId = activeRootId
    else if (flowType === "project") ids.projectId = activeRootId
    else if (flowType === "tower") ids.towerId = activeRootId
  }

  return ids
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
  /**
   * FIX 2 & 4: After a clone-to-draft completes on the page, set this to the
   * new draftId so the hook immediately uses the correct ID for auto-saves.
   * This prevents the race condition where auto-save fires with the old
   * publishedId before the URL ?edit param is updated.
   */
  forcedDraftId?: string | null
  generatedTowers?: any[]
  generatedUnits?: any[]
}

export function useAutoDraft({
  flowType,
  currentStep,
  state,
  debounceMs = 10000,
  enabled = true,
  forcedDraftId,
  generatedTowers,
  generatedUnits,
}: UseAutoDraftOptions): AutoDraftState {
  const [draftIds, setDraftIds] = useState<DraftIds>(() => loadDraftIds(flowType, forcedDraftId))
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)
  const draftIdsRef = useRef<DraftIds>(draftIds)
  draftIdsRef.current = draftIds

  // FIX 3: Single pending promise ref to prevent race-condition duplicate POSTs.
  // If a save is already in-flight, subsequent triggers will await this promise
  // and then re-use the resolved IDs instead of starting a parallel POST.
  const pendingSaveRef = useRef<Promise<DraftIds | undefined> | null>(null)

  // FIX 2 & 4: When forcedDraftId changes (after clone-to-draft resolves on page),
  // immediately update the draftIds ref and localStorage so the next auto-save
  // uses the correct draft document ID, not the stale publishedId.
  useEffect(() => {
    if (!forcedDraftId) return

    const currentIds = draftIdsRef.current
    const alreadySet =
      (flowType === "township" && currentIds.townshipId === forcedDraftId) ||
      (flowType === "project" && currentIds.projectId === forcedDraftId) ||
      (flowType === "tower" && currentIds.towerId === forcedDraftId)

    if (alreadySet) return // No-op if already correct

    const newIds: DraftIds = { ...currentIds }
    if (flowType === "township") newIds.townshipId = forcedDraftId
    else if (flowType === "project") newIds.projectId = forcedDraftId
    else if (flowType === "tower") newIds.towerId = forcedDraftId

    console.log(`[useAutoDraft] Injecting forced draftId: ${forcedDraftId} (flowType: ${flowType})`)
    draftIdsRef.current = newIds
    setDraftIds(newIds)
    saveDraftIdsToStorage(flowType, newIds)
  }, [forcedDraftId, flowType])

  // ── Sync from DB State if localStorage is empty ───────────────────────────
  useEffect(() => {
    let ids = { ...draftIdsRef.current }
    let needsUpdate = false

    // 1. Sync from _autoDraftIds snapshot if maps are missing
    if (state?._autoDraftIds) {
      const snap = state._autoDraftIds
      if (!ids.townshipId && snap.townshipId) { ids.townshipId = snap.townshipId; needsUpdate = true }
      if (!ids.projectId && snap.projectId) { ids.projectId = snap.projectId; needsUpdate = true }
      if (!ids.towerId && snap.towerId) { ids.towerId = snap.towerId; needsUpdate = true }
      
      if (Object.keys(ids.projectMap || {}).length === 0 && snap.projectMap) {
        ids.projectMap = snap.projectMap
        needsUpdate = true
      }
      if (Object.keys(ids.towerMap || {}).length === 0 && snap.towerMap) {
        ids.towerMap = snap.towerMap
        needsUpdate = true
      }
    }

    // 2. Always fallback to extracting _dbId directly from hydrated state
    if (typeof window !== "undefined") {
      const newProjectMap = { ...(ids.projectMap || {}) }
      const newTowerMap = { ...(ids.towerMap || {}) }

      for (const proj of state?.projects || []) {
        if (proj._dbId && proj.id && !newProjectMap[proj.id]) {
          newProjectMap[proj.id] = proj._dbId
          needsUpdate = true
        }
      }
      for (const tower of state?.towers || []) {
        if (tower._dbId && tower.id && !newTowerMap[tower.id]) {
          newTowerMap[tower.id] = tower._dbId
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        ids.projectMap = newProjectMap
        ids.towerMap = newTowerMap
      }
    }

    if (needsUpdate) {
      setDraftIds(ids)
      draftIdsRef.current = ids
      saveDraftIdsToStorage(flowType, ids)
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
    const safeLocation = payload.location ?? {}

    if (existingId) {
      // PATCH — lightweight auto-save, never creates a new document (with 2 retries for transient 503/network issues)
      let attempt = 0;
      let lastErr: Error | null = null;
      while (attempt < 3) {
        try {
          const res = await fetch(`/api/properties/${existingId}/draft`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: safeName,
              location: safeLocation,
              details: payload.details ?? {},
              lastSavedStep: currentStep,
              ...(payload.parentId ? { parentId: payload.parentId } : {}),
            }),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            if (res.status === 503 && attempt < 2) {
              attempt++;
              await new Promise(r => setTimeout(r, 1000 * attempt));
              continue;
            }
            throw new Error(err.error || "Auto-save patch failed")
          }
          return existingId
        } catch (e: any) {
          lastErr = e;
          attempt++;
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      }
      throw lastErr || new Error("Auto-save patch failed after retries");
    } else {
      // POST — create new draft only when truly no existingId is known
      if (process.env.NODE_ENV !== "production" && !flowType) {
        console.warn("[useAutoDraft] saveEntity called with no flowType — defaulting to entityType:", entityType)
      }
      const resolvedFlowType = flowType || entityType

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
  const performSave = useCallback(async (): Promise<DraftIds | undefined> => {
    if (!enabled) return undefined

    const hasAnythingToSave =
      (flowType === "township" && (state.township?.name?.trim() || state.projects?.length > 0)) ||
      (flowType === "project"  && state.projects?.[0]?.name?.trim()) ||
      (flowType === "tower"    && state.towers?.[0]?.name?.trim())
    if (!hasAnythingToSave) return undefined

    // FIX 3: If a save is already in-flight, wait for it to complete and then
    // return the resolved IDs. Do NOT start a parallel POST.
    if (pendingSaveRef.current) {
      console.log("[useAutoDraft] Save already in progress — awaiting existing promise to prevent duplicate POST.")
      return await pendingSaveRef.current
    }

    const savePromise = (async (): Promise<DraftIds | undefined> => {
      isSavingRef.current = true
      setIsSaving(true)
      setDraftError(null)

      try {
        // FIX 3: Re-read IDs from ref (not closure) to get the most recent state,
        // including any IDs injected after a clone-to-draft resolve.
        const newIds: DraftIds = { ...draftIdsRef.current }

        const fullStateSnapshot = {
          ...state,
          ...(generatedTowers ? { generatedTowers } : {}),
          ...(generatedUnits ? { generatedUnits } : {}),
        }

        if (flowType === "township") {
          const tp = state.township
          const townshipLocation = {
            city: tp?.city,
            district: tp?.district,
            subCity: tp?.subCity,
            village: tp?.village,
            area: tp?.area || tp?.village,
            state: tp?.state,
            country: tp?.country,
            pincode: tp?.pincode,
            nearbyLandmark: tp?.nearbyLandmark,
            googleMapLink: tp?.googleMapLink,
            googlePlusCode: tp?.googlePlusCode,
            coordinates: tp?.coordinates,
          }
          const townshipId = await saveEntity("township", newIds.townshipId, {
            name: tp?.name,
            location: townshipLocation as any,
            details: fullStateSnapshot,
          })
          newIds.townshipId = townshipId

          const currentProjectMap = newIds.projectMap || {}
          const currentTowerMap = newIds.towerMap || {}

          for (const proj of state.projects || []) {
            const projectLocation = {
              city: proj.city || tp?.city,
              district: proj.district || tp?.district,
              subCity: proj.subCity || tp?.subCity,
              village: proj.village || tp?.village,
              area: proj.area || proj.village || tp?.area || tp?.village,
              state: proj.state || tp?.state,
              country: proj.country || tp?.country,
              pincode: proj.pincode || tp?.pincode,
              nearbyLandmark: proj.nearbyLandmark || tp?.nearbyLandmark,
              googleMapLink: proj.googleMapLink || tp?.googleMapLink,
              googlePlusCode: proj.googlePlusCode || tp?.googlePlusCode,
              coordinates: proj.coordinates || tp?.coordinates
            }
            const mappedProjectId = currentProjectMap[proj.id]
            const projectId = await saveEntity("project", mappedProjectId, {
              name: proj.name,
              location: projectLocation,
              details: fullStateSnapshot,
              parentId: townshipId,
            })
            currentProjectMap[proj.id] = projectId

            const projectTowers = (state.towers || []).filter((t: any) => t.projectId === proj.id)
            for (const tower of projectTowers) {
              const mappedTowerId = currentTowerMap[tower.id]
              const towerId = await saveEntity("tower", mappedTowerId, {
                name: tower.name,
                location: projectLocation,
                details: fullStateSnapshot,
                parentId: projectId,
              })
              currentTowerMap[tower.id] = towerId
            }
          }
          newIds.projectMap = currentProjectMap
          newIds.towerMap = currentTowerMap

          if (state.projects?.[0] && currentProjectMap[state.projects[0].id]) {
            newIds.projectId = currentProjectMap[state.projects[0].id]
          }

        } else if (flowType === "project") {
          const currentProjectMap = newIds.projectMap || {}
          const currentTowerMap = newIds.towerMap || {}

          for (const proj of state.projects || []) {
            const projectLocation = {
              city: proj.city,
              district: proj.district,
              subCity: proj.subCity,
              village: proj.village,
              area: proj.area || proj.village,
              state: proj.state,
              country: proj.country,
              pincode: proj.pincode,
              nearbyLandmark: proj.nearbyLandmark,
              googleMapLink: proj.googleMapLink,
              googlePlusCode: proj.googlePlusCode,
              coordinates: proj.coordinates
            }
            const mappedProjectId = currentProjectMap[proj.id]
            const projectId = await saveEntity("project", mappedProjectId, {
              name: proj.name,
              location: projectLocation,
              details: fullStateSnapshot,
              parentId: null,
            })
            currentProjectMap[proj.id] = projectId

            const projectTowers = (state.towers || []).filter((t: any) => t.projectId === proj.id)
            for (const tower of projectTowers) {
              const mappedTowerId = currentTowerMap[tower.id]
              const towerId = await saveEntity("tower", mappedTowerId, {
                name: tower.name,
                location: projectLocation,
                details: fullStateSnapshot,
                parentId: projectId,
              })
              currentTowerMap[tower.id] = towerId
            }
          }

          newIds.projectMap = currentProjectMap
          newIds.towerMap = currentTowerMap

          if (state.projects?.[0] && currentProjectMap[state.projects[0].id]) {
            newIds.projectId = currentProjectMap[state.projects[0].id]
          }

        } else if (flowType === "tower") {
          const currentTowerMap = newIds.towerMap || {}

          for (const tower of state.towers || []) {
            const towerLocation = {
              city: (tower as any).city || state.township?.city,
              district: (tower as any).district || state.township?.district,
              subCity: (tower as any).subCity || state.township?.subCity,
              village: (tower as any).village || state.township?.village,
              area: (tower as any).area || (tower as any).village || state.township?.area || state.township?.village,
              state: (tower as any).state || state.township?.state,
              country: (tower as any).country || state.township?.country,
              pincode: (tower as any).pincode || state.township?.pincode,
              nearbyLandmark: (tower as any).nearbyLandmark || state.township?.nearbyLandmark,
              googleMapLink: (tower as any).googleMapLink || state.township?.googleMapLink,
              googlePlusCode: (tower as any).googlePlusCode || state.township?.googlePlusCode,
              coordinates: (tower as any).coordinates || state.township?.coordinates,
            }
            const mappedTowerId = currentTowerMap[tower.id]
            const towerId = await saveEntity("tower", mappedTowerId, {
              name: tower.name,
              location: towerLocation,
              details: fullStateSnapshot,
              parentId: null,
            })
            currentTowerMap[tower.id] = towerId
          }

          newIds.towerMap = currentTowerMap

          if (state.towers?.[0] && currentTowerMap[state.towers[0].id]) {
            newIds.towerId = currentTowerMap[state.towers[0].id]
          }
        }

        // Persist the completed _autoDraftIds map inside details for localStorage recovery
        const rootId = flowType === "township" ? newIds.townshipId : (flowType === "project" ? newIds.projectId : newIds.towerId)
        if (rootId) {
          fetch(`/api/properties/${rootId}/draft`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              details: { ...fullStateSnapshot, _autoDraftIds: newIds },
              lastSavedStep: currentStep
            })
          }).catch(e => console.error("Failed to commit draftIds", e))
        }

        draftIdsRef.current = newIds
        setDraftIds(newIds)
        saveDraftIdsToStorage(flowType, newIds)
        setLastSaved(new Date())

        // Update URL silently so page refresh (F5) reloads this draft
        if (typeof window !== "undefined" && rootId) {
          const url = new URL(window.location.href)
          if (url.searchParams.get("edit") !== rootId) {
            url.searchParams.set("edit", rootId)
            window.history.replaceState({}, "", url.toString())
          }
        }

        return newIds

      } catch (err: any) {
        // FIX 2: If PATCH fails because the existingId was a published doc (stale),
        // clear the stale ID from memory and storage. Do NOT fall through to POST —
        // the next save cycle will re-evaluate and POST a fresh draft if truly needed.
        if (
          err.message === "Draft not found or already published" ||
          err.message === "Auto-save patch failed" ||
          err.message === "Draft not found or unauthorized" ||
          err.message?.includes("not found")
        ) {
          console.warn("[useAutoDraft] PATCH failed with stale ID. Clearing to avoid duplicate POST.", err.message)
          clearDraftIdsFromStorage(flowType)
          setDraftIds({})
          draftIdsRef.current = {}
          return undefined
        }

        console.error("[useAutoDraft] Save failed:", err)
        setDraftError(err.message || "Auto-save failed")
      } finally {
        isSavingRef.current = false
        setIsSaving(false)
        pendingSaveRef.current = null // Clear the pending save ref
      }
    })()

    pendingSaveRef.current = savePromise
    return await savePromise
  }, [flowType, state, saveEntity, enabled, currentStep])

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

  const saveNow = useCallback(async (): Promise<DraftIds | undefined> => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    return await performSave()
  }, [performSave])

  const clearDraft = useCallback(() => {
    const ids = draftIdsRef.current

    let rootIdsToDelete: string[] = []
    if (flowType === "township" && ids.townshipId) {
      rootIdsToDelete.push(ids.townshipId)
    } else if (flowType === "project" && ids.projectId) {
      rootIdsToDelete.push(ids.projectId)
    } else if (flowType === "tower" && ids.towerId) {
      rootIdsToDelete.push(ids.towerId)
    }

    if (rootIdsToDelete.length === 0) {
      rootIdsToDelete = [ids.townshipId, ids.projectId, ids.towerId].filter(Boolean) as string[]
    }

    rootIdsToDelete.forEach((draftId) => {
      fetch(`/api/properties/${draftId}/draft`, { method: "DELETE" }).catch((err) => {
        console.error("Failed to delete draft:", err)
      })
    })

    clearDraftIdsFromStorage(flowType)
    setDraftIds({})
    draftIdsRef.current = {}
    setLastSaved(null)
    setDraftError(null)
    pendingSaveRef.current = null
  }, [flowType])

  return { draftIds, isSaving, lastSaved, draftError, saveNow, clearDraft }
}
