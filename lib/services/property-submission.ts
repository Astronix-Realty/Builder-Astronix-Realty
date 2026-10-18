import {
  type WizardState,
  type GeneratedTower,
  type GeneratedUnit,
} from "@/lib/builder-types"

export interface SubmitPropertyHierarchyOptions {
  rootDraftId?: string
  state: WizardState
  flowType: "township" | "project" | "tower"
  generatedTowers: GeneratedTower[]
  generatedUnits: GeneratedUnit[]
  createApi: (payload: any) => Promise<string>
}

export async function submitPropertyHierarchy({
  rootDraftId,
  state,
  flowType,
  generatedTowers,
  generatedUnits,
  createApi,
}: SubmitPropertyHierarchyOptions): Promise<void> {
  if (rootDraftId) {
    console.log("[submitPropertyHierarchy] Submitting draft hierarchy:", rootDraftId)
    const submitRes = await fetch(`/api/properties/${rootDraftId}/submit`, { method: "POST" })
    
    if (!submitRes.ok) {
      const err = await submitRes.json()
      // Recovery: If the draft is "not found" (maybe purged or session expired),
      // fallback to legacy sequential creation
      if (submitRes.status === 404 || err.error?.includes("not found")) {
        console.warn("[submitPropertyHierarchy] Draft not found on server. Falling back to manual creation...")
        await performLegacyCreation()
      } else {
        throw new Error(err.error || "Failed to submit draft hierarchy for approval")
      }
    }
  } else {
    console.warn("[submitPropertyHierarchy] No root draft ID could be established. Proceeding with legacy creation.")
    await performLegacyCreation()
  }

  async function performLegacyCreation() {
    console.log("[submitPropertyHierarchy] Performing sequential entity creation fallback...")
    const projectIdMap: Record<string, string> = {}
    const towerIdMap: Record<string, string> = {}
    const rootLoc = {
      city: state.township?.city,
      district: state.township?.district,
      subCity: state.township?.subCity,
      village: state.township?.village,
      area: (state.township as any)?.area || state.township?.village,
      state: state.township?.state,
      country: state.township?.country,
      pincode: state.township?.pincode,
      nearbyLandmark: state.township?.nearbyLandmark,
      googleMapLink: state.township?.googleMapLink,
      googlePlusCode: state.township?.googlePlusCode,
      coordinates: state.township?.coordinates,
    }

    if (flowType === "township") {
      const rootName = state.township?.name || "Untitled Township"
      
      const townshipId = await createApi({
        type: "township",
        name: rootName,
        location: rootLoc,
        details: state.township,
        status: "pending"
      })
      
      for (const proj of state.projects) {
        const projectId = await createApi({
          type: "project",
          parentId: townshipId,
          name: proj.name || "Untitled Project",
          location: rootLoc,
          details: proj,
          status: "pending"
        })
        projectIdMap[proj.id] = projectId

        const projTowers = generatedTowers.filter(t => t.projectId === proj.id)
        for (const tow of projTowers) {
          const towerId = await createApi({
            type: "tower",
            parentId: projectId,
            name: tow.name || "Untitled Tower",
            details: { ...tow, unitConfig: state.towerUnitConfigs.find(c => c.towerId === tow.id) },
            status: "pending"
          })
          towerIdMap[tow.id] = towerId
        }
      }
    } else if (flowType === "project") {
      const rootProj = state.projects[0]
      const projectId = await createApi({
        type: "project",
        name: rootProj?.name || "Untitled Project",
        location: rootLoc,
        details: rootProj,
        status: "pending"
      })
      projectIdMap[rootProj?.id || ""] = projectId
      
      for (const tow of generatedTowers) {
        const towerId = await createApi({
          type: "tower",
          parentId: projectId,
          name: tow.name || "Untitled Tower",
          details: { ...tow, unitConfig: state.towerUnitConfigs.find(c => c.towerId === tow.id) },
          status: "pending"
        })
        towerIdMap[tow.id] = towerId
      }
    } else if (flowType === "tower") {
      const rootTow = state.towers[0]
      const towerId = await createApi({
        type: "tower",
        name: rootTow?.name || "Untitled Tower",
        details: { ...rootTow, unitConfig: state.towerUnitConfigs[0] },
        status: "pending"
      })
      towerIdMap[rootTow?.id || ""] = towerId
    }

    if (generatedUnits && generatedUnits.length > 0) {
      const mappedUnits = generatedUnits.map(unit => ({
        ...unit,
        towerId: towerIdMap[unit.towerId] || unit.towerId,
        projectId: projectIdMap[unit.projectId || ""] || unit.projectId,
        parentId: towerIdMap[unit.towerId] || unit.towerId,
        location: rootLoc,
        type: "unit"
      }))

      const unitsRes = await fetch("/api/units/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units: mappedUnits, status: "pending" })
      })
      if (!unitsRes.ok) {
        console.error("Bulk unit creation failed in fallback:", await unitsRes.json())
      }
    }
  }
}
