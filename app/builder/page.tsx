"use client"

import { useState, useCallback, useMemo, useEffect, Suspense } from "react"
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
      baseState.towers = [standaloneTower]
    }

    return baseState
  }, [flowType, stepOffset])

  const [state, setState] = useState<WizardState>(() => getInitialState())
  const [isComplete, setIsComplete] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showResumeBanner, setShowResumeBanner] = useState(true)

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

  const editId = searchParams.get("edit")

  // Load data if editing
  useEffect(() => {
    const loadProperty = async () => {
      if (editId) {
        try {
          const res = await fetch(`/api/properties/${editId}`)
          if (res.ok) {
            const data = await res.json()
            if (data.property) {
              const wizardData = data.property.details || data.property.data
              if (wizardData) {
                const defaultState = getInitialState()
                setState({
                  ...defaultState,
                  ...wizardData,
                  township: { ...defaultState.township, ...(wizardData.township || {}) },
                  projects: wizardData.projects || defaultState.projects,
                  towers: wizardData.towers || defaultState.towers,
                  unitTemplate: { ...defaultState.unitTemplate, ...(wizardData.unitTemplate || {}) },
                  towerUnitConfigs: wizardData.towerUnitConfigs || defaultState.towerUnitConfigs,
                })
                console.log("Loaded property from MongoDB:", data.property)
              }
            }
          }
        } catch (error) {
          console.error("Error loading property:", error)
        }
      }
    }
    loadProperty()
  }, [editId])

  // Auto draft hook
  const { draftIds, isSaving, lastSaved, draftError, saveNow, clearDraft } = useAutoDraft({
    flowType,
    currentStep: state?.currentStep || 1,
    state,
    debounceMs: 10000,
    enabled: !isAuthChecking,
  })

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
    setState(getInitialState())
    setIsComplete(false)
    setIsCreating(false)
  }, [flowType, getInitialState])

  // ── Auto-add projects when township.projectCount increases ────────────────
  // NOTE: We only ADD projects here, never remove them.
  // Removal is handled by the ProjectsForm's remove button.
  // This way, manually added projects are never wiped by this effect.
  useEffect(() => {
    if (flowType !== "township") return
    const currentCount = state.projects.length
    const targetCount = state.township.projectCount
    if (targetCount > currentCount) {
      const newProjects = Array.from({ length: targetCount - currentCount }, (_, i) =>
        createInitialProject(currentCount + i + 1),
      )
      setState((prev) => ({ ...prev, projects: [...prev.projects, ...newProjects] }))
    }
    // ⛔ Deliberately NOT cutting projects when targetCount < currentCount
    // ProjectsForm remove button handles deletion directly.
  }, [state.township.projectCount, flowType, state.projects.length])

  // ── Tower sync useEffect DISABLED ──────────────────────────────────────────
  // Reason: Towers are now fully manually managed via TowersForm (Step 3).
  // The old effect was overwriting manually added towers by resetting to
  // project.totalTowers count (default 0), causing "tower add nahi hota" bug.
  // Tower counts are kept in sync via the updateTowers callback below.

  const { unitTemplate, towers, towerUnitConfigs } = state

  const generatedTowers = useMemo<GeneratedTower[]>(() => {
    return towers.map((tower) => {
      const floors = Number.parseInt(tower.totalFloors.replace(/\D/g, "")) || 20
      const unitsPerFloor = Number.parseInt(tower.unitsPerFloor) || 4
      return {
        id: tower.id,
        projectId: tower.projectId,
        name: tower.name || `Tower ${tower.id.split("-").pop()?.toUpperCase()}`,
        reraNumber: tower.reraNumber,
        totalFloors: floors,
        unitsPerFloor,
        totalUnits: floors * unitsPerFloor,
      }
    })
  }, [towers])

  const generatedUnits = useMemo<GeneratedUnit[]>(() => {
    const units: GeneratedUnit[] = []
    const facings = ["north", "south", "east", "west", "north-east", "north-west", "south-east", "south-west"]

    generatedTowers.forEach((tower) => {
      const towerConfig = towerUnitConfigs.find((c) => c.towerId === tower.id)
      const configs = towerConfig?.configurations || unitTemplate.configurations
      const basePrice = towerConfig?.basePrice
        ? Number.parseFloat(towerConfig.basePrice)
        : Number.parseFloat(unitTemplate.basePrice)
      const ratePerSqft = towerConfig?.ratePerSqft
        ? Number.parseFloat(towerConfig.ratePerSqft)
        : Number.parseFloat(unitTemplate.ratePerSqft)
      const facingPremiums = towerConfig?.facingPremiums || unitTemplate.facingPremiums

      let unitNumber = 0
      for (let floor = 1; floor <= tower.totalFloors; floor++) {
        configs.forEach((config: any) => {
          for (let i = 0; i < config.countPerFloor; i++) {
            unitNumber++
            const facing = facings[(unitNumber - 1) % facings.length]

            const carpetArea = config.carpetArea || 0
            let finalPrice = carpetArea * ratePerSqft || basePrice

            const floorRiseStart = 5
            if (floor >= floorRiseStart) {
              const floorDiff = floor - floorRiseStart
              const risePercent = 0.5 / 100
              finalPrice = finalPrice * (1 + floorDiff * risePercent)
            }

            const facingPremium = Number.parseFloat(facingPremiums[facing as keyof typeof facingPremiums]) / 100
            finalPrice = finalPrice * (1 + facingPremium)

            units.push({
              id: `unit-${tower.id}-${floor}-${unitNumber}`,
              towerId: tower.id,
              unitNumber: `${tower.name.replace("Tower ", "")}-${floor}${String(unitNumber % 100).padStart(2, "0")}`,
              floor,
              floorNumber: floor,
              configuration: config.type,
              carpetArea,
              area: carpetArea,
              price: Math.round(finalPrice),
              facing,
              status: "available",
            })
          }
        })
      }
    })

    return units
  }, [unitTemplate, generatedTowers, towerUnitConfigs])

  // Ensure towerUnitConfigs are populated for all towers
  useEffect(() => {
    const missingConfigTowerIds = (state?.towers || [])
      .map((t) => t.id)
      .filter((id) => !state?.towerUnitConfigs?.some((c) => c.towerId === id))

    if (missingConfigTowerIds.length > 0) {
      console.log("Populating default configs for:", missingConfigTowerIds)
      const newConfigs = missingConfigTowerIds.map((towerId) => ({
        towerId,
        configurations: [...state.unitTemplate.configurations],
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
    // Also sync township.projectCount so summary is accurate
    setState((prev) => ({
      ...prev,
      projects,
      township: { ...prev.township, projectCount: projects.length },
    }))
  }, [])

  const updateTowers = useCallback((towers: TowerData[]) => {
    // Also sync each project's totalTowers count from actual towers array
    setState((prev) => {
      const updatedProjects = prev.projects.map(p => ({
        ...p,
        totalTowers: towers.filter(t => t.projectId === p.id).length,
      }))
      return { ...prev, towers, projects: updatedProjects }
    })
  }, [])

  // ── Auto-sync township counts ──────────────────────────────────────────
  useEffect(() => {
    const towersCount = state?.towers?.length || 0
    const unitsCount = generatedUnits?.length || 0
    const projectsCount = state?.projects?.length || 0
    // totalFamilies is typically same as totalUnits for initial estimation
    const familiesCount = unitsCount

    if (
      state.township.projectCount !== projectsCount ||
      state.township.totalTowers !== towersCount ||
      state.township.totalUnits !== unitsCount ||
      state.township.totalFamilies !== familiesCount
    ) {
      setState(prev => ({
        ...prev,
        township: {
          ...prev.township,
          projectCount: projectsCount,
          totalTowers: towersCount,
          totalUnits: unitsCount,
          totalFamilies: familiesCount
        }
      }))
    }
  }, [state.projects.length, state.towers.length, generatedUnits.length, state.township.projectCount, state.township.totalTowers, state.township.totalUnits, state.township.totalFamilies])

  const handleAddProject = useCallback(() => {
    const newProject = createInitialProject(state.township.name, state.projects.length)
    const next = [...state.projects, newProject]
    updateProjects(next)
    setActiveProjectIdx(next.length - 1)
  }, [state.projects, state.township.name, updateProjects])

  const handleAddTower = useCallback((projectId: string) => {
    const projectTowers = state.towers.filter(t => t.projectId === projectId)
    const newTower = createInitialTower(projectTowers.length, projectId)
    const next = [...state.towers, newTower]
    updateTowers(next)
    setActiveTowerIdx(next.filter(t => t.projectId === projectId).length - 1)
  }, [state.towers, updateTowers])

  const handleCloneTower = useCallback((towerId: string) => {
    const originalTower = state.towers.find(t => t.id === towerId)
    if (!originalTower) return

    const newTowerId = `tower-${crypto.randomUUID()}`
    const clonedTower: TowerData = {
      ...originalTower,
      id: newTowerId,
      name: `${originalTower.name} (Copy)`,
    }

    // Clone units as well
    const originalConfig = state.towerUnitConfigs.find(c => c.towerId === towerId)
    let newConfigs = state.towerUnitConfigs
    if (originalConfig) {
      newConfigs = [...state.towerUnitConfigs, { ...originalConfig, towerId: newTowerId }]
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

    const newProjectId = `proj-${crypto.randomUUID()}`
    const clonedProject: ProjectData = {
      ...originalProject,
      id: newProjectId,
      name: `${originalProject.name} (Copy)`,
    }

    // Clone towers of this project
    const projectTowers = state.towers.filter(t => t.projectId === projectId)
    const clonedTowers = projectTowers.map(tower => {
      const newTowerId = `tower-${crypto.randomUUID()}`
      return { ...tower, id: newTowerId, projectId: newProjectId }
    })

    // Clone units of those towers
    const clonedConfigs = projectTowers.flatMap(tower => {
      const originalConfig = state.towerUnitConfigs.find(c => c.towerId === tower.id)
      if (originalConfig) {
        // Find the new tower id for this tower
        const newTowerId = clonedTowers.find(ct => ct.name === tower.name)?.id // names might not be unique but here they are same
        // Actually better to map them safely
        return [] // We'll do it better below
      }
      return []
    })

    // Correct way to clone nested structure
    const towerConfigsToAdd: any[] = []
    const finalClonedTowers = projectTowers.map(tower => {
      const newTowerId = `tower-${crypto.randomUUID()}`
      const originalConfig = state.towerUnitConfigs.find(c => c.towerId === tower.id)
      if (originalConfig) {
        towerConfigsToAdd.push({ ...originalConfig, towerId: newTowerId })
      }
      return { ...tower, id: newTowerId, projectId: newProjectId }
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
    // ⚠️ Validation temporarily disabled — enable before production
    return true
  }, [])

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
    window.location.href = "/builder-dashboard?tab=properties&filter=drafts"
  }


  const handleCreate = async () => {
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

      // Sequential Creation Flow
      if (flowType === "township") {
        const rootName = state.township?.name || "Untitled Township"
        const rootLoc = { city: state.township?.city, state: state.township?.state }
        
        const townshipId = await createApi({
          type: 'township',
          name: rootName,
          location: rootLoc,
          details: state.township,
          status: 'active'
        })
        
        for (const proj of state.projects) {
           const projectId = await createApi({
             type: 'project',
             parentId: townshipId,
             name: proj.name || "Untitled Project",
             location: { city: (proj as any).city, state: (proj as any).state },
             details: proj,
             status: 'active'
           })

           const projTowers = generatedTowers.filter(t => t.projectId === proj.id)
           for (const tow of projTowers) {
              await createApi({
                type: 'tower',
                parentId: projectId,
                name: tow.name || "Untitled Tower",
                details: { ...tow, unitConfig: state.towerUnitConfigs.find(c => c.towerId === tow.id) },
                status: 'active'
              })
           }
        }
      } else if (flowType === "project") {
        const rootProj = state.projects[0]
        const projectId = await createApi({
             type: 'project',
             name: rootProj?.name || "Untitled Project",
             location: { city: (rootProj as any)?.city, state: (rootProj as any)?.state },
             details: rootProj,
             status: 'active'
        })
        
        for (const tow of generatedTowers) {
            await createApi({
                type: 'tower',
                parentId: projectId,
                name: tow.name || "Untitled Tower",
                details: { ...tow, unitConfig: state.towerUnitConfigs.find(c => c.towerId === tow.id) },
                status: 'active'
            })
        }
      } else if (flowType === "tower") {
         const rootTow = state.towers[0]
         await createApi({
                type: 'tower',
                name: rootTow?.name || "Untitled Tower",
                details: { ...rootTow, unitConfig: state.towerUnitConfigs[0] },
                status: 'active'
         })
      }

      // Note: Units are handled in a separate upcoming flow per the strict schema.

      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsCreating(false)
      setIsComplete(true)
      clearDraft() // Clear draft from localStorage on successful publish
      setTimeout(() => {
        window.location.href = "/builder-dashboard?tab=properties&filter=active"
      }, 1500)
    } catch (error: any) {
      console.error("Error creating property:", error)
      setIsCreating(false)
      alert(error.message || "Failed to create property structure. Please ensure all required fields are filled.")
    }
  }

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

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Properties Created Successfully!</h1>
          <p className="text-xs text-muted-foreground mb-6">
            {totalEntities.toLocaleString()} properties have been created and are ready for use.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/builder-dashboard?tab=properties&filter=published" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Go to Dashboard</a>
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
      <header className="sticky top-0 z-50 border-b bg-white dark:bg-slate-900 shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-3">
          {/* Row 1: Primary Wizard Control */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/10 text-white shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-base md:text-lg text-slate-900 dark:text-white truncate">
                  {getFlowTitle()}
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold leading-none">
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
              <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border">
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
                className="p-2.5 rounded-xl bg-slate-100/50 border border-slate-200 text-slate-600 hover:bg-white hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all group"
                title="Save Draft Now"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to cancel? Unsaved changes will be lost.")) {
                    window.location.href = "/builder-dashboard"
                  }
                }}
                disabled={isCreating}
                className="p-2.5 rounded-xl bg-slate-100/50 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:shadow-sm transition-all group"
                title="Cancel / Close"
              >
                <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* Row 2: Merged Entity Tabs (Visible only on Step 2, 3, 4) */}
          {(state?.currentStep >= 2 && state?.currentStep <= 4) && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {/* Step 2: Projects Navigation */}
              {state?.currentStep === 2 && flowType === "township" && (
                <>
                  <LayoutGrid className="w-4 h-4 text-slate-400 ml-1 mr-2" />
                  {state?.projects?.map((p, i) => (
                    <button
                      key={p.id}
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
                </>
              )}

              {/* Step 3: Towers Navigation */}
              {state.currentStep === 3 && (flowType === "township" || flowType === "project") && (
                <>
                  <LayoutGrid className="w-4 h-4 text-slate-400 ml-1 mr-2" />
                  {/* Project Selector first */}
                  <select
                    className="bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-lg px-2 py-1 outline-none text-slate-700"
                    value={activeProjectIdx}
                    onChange={(e) => {
                      setActiveProjectIdx(Number(e.target.value))
                      setActiveTowerIdx(0)
                    }}
                  >
                    {state?.projects?.map((p, i) => (
                      <option key={p.id} value={i}>{p.name || `Project ${i + 1}`}</option>
                    ))}
                  </select>
                  <div className="w-px h-4 bg-slate-200 mx-2" />
                  {/* Towers in active project */}
                  {state?.towers?.filter(t => t.projectId === state?.projects?.[activeProjectIdx]?.id).map((t, i) => (
                    <button
                      key={t.id}
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
                </>
              )}

              {/* Step 4: Units Navigation */}
              {state.currentStep === 4 && (
                <>
                  <Layers className="w-4 h-4 text-slate-400 ml-1 mr-2" />
                  <button
                    onClick={() => { setActiveUnitProjectId("all"); setActiveUnitTowerId("global") }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${activeUnitTowerId === "global"
                      ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/10"
                      : "bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-slate-50"
                      }`}
                  >
                    Global Pricing
                  </button>
                  <div className="w-px h-4 bg-slate-200 mx-2" />
                  {/* Project Selector for units */}
                  {state.projects.map((p, i) => (
                    <button
                      key={p.id}
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

                  {activeUnitProjectId !== "all" && (
                    <>
                      <div className="w-px h-4 bg-slate-200 mx-2" />
                      {state.towers.filter(t => t.projectId === activeUnitProjectId).map((t) => (
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
                    </>
                  )}
                </>
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
          onResume={(details, step) => {
            setState(prev => ({ ...prev, ...details, currentStep: step }))
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
              data={state?.township}
              onChange={(data) => updateState("township", data)}
              user={currentUser}
            />
          )}

          {flowType === "project" && state?.currentStep === 2 && (
            <ProjectFlowForm
              data={state?.projects?.[0]}
              onChange={(data) => {
                const updated = [...(state?.projects || [])]
                updated[0] = data
                setState((prev) => ({ ...prev, projects: updated }))
              }}
              townshipData={state?.township}
              onTownshipChange={(data) => updateState("township", data)}
              showCommonData={true}
              user={currentUser}
            />
          )}

          {flowType === "tower" && state?.currentStep === 3 && (
            <TowerFlowForm
              data={state?.towers?.[0]}
              onChange={(data) => {
                const updated = [...(state?.towers || [])]
                updated[0] = data
                setState((prev) => ({ ...prev, towers: updated }))
              }}
              townshipData={state?.township}
              onTownshipChange={(data) => updateState("township", data)}
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
              onChange={(data) => updateState("unitTemplate", data)}
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
        className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-slate-600 hover:text-[#1A3C8C] hover:border-blue-300 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-0 disabled:pointer-events-none group hidden sm:flex"
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
      </button>

      {!isReviewStep ? (
        <button
          onClick={nextStep}
          className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-[#1A3C8C] text-white shadow-[0_8px_30px_rgba(26,60,140,0.4)] hover:bg-blue-700 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/40 group hidden sm:flex"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-1 transition-transform" />
        </button>
      ) : (
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-[#2BB673] text-white shadow-[0_8px_30px_rgba(43,182,115,0.4)] hover:bg-emerald-600 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/40 disabled:opacity-50 disabled:scale-100 flex items-center justify-center group hidden sm:flex"
          title="Create All"
        >
          {isCreating ? (
            <span className="w-6 h-6 md:w-8 md:h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check className="w-6 h-6 md:w-8 md:h-8" />
          )}
        </button>
      )}
      
      {/* Mobile Floating Actions (Visible only on small screens) */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 sm:hidden">
        <button
          onClick={prevStep}
          disabled={state.currentStep === minStep}
          className="p-3 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 text-slate-700 disabled:opacity-0 disabled:pointer-events-none transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        {!isReviewStep ? (
          <button
            onClick={nextStep}
            className="p-4 rounded-full bg-[#1A3C8C] text-white shadow-[0_8px_30px_rgba(26,60,140,0.4)] transition-all"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="p-4 rounded-full bg-[#2BB673] text-white shadow-[0_8px_30px_rgba(43,182,115,0.4)] transition-all disabled:opacity-50"
          >
            {isCreating ? <span className="w-7 h-7 flex items-center justify-center text-xs">...</span> : <Check className="w-7 h-7" />}
          </button>
        )}
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
