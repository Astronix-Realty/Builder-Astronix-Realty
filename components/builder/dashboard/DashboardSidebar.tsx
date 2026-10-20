"use client"

import React from "react"
import Image from "next/image"
import {
  Receipt,
  Building2,
  Layers,
  Users,
  MessageSquare,
  FileText,
  Gift,
  Settings,
  Headphones,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react"
import { DashboardTab, DashboardProfile } from "./dashboard-types"

interface DashboardSidebarProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  onLogout: () => void
  role: "builder" | "mandate"
  currentUser: any
  profile: DashboardProfile
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function DashboardSidebar({
  activeTab,
  onTabChange,
  onLogout,
  role,
  currentUser,
  profile,
  isCollapsed = false,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const panelTitle = role === "mandate" ? "Mandate OS" : "Builder OS"
  const workspaceTag = role === "mandate" ? "Exclusive Mandate" : "Developer Studio"

  const navSections = [
    {
      group: "WORKSPACE",
      items: [
        {
          id: "properties" as DashboardTab,
          label: "Properties",
          icon: Building2,
          badge: null,
          color: "text-blue-600 dark:text-blue-400",
        },
        {
          id: "inventory" as DashboardTab,
          label: "Inventory Matrix",
          icon: Layers,
          badge: "Live",
          color: "text-teal-600 dark:text-teal-400",
        },
        {
          id: "bills" as DashboardTab,
          label: "Bills & Brokerage",
          icon: Receipt,
          badge: null,
          color: "text-amber-600 dark:text-amber-400",
        },
      ],
    },
    {
      group: "PIPELINE & SALES",
      items: [
        {
          id: "ads-studio" as DashboardTab,
          label: "🚀 Meta Ads & Boost Studio",
          icon: Sparkles,
          badge: "NEW",
          color: "text-amber-500 dark:text-amber-400 font-bold",
        },
        {
          id: "crm" as DashboardTab,
          label: "Astronix Leads",
          icon: Users,
          badge: "CRM 1",
          color: "text-indigo-600 dark:text-indigo-400",
        },
        {
          id: "crm2" as DashboardTab,
          label: "Our Leads",
          icon: Users,
          badge: "CRM 2",
          color: "text-violet-600 dark:text-violet-400",
        },
        {
          id: "chat" as DashboardTab,
          label: "Communications",
          icon: MessageSquare,
          badge: null,
          color: "text-sky-600 dark:text-sky-400",
        },
        {
          id: "offers" as DashboardTab,
          label: "Special Offers",
          icon: Gift,
          badge: null,
          color: "text-rose-600 dark:text-rose-400",
        },
      ],
    },
    {
      group: "MEDIA & VAULT",
      items: [
        {
          id: "documents" as DashboardTab,
          label: "Document Vault",
          icon: FileText,
          badge: null,
          color: "text-orange-600 dark:text-orange-400",
        },
        {
          id: "blog" as DashboardTab,
          label: "Blog Studio",
          icon: FileText,
          badge: null,
          color: "text-pink-600 dark:text-pink-400",
        },
      ],
    },
    {
      group: "ORGANIZATION",
      items: [
        {
          id: "team" as DashboardTab,
          label: "Team Console",
          icon: Users,
          badge: null,
          color: "text-emerald-600 dark:text-emerald-400",
        },
        {
          id: "settings" as DashboardTab,
          label: "System Settings",
          icon: Settings,
          badge: null,
          color: "text-slate-600 dark:text-slate-400",
        },
        {
          id: "feedback" as DashboardTab,
          label: "Help & Feedback",
          icon: Headphones,
          badge: null,
          color: "text-red-500 dark:text-red-400",
        },
      ],
    },
  ]

  return (
    <aside
      className={`hidden lg:flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200/90 dark:border-slate-800/90 shadow-sm static z-30 shrink-0 select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-[68px]" : "w-64 xl:w-72"
      }`}
    >
      {isCollapsed ? (
        /* ── COLLAPSED COMPACT ICON-ONLY RAIL (w-[68px]) ── */
        <div className="w-[68px] h-full flex flex-col justify-between overflow-hidden">
          {/* Top Logo / Expand Button */}
          <div className="py-3 px-2 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand Sidebar (Ctrl+B)"
              aria-label="Expand Sidebar"
              className="w-10 h-10 flex items-center justify-center shrink-0 group cursor-pointer hover:scale-105 active:scale-95 transition-transform relative"
            >
              <img
                src="/astronix-logo.png"
                alt="Astronix Realty Logo"
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-blue-600/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                <PanelLeftOpen className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Nav Icons */}
          <nav className="flex-1 py-3 px-2 space-y-2 overflow-y-auto software-scrollbar flex flex-col items-center">
            {navSections.map((sec, secIdx) => (
              <div key={sec.group} className="w-full flex flex-col items-center space-y-1">
                {secIdx > 0 && (
                  <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 my-1" />
                )}
                {sec.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      title={`${item.label}${item.badge ? ` (${item.badge})` : ""}`}
                      aria-label={item.label}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all group ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                          isActive ? "text-white" : item.color
                        }`}
                      />
                      {item.badge && (
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Footer User Avatar & Exit */}
          <div className="p-2 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col items-center gap-2">
            <button
              onClick={() => onTabChange("settings")}
              title={
                currentUser?.profile?.companyName ||
                profile.companyName ||
                currentUser?.name ||
                "System Settings"
              }
              aria-label="Settings"
              className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center border border-slate-300/80 dark:border-slate-600 shadow-2xs overflow-hidden hover:border-blue-400 transition-all cursor-pointer relative group"
            >
              {currentUser?.profile?.logo || profile.logo ? (
                <Image
                  src={currentUser?.profile?.logo || profile.logo || ""}
                  alt="Company Logo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <User className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              )}
            </button>

            <button
              onClick={onLogout}
              title="Exit Session"
              aria-label="Exit Session"
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800/50 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* ── EXPANDED FULL SIDEBAR (w-64 xl:w-72) ── */
        <div className="w-64 xl:w-72 h-full flex flex-col shrink-0">
          {/* Software Title Bar / Window Header */}
          <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                <img
                  src="/astronix-logo.png"
                  alt="Astronix Realty Logo"
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
                    Astronix OS
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 rounded font-semibold">
                    PRO
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {panelTitle} • {workspaceTag}
                  </p>
                </div>
              </div>
            </div>

            {/* Toggle Button for Red Box 1 */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Collapse Sidebar (Ctrl+B)"
                aria-label="Collapse Sidebar"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all shadow-2xs active:scale-95 shrink-0"
              >
                <PanelLeftClose className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            )}
          </div>

          {/* Software Categorized Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto software-scrollbar">
            {navSections.map((sec) => (
              <div key={sec.group} className="space-y-1">
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase font-mono">
                    {sec.group}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                          isActive
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                              isActive
                                ? "text-white"
                                : item.color
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {isActive && (
                          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-600 rounded-r" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile & Software Session Footer */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col gap-2">
            <button
              onClick={() => onTabChange("settings")}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800/90 border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all text-left group cursor-pointer focus:outline-none"
            >
              <div className="relative w-8 h-8 shrink-0 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center border border-slate-300/80 dark:border-slate-600 shadow-2xs overflow-hidden">
                {currentUser?.profile?.logo || profile.logo ? (
                  <Image
                    src={currentUser?.profile?.logo || profile.logo || ""}
                    alt="Company Logo"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <User className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {currentUser?.profile?.companyName ||
                    profile.companyName ||
                    currentUser?.name ||
                    "Workspace User"}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                  {currentUser?.email || (role === "mandate" ? "Mandate Agency" : "Builder Partner")}
                </p>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0" />
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800/50 text-slate-600 dark:text-slate-300 rounded-md text-xs font-medium transition-all shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Exit Session</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
