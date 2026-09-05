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
} from "lucide-react"

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

  // Collapsible state for projects and towers
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({})
  const [collapsedTowers, setCollapsedTowers] = useState<Record<string, boolean>>({})

  // Fetch hierarchy when modal opens
  useEffect(() => {
    if (!isOpen || !property?.id) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError(null)
    setCollapsedProjects({})
    setCollapsedTowers({})

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

  // Toggle project accordion
  const toggleProject = (projectId: string) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }))
  }

  // Toggle tower accordion
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
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-0 overflow-hidden">

        {/* Modal Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
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

            {/* Status & Level Badge */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {hierarchyMode.toUpperCase()}
              </span>
              {data?.property?.status && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${data.property.status === "published"
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

          <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 mt-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              {hierarchyMode === "township" ? (
                <Compass className="h-5 w-5" />
              ) : hierarchyMode === "project" ? (
                <Building2 className="h-5 w-5" />
              ) : (
                <Building className="h-5 w-5" />
              )}
            </span>
            <span className="truncate">{property?.name || data?.property?.name || "Property Hierarchy"}</span>
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
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
              <span className="flex items-center gap-1 font-mono text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-150 dark:border-blue-900/50">
                <ShieldCheck className="h-3 w-3" />
                RERA: {data.property.reraNumber}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-9 w-9 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
                Resolving dynamic hierarchy...
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Fetching related township, project, tower, and unit records
              </p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto" />
              <h4 className="text-sm font-bold text-red-900 dark:text-red-200">Hierarchy Error</h4>
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-slate-400">
              <Building className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No hierarchy data available</p>
            </div>
          ) : (
            <div className="space-y-6">

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

              {/* ─────────────────────────────────────────────────────────────
                  CASE 1: TOWNSHIP LEVEL (Township → Project → Tower)
                  ───────────────────────────────────────────────────────────── */}
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
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                                Level 1 · Root Township
                              </span>
                            </div>
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
                            {/* Project Header Bar */}
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

                            {/* Level 3: Towers List under this Project */}
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
                                  projTowers.map((tower, tIdx) => (
                                    <div
                                      key={tower._id || tIdx}
                                      className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-200 group"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                                          <Building className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <h5 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                                              {tower.name}
                                            </h5>
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            <span>{tower.floorCount || 0} Floors</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                            <span>{tower.unitCount || 0} Units</span>
                                            {tower._id && (
                                              <>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                                                  ID: {tower._id}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-black font-mono shadow-xs">
                                          {formatBaseRate(tower.baseRate)}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}

                    {/* Direct Towers in Township (if any) */}
                    {directTowers.length > 0 && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden mt-4">
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Building className="h-3.5 w-3.5 text-blue-600" />
                            Direct Towers in Township ({directTowers.length})
                          </h4>
                          <span className="text-[11px] text-slate-400">Unassigned to projects</span>
                        </div>
                        <div className="p-3 space-y-2.5">
                          {directTowers.map((tower, tIdx) => (
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
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  CASE 2: PROJECT LEVEL (Project → Tower → Unit)
                  ───────────────────────────────────────────────────────────── */}
              {hierarchyMode === "project" && (
                <div className="relative pl-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-[2px] before:bg-blue-200 dark:before:bg-blue-950/80 space-y-6">

                  {/* LEVEL 1: Project Header Card */}
                  <div className="relative">
                    <div className="absolute -left-[30px] top-1.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-md">
                      1
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 shadow-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                              Level 1 · Selected Project
                            </span>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {data.property.name}
                            </h3>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold">
                            {data.towers.length} {data.towers.length === 1 ? "Tower" : "Towers"}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {data.units.length} Units Total
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LEVEL 2 & 3: Towers with Units */}
                  <div className="relative space-y-4">
                    <div className="absolute -left-[30px] top-1.5 w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-black shadow-md">
                      2
                    </div>
                    <div className="flex items-center justify-between pb-1">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                        Level 2 · Towers ({data.towers.length})
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Level 3 · Units under each tower
                      </span>
                    </div>

                    {data.towers.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                        No towers configured in this project.
                      </div>
                    ) : (
                      data.towers.map((tower, tIdx) => {
                        const towerUnits = towerUnitsMap.get(tower._id) || []
                        const isCollapsed = !!collapsedTowers[tower._id]

                        return (
                          <div
                            key={tower._id || tIdx}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
                          >
                            {/* Tower Header Card */}
                            <div
                              onClick={() => toggleTower(tower._id)}
                              className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                  <Building className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                      {tower.name}
                                    </h4>
                                    {tower._id && (
                                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                                        ID: {tower._id}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    <span>{tower.floorCount || 0} Floors</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                    <span>{towerUnits.length || tower.unitCount || 0} Units</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-black font-mono shadow-xs">
                                  {formatBaseRate(tower.baseRate)}
                                </span>
                                {isCollapsed ? (
                                  <ChevronRight className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {/* Level 3: Units Grid under this Tower */}
                            {!isCollapsed && (
                              <div className="p-4 bg-white dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  <span className="flex items-center gap-1">
                                    <DoorClosed className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                    Level 3 · Configured Units ({towerUnits.length})
                                  </span>
                                  {towerUnits.length > 0 && (
                                    <span className="text-slate-400 text-[10px] lowercase">
                                      showing {Math.min(towerUnits.length, 30)} of {towerUnits.length}
                                    </span>
                                  )}
                                </div>

                                {towerUnits.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                    No individual unit records mapped for this tower.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {towerUnits.slice(0, 30).map((unit, uIdx) => (
                                      <div
                                        key={unit._id || uIdx}
                                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 text-xs space-y-1 hover:border-emerald-400 transition-colors"
                                      >
                                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                                          <span>Unit {unit.unitNumber || `#${uIdx + 1}`}</span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                                            {unit.status || "available"}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                          <span>{unit.configuration || "Standard"}</span>
                                          <span>Fl {unit.floorNumber || 1}</span>
                                        </div>
                                        {unit.area > 0 && (
                                          <div className="text-[10px] text-slate-400 font-mono">
                                            {unit.area} sqft
                                            {unit.price > 0 && ` · ${formatPrice(unit.price)}`}
                                          </div>
                                        )}
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

              {/* ─────────────────────────────────────────────────────────────
                  CASE 3: TOWER LEVEL (Tower → Unit)
                  ───────────────────────────────────────────────────────────── */}
              {hierarchyMode === "tower" && (
                <div className="relative pl-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-[2px] before:bg-cyan-200 dark:before:bg-cyan-950/80 space-y-6">

                  {/* LEVEL 1: Tower Header Card */}
                  <div className="relative">
                    <div className="absolute -left-[30px] top-1.5 w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-black shadow-md">
                      1
                    </div>
                    <div className="p-4 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-800/60 shadow-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Building className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                              Level 1 · Selected Tower
                            </span>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {data.property.name}
                            </h3>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 text-xs font-black font-mono shadow-xs">
                            {formatBaseRate(data.towers[0]?.baseRate)}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {data.towers[0]?.floorCount || 0} Floors · {data.units.length} Units
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LEVEL 2: Units Breakdown */}
                  <div className="relative space-y-4">
                    <div className="absolute -left-[30px] top-1.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shadow-md">
                      2
                    </div>
                    <div className="flex items-center justify-between pb-1">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <DoorClosed className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Level 2 · Configured Units ({data.units.length})
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Unit inventory details
                      </span>
                    </div>

                    {data.units.length === 0 ? (
                      <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                        No unit records generated or configured for this tower yet.
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                          {data.units.map((unit, uIdx) => (
                            <div
                              key={unit._id || uIdx}
                              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 text-xs space-y-1 hover:border-emerald-400 transition-colors"
                            >
                              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                                <span>Unit {unit.unitNumber || `#${uIdx + 1}`}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                                  {unit.status || "available"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <span>{unit.configuration || "Standard"}</span>
                                <span>Floor {unit.floorNumber || 1}</span>
                              </div>
                              {unit.area > 0 && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {unit.area} sqft
                                  {unit.price > 0 && ` · ${formatPrice(unit.price)}`}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div></div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            Close
          </button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
