"use client"

import React from "react"
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
} from "lucide-react"
import GroupBuyingQuickEdit from "@/components/builder/group-buying-quick-edit"
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
}: PropertiesViewProps) {
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
    <div>
      {/* Search and Action Bar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Your Properties
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage and create new property listings
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md w-full md:mx-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={propertySearchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder={`Search ${
              propertyFilter === "draft"
                ? "Draft"
                : propertyFilter.charAt(0).toUpperCase() + propertyFilter.slice(1)
            } Properties...`}
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-600 transition-all shadow-sm text-slate-900 dark:text-white"
          />
          {propertySearchInput && (
            <button
              onClick={() => onSearchInputChange("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={onRefreshProperties}
          disabled={isFetchingProperties}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetchingProperties ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Start New Property Flow Options */}
      {showAddProperty && (
        <div className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Start New Property
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Choose what you want to add:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Township Flow */}
            <a
              href="/builder?flow=township"
              className="group p-6 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Home className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Add Township
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Create a complete township with projects, towers, and units
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                  Township
                </span>
                <ChevronRight className="h-3 w-3" />
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                  Project
                </span>
                <ChevronRight className="h-3 w-3" />
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                  Tower
                </span>
                <ChevronRight className="h-3 w-3" />
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                  Unit
                </span>
              </div>
            </a>

            {/* Project Flow */}
            <a
              href="/builder?flow=project"
              className="group p-6 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Layers className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Add Project
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Add a standalone project with towers and units
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                  Project
                </span>
                <ChevronRight className="h-3 w-3" />
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                  Tower
                </span>
                <ChevronRight className="h-3 w-3" />
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                  Unit
                </span>
              </div>
            </a>

            {/* Tower Flow */}
            <a
              href="/builder?flow=tower"
              className="group p-6 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Building className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Add Tower
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Add a standalone tower with unit configurations
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                  Tower
                </span>
                <ChevronRight className="h-3 w-3" />
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                  Unit
                </span>
              </div>
            </a>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowAddProperty(false)}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isFetchingProperties && filteredProperties.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-[380px] animate-pulse"
            >
              <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-t-xl" />
              <div className="p-5 flex-1">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-6" />
                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : filteredProperties.length === 0 && activeTabTotalCount > 0 ? (
          <div className="col-span-full py-16 px-4 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              No Properties Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              We couldn't find any properties matching "{debouncedSearchQuery}" in
              this tab. Try adjusting your search query.
            </p>
            {propertySearchInput && (
              <button
                onClick={() => onSearchInputChange("")}
                className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-lg transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredProperties.map((property) => (
            <div
              key={property.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group"
            >
              {/* Thumbnail Image Header */}
              <div className="h-44 w-full relative bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
                {property.thumbnail ? (
                  <Image
                    src={property.thumbnail}
                    alt={property.townshipName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                    <div
                      className={`p-4 rounded-3xl ${
                        property.flowType === "township"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40"
                          : property.flowType === "project"
                          ? "bg-teal-100 text-teal-600 dark:bg-teal-900/40"
                          : "bg-orange-100 text-orange-600 dark:bg-orange-900/40"
                      }`}
                    >
                      {property.flowType === "township" ? (
                        <Home className="h-10 w-10" />
                      ) : property.flowType === "project" ? (
                        <Layers className="h-10 w-10" />
                      ) : (
                        <Building className="h-10 w-10" />
                      )}
                    </div>
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Hierarchy Badge */}
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 z-20">
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                    {property.flowType}
                  </span>
                  {property.flowType === "township" && (
                    <>
                      <ChevronRight className="h-3 w-3 text-slate-400" />
                      <Layers className="h-3 w-3 text-blue-500" />
                    </>
                  )}
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <span
                    className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-xl border backdrop-blur-sm ${
                      property.status === "published"
                        ? "bg-emerald-500/80 text-white border-emerald-400/50"
                        : property.status === "pending"
                        ? "bg-amber-500/80 text-white border-amber-400/50"
                        : property.status === "rejected"
                        ? "bg-red-500/80 text-white border-red-400/50"
                        : "bg-slate-500/80 text-white border-slate-400/50"
                    }`}
                  >
                    {property.status === "published"
                      ? "Published"
                      : property.status === "pending"
                      ? "Pending"
                      : property.status === "draft"
                      ? "Draft"
                      : property.status}
                  </span>
                </div>
              </div>

              {/* Property Info */}
              <div className="p-5 flex-1 min-w-0">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-bold text-slate-900 dark:text-white leading-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate"
                      title={property.townshipName || property.name || ""}
                    >
                      {highlightMatch(
                        property.townshipName || property.name || "",
                        debouncedSearchQuery
                      )}
                    </h3>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-black text-blue-700 dark:text-blue-400 font-mono tracking-tight">
                      {formatCurrency(property.totalValue || 0)}
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                      Total Inv. Value
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">
                    {highlightMatch(
                      property.location || "Location N/A",
                      debouncedSearchQuery
                    )}
                  </span>
                </div>
              </div>

              {/* RERA Verification Strip */}
              <div className="px-5 pb-1">
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    RERA No:
                  </span>
                  <span
                    className="text-[11px] font-black text-emerald-900 dark:text-emerald-300 font-mono tracking-tight truncate"
                    title={property.reraNumber}
                  >
                    {property.reraNumber || "P51700012345"}
                  </span>
                </div>
              </div>

              {/* Group Buying Quick Edit Strip */}
              <GroupBuyingQuickEdit
                propertyId={property.id}
                initialData={property.groupBuying || { enabled: false }}
                onUpdate={onUpdateGroupBuying}
              />

              {/* Hierarchy Counts Grid */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                <div
                  className={`grid gap-4 text-center ${
                    property.flowType === "township"
                      ? "grid-cols-3"
                      : property.flowType === "project"
                      ? "grid-cols-2"
                      : "grid-cols-1"
                  }`}
                >
                  {property.flowType === "township" && (
                    <div className="relative after:absolute after:right-[-8px] after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-[1px] after:bg-slate-200 dark:after:bg-slate-800">
                      <div className="text-xl font-black text-slate-800 dark:text-white">
                        {property.projects || 0}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Projects
                      </div>
                    </div>
                  )}

                  {(property.flowType === "township" ||
                    property.flowType === "project") && (
                    <div
                      className={
                        property.flowType === "township"
                          ? "relative after:absolute after:right-[-8px] after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-[1px] after:bg-slate-200 dark:after:bg-slate-800"
                          : ""
                      }
                    >
                      <div className="text-xl font-black text-slate-800 dark:text-white">
                        {property.towers || 0}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Towers
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                      {property.units || 0}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Total Units
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Timestamp */}
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px] font-medium uppercase tracking-tight">
                    Synced {new Date(property.createdDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  ID:{" "}
                  <span className="text-slate-300 dark:text-slate-600">
                    {property.id.slice(-6)}
                  </span>
                </div>
              </div>

              {/* Rejection Alert */}
              {property.status === "rejected" && property.rejectionReason && (
                <div className="px-5 py-3 border-t border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                  <div className="flex items-start gap-2 group/alert cursor-pointer">
                    <Shield className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-red-800 dark:text-red-300 mb-1">
                        Rejection Reason
                      </h4>
                      <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2 group-hover/alert:line-clamp-none transition-all duration-300 ease-in-out">
                        {property.rejectionReason}
                      </p>
                      {property.updatedAt && (
                        <p className="text-[10px] text-red-500/70 dark:text-red-500/60 mt-1.5 font-medium uppercase tracking-tighter">
                          {new Date(property.updatedAt).toLocaleDateString()} at{" "}
                          {new Date(property.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Card Actions */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex gap-2">
                <button
                  onClick={() =>
                    onViewHierarchy(
                      property.id,
                      property.townshipName,
                      property.flowType,
                      property.status
                    )
                  }
                  className="flex-1 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>

                {property.status === "draft" ? (
                  <a
                    href={`/builder?flow=${
                      property.flowType || "township"
                    }&edit=${property.id}`}
                    className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </a>
                ) : (
                  <button
                    onClick={() => onMoveToDraft(property.id)}
                    disabled={movingToDraftId === property.id}
                    className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {movingToDraftId === property.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Edit2 className="h-4 w-4" />
                    )}
                    Move to Draft
                  </button>
                )}

                <button
                  onClick={() => onDeleteProperty(property.id)}
                  disabled={deletingPropertyId === property.id}
                  className="px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-white dark:hover:bg-slate-800 hover:text-red-700 dark:hover:border-red-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                  title="Delete Property"
                >
                  {deletingPropertyId === property.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Empty State */}
      {!isFetchingProperties && activeTabTotalCount === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <Building2 className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Properties Found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {propertyFilter === "published"
              ? "You haven't published any properties yet."
              : propertyFilter === "pending"
              ? "You don't have any properties pending approval."
              : propertyFilter === "rejected"
              ? "You don't have any rejected properties."
              : "You don't have any drafts."}
          </p>
          <button
            onClick={() => setShowAddProperty(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors mx-auto"
          >
            <Plus className="h-5 w-5" />
            Create New Property
          </button>
        </div>
      )}
    </div>
  )
}
