"use client"

import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
  Search,
  X,
  RefreshCw,
  Home,
  ChevronRight,
  Layers,
  Building,
  Building2,
  MapPin,
  ShieldCheck,
  Shield,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  Plus,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react"
import GroupBuyingQuickEdit from "@/components/builder/group-buying-quick-edit"
import DownPaymentQuickEdit from "@/components/builder/down-payment-quick-edit"
import { Property, PropertyFilter } from "./dashboard-types"

interface PropertiesViewProps {
  role: "builder" | "mandate"
  properties: Property[]
  filteredProperties: Property[]
  propertyFilter: PropertyFilter
  propertySearchInput: string
  onSearchInputChange: (val: string) => void
  debouncedSearchQuery: string
  isFetchingProperties: boolean
  onRefreshProperties: () => void
  showAddProperty: boolean
  setShowAddProperty: (show: boolean) => void
  onViewHierarchy: (
    propertyId: string,
    propertyName: string,
    flowType?: string,
    status?: string
  ) => void
  onMoveToDraft: (id: string) => Promise<void>
  movingToDraftId: string | null
  onDeleteProperty: (id: string) => Promise<void>
  deletingPropertyId: string | null
  onUpdateGroupBuying: (propertyId: string, data: any) => void
  onUpdateDownPayment?: (propertyId: string, percent: number) => void
}

export function PropertiesView({
  role,
  properties,
  filteredProperties,
  propertyFilter,
  propertySearchInput,
  onSearchInputChange,
  debouncedSearchQuery,
  isFetchingProperties,
  onRefreshProperties,
  showAddProperty,
  setShowAddProperty,
  onViewHierarchy,
  onMoveToDraft,
  movingToDraftId,
  onDeleteProperty,
  deletingPropertyId,
  onUpdateGroupBuying,
  onUpdateDownPayment,
}: PropertiesViewProps) {
  // Desktop View Mode: 'grid' vs 'table' (Spreadsheet Master View)
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("astronix_properties_view_mode")
      if (stored === "table" || stored === "grid") return stored
    }
    return "grid"
  })

  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSetViewMode = (mode: "grid" | "table") => {
    setViewMode(mode)
    if (typeof window !== "undefined") {
      localStorage.setItem("astronix_properties_view_mode", mode)
    }
  }

  // Keyboard shortcut listener: press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value)
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return <span>{text}</span>
    const index = text.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return <span>{text}</span>

    const before = text.substring(0, index)
    const match = text.substring(index, index + query.length)
    const after = text.substring(index + query.length)

    return (
      <span>
        {before}
        <mark className="bg-yellow-100 dark:bg-yellow-500/30 text-yellow-800 dark:text-yellow-200 px-0.5 rounded font-semibold">
          {match}
        </mark>
        {after}
      </span>
    )
  }

  const activeTabTotalCount = properties.filter(
    (p) => p.status === propertyFilter
  ).length

  return (
    <div className="space-y-6">
      {/* Desktop Software Toolbar & Subheader */}
      <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title & Live Counter */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Workspace Inventory
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 font-semibold">
                {filteredProperties.length} {propertyFilter}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              High-density property master list &amp; inventory controller
            </p>
          </div>
        </div>

        {/* Center: Desktop Software Search Input */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={propertySearchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder={`Search ${propertyFilter} properties... (Press / to focus)`}
            className="w-full pl-9 pr-14 py-1.5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {propertySearchInput ? (
              <button
                onClick={() => onSearchInputChange("")}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="software-kbd text-[9px] py-0 px-1 text-slate-400 dark:text-slate-500">
                /
              </span>
            )}
          </div>
        </div>

        {/* Right Action Controls: View Switcher & Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop View Switcher (Grid vs Spreadsheet Table) */}
          <div className="hidden sm:flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => handleSetViewMode("grid")}
              className={`p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">Cards</span>
            </button>
            <button
              onClick={() => handleSetViewMode("table")}
              className={`p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
              title="Spreadsheet Table View"
            >
              <List className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">Table</span>
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefreshProperties}
            disabled={isFetchingProperties}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
            title="Reload Properties"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isFetchingProperties ? "animate-spin text-blue-600" : ""
              }`}
            />
            <span className="hidden md:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Start New Property Flow Options Modal / Panel */}
      {showAddProperty && (
        <div className="p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Select Property Type
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the property type for your new property listing
              </p>
            </div>
            <button
              onClick={() => setShowAddProperty(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Township Flow */}
            <a
              href="/builder?flow=township"
              className="group p-4 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all cursor-pointer relative"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Home className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                Full Township
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Large scale land development with multiple independent projects, towers, &amp; units
              </p>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold">
                  Township
                </span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold">
                  Projects
                </span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold">
                  Towers
                </span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold">
                  Units
                </span>
              </div>
            </a>

            {/* Project Flow */}
            <a
              href="/builder?flow=project"
              className="group p-4 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all cursor-pointer relative"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                Standalone Project
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Single residential or commercial complex encompassing 1 or more towers
              </p>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                <span className="px-1.5 py-0.5 bg-teal-100/70 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded font-semibold">
                  Project
                </span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold">
                  Towers
                </span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold">
                  Units
                </span>
              </div>
            </a>

            {/* Tower Flow */}
            <a
              href="/builder?flow=tower"
              className="group p-4 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all cursor-pointer relative"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Building className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                Single Tower / Phase
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Add an individual standalone building directly with floor-wise unit matrix
              </p>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                <span className="px-1.5 py-0.5 bg-amber-100/70 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded font-semibold">
                  Tower
                </span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold">
                  Units Matrix
                </span>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* SPREADSHEET TABLE VIEW (DESKTOP SOFTWARE MASTER TABLE) */}
      {viewMode === "table" && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto software-scrollbar max-h-[640px]">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-sm border-b border-slate-200/90 dark:border-slate-700/80 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <th className="py-2 px-3 font-bold">Property &amp; Location</th>
                  <th className="py-2 px-2.5 font-bold">Type</th>
                  <th className="py-2 px-2.5 font-bold">RERA Number</th>
                  <th className="py-2 px-2 font-bold text-center">Proj</th>
                  <th className="py-2 px-2 font-bold text-center">Tow</th>
                  <th className="py-2 px-2 font-bold text-center">Units</th>
                  <th className="py-2 px-3 font-bold text-right">Inv. Valuation</th>
                  <th className="py-2 px-2.5 font-bold text-center">Status</th>
                  <th className="py-2 px-3 font-bold text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {isFetchingProperties && filteredProperties.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={9} className="py-2.5 px-3">
                        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 px-4 text-center text-slate-400 font-mono text-xs">
                      No properties found matching your filter or query.
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((property) => (
                    <tr
                      key={property.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors group text-xs"
                    >
                      {/* Property & Thumbnail */}
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-2.5 min-w-0 max-w-xs">
                          <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                            {property.thumbnail ? (
                              <Image
                                src={property.thumbnail}
                                alt={property.townshipName}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Building2 className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate text-xs leading-snug">
                              {highlightMatch(
                                property.townshipName || property.name || "",
                                debouncedSearchQuery
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-1 font-medium">
                              <MapPin className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                              {highlightMatch(
                                property.location || "Location N/A",
                                debouncedSearchQuery
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-1.5 px-2.5">
                        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {property.flowType}
                        </span>
                      </td>

                      {/* RERA */}
                      <td className="py-1.5 px-2.5">
                        <span className="font-mono text-[10.5px] font-semibold text-slate-600 dark:text-slate-300">
                          {property.reraNumber || "P51700012345"}
                        </span>
                      </td>

                      {/* Projects */}
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {property.projects || 0}
                      </td>

                      {/* Towers */}
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {property.towers || 0}
                      </td>

                      {/* Units */}
                      <td className="py-1.5 px-2 text-center font-mono font-black text-blue-600 dark:text-blue-400 text-xs">
                        {property.units || 0}
                      </td>

                      {/* Valuation & Down Payment */}
                      <td className="py-1.5 px-3 text-right">
                        <div className="font-mono font-black text-slate-900 dark:text-white text-xs">
                          {property.totalValue && property.totalValue > 0
                            ? formatCurrency(property.totalValue)
                            : "Price on Request"}
                        </div>
                        <div className="text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {property.downPaymentPercent ?? 20}% DP
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-1.5 px-2.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold uppercase tracking-wider ${
                            property.status === "published"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                              : property.status === "pending"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60"
                              : property.status === "rejected"
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              property.status === "published"
                                ? "bg-emerald-500 shadow-2xs shadow-emerald-500/50"
                                : property.status === "pending"
                                ? "bg-amber-500"
                                : property.status === "rejected"
                                ? "bg-rose-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {property.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-1.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              onViewHierarchy(
                                property.id,
                                property.townshipName,
                                property.flowType,
                                property.status
                              )
                            }
                            className="h-7 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 rounded text-[11px] font-semibold transition-all flex items-center gap-1 shadow-2xs"
                            title="Inspect Hierarchy"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </button>

                          {property.status === "draft" ? (
                            <a
                              href={`/builder?flow=${
                                property.flowType || "township"
                              }&edit=${property.id}`}
                              className="h-7 px-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center gap-1 shadow-2xs"
                              title="Edit Draft"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>Edit</span>
                            </a>
                          ) : (
                            <button
                              onClick={() => onMoveToDraft(property.id)}
                              disabled={movingToDraftId === property.id}
                              className="h-7 px-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 shadow-2xs disabled:opacity-50"
                              title="Move to Draft"
                            >
                              {movingToDraftId === property.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Edit2 className="h-3 w-3" />
                              )}
                              <span>Draft</span>
                            </button>
                          )}

                          <button
                            onClick={() => onDeleteProperty(property.id)}
                            disabled={deletingPropertyId === property.id}
                            className="h-7 w-7 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800/60 rounded transition-all shadow-2xs disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingPropertyId === property.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARD GRID VIEW (DESKTOP SOFTWARE CARDS) */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isFetchingProperties && filteredProperties.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/90 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs h-[380px] animate-pulse"
              >
                <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
                <div className="p-4 flex-1 space-y-3">
                  <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredProperties.length === 0 && activeTabTotalCount > 0 ? (
            <div className="col-span-full py-16 px-4 text-center bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs">
              <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                No Matching Properties Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                No properties in {propertyFilter} matched &ldquo;{debouncedSearchQuery}&rdquo;.
              </p>
              {propertySearchInput && (
                <button
                  onClick={() => onSearchInputChange("")}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg transition-colors border border-blue-200/60 dark:border-blue-800/60"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filteredProperties.map((property) => (
              <div
                key={property.id}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
              >
                {/* Widescreen Desktop Asset Viewport */}
                <div className="h-32 w-full relative bg-slate-950 border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
                  {property.thumbnail ? (
                    <Image
                      src={property.thumbnail}
                      alt={property.townshipName}
                      fill
                      className="object-cover group-hover:scale-102 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                      <div
                        className={`p-2.5 rounded-xl ${
                          property.flowType === "township"
                            ? "bg-blue-900/40 text-blue-400 border border-blue-700/40"
                            : property.flowType === "project"
                            ? "bg-teal-900/40 text-teal-400 border border-teal-700/40"
                            : "bg-amber-900/40 text-amber-400 border border-amber-700/40"
                        }`}
                      >
                        {property.flowType === "township" ? (
                          <Home className="h-6 w-6" />
                        ) : property.flowType === "project" ? (
                          <Layers className="h-6 w-6" />
                        ) : (
                          <Building className="h-6 w-6" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Desktop CAD Vignette Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/40 pointer-events-none" />

                  {/* Flow Chip (Top Left) */}
                  <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 shadow-2xs flex items-center gap-1 z-10">
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest font-mono">
                      {property.flowType}
                    </span>
                    {property.flowType === "township" && (
                      <ChevronRight className="h-2 w-2 text-blue-400" />
                    )}
                  </div>

                  {/* Status Indicator (Top Right) */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider shadow-sm border backdrop-blur-md flex items-center gap-1 ${
                        property.status === "published"
                          ? "bg-emerald-500/90 text-white border-emerald-400/50"
                          : property.status === "pending"
                          ? "bg-amber-500/90 text-white border-amber-400/50"
                          : property.status === "rejected"
                          ? "bg-rose-500/90 text-white border-rose-400/50"
                          : "bg-slate-800/90 text-slate-300 border-slate-700/50"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {property.status}
                    </span>
                  </div>

                  {/* Inventory Value Overlay (Bottom Right of Media) */}
                  <div className="absolute bottom-2 right-2.5 z-10">
                    <div className="bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 shadow-xs flex items-center gap-1">
                      <span className="text-[9px] text-slate-400 font-mono uppercase">Inv:</span>
                      <span className="text-xs font-black text-blue-400 font-mono tracking-tight">
                        {property.totalValue && property.totalValue > 0
                          ? formatCurrency(property.totalValue)
                          : "Price on Request"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Property Identity strip */}
                <div className="p-3 pb-2 flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-xs font-bold text-slate-900 dark:text-white leading-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate"
                        title={property.townshipName || property.name || ""}
                      >
                        {highlightMatch(
                          property.townshipName || property.name || "",
                          debouncedSearchQuery
                        )}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10.5px] font-medium bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                    <MapPin className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {highlightMatch(
                        property.location || "Location N/A",
                        debouncedSearchQuery
                      )}
                    </span>
                  </div>
                </div>

                {/* RERA Strip */}
                <div className="px-3 pb-1.5">
                  <div className="flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/20 px-2 py-1 rounded border border-emerald-200/50 dark:border-emerald-800/40 text-[9.5px]">
                    <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                      <ShieldCheck className="h-3 w-3 shrink-0" />
                      <span>RERA:</span>
                    </div>
                    <span
                      className="font-mono font-bold text-emerald-900 dark:text-emerald-300 truncate max-w-[140px]"
                      title={property.reraNumber}
                    >
                      {property.reraNumber || "Pending / Applied"}
                    </span>
                  </div>
                </div>

                {/* Group Buying Quick Edit Strip */}
                <div className="px-3 py-0.5">
                  <GroupBuyingQuickEdit
                    propertyId={property.id}
                    initialData={property.groupBuying || { enabled: false }}
                    onUpdate={onUpdateGroupBuying}
                  />
                </div>

                {/* Down Payment Dynamic Quick Edit Strip */}
                <div className="px-3 pb-1.5 pt-0.5">
                  <DownPaymentQuickEdit
                    propertyId={property.id}
                    initialPercent={property.downPaymentPercent ?? 20}
                    onUpdate={onUpdateDownPayment}
                  />
                </div>

                {/* High Density Hierarchy Telemetry Grid */}
                <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40">
                  <div
                    className={`grid gap-1.5 text-center ${
                      property.flowType === "township"
                        ? "grid-cols-3"
                        : property.flowType === "project"
                        ? "grid-cols-2"
                        : "grid-cols-1"
                    }`}
                  >
                    {property.flowType === "township" && (
                      <div className="p-1 rounded bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                        <div className="text-xs font-black text-slate-800 dark:text-white font-mono">
                          {property.projects || 0}
                        </div>
                        <div className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Projects
                        </div>
                      </div>
                    )}

                    {(property.flowType === "township" ||
                      property.flowType === "project") && (
                      <div className="p-1 rounded bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                        <div className="text-xs font-black text-slate-800 dark:text-white font-mono">
                          {property.towers || 0}
                        </div>
                        <div className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Towers
                        </div>
                      </div>
                    )}

                    <div className="p-1 rounded bg-white dark:bg-slate-800/80 border border-blue-200/60 dark:border-blue-900/60">
                      <div className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                        {property.units || 0}
                      </div>
                      <div className="text-[8.5px] font-bold text-blue-500/80 dark:text-blue-400/80 uppercase tracking-wider font-mono">
                        Units
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Software Dock */}
                <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onViewHierarchy(
                        property.id,
                        property.townshipName,
                        property.flowType,
                        property.status
                      )
                    }
                    className="flex-1 h-7 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 rounded text-[11px] font-semibold transition-all flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Hierarchy</span>
                  </button>

                  {property.status === "draft" ? (
                    <a
                      href={`/builder?flow=${
                        property.flowType || "township"
                      }&edit=${property.id}`}
                      className="flex-1 h-7 px-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => onMoveToDraft(property.id)}
                      disabled={movingToDraftId === property.id}
                      className="flex-1 h-7 px-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1 shadow-2xs disabled:opacity-50"
                    >
                      {movingToDraftId === property.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Edit2 className="h-3 w-3" />
                      )}
                      <span>Edit</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteProperty(property.id)}
                    disabled={deletingPropertyId === property.id}
                    className="h-7 w-7 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800/60 rounded transition-all shadow-2xs disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingPropertyId === property.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Empty State */}
      {!isFetchingProperties && activeTabTotalCount === 0 && (
        <div className="text-center py-16 bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <Building2 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No Properties In {propertyFilter.toUpperCase()}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
            {propertyFilter === "published"
              ? "You haven't published any properties yet. Create and submit one for review."
              : propertyFilter === "pending"
              ? "You don't have any properties currently pending admin approval."
              : propertyFilter === "rejected"
              ? "No rejected properties found."
              : "No drafts found. Click below to start building a new property."}
          </p>
          <button
            onClick={() => setShowAddProperty(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all mx-auto shadow-sm shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            Create New Property
          </button>
        </div>
      )}
    </div>
  )
}
