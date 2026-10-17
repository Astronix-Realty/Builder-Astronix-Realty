"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Building,
  Building2,
  Home,
  Layers,
  Network,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  DoorClosed,
  Database,
  Hash,
  Compass,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Workflow,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface HierarchyPropertyInfo {
  id: string
  name: string
  flowType?: string
  status?: string
}

interface ParentInfo {
  _id: string
  name: string
  type: string
  reraNumber?: string
}

interface HierarchyData {
  property: {
    _id: string
    name: string
    type: "township" | "project" | "tower"
    flowType?: string
    location?: { city?: string; state?: string; address?: string }
    status?: string
    reraNumber?: string
    parentId?: string | null
    parentHierarchy?: {
      township?: ParentInfo
      project?: ParentInfo
    }
  }
  projects: Array<{
    _id: string
    name: string
    towerCount: number
    unitCount: number
    reraNumber?: string
  }>
  towers: Array<{
    _id: string
    name: string
    projectId: string | null
    floorCount: number
    unitCount: number
    baseRate: number
  }>
  units: Array<{
    _id: string
    id?: string
    unitNumber: string
    floorNumber: number
    configuration: string
    area: number
    carpetArea?: number
    price: number
    ratePerSqft: number
    status: string
    towerId: string
    projectId?: string | null
    facing?: string
  }>
}

interface PropertyHierarchyModalProps {
  isOpen: boolean
  onClose: () => void
  property: HierarchyPropertyInfo | null
}

export default function PropertyHierarchyModal({
  isOpen,
  onClose,
  property,
}: PropertyHierarchyModalProps) {
  const [data, setData] = useState<HierarchyData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Layout & View Mode States
  const [isFullscreen, setIsFullscreen] = useState(true)
  const [viewMode, setViewMode] = useState<"flowchart" | "list">("flowchart")
  const [zoom, setZoom] = useState(100)
  const [selectedTower, setSelectedTower] = useState<any | null>(null)

  // Collapsible state for projects and towers in List View
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({})
  const [collapsedTowers, setCollapsedTowers] = useState<Record<string, boolean>>({})

  // Fetch hierarchy when modal opens
  useEffect(() => {
    if (!isOpen || !property?.id) {
      setData(null)
      setError(null)
      setIsLoading(false)
      setSelectedTower(null)
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError(null)
    setCollapsedProjects({})
    setCollapsedTowers({})
    setSelectedTower(null)

    const fetchHierarchy = async () => {
      try {
        const res = await fetch(`/api/inventory/${property.id}`)
        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Failed to load hierarchy (HTTP ${res.status}): ${errText}`)
        }
        const json = await res.json()
        if (isMounted) {
          setData(json)
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Error fetching hierarchy:", err)
          setError(err.message || "Failed to load hierarchy")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchHierarchy()

    return () => {
      isMounted = false
    }
  }, [isOpen, property?.id])

  // Format currency for base rate
  const formatBaseRate = (rate?: number) => {
    if (!rate || rate <= 0) return "N/A"
    return (
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(rate) + " / sqft"
    )
  }

  // Format price
  const formatPrice = (price?: number) => {
    if (!price || price <= 0) return ""
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(price)
  }

  // Determine hierarchy mode: "township" | "project" | "tower"
  const hierarchyMode = useMemo(() => {
    const rawType = data?.property?.type || property?.flowType || "township"
    if (rawType === "township") return "township"
    if (rawType === "project") return "project"
    if (rawType === "tower") return "tower"
    return "township"
  }, [data?.property?.type, property?.flowType])

  // Group towers by projectId for township view
  const { projectTowersMap, directTowers } = useMemo(() => {
    if (!data) return { projectTowersMap: new Map<string, any[]>(), directTowers: [] }

    const map = new Map<string, any[]>()
    const direct: any[] = []

    const validProjectIds = new Set(data.projects.map((p) => p._id))

    data.towers.forEach((tower) => {
      if (tower.projectId && validProjectIds.has(tower.projectId)) {
        const list = map.get(tower.projectId) || []
        list.push(tower)
        map.set(tower.projectId, list)
      } else {
        direct.push(tower)
      }
    })

    return { projectTowersMap: map, directTowers: direct }
  }, [data])

  // Group units by towerId for project and tower views
  const towerUnitsMap = useMemo(() => {
    if (!data) return new Map<string, any[]>()
    const map = new Map<string, any[]>()

    data.units.forEach((unit) => {
      const tid = unit.towerId
      if (tid) {
        const list = map.get(tid) || []
        list.push(unit)
        map.set(tid, list)
      }
    })

    return map
  }, [data])

  // Toggle project accordion (List view)
  const toggleProject = (projectId: string) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }))
  }

  // Toggle tower accordion (List view)
  const toggleTower = (towerId: string) => {
    setCollapsedTowers((prev) => ({
      ...prev,
      [towerId]: !prev[towerId],
    }))
  }

  // Build breadcrumb items based on hierarchy level
  const breadcrumbLevels = useMemo(() => {
    if (hierarchyMode === "township") {
      return [
        { label: "Township", icon: Compass, color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" },
        { label: "Projects", icon: Building2, color: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
        { label: "Towers", icon: Building, color: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800" },
      ]
    }
    if (hierarchyMode === "project") {
      return [
        { label: "Project", icon: Building2, color: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
        { label: "Towers", icon: Building, color: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800" },
        { label: "Units", icon: DoorClosed, color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
      ]
    }
    return [
      { label: "Tower", icon: Building, color: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800" },
      { label: "Units", icon: DoorClosed, color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
    ]
  }, [hierarchyMode])

  const parentTownship = data?.property?.parentHierarchy?.township
  const parentProject = data?.property?.parentHierarchy?.project

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className={cn(
          "flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-0 overflow-hidden transition-all duration-300",
          isFullscreen
            ? "w-[98vw] max-w-[98vw] sm:max-w-[98vw] md:max-w-[98vw] lg:max-w-[98vw] xl:max-w-[98vw] 2xl:max-w-[98vw] h-[96vh] max-h-[96vh] rounded-2xl"
            : "w-[92vw] max-w-5xl sm:max-w-5xl md:max-w-5xl lg:max-w-5xl h-[88vh] max-h-[88vh] rounded-2xl"
        )}
      >
        {/* Fullscreen Toggle Button */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-4 right-12 z-20 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>

        {/* Modal Header */}
        <DialogHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-20">
            {/* Breadcrumb Path Strip */}
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
                <Network className="h-3.5 w-3.5 text-blue-500" />
                Hierarchy:
              </span>
              {breadcrumbLevels.map((lvl, idx) => {
                const Icon = lvl.icon
                return (
                  <React.Fragment key={lvl.label}>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold shadow-xs ${lvl.color}`}
                    >
                      <Icon className="h-3 w-3" />
                      {lvl.label}
                    </span>
                    {idx < breadcrumbLevels.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
                    )}
                  </React.Fragment>
                )
              })}
            </div>

            {/* View Switcher & Controls */}
            <div className="flex items-center gap-3">
              {/* Segmented Switcher */}
              <div className="flex items-center p-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg border border-slate-300/60 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("flowchart")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all",
                    viewMode === "flowchart"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  <Workflow className="h-3.5 w-3.5 text-blue-500" />
                  Flowchart View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all",
                    viewMode === "list"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  <Layers className="h-3.5 w-3.5 text-slate-500" />
                  Nested List
                </button>
              </div>

              {/* Zoom Controls (Flowchart Only) */}
              {viewMode === "flowchart" && (
                <div className="hidden md:flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.max(50, prev - 10))}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10.5px] font-mono font-bold w-9 text-center text-slate-700 dark:text-slate-200">
                    {zoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.min(150, prev + 10))}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(100)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-0.5"
                    title="Reset Zoom (100%)"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {hierarchyMode.toUpperCase()}
                </span>
                {data?.property?.status && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      data.property.status === "published"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : data.property.status === "pending"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {data.property.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogTitle className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-2">
            <span className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              {hierarchyMode === "township" ? (
                <Compass className="h-4.5 w-4.5" />
              ) : hierarchyMode === "project" ? (
                <Building2 className="h-4.5 w-4.5" />
              ) : (
                <Building className="h-4.5 w-4.5" />
              )}
            </span>
            <span className="truncate">{property?.name || data?.property?.name || "Property Hierarchy"}</span>
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            {data?.property?._id && (
              <span className="font-mono text-[11px] flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <Hash className="h-3 w-3" />
                ID: {data.property._id}
              </span>
            )}
            {data?.property?.location?.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                {data.property.location.city}
                {data.property.location.state ? `, ${data.property.location.state}` : ""}
              </span>
            )}
            {data?.property?.reraNumber && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-150 dark:border-blue-900/50 font-bold">
                <ShieldCheck className="h-3 w-3" />
                RERA: {data.property.reraNumber}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-50/40 dark:bg-slate-950/40">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-9 w-9 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
                Building interactive hierarchy flowchart...
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Fetching connected township, projects, towers, and units
              </p>
            </div>
          ) : error ? (
            <div className="p-8 m-6 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto" />
              <h4 className="text-sm font-bold text-red-900 dark:text-red-200">Hierarchy Error</h4>
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          ) : !data ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
              <Building className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No hierarchy data available</p>
            </div>
          ) : viewMode === "flowchart" ? (
            /* ══════════════════════════════════════════════════════════════════
               1. FLOWCHART TREE VIEW (Top-to-Bottom Diagram)
               ══════════════════════════════════════════════════════════════════ */
            <div className="flex-1 overflow-auto p-8 flex justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                }}
                className="transition-transform duration-150 ease-out min-w-max pb-16"
              >
                {/* ─────────────────────────────────────────────────────────────
                    CASE 1: TOWNSHIP FLOWCHART (Township → Projects → Towers)
                    ───────────────────────────────────────────────────────────── */}
                {hierarchyMode === "township" && (
                  <div className="flex flex-col items-center">
                    {/* LEVEL 1: Root Township Node Card */}
                    <div className="w-[420px] rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/50 dark:border-indigo-500/60 shadow-xl shadow-indigo-500/10 p-5 text-center relative z-10 transition-all hover:scale-[1.01] hover:border-indigo-600">
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider mb-2 border border-indigo-200 dark:border-indigo-800">
                        <Compass className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        Level 1 · Root Township
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {data.property.name}
                      </h3>
                      <div className="flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        {data.property.location?.city && (
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {data.property.location.city}
                          </span>
                        )}
                        {data.property.reraNumber && (
                          <span className="flex items-center gap-1 font-mono text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-800/40 font-bold">
                            <ShieldCheck className="h-3 w-3" />
                            {data.property.reraNumber}
                          </span>
                        )}
                      </div>

                      {/* Telemetry Count Strip */}
                      <div className="mt-3.5 pt-3 border-t border-slate-150 dark:border-slate-800 flex items-center justify-around text-xs">
                        <div>
                          <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                            {data.projects.length}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Projects
                          </div>
                        </div>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                        <div>
                          <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                            {data.towers.length}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Towers
                          </div>
                        </div>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                        <div>
                          <div className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                            {data.units.length}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Units
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Connector Stem down from Township */}
                    {data.projects.length > 0 && (
                      <div className="w-0.5 h-10 bg-indigo-500 dark:bg-indigo-400 relative">
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900 shadow-xs" />
                      </div>
                    )}

                    {/* LEVEL 2: Projects Branches (Side by Side) */}
                    {data.projects.length > 0 && (
                      <div className="flex items-start justify-center gap-12 pt-0">
                        {data.projects.map((proj, pIdx) => {
                          const projTowers = projectTowersMap.get(proj._id) || []
                          const isFirst = pIdx === 0
                          const isLast = pIdx === data.projects.length - 1
                          const isOnlyOne = data.projects.length === 1

                          return (
                            <div key={proj._id || pIdx} className="flex flex-col items-center relative">
                              {/* Horizontal Branching Bar for Projects */}
                              {!isOnlyOne && (
                                <div
                                  className={cn(
                                    "absolute top-0 h-0.5 bg-indigo-500 dark:bg-indigo-400",
                                    isFirst && "left-1/2 right-0",
                                    isLast && "left-0 right-1/2",
                                    !isFirst && !isLast && "left-0 right-0"
                                  )}
                                />
                              )}

                              {/* Vertical Drop Connector into Project Card */}
                              <div className="w-0.5 h-8 bg-indigo-500 dark:bg-indigo-400 relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-500" />
                              </div>

                              {/* Project Card */}
                              <div className="w-[340px] rounded-xl bg-white dark:bg-slate-900 border-2 border-blue-500/40 dark:border-blue-500/50 shadow-md shadow-blue-500/5 p-4 relative z-10 transition-all hover:border-blue-600 hover:shadow-xl">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                                    <Building2 className="h-3 w-3" />
                                    Project #{pIdx + 1}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-mono">
                                    {projTowers.length} {projTowers.length === 1 ? "Tower" : "Towers"}
                                  </span>
                                </div>
                                <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                  {proj.name}
                                </h4>
                                {proj._id && (
                                  <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                                    <Hash className="h-2.5 w-2.5" />
                                    ID: {proj._id}
                                  </div>
                                )}
                              </div>

                              {/* Connector Stem down from Project into its Towers */}
                              {projTowers.length > 0 && (
                                <div className="w-0.5 h-8 bg-blue-400 dark:bg-blue-500 relative">
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" />
                                </div>
                              )}

                              {/* LEVEL 3: Towers Row under this Project */}
                              {projTowers.length > 0 && (
                                <div className="flex items-start justify-center gap-3.5 pt-0">
                                  {projTowers.map((tower, tIdx) => {
                                    const isTowerFirst = tIdx === 0
                                    const isTowerLast = tIdx === projTowers.length - 1
                                    const isTowerOnlyOne = projTowers.length === 1

                                    return (
                                      <div
                                        key={tower._id || tIdx}
                                        className="flex flex-col items-center relative"
                                      >
                                        {/* Horizontal Branching Bar for Towers */}
                                        {!isTowerOnlyOne && (
                                          <div
                                            className={cn(
                                              "absolute top-0 h-0.5 bg-blue-400 dark:bg-blue-500",
                                              isTowerFirst && "left-1/2 right-0",
                                              isTowerLast && "left-0 right-1/2",
                                              !isTowerFirst && !isTowerLast && "left-0 right-0"
                                            )}
                                          />
                                        )}

                                        {/* Vertical Drop Connector into Tower Card */}
                                        <div className="w-0.5 h-6 bg-blue-400 dark:bg-blue-500" />

                                        {/* Tower Card */}
                                        <div
                                          onClick={() => setSelectedTower(tower)}
                                          className="w-[180px] rounded-xl bg-white dark:bg-slate-900 border-2 border-cyan-400/40 dark:border-cyan-500/40 shadow-xs hover:border-cyan-500 hover:shadow-md p-3 transition-all duration-200 cursor-pointer group text-left"
                                        >
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-200">
                                              <Building className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <h5 className="font-bold text-slate-900 dark:text-white text-xs truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                                                {tower.name}
                                              </h5>
                                              <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">
                                                Tower #{tIdx + 1}
                                              </span>
                                            </div>
                                          </div>

                                          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10.5px]">
                                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                              <span className="text-slate-400">Floors:</span>
                                              <span className="font-bold font-mono">{tower.floorCount || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                              <span className="text-slate-400">Units:</span>
                                              <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                                                {tower.unitCount || 0}
                                              </span>
                                            </div>
                                            {tower.baseRate > 0 && (
                                              <div className="mt-1 pt-1 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                                <span className="text-[9.5px] text-slate-400">Rate:</span>
                                                <span className="text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                  {formatBaseRate(tower.baseRate)}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Direct Towers Branch (if any) */}
                    {directTowers.length > 0 && (
                      <div className="flex flex-col items-center mt-8">
                        <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700" />
                        <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border text-[11px] font-bold text-slate-500 mb-2">
                          Direct Towers in Township ({directTowers.length})
                        </div>
                        <div className="flex items-start justify-center gap-4">
                          {directTowers.map((tower, tIdx) => (
                            <div
                              key={tower._id || tIdx}
                              onClick={() => setSelectedTower(tower)}
                              className="w-[180px] rounded-xl bg-white dark:bg-slate-900 border-2 border-cyan-400/40 p-3 shadow-xs hover:border-cyan-500 cursor-pointer"
                            >
                              <h5 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                {tower.name}
                              </h5>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {tower.floorCount || 0} Floors · {tower.unitCount || 0} Units
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    CASE 2: PROJECT FLOWCHART (Project → Towers → Units)
                    ───────────────────────────────────────────────────────────── */}
                {hierarchyMode === "project" && (
                  <div className="flex flex-col items-center">
                    {/* Project Node */}
                    <div className="w-[380px] rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-500/50 shadow-xl p-5 text-center relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider mb-2">
                        <Building2 className="h-3.5 w-3.5" />
                        Level 1 · Selected Project
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {data.property.name}
                      </h3>
                      <div className="mt-3 pt-3 border-t border-slate-150 dark:border-slate-800 flex justify-around text-xs">
                        <div>
                          <div className="text-sm font-black font-mono">{data.towers.length}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Towers</div>
                        </div>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                        <div>
                          <div className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                            {data.units.length}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Units</div>
                        </div>
                      </div>
                    </div>

                    {/* Stem down */}
                    {data.towers.length > 0 && (
                      <div className="w-0.5 h-10 bg-blue-500 relative">
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                      </div>
                    )}

                    {/* Towers Row */}
                    <div className="flex items-start justify-center gap-6 pt-0">
                      {data.towers.map((tower, tIdx) => {
                        const towerUnits = towerUnitsMap.get(tower._id) || []
                        const isFirst = tIdx === 0
                        const isLast = tIdx === data.towers.length - 1
                        const isOnly = data.towers.length === 1

                        return (
                          <div key={tower._id || tIdx} className="flex flex-col items-center relative">
                            {!isOnly && (
                              <div
                                className={cn(
                                  "absolute top-0 h-0.5 bg-blue-500",
                                  isFirst && "left-1/2 right-0",
                                  isLast && "left-0 right-1/2",
                                  !isFirst && !isLast && "left-0 right-0"
                                )}
                              />
                            )}
                            <div className="w-0.5 h-8 bg-blue-500" />
                            <div
                              onClick={() => setSelectedTower(tower)}
                              className="w-[200px] rounded-xl bg-white dark:bg-slate-900 border-2 border-cyan-400/50 p-3.5 shadow-sm hover:border-cyan-500 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Building className="h-4 w-4 text-cyan-600" />
                                <h5 className="font-bold text-xs truncate">{tower.name}</h5>
                              </div>
                              <div className="text-[11px] text-slate-500 space-y-1">
                                <div>{tower.floorCount || 0} Floors</div>
                                <div className="text-blue-600 font-bold">
                                  {towerUnits.length || tower.unitCount || 0} Units
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    CASE 3: TOWER FLOWCHART (Tower → Units Breakdown)
                    ───────────────────────────────────────────────────────────── */}
                {hierarchyMode === "tower" && (
                  <div className="flex flex-col items-center">
                    <div className="w-[360px] rounded-2xl bg-white dark:bg-slate-900 border-2 border-cyan-500/50 shadow-xl p-5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-[10px] font-black uppercase tracking-wider mb-2">
                        <Building className="h-3.5 w-3.5" />
                        Level 1 · Selected Tower
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {data.property.name}
                      </h3>
                      <div className="text-xs text-slate-500 mt-2">
                        {data.units.length} Total Configured Units
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════════
               2. NESTED LIST / ACCORDION VIEW
               ══════════════════════════════════════════════════════════════════ */
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Parent Context Banner (if viewing sub-entity) */}
              {(parentTownship || parentProject) && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                      Parent Context
                    </span>
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      {parentTownship && (
                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                          <Compass className="h-3.5 w-3.5" />
                          {parentTownship.name}
                        </span>
                      )}
                      {parentTownship && parentProject && (
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      )}
                      {parentProject && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                          <Building2 className="h-3.5 w-3.5" />
                          {parentProject.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {parentProject?._id || parentTownship?._id}
                  </span>
                </div>
              )}

              {/* LIST VIEW CASE 1: TOWNSHIP */}
              {hierarchyMode === "township" && (
                <div className="relative pl-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-[2px] before:bg-indigo-200 dark:before:bg-indigo-950/80 space-y-6">
                  {/* LEVEL 1: Township Header Card */}
                  <div className="relative">
                    <div className="absolute -left-[30px] top-1.5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-md">
                      1
                    </div>
                    <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Compass className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                              Level 1 · Root Township
                            </span>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {data.property.name}
                            </h3>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
                            {data.projects.length} Projects · {data.towers.length} Towers
                          </span>
                          {data.units.length > 0 && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {data.units.length} Configured Units
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LEVEL 2 & 3: Projects with their Towers */}
                  <div className="relative space-y-4">
                    <div className="absolute -left-[30px] top-1.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-md">
                      2
                    </div>
                    <div className="flex items-center justify-between pb-1">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        Level 2 · Projects ({data.projects.length})
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Level 3 · Towers under each project
                      </span>
                    </div>

                    {data.projects.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                        No distinct projects configured in this township.
                      </div>
                    ) : (
                      data.projects.map((proj, pIdx) => {
                        const projTowers = projectTowersMap.get(proj._id) || []
                        const isCollapsed = !!collapsedProjects[proj._id]

                        return (
                          <div
                            key={proj._id || pIdx}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all duration-200"
                          >
                            <div
                              onClick={() => toggleProject(proj._id)}
                              className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                  <Building2 className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                      Project #{pIdx + 1}
                                    </span>
                                    {proj._id && (
                                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                                        ID: {proj._id}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                    {proj.name}
                                  </h4>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-150 dark:border-blue-900/40">
                                  {projTowers.length} {projTowers.length === 1 ? "Tower" : "Towers"}
                                </span>
                                {isCollapsed ? (
                                  <ChevronRight className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {!isCollapsed && (
                              <div className="p-3.5 bg-white dark:bg-slate-900/80 space-y-2.5 border-t border-slate-100 dark:border-slate-800">
                                <div className="px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                  <Building className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                                  Level 3 · Towers in {proj.name} ({projTowers.length})
                                </div>

                                {projTowers.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                    No towers configured for this project yet.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {projTowers.map((tower, tIdx) => (
                                      <div
                                        key={tower._id || tIdx}
                                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-200 group"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                                            <Building className="h-5 w-5" />
                                          </div>
                                          <div className="min-w-0">
                                            <h5 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                                              {tower.name}
                                            </h5>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                              <span>{tower.floorCount || 0} Floors</span>
                                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                              <span>{tower.unitCount || 0} Units</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-black font-mono shadow-xs">
                                            {formatBaseRate(tower.baseRate)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
             3. SLIDE-OVER DRAWER FOR SELECTED TOWER'S UNITS
             ══════════════════════════════════════════════════════════════════ */}
          {selectedTower && (
            <div className="absolute inset-y-0 right-0 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {selectedTower.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {selectedTower.floorCount || 0} Floors · {selectedTower.unitCount || 0} Units
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTower(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {(() => {
                  const units = towerUnitsMap.get(selectedTower._id) || []
                  if (units.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No individual unit records mapped for this tower.
                      </div>
                    )
                  }
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      {units.map((unit, uIdx) => (
                        <div
                          key={unit._id || uIdx}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>Unit {unit.unitNumber || `#${uIdx + 1}`}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-600 font-semibold">
                              {unit.status || "available"}
                            </span>
                          </div>
                          <div className="text-[10.5px] text-slate-500 mt-0.5">
                            {unit.configuration || "Standard"} · Fl {unit.floorNumber || 1}
                          </div>
                          {unit.price > 0 && (
                            <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                              {formatPrice(unit.price)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span>Interactive Architectural Hierarchy Flowchart</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
