"use client"

import { useState, useCallback, useMemo, useEffect, Suspense, Fragment, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { useSearchParams } from "next/navigation"
import { ProgressBar } from "@/components/builder/progress-bar"
import { ProjectsForm } from "@/components/builder/projects-form"
import { TowersForm } from "@/components/builder/towers-form"
import { UnitsForm } from "@/components/builder/units-form"
import { WizardSummary } from "@/components/builder/wizard-summary"
import {
  ChevronLeft, ChevronRight, Check, Building2, Save, X,
  Plus, Layers, LayoutGrid, CheckCircle2, AlertCircle, Loader2, CloudOff, Clock
} from "lucide-react"
import {
  type WizardState,
  type GeneratedTower,
  type GeneratedUnit,
  type ProjectData,
  type TowerData,
  type UnitConfiguration,
  type FloorGroup,
  initialTownshipData,
  initialProjectTemplate,
  initialTowerTemplate,
  initialUnitTemplate,
  createInitialProject,
  createInitialTower,
} from "@/lib/builder-types"
import { TownshipFlowForm } from "@/components/builder/forms/township-flow-form"
import { ProjectFlowForm } from "@/components/builder/forms/project-flow-form"
import { TowerFlowForm } from "@/components/builder/forms/tower-flow-form"
import { useAutoDraft } from "@/lib/algorithms/use-auto-draft"
import { DraftResumeBanner } from "@/components/builder/shared/DraftResumeBanner"
import { calculateUpwardPricingAndCounts } from "@/lib/services/pricing-rollup"
import { generateTowers, generateUnits } from "@/lib/services/entity-generator"
import { submitPropertyHierarchy } from "@/lib/services/property-submission"
import { toast } from "sonner"
import { townshipStepSchema } from "@/lib/schemas/builder"

const ALL_STEPS = [
  { id: 1, name: "Township", description: "Basic details & location" },
  { id: 2, name: "Projects", description: "Individual project details" },
  { id: 3, name: "Towers", description: "Buildings & structure" },
  { id: 4, name: "Units", description: "Tower-wise configurations & pricing" },
]

type FlowType = "township" | "project" | "tower"

// Get steps based on flow type
const getStepsForFlow = (flowType: FlowType) => {
  let steps = ALL_STEPS

  if (flowType === "project") {
    steps = ALL_STEPS.slice(1) // Projects, Towers, Units
  } else if (flowType === "tower") {
    steps = ALL_STEPS.slice(2) // Towers, Units
  }

  // Return new objects with re-mapped IDs (1, 2, 3...)
  return steps.map((step, index) => ({
    ...step,
    id: index + 1
  }))
}

// Get step offset based on flow type (for mapping display step to actual step)
const getStepOffset = (flowType: FlowType) => {
  switch (flowType) {
    case "township":
      return 0
    case "project":
      return 1 // Skip step 1 (Township)
    case "tower":
      return 2 // Skip steps 1 & 2 (Township & Projects)
    default:
      return 0
  }
}

function BuilderContent() {
  const searchParams = useSearchParams()
  const flowType = (searchParams.get("flow") as FlowType) || "township"

  const STEPS = getStepsForFlow(flowType)
  const stepOffset = getStepOffset(flowType)

  const getInitialState = useCallback((): WizardState => {
    const baseState: WizardState = {
      currentStep: 1 + stepOffset, // Start at appropriate step based on flow
      township: {
        ...initialTownshipData,
        id: `township-${Date.now()}` // Ensure unique ID per session
      },
      projectTemplate: initialProjectTemplate,
      projects: [],
      towers: [],
      towerTemplate: initialTowerTemplate,
      unitTemplate: initialUnitTemplate("global"),  // ← call as function with default towerId
      towerUnitConfigs: [],
      generatedProjects: [],
      generatedTowers: [],
      generatedUnits: [],
    }

    // For project flow, create a default project
    if (flowType === "project") {
      const defaultProject = createInitialProject(1)
      defaultProject.totalTowers = 1
      baseState.projects = [defaultProject]
    }

    if (flowType === "tower") {
      const standaloneTower = createInitialTower(0, "standalone")
      standaloneTower.id = "tower-standalone-1" // Ensure unique ID
      standaloneTower.name = "Tower A"
      standaloneTower.totalFloors = "G + 20"
      standaloneTower.totalFloorsNum = 20
      standaloneTower.unitsPerFloor = "4"
      baseState.towers = [standaloneTower]
    }

    return baseState
  }, [flowType, stepOffset])

  const editId = searchParams.get("edit")
  const [state, setState] = useState<WizardState>(() => getInitialState())
  const [isComplete, setIsComplete] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showResumeBanner, setShowResumeBanner] = useState(!editId)
  // FIX 4: After clone-to-draft resolves, store the real draftId here so
  // useAutoDraft can immediately use it instead of the stale publishedId from URL.
  const [resolvedDraftId, setResolvedDraftId] = useState<string | null>(null)

  // Verify Auth on Client Mount explicitly (Bonus)
  useEffect(() => {
    const verifyClientAuth = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          const checkRole = data.user?.role || data.user?.userType
          if (checkRole === "builder" || checkRole === "mandate") {
             setCurrentUser(data.user)
             setIsAuthChecking(false)
          } else {
             window.location.href = "/"
          }
        } else {
          window.location.href = "/login?redirect=/builder"
        }
      } catch (e) {
        window.location.href = "/login"
      }
    }
    verifyClientAuth()
  }, [])

  // Sub-navigation state for Tabs
  const [activeProjectIdx, setActiveProjectIdx] = useState(0)
  const [activeTowerIdx, setActiveTowerIdx] = useState(0)
  const [activeUnitTowerId, setActiveUnitTowerId] = useState<string>("global")
  const [activeUnitProjectId, setActiveUnitProjectId] = useState<string>("all")

  const [isEditLoading, setIsEditLoading] = useState(!!editId)

  // Load data if editing
  useEffect(() => {
    const loadProperty = async () => {
      if (editId) {
        setIsEditLoading(true)
        try {
          let targetId = editId
          const checkRes = await fetch(`/api/properties/${editId}`)
          if (checkRes.ok) {
            const checkData = await checkRes.json()
            if (checkData.property?.status === 'published' || checkData.property?.status === 'active') {
              console.log("[loadProperty] Property is published. Cloning to draft...")
              const cloneRes = await fetch(`/api/properties/${editId}/clone-to-draft`, { method: 'POST' })
              if (cloneRes.ok) {
                const cloneData = await cloneRes.json()
                targetId = cloneData.draftId
                setResolvedDraftId(cloneData.draftId)
                
                // Update the URL so it reflects the draft ID instead of the published ID
                const newUrl = new URL(window.location.href)
                newUrl.searchParams.set('edit', cloneData.draftId)
                window.history.replaceState({}, '', newUrl.toString())
              } else {
                console.error("[loadProperty] Failed to clone property to draft")
                setResolvedDraftId(editId)
              }
            } else {
              // For draft/pending/rejected properties, the editId IS the draft id.
              // Inject it immediately so useAutoDraft doesn't re-read a stale localStorage value.
              setResolvedDraftId(editId)
            }
          }

          const res = await fetch(`/api/properties/${targetId}`)
          if (res.ok) {
            const data = await res.json()
            if (data.property) {
              const wizardData = data.property.details || data.property.data
              if (wizardData) {
                const defaultState = getInitialState()
                
                // Deep merge to ensure nested structures like township and unitTemplate are preserved
                // Use data.property.townshipName as a backup for the name if wizardData.township is partial
                const newState: WizardState = {
                  ...defaultState,
                  ...wizardData,
                  township: { 
                    ...defaultState.township, 
                    ...(wizardData.township || {}),
                    name: wizardData.township?.name || data.property.townshipName || data.property.name || defaultState.township.name,
                    totalValue: wizardData.township?.totalValue || data.property.totalValue || 0
                  },
                  projects: Array.isArray(wizardData.projects) && wizardData.projects.length > 0 
                    ? wizardData.projects.filter(Boolean) 
                    : defaultState.projects,
                  towers: Array.isArray(wizardData.towers) && wizardData.towers.length > 0 
                    ? wizardData.towers.filter(Boolean) 
                    : defaultState.towers,
                  unitTemplate: { 
                    ...defaultState.unitTemplate, 
                    ...(wizardData.unitTemplate || {}) 
                  },
                  towerUnitConfigs: Array.isArray(wizardData.towerUnitConfigs) 
                    ? wizardData.towerUnitConfigs.filter(Boolean) 
                    : (defaultState.towerUnitConfigs || []),
                  currentStep: Math.max(
                    wizardData.currentStep || data.property.lastSavedStep || defaultState.currentStep,
                    defaultState.currentStep
                  )
                }

                setState(newState)
                console.log("Loaded property data from MongoDB:", {
                  id: data.property._id,
                  type: data.property.type,
                  flowType: data.property.flowType,
                  step: newState.currentStep,
                  townshipName: newState.township.name
                })
              }
            }
          }
        } catch (error) {
          console.error("Error loading property:", error)
        } finally {
          setIsEditLoading(false)
        }
      }
    }
    loadProperty()
  }, [editId])

  // Theme management
  const [theme, setTheme] = useState("system")

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem("theme") || "system"
    setTheme(savedTheme)
  }, [])

  useEffect(() => {
    // Apply theme class
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Save to local storage
    localStorage.setItem("theme", theme)
  }, [theme])

  // Reset state when flow type changes
  useEffect(() => {
    if (editId) return // Skip reset when editing — the edit-load effect handles state initialization
    setState(getInitialState())
    setIsComplete(false)
    setIsCreating(false)
  }, [flowType, getInitialState, editId])

  // ── Auto-sync projects when township.projectCount changes ────────────────
  // DISABLED because projects are now fully manually managed via ProjectsForm (Step 2).
  // The old effect was overwriting manually added projects by resetting to
  // township.projectCount (which defaults to 0 or is read-only), causing projects to disappear on edit.
  /*
  useEffect(() => {
    if (flowType !== "township") return
    const currentCount = (state.projects || []).filter(Boolean).length
    const targetCount = state.township.projectCount
    if (targetCount > currentCount) {
      const newProjects = Array.from({ length: targetCount - currentCount }, (_, i) =>
        createInitialProject(currentCount + i + 1),
      )
      setState((prev) => ({ ...prev, projects: [...(prev.projects || []).filter(Boolean), ...newProjects] }))
    } else if (targetCount < currentCount) {
      setState((prev) => ({ ...prev, projects: (prev.projects || []).filter(Boolean).slice(0, targetCount) }))
    }
  }, [state.township.projectCount, flowType, state.projects.length])
  */

  // ── Tower sync useEffect DISABLED ──────────────────────────────────────────
  // Reason: Towers are now fully manually managed via TowersForm (Step 3).
  // The old effect was overwriting manually added towers by resetting to
  // project.totalTowers count (default 0), causing "tower add nahi hota" bug.
  // Tower counts are kept in sync via the updateTowers callback below.

  const { unitTemplate, towers, towerUnitConfigs } = state

  const generatedTowers = useMemo<GeneratedTower[]>(() => {
    return generateTowers({
      towers: state.towers,
      towerUnitConfigs,
      unitTemplate,
    })
  }, [state.towers, towerUnitConfigs, unitTemplate])

  const generatedUnits = useMemo<GeneratedUnit[]>(() => {
    return generateUnits({
      generatedTowers,
      towerUnitConfigs,
      unitTemplate,
    })
  }, [unitTemplate, generatedTowers, towerUnitConfigs])

  // Auto draft hook
  const { draftIds, isSaving, lastSaved, draftError, saveNow, clearDraft } = useAutoDraft({
    flowType,
    currentStep: state?.currentStep || 1,
    state,
    debounceMs: 10000,
    // Turn off auto-save when creating to prevent "draft already published" errors
    enabled: !isAuthChecking && !isCreating && !isComplete && !isEditLoading,
    // FIX 4: Pass the resolved draftId so the hook immediately uses the correct
    // draft document ID instead of the stale publishedId from the URL on first load.
    forcedDraftId: resolvedDraftId,
    generatedTowers,
    generatedUnits,
  })

  // Ensure towerUnitConfigs are populated for all towers
  useEffect(() => {
    const missingConfigTowerIds = (state?.towers || []).filter(Boolean)
      .map((t) => t.id)
      .filter((id) => !state?.towerUnitConfigs?.some((c) => c.towerId === id))

    if (missingConfigTowerIds.length > 0) {
      console.log("Populating default configs for:", missingConfigTowerIds)
      const newConfigs = missingConfigTowerIds.map((towerId) => ({
        towerId,
        configurations: (state.unitTemplate.configurations || []).map((c: any) => ({ ...c })),
        floorGroups: (state.unitTemplate.floorGroups || []).map((fg: any) => ({ ...fg })),
        basePrice: state.unitTemplate.basePrice,
        ratePerSqft: state.unitTemplate.ratePerSqft,
        facingPremiums: { ...state.unitTemplate.facingPremiums },
      }))

      setState((prev) => ({
        ...prev,
        towerUnitConfigs: [...prev.towerUnitConfigs, ...newConfigs],
      }))
    }
  }, [state.towers, state.towerUnitConfigs, state.unitTemplate])

  const updateState = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const updateProjects = useCallback((projects: ProjectData[]) => {
    const safeProjects = (projects || []).filter(Boolean)
    const validProjectIds = new Set(safeProjects.map(p => p.id))
    setState((prev) => {
      // Clean up orphaned towers whose parent project was deleted
      const remainingTowers = (prev.towers || []).filter(t => !t.projectId || validProjectIds.has(t.projectId))
      const remainingTowerIds = new Set(remainingTowers.map(t => t.id))
      // Clean up orphaned towerUnitConfigs
      const remainingConfigs = (prev.towerUnitConfigs || []).filter(c => remainingTowerIds.has(c.towerId))

      return {
        ...prev,
        projects: safeProjects,
        towers: remainingTowers,
        towerUnitConfigs: remainingConfigs,
        township: { ...prev.township, projectCount: safeProjects.length },
      }
    })
  }, [])

  const updateTowers = useCallback((towers: TowerData[]) => {
    const safeTowers = (towers || []).filter(Boolean)
    const validTowerIds = new Set(safeTowers.map(t => t.id))
    setState((prev) => {
      const updatedProjects = (prev.projects || []).filter(Boolean).map(p => ({
        ...p,
        totalTowers: safeTowers.filter(t => t.projectId === p.id).length,
      }))
      const remainingConfigs = (prev.towerUnitConfigs || []).filter(c => validTowerIds.has(c.towerId))
      return {
        ...prev,
        towers: safeTowers,
        projects: updatedProjects,
        towerUnitConfigs: remainingConfigs,
      }
    })
  }, [])

  // ── Auto-sync township counts & pricing using modular rollup service ──────
  useEffect(() => {
    const rollup = calculateUpwardPricingAndCounts(state, generatedUnits)
    if (rollup.hasChanged) {
      setState(prev => ({
        ...prev,
        township: rollup.updatedTownship,
        towers: rollup.updatedTowers,
        projects: rollup.updatedProjects
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(state.projects), 
    JSON.stringify(state.towers), 
    JSON.stringify(state.towerUnitConfigs), 
    JSON.stringify(state.unitTemplate), 
    state.township.name, 
    generatedUnits.length
  ])

  const handleAddProject = useCallback(() => {
    const safeProjects = state.projects.filter(Boolean)
    const newProject = createInitialProject(state.township.name, safeProjects.length)
    const next = [...safeProjects, newProject]
    updateProjects(next)
    setActiveProjectIdx(next.length - 1)
  }, [state.projects, state.township.name, updateProjects])

  const handleAddTower = useCallback((projectId: string) => {
    const projectTowers = state.towers.filter(Boolean).filter(t => t.projectId === projectId)
    const newTower = createInitialTower(projectTowers.length, projectId)
    const next = [...state.towers.filter(Boolean), newTower]
    updateTowers(next)
    setActiveTowerIdx(next.filter(t => t.projectId === projectId).length - 1)
  }, [state.towers, updateTowers])

  const handleCloneTower = useCallback((towerId: string) => {
    const originalTower = state.towers.find(t => t.id === towerId)
    if (!originalTower) return

    const newTowerId = `tower-${uuidv4()}`
    const clonedTower: TowerData = {
      ...originalTower,
      id: newTowerId,
      name: `${originalTower.name} (Copy)`,
    }

    // Clone units as well
    const originalConfig = state.towerUnitConfigs.find(c => c.towerId === towerId)
    let newConfigs = state.towerUnitConfigs
    if (originalConfig) {
      newConfigs = [...state.towerUnitConfigs, { 
        ...originalConfig, 
        towerId: newTowerId,
        configurations: originalConfig.configurations ? JSON.parse(JSON.stringify(originalConfig.configurations)) : [],
        floorGroups: originalConfig.floorGroups ? JSON.parse(JSON.stringify(originalConfig.floorGroups)) : []
      }]
    }

    setState(prev => ({
      ...prev,
      towers: [...prev.towers, clonedTower],
      towerUnitConfigs: newConfigs
    }))

    const projectTowers = [...state.towers, clonedTower].filter(t => t.projectId === originalTower.projectId)
    setActiveTowerIdx(projectTowers.length - 1)
  }, [state.towers, state.towerUnitConfigs])

  const handleCloneProject = useCallback((projectId: string) => {
    const originalProject = state.projects.find(p => p.id === projectId)
    if (!originalProject) return

    const newProjectId = `proj-${uuidv4()}`
    const clonedProject: ProjectData = {
      ...originalProject,
      id: newProjectId,
      name: `${originalProject.name} (Copy)`,
    }

    // Clone towers of this project
    const projectTowers = state.towers.filter(t => t.projectId === projectId)
    const towerConfigsToAdd: any[] = []
    
    // Create a precise mapping of old Tower ID to new Tower ID
    const towerIdMap: Record<string, string> = {}
    
    const finalClonedTowers = projectTowers.map(tower => {
      const newTowerId = `tower-${uuidv4()}`
      towerIdMap[tower.id] = newTowerId
      return { ...tower, id: newTowerId, projectId: newProjectId }
    })

    // Now map configs using the exact map
    projectTowers.forEach(tower => {
      const originalConfig = state.towerUnitConfigs.find(c => c.towerId === tower.id)
      const newTowerId = towerIdMap[tower.id]
      if (originalConfig && newTowerId) {
        towerConfigsToAdd.push({ ...originalConfig, towerId: newTowerId })
      }
    })

    setState(prev => ({
      ...prev,
      projects: [...prev.projects, clonedProject],
      towers: [...prev.towers, ...finalClonedTowers],
      towerUnitConfigs: [...prev.towerUnitConfigs, ...towerConfigsToAdd]
    }))

    setActiveProjectIdx(state.projects.length)
  }, [state.projects, state.towers, state.towerUnitConfigs])

  const maxStep = 4 // Units step is always 4
  const minStep = 1 + stepOffset // Min step based on flow

  const validateStep = useCallback(() => {
    // ── STEP 1: IDENTITY & MASTER INFORMATION ─────────────────────────────────
    if (flowType === "township" && state.currentStep === 1) {
      if (!state.township.name || state.township.name.trim().length < 2) {
        toast.error("Please enter a valid Township Name (at least 2 characters).")
        return false
      }
      const hasLocation = state.township.city || state.township.subCity || state.township.village || state.township.nearbyLandmark
      if (!hasLocation) {
        toast.error("Please specify a location (city, area, or nearby landmark) for this township.")
        return false
      }
    }

    if (flowType === "project" && state.currentStep === 2) {
      const proj = state.projects[0]
      if (!proj || !proj.name || proj.name.trim().length < 2) {
        toast.error("Please enter a valid Project Name (at least 2 characters).")
        return false
      }
      const hasLocation = state.township?.city || state.township?.subCity || state.township?.village || state.township?.nearbyLandmark || (proj as any)?.city
      if (!hasLocation) {
        toast.error("Please specify a location (city, area, or nearby landmark) for this project.")
        return false
      }
    }

    if (flowType === "tower" && state.currentStep === 3) {
      const tower = state.towers[0]
      if (!tower || !tower.name || tower.name.trim().length < 1) {
        toast.error("Please enter a name for this Tower / Building.")
        return false
      }
      const floors = parseInt(String(tower.totalFloors || "").replace(/\D/g, "")) || tower.totalFloorsNum || 0
      if (floors <= 0) {
        toast.error("Please specify total floors for this tower.")
        return false
      }
      const hasLocation = state.township?.city || state.township?.village || state.township?.nearbyLandmark
      if (!hasLocation) {
        toast.error("Please specify a location (city, area, or nearby landmark) for this tower.")
        return false
      }
    }

    // ── STEP 2: PROJECTS MANAGEMENT (Township Flow) ───────────────────────────
    if (flowType === "township" && state.currentStep === 2) {
      if (!state.projects || state.projects.length === 0) {
        toast.error("Please add at least one Project to proceed.")
        return false
      }
      const hasUnnamedProject = state.projects.some(p => !p || !p.name || p.name.trim().length === 0)
      if (hasUnnamedProject) {
        toast.error("Please provide a valid name for all projects.")
        return false
      }
    }

    // ── STEP 3: TOWERS & STRUCTURE (Township & Project Flows) ─────────────────
    if ((flowType === "township" || flowType === "project") && state.currentStep === 3) {
      if (!state.towers || state.towers.length === 0) {
        toast.error("Please add at least one Tower to proceed.")
        return false
      }
      if (flowType === "township" && state.projects.length > 0) {
        const projectWithoutTower = state.projects.find(p => !state.towers.some(t => t.projectId === p.id))
        if (projectWithoutTower) {
          toast.error(`Please add at least one Tower for project "${projectWithoutTower.name || 'Untitled Project'}".`)
          return false
        }
      }
      const hasUnnamedTower = state.towers.some(t => !t || !t.name || t.name.trim().length === 0)
      if (hasUnnamedTower) {
        toast.error("Please provide a name for all towers.")
        return false
      }
    }

    // ── STEP 4: UNITS MATRIX & PRICING BLUEPRINT (All Flows) ──────────────────
    if (state.currentStep === 4) {
      const globalConfigs = state.unitTemplate?.configurations || []
      const hasAnyTowerConfig = (state.towerUnitConfigs || []).some(tc => (tc.configurations || []).length > 0)

      if (globalConfigs.length === 0 && !hasAnyTowerConfig) {
        toast.error("Please add at least one Unit Configuration (e.g., 1BHK, 2BHK) with carpet area.")
        return false
      }

      if (!generatedUnits || generatedUnits.length === 0) {
        toast.error("No units generated. Please configure floor layouts or units per floor.")
        return false
      }
    }

    return true
  }, [
    state.currentStep,
    state.township,
    state.projects,
    state.towers,
    state.towerUnitConfigs,
    state.unitTemplate,
    generatedUnits,
    flowType
  ])

  const nextStep = useCallback(() => {
    if (!validateStep()) return

    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, maxStep + 1), // +1 for review step
      generatedTowers,
      generatedUnits,
    }))
  }, [generatedTowers, generatedUnits, maxStep, validateStep])

  const prevStep = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, minStep) }))
  }, [minStep])

  const handleSaveDraft = async () => {
    await saveNow()
    const dashboardPath = currentUser?.role === "mandate" ? "/mandate-dashboard" : "/builder-dashboard"
    window.location.href = `${dashboardPath}?tab=properties&filter=drafts`
  }

  const isSubmittingRef = useRef(false)

  const handleCreate = async () => {
    if (isSubmittingRef.current) {
      console.warn("[handleCreate] Submission already in progress. Ignoring duplicate click.");
      return;
    }
    isSubmittingRef.current = true;

    try {
      setIsCreating(true)

      const createApi = async (payload: any) => {
        const res = await fetch('/api/properties', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error?.message || "Failed to save entity")
        }
        return (await res.json()).property._id
      }

      // ── STEP 1: FORCE SYNC BEFORE SUBMISSION ─────────────────────────────
      // Unconditionally force a save now to ensure the database draft has the 
      // absolute latest generatedUnits and generatedTowers from the client state.
      let currentDraftIds = draftIds;
      console.log("[handleCreate] Forcing sync before submission to flush generated units...");
      const newIds = await saveNow();
      if (newIds) {
        currentDraftIds = newIds;
      }


      // Re-read draft IDs securely using the resolved variable
      const rootDraftId = currentDraftIds.townshipId || currentDraftIds.projectId || currentDraftIds.towerId;

      // ── STEP 2: SUBMIT VIA SUBMISSION SERVICE ──────────────────────────────────
      await submitPropertyHierarchy({
        rootDraftId,
        state,
        flowType,
        generatedTowers,
        generatedUnits,
        createApi,
      })

      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsCreating(false)
      setIsComplete(true)
      isSubmittingRef.current = false
      
      // Crucial: Clear draft from localStorage and DB on successful publish
      // This prevents the "Resume Draft" banner from appearing for already published content.
      clearDraft() 
      
      setTimeout(() => {
        const dashboardPath = currentUser?.role === "mandate" ? "/mandate-dashboard" : "/builder-dashboard"
        window.location.href = `${dashboardPath}?tab=properties&filter=pending`
      }, 1500)

    } catch (error: any) {
      console.error("Error creating property:", error)
      setIsCreating(false)
      isSubmittingRef.current = false
      
      const msg = error.message || "";
      if (msg.includes("unauthorized") || msg.includes("authenticated")) {
         toast.error("Your session has expired. Please log in again to save your work.")
         window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname + window.location.search)
      } else {
         toast.error(msg || "Failed to create property structure. Please ensure all required fields are filled.")
      }
    }
  }

  // Desktop keyboard shortcuts: Ctrl+S to save draft, Ctrl+Enter to proceed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveNow()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if ((state?.currentStep || 1) > maxStep) {
          handleCreate()
        } else {
          nextStep()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveNow, nextStep, state?.currentStep, maxStep])

  const totalEntities = 1 + (state?.projects?.length || 0) + (generatedTowers?.length || 0) + (generatedUnits?.length || 0)
  const displayStepIndex = (state?.currentStep || 1) - 1 - stepOffset
  const isReviewStep = (state?.currentStep || 1) > maxStep

  const getFlowTitle = () => {
    switch (flowType) {
      case "township": return "Township Builder"
      case "project": return "Project Builder"
      case "tower": return "Tower Builder"
      default: return "Property Builder"
    }
  }

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="ml-3 text-slate-600 font-medium">Verifying secure builder session...</p>
      </div>
    )
  }

  if (isEditLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="ml-3 text-slate-600 font-medium">Loading property data...</p>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Properties Created Successfully!</h1>
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex flex-col gap-1">
            <p>The following entities have been generated and saved:</p>
            <p className="font-medium text-slate-800 dark:text-slate-200 mt-2">
              {flowType === 'township' && `1 Township, `}
              {(flowType === 'township' || flowType === 'project') && `${state?.projects?.length || (flowType === 'project' ? 1 : 0)} Project${(state?.projects?.length || 1) !== 1 ? 's' : ''}, `}
              {`${generatedTowers?.length || 0} Tower${(generatedTowers?.length || 0) !== 1 ? 's' : ''}, `}
              {`and ${generatedUnits?.length || 0} Unit${(generatedUnits?.length || 0) !== 1 ? 's' : ''}.`}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <a href={`${currentUser?.role === "mandate" ? "/mandate-dashboard" : "/builder-dashboard"}?tab=properties&filter=published`} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Go to Dashboard</a>
            <button onClick={() => window.location.reload()} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors font-medium">Create Another</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 
        Changes made here for mobile: 
        1. Reduced padding (px-4 for mobile).
        2. Included ProgressBar inside this sticky header so it's always visible.
      */}
      <header className="sticky top-0 z-50 border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-200/80 dark:border-slate-800 shadow-sm transition-all">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-2.5">
          {/* Row 1: Primary Wizard Control */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              {/* Desktop Window Controls */}
              <div className="hidden xl:flex items-center gap-1.5 mr-1 select-none">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400/90 hover:opacity-100 transition-opacity"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/90 hover:opacity-100 transition-opacity"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/90 hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/10 text-white shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-base md:text-lg text-slate-900 dark:text-white truncate tracking-tight">
                  {getFlowTitle()}
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold leading-none">
                  {flowType === "township" ? "Mega Township" : "Standalone Property"}
                </p>
              </div>
            </div>

            <div className="flex-1 max-w-2xl px-0 md:px-8">
              <ProgressBar
                steps={[...STEPS, { id: STEPS.length + 1, name: "Review", description: "Review" }]}
                currentStep={displayStepIndex + 1}
              />
            </div>

            <div className="flex items-center gap-2 justify-end shrink-0">
              <div className="hidden lg:block text-right border-r pr-4 border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-0.5">Current Phase</p>
                <p className="text-sm font-black text-[#1A3C8C] dark:text-blue-400">
                  {isReviewStep ? "Final Review" : STEPS[displayStepIndex]?.name}
                </p>
              </div>

              {/* Auto-save status indicator */}
              <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 select-none">
                {isSaving ? (
                  <><Loader2 className="w-3 h-3 animate-spin text-blue-500" /><span className="text-blue-500">Saving...</span></>
                ) : draftError ? (
                  <><CloudOff className="w-3 h-3 text-red-400" /><span className="text-red-400">Save failed</span></>
                ) : lastSaved ? (
                  <><Clock className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600">Saved {Math.round((Date.now() - lastSaved.getTime()) / 60000) < 1 ? 'just now' : `${Math.round((Date.now() - lastSaved.getTime()) / 60000)}m ago`}</span></>
                ) : (
                  <><Save className="w-3 h-3 text-slate-400" /><span className="text-slate-400">Auto-save on</span></>
                )}
              </div>

              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white hover:text-blue-600 hover:border-blue-300 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold group shadow-sm disabled:opacity-50"
                title="Save Draft Now"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}<span className="hidden sm:inline">Save Draft</span><span className="software-kbd hidden xl:inline">Ctrl+S</span>
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to cancel? Unsaved changes will be lost.")) {
                    window.location.href = currentUser?.role === "mandate" ? "/mandate-dashboard" : "/builder-dashboard"
                  }
                }}
                disabled={isCreating}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-all flex items-center gap-1 text-xs font-bold group shadow-sm"
                title="Cancel / Close"
              >
                <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /><span className="hidden sm:inline">Close</span><span className="software-kbd hidden xl:inline">Esc</span>
              </button>
            </div>
          </div>

          {/* Row 2: Merged Entity Tabs (Visible only on Step 2, 3, 4) */}
          {(state?.currentStep >= 2 && state?.currentStep <= 4) && (
            <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center gap-2 overflow-x-auto software-scrollbar">
              {/* Step 2: Projects Navigation */}
              {state?.currentStep === 2 && flowType === "township" && (
                <Fragment key="step2-projects">
                  <LayoutGrid className="w-4 h-4 text-slate-400 ml-1 mr-2" />
                  {state?.projects?.map((p, i) => (
                    <button
                      key={p.id || `proj-${i}`}
                      onClick={() => setActiveProjectIdx(i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${activeProjectIdx === i
                        ? "bg-[#1A3C8C] text-white border-[#1A3C8C] shadow-md shadow-blue-500/10"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.name && p.reraNumber ? "bg-emerald-400" : "bg-orange-400"}`} />
                      {p.name || `Project ${i + 1}`}
                    </button>
                  ))}
                  <button
                    onClick={handleAddProject}
                    className="px-3 py-1.5 rounded-full text-xs font-bold text-emerald-600 border border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-all flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </Fragment>
              )}

              {/* Step 3: Towers Navigation */}
              {state.currentStep === 3 && (flowType === "township" || flowType === "project") && (
                <Fragment key="step3-towers">
                  <LayoutGrid className="w-4 h-4 text-slate-400 ml-1 mr-2" />
                  <select
                    className="bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-lg px-2 py-1 outline-none text-slate-700"
                    value={activeProjectIdx}
                    onChange={(e) => {
                      setActiveProjectIdx(Number(e.target.value))
                      setActiveTowerIdx(0)
                    }}
                  >
                    {state?.projects?.map((p, i) => (
                      <option key={p.id || `proj-opt-${i}`} value={i}>{p.name || `Project ${i + 1}`}</option>
                    ))}
                  </select>
                  <div className="w-px h-4 bg-slate-200 mx-2" />
                  {state?.towers?.filter(t => t.projectId === state?.projects?.[activeProjectIdx]?.id).map((t, i) => (
                    <button
                      key={t.id || `tower-${i}`}
                      onClick={() => setActiveTowerIdx(i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${activeTowerIdx === i
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        }`}
                    >
                      {t.name || `Tower ${i + 1}`}
                    </button>
                  ))}
                  <button
                    onClick={() => state?.projects?.[activeProjectIdx] && handleAddTower(state.projects[activeProjectIdx].id)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold text-emerald-600 border border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-all flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Tower
                  </button>
                </Fragment>
              )}

              {/* Step 4: Units Navigation */}
              {state.currentStep === 4 && (
                <Fragment key="step4-units">
                  <Layers className="w-4 h-4 text-slate-400 ml-1 mr-2" />
                  <button
                    onClick={() => { setActiveUnitProjectId("all"); setActiveUnitTowerId("global") }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${activeUnitTowerId === "global"
                      ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/10"
                      : "bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-slate-50"
                      }`}
                  >
                    Global Configuration
                  </button>
                  <div className="w-px h-4 bg-slate-200 mx-2" />
                  {state.projects.map((p, i) => (
                    <button
                      key={p.id || `unit-proj-${i}`}
                      onClick={() => {
                        setActiveUnitProjectId(p.id);
                        const pt = state.towers.filter(t => t.projectId === p.id);
                        if (pt.length > 0) setActiveUnitTowerId(pt[0].id);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${activeUnitProjectId === p.id && activeUnitTowerId !== "global"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        }`}
                    >
                      {p.name || `P${i + 1}`}
                    </button>
                  ))}

                  {(activeUnitProjectId !== "all" || flowType === "tower") && (
                    <Fragment key="unit-towers">
                      <div className="w-px h-4 bg-slate-200 mx-2" />
                      {state.towers.filter(t => flowType === "tower" || t.projectId === activeUnitProjectId).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setActiveUnitTowerId(t.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${activeUnitTowerId === t.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                            }`}
                        >
                          {t.name || "Tower"}
                        </button>
                      ))}
                    </Fragment>
                  )}
                </Fragment>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Draft Resume Banner */}
      {showResumeBanner && (
        <DraftResumeBanner
          flowType={flowType}
          draftId={draftIds.townshipId || draftIds.projectId || draftIds.towerId}
          onResume={(wizardState, step) => {
            // wizardState is the full WizardState snapshot stored in details.
            // Safely merge it with the current initial defaults so missing
            // keys (from old or partial drafts) never leave the wizard broken.
            const defaultState = getInitialState()
            setState({
              ...defaultState,
              ...wizardState,
              // Always restore sub-objects with fallbacks
              township: { ...defaultState.township, ...(wizardState?.township ?? {}) },
              projects: wizardState?.projects?.length > 0 ? wizardState.projects : defaultState.projects,
              towers: wizardState?.towers?.length > 0 ? wizardState.towers : defaultState.towers,
              unitTemplate: { ...defaultState.unitTemplate, ...(wizardState?.unitTemplate ?? {}) },
              towerUnitConfigs: wizardState?.towerUnitConfigs ?? defaultState.towerUnitConfigs,
              // step comes from lastSavedStep, not the snapshot's own currentStep
              currentStep: step,
            })
            setShowResumeBanner(false)
          }}
          onDiscard={() => {
            clearDraft()
            setShowResumeBanner(false)
          }}
        />
      )}

      <main className="container max-w-7xl mx-auto px-4 md:px-6 py-8 flex-1">
        <div className="mb-6 md:mb-10 space-y-2 md:space-y-3">
          {/* <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {isReviewStep ? "Review" : STEPS[displayStepIndex]?.name}
          </h2> */}
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            {/* {state.currentStep === 1 && "Define your township's core identity, location, and master plan"} */}
            {state?.currentStep === 2 &&
              `Configure ${flowType === "township" ? state?.township?.projectCount || 0 : state?.projects?.length || 0} individual projects`}
            {state?.currentStep === 3 && `Add towers and building details for ${state?.projects?.length || 0} projects`}
            {state?.currentStep === 4 &&
              `Customize unit configurations and pricing for each of ${state?.towers?.length || 0} towers`}
            {isReviewStep && `Review all ${totalEntities.toLocaleString()} entities before creating`}
          </p>
        </div>

        <div className="mb-8 min-h-[50vh] pb-24">
          {flowType === "township" && state?.currentStep === 1 && (
            <TownshipFlowForm
              key={state?.township?.id || "township-form"}
              data={state?.township}
              onChange={(updaterOrData) => {
                setState(prev => {
                  const next = typeof updaterOrData === "function"
                    ? updaterOrData(prev.township)
                    : updaterOrData
                  return { ...prev, township: next }
                })
              }}
              user={currentUser}
            />
          )}

          {flowType === "project" && state?.currentStep === 2 && (
            <ProjectFlowForm
              key={state?.projects?.[0]?.id || "project-form"}
              data={state?.projects?.[0]}
              onChange={(updaterOrData) => {
                setState(prev => {
                  const updated = [...(prev.projects || [])]
                  updated[0] = typeof updaterOrData === "function"
                    ? updaterOrData(updated[0])
                    : updaterOrData
                  return { ...prev, projects: updated }
                })
              }}
              townshipData={state?.township}
              onTownshipChange={(updaterOrData) => {
                setState(prev => {
                  const next = typeof updaterOrData === "function"
                    ? updaterOrData(prev.township)
                    : updaterOrData
                  return { ...prev, township: next }
                })
              }}
              showCommonData={true}
              user={currentUser}
            />
          )}

          {flowType === "tower" && state?.currentStep === 3 && (
            <TowerFlowForm
              key={state?.towers?.[0]?.id || "tower-form"}
              data={state?.towers?.[0]}
              onChange={(updaterOrData) => {
                setState(prev => {
                  const updated = [...(prev.towers || [])]
                  const currentTower = updated[0] || {}
                  updated[0] = typeof updaterOrData === "function"
                    ? updaterOrData(currentTower)
                    : { ...currentTower, ...updaterOrData } as TowerData
                  return { ...prev, towers: updated }
                })
              }}
              townshipData={state?.township}
              onTownshipChange={(updaterOrData) => {
                setState(prev => {
                  const next = typeof updaterOrData === "function"
                    ? updaterOrData(prev.township)
                    : updaterOrData
                  return { ...prev, township: next }
                })
              }}
              showCommonData={true}
              user={currentUser}
            />
          )}

          {flowType === "township" && state?.currentStep === 2 && (
            <ProjectsForm
              township={state?.township}
              projects={state?.projects}
              onChange={updateProjects}
              onCloneProject={handleCloneProject}
              activeIdx={activeProjectIdx}
              setActiveIdx={setActiveProjectIdx}
              isWizardMode={true}
            />
          )}

          {(flowType === "township" || flowType === "project") && state?.currentStep === 3 && (
            <TowersForm
              projects={state?.projects}
              towers={state?.towers}
              towerUnitConfigs={state.towerUnitConfigs}
              unitTemplate={state.unitTemplate}
              onTowersChange={updateTowers}
              onCloneTower={handleCloneTower}
              activeProjectIdx={activeProjectIdx}
              setActiveProjectIdx={setActiveProjectIdx}
              activeTowerIdx={activeTowerIdx}
              setActiveTowerIdx={setActiveTowerIdx}
            />
          )}

          {state?.currentStep === 4 && (
            <UnitsForm
              towers={generatedTowers}
              data={state?.unitTemplate}
              onChange={(newTemplate) => {
                setState(prev => {
                  const updatedTowerConfigs = prev.towerUnitConfigs.map(towerConfig => {
                    const syncedConfigurations: UnitConfiguration[] = []
                    
                    const globalConfigs = newTemplate.configurations || []
                    globalConfigs.forEach(globalConfig => {
                      const localConfigs = towerConfig.configurations || []
                      const localConfig = localConfigs.find((c: any) => c.id === globalConfig.id)
                      if (localConfig) {
                        // Exists locally. Merge fields, but respect overrides.
                        syncedConfigurations.push({
                          ...globalConfig,
                          ...localConfig,
                          basePrice: localConfig.isRateOverridden ? localConfig.basePrice : globalConfig.basePrice,
                          ratePerSqft: localConfig.isRateOverridden ? localConfig.ratePerSqft : globalConfig.ratePerSqft,
                          gstAmount: localConfig.isRateOverridden ? localConfig.gstAmount : globalConfig.gstAmount,
                          stampDutyAmount: localConfig.isRateOverridden ? localConfig.stampDutyAmount : globalConfig.stampDutyAmount,
                          totalTaxes: localConfig.isRateOverridden ? localConfig.totalTaxes : globalConfig.totalTaxes,
                          allInclusivePrice: localConfig.isRateOverridden ? localConfig.allInclusivePrice : globalConfig.allInclusivePrice,
                          parkingCharges: localConfig.isRateOverridden ? localConfig.parkingCharges : globalConfig.parkingCharges,
                          maintenancePerSqft: localConfig.isRateOverridden ? localConfig.maintenancePerSqft : globalConfig.maintenancePerSqft,
                        })
                      } else {
                        // New global config added
                        syncedConfigurations.push({ ...globalConfig })
                      }
                    })

                    const syncedFloorGroups: FloorGroup[] = []
                    const globalGroups = newTemplate.floorGroups || []
                    globalGroups.forEach(globalGroup => {
                      const localGroups = towerConfig.floorGroups || []
                      const localGroup = localGroups.find((g: any) => g.id === globalGroup.id)
                      if (localGroup) {
                        const hasCustomFloors = localGroup.floors && localGroup.floors.length > 0
                        syncedFloorGroups.push({
                          ...globalGroup,
                          ...localGroup,
                          floors: hasCustomFloors ? localGroup.floors : globalGroup.floors,
                          floorRange: hasCustomFloors ? localGroup.floorRange : globalGroup.floorRange,
                        })
                      } else {
                        syncedFloorGroups.push({ ...globalGroup })
                      }
                    })

                    return {
                      ...towerConfig,
                      basePrice: towerConfig.basePrice ?? newTemplate.basePrice,
                      ratePerSqft: towerConfig.ratePerSqft ?? newTemplate.ratePerSqft,
                      facingPremiums: { ...newTemplate.facingPremiums },
                      configurations: syncedConfigurations,
                      floorGroups: syncedFloorGroups
                    }
                  })

                  return {
                    ...prev,
                    unitTemplate: newTemplate,
                    towerUnitConfigs: updatedTowerConfigs
                  }
                })
              }}
              towerConfigs={state?.towerUnitConfigs}
              onTowerConfigsChange={(configs) => updateState("towerUnitConfigs", configs)}
              activeTowerId={activeUnitTowerId}
              setActiveTowerId={setActiveUnitTowerId}
              activeProjectId={activeUnitProjectId}
              setActiveProjectId={setActiveUnitProjectId}
            />
          )}

          {isReviewStep && (
            <WizardSummary
              state={{ ...state, generatedProjects: state.projects as any, generatedTowers, generatedUnits }}
              flowType={flowType}
            />
          )}
        </div>
      </main>

      {/* Side Navigation Buttons */}
      <button
        onClick={prevStep}
        disabled={state.currentStep === minStep}
        className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 p-3 md:p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-slate-600 dark:text-slate-300 hover:text-[#1A3C8C] dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-0 disabled:pointer-events-none group hidden sm:flex items-center justify-center"
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
      </button>

      {!isReviewStep ? (
        <button
          onClick={nextStep}
          className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 p-3 md:p-3.5 rounded-2xl bg-gradient-to-br from-[#1A3C8C] to-blue-700 text-white shadow-[0_8px_30px_rgba(26,60,140,0.4)] hover:shadow-blue-500/30 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/40 group hidden sm:flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-1 transition-transform" />
        </button>
      ) : (
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 p-3 md:p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-[0_8px_30px_rgba(16,185,129,0.4)] hover:shadow-emerald-500/30 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/40 disabled:opacity-50 disabled:scale-100 flex items-center justify-center group hidden sm:flex"
          title="Create All"
        >
          {isCreating ? (
            <span className="w-6 h-6 md:w-8 md:h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check className="w-6 h-6 md:w-8 md:h-8" />
          )}
        </button>
      )}
      
      {/* Mobile Sticky Bottom Action Bar (Native App Style) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {state.currentStep > minStep && (
            <button
              type="button"
              onClick={prevStep}
              className="h-12 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}

          {!isReviewStep ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 h-12 rounded-xl bg-[#1A3C8C] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Save & Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="flex-1 h-12 rounded-xl bg-[#2BB673] hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Entities...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit & Publish All</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Wizard...</div>}>
      <BuilderContent />
    </Suspense>
  )
}
