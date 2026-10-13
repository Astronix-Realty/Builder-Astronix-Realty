"use client"

import React from "react"
import { Plus, Save, Loader2 } from "lucide-react"
import {
  DashboardTab,
  PropertyFilter,
  ActiveSettingsTab,
} from "./dashboard-types"

interface DashboardHeaderProps {
  activeTab: DashboardTab
  role: "builder" | "mandate"
  currentUser: any
  activeSettingsTab: ActiveSettingsTab
  onSaveProfile: () => void
  isSavingProfile: boolean
  showAddProperty: boolean
  setShowAddProperty: React.Dispatch<React.SetStateAction<boolean>>
  propertyFilter: PropertyFilter
  onFilterChange: (filter: PropertyFilter) => void
  propertyCounts: {
    published: number
    pending: number
    draft: number
    rejected: number
  }
}

export function DashboardHeader({
  activeTab,
  role,
  currentUser,
  activeSettingsTab,
  onSaveProfile,
  isSavingProfile,
  showAddProperty,
  setShowAddProperty,
  propertyFilter,
  onFilterChange,
  propertyCounts,
}: DashboardHeaderProps) {
  if (activeTab === "blog") return null

  const getMobileTitle = () => {
    switch (activeTab) {
      case "bills":
        return "Bills & Brokerage"
      case "properties":
        return "Properties"
      case "inventory":
        return "Inventory"
      case "crm":
        return "Astronix Leads"
      case "crm2":
        return "Our Leads"
      case "chat":
        return "Communications"
      case "documents":
        return "Documents"
      case "offers":
        return "Offers"
      case "team":
        return "Team"
      case "feedback":
        return "Support"
      case "settings":
        return "Settings"
      default:
        return ""
    }
  }

  const getDesktopTitle = () => {
    switch (activeTab) {
      case "bills":
        return "Bills & Brokerage Invoices"
      case "properties":
        return "Property Details"
      case "inventory":
        return "Inventory Management"
      case "crm":
        return "Astronix Leads and CRM"
      case "crm2":
        return "Our Leads and CRM"
      case "chat":
        return "Communications"
      case "documents":
        return "Document Center"
      case "offers":
        return "Offers Management"
      case "team":
        return "Team Management"
      case "feedback":
        return "Feedback & Support"
      case "settings":
        return "Profile & Settings"
      default:
        return ""
    }
  }

  const getDesktopDescription = () => {
    switch (activeTab) {
      case "bills":
        return "Track official brokerage invoices issued by Admin for booked clients"
      case "properties":
        return "Manage your real estate inventory"
      case "inventory":
        return "Track unit status, sales, and availability"
      case "crm":
      case "crm2":
        return "Manage leads, site visits, and bookings"
      case "chat":
        return "Chat with potential buyers and agents"
      case "documents":
        return "Organize brochures, legal docs, and plans"
      case "offers":
        return "Create and track special deals"
      case "team":
        return "Manage your team members and roles"
      case "feedback":
        return "Send feedback, report glitches, and get help"
      case "settings":
        return role === "mandate"
          ? "Manage mandate agency profile and system preferences"
          : "Manage company profile and system preferences"
      default:
        return ""
    }
  }

  const userSubtitle =
    currentUser?.profile?.developerName ||
    currentUser?.profile?.companyName ||
    (role === "mandate" ? "Mandate Panel" : "Builder Panel")

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3.5 sm:px-6 lg:px-8 py-3 lg:py-4 sticky top-0 z-10">
      {/* MOBILE & TABLET APP BAR (<lg) */}
      <div className="lg:hidden flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#050b18] border border-slate-700/50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            <img
              src="/astronix-logo.png"
              alt="Astronix"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
              {getMobileTitle()}
            </h2>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider truncate">
              {userSubtitle}
            </p>
          </div>
        </div>

        {/* Right Mobile Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "properties" && (
            <button
              onClick={() => setShowAddProperty((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm min-h-[36px] active:scale-95 transition-transform"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          )}
          {activeTab === "settings" && activeSettingsTab === "profile" && (
            <button
              onClick={onSaveProfile}
              disabled={isSavingProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 min-h-[36px]"
            >
              {isSavingProfile ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Save</span>
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP TOP BAR (lg:flex) */}
      <div className="hidden lg:flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {getDesktopTitle()}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {getDesktopDescription()}
            </p>
          </div>
        </div>

        {/* CENTER – PROPERTIES FILTER TABS (DESKTOP) */}
        {activeTab === "properties" && (
          <div className="flex items-center gap-6 text-sm font-medium absolute left-1/2 -translate-x-1/2">
            <button
              onClick={() => onFilterChange("published")}
              className={`pb-1 transition-colors ${
                propertyFilter === "published"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              Published ({propertyCounts.published})
            </button>
            <button
              onClick={() => onFilterChange("pending")}
              className={`pb-1 transition-colors ${
                propertyFilter === "pending"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              Pending ({propertyCounts.pending})
            </button>
            <button
              onClick={() => onFilterChange("draft")}
              className={`pb-1 transition-colors ${
                propertyFilter === "draft"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              Drafts ({propertyCounts.draft})
            </button>
            <button
              onClick={() => onFilterChange("rejected")}
              className={`pb-1 transition-colors ${
                propertyFilter === "rejected"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              Rejected ({propertyCounts.rejected})
            </button>
          </div>
        )}

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {activeTab === "properties" && (
            <button
              onClick={() => setShowAddProperty((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>Add Property</span>
            </button>
          )}
          {activeTab === "settings" && activeSettingsTab === "profile" && (
            <button
              onClick={onSaveProfile}
              disabled={isSavingProfile}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50 transition-all"
            >
              {isSavingProfile ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              <span>Save Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE HORIZONTAL SWIPEABLE FILTER PILLS */}
      {activeTab === "properties" && (
        <div className="lg:hidden mt-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          <button
            onClick={() => onFilterChange("published")}
            className={`px-3.5 py-1.5 text-xs rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[36px] ${
              propertyFilter === "published"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            Published ({propertyCounts.published})
          </button>
          <button
            onClick={() => onFilterChange("pending")}
            className={`px-3.5 py-1.5 text-xs rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[36px] ${
              propertyFilter === "pending"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            Pending ({propertyCounts.pending})
          </button>
          <button
            onClick={() => onFilterChange("draft")}
            className={`px-3.5 py-1.5 text-xs rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[36px] ${
              propertyFilter === "draft"
                ? "bg-slate-700 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            Drafts ({propertyCounts.draft})
          </button>
          <button
            onClick={() => onFilterChange("rejected")}
            className={`px-3.5 py-1.5 text-xs rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[36px] ${
              propertyFilter === "rejected"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            Rejected ({propertyCounts.rejected})
          </button>
        </div>
      )}
    </header>
  )
}
