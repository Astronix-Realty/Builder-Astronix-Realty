"use client"

import React, { useState, useEffect } from "react"
import {
  Building2,
  Layers,
  Users,
  Grid,
  MessageSquare,
  FileText,
  Gift,
  Receipt,
  Settings,
  LogOut,
  X,
  ChevronRight,
  User,
  ShieldCheck,
  Sparkles
} from "lucide-react"

export type BuilderTab =
  | "bills"
  | "properties"
  | "inventory"
  | "crm"
  | "crm2"
  | "chat"
  | "documents"
  | "offers"
  | "blog"
  | "settings"
  | "team"

interface MobileBottomNavProps {
  activeTab: BuilderTab
  onTabChange: (tab: BuilderTab) => void
  currentUser?: any
  onLogout?: () => void
  userRole?: "builder" | "mandate" | "teamLeader"
}

export function MobileBottomNav({
  activeTab,
  onTabChange,
  currentUser,
  onLogout,
  userRole = "builder",
}: MobileBottomNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  // Close "More" bottom sheet when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMoreOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMoreOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMoreOpen])

  const handleSelectTab = (tab: BuilderTab) => {
    onTabChange(tab)
    setIsMoreOpen(false)
  }

  // Determine if active tab is inside the "More" drawer
  const isMoreTabActive = [
    "crm2",
    "chat",
    "documents",
    "offers",
    "blog",
    "bills",
    "team",
    "settings",
  ].includes(activeTab)

  const secondaryNavItems = [
    {
      id: "crm2" as BuilderTab,
      label: "Our Leads",
      description: "Direct in-house pipeline",
      icon: Users,
      color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
    },
    {
      id: "chat" as BuilderTab,
      label: "Chat",
      description: "Direct buyer inquiries",
      icon: MessageSquare,
      color: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
    },
    {
      id: "documents" as BuilderTab,
      label: "Documents",
      description: "Cost sheets & agreements",
      icon: FileText,
      color: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
    },
    {
      id: "offers" as BuilderTab,
      label: "Offers",
      description: "Discounts & festive schemes",
      icon: Gift,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
    },
    {
      id: "blog" as BuilderTab,
      label: "Blog & SEO",
      description: "Articles & content hub",
      icon: Sparkles,
      color: "bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400",
    },
    {
      id: "bills" as BuilderTab,
      label: "Bills & Brokerage",
      description: "Invoices & payment proofs",
      icon: Receipt,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
    {
      id: "team" as BuilderTab,
      label: "Team",
      description: "Assign site managers",
      icon: ShieldCheck,
      color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400",
    },
    {
      id: "settings" as BuilderTab,
      label: "Settings",
      description: "Profile, theme & security",
      icon: Settings,
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
  ]

  return (
    <>
      {/* ── Fixed Native Bottom Bar (Mobile/Tablet Only: lg:hidden) ── */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] lg:hidden select-none"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0.5rem))",
        }}
      >
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-2">
          {/* 1. Properties */}
          <button
            type="button"
            onClick={() => handleSelectTab("properties")}
            className={`flex flex-col items-center justify-center gap-1 min-h-[48px] py-1 transition-all rounded-xl ${
              activeTab === "properties"
                ? "text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            <div
              className={`p-1.5 rounded-full transition-transform active:scale-95 ${
                activeTab === "properties"
                  ? "bg-blue-100/70 dark:bg-blue-900/40"
                  : ""
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] tracking-tight leading-none">
              Properties
            </span>
          </button>

          {/* 2. Inventory */}
          <button
            type="button"
            onClick={() => handleSelectTab("inventory")}
            className={`flex flex-col items-center justify-center gap-1 min-h-[48px] py-1 transition-all rounded-xl ${
              activeTab === "inventory"
                ? "text-teal-600 dark:text-teal-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            <div
              className={`p-1.5 rounded-full transition-transform active:scale-95 ${
                activeTab === "inventory"
                  ? "bg-teal-100/70 dark:bg-teal-900/40"
                  : ""
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[11px] tracking-tight leading-none">
              Inventory
            </span>
          </button>

          {/* 3. CRM */}
          <button
            type="button"
            onClick={() => handleSelectTab("crm")}
            className={`flex flex-col items-center justify-center gap-1 min-h-[48px] py-1 transition-all rounded-xl relative ${
              activeTab === "crm"
                ? "text-indigo-600 dark:text-indigo-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            <div
              className={`p-1.5 rounded-full transition-transform active:scale-95 ${
                activeTab === "crm"
                  ? "bg-indigo-100/70 dark:bg-indigo-900/40"
                  : ""
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] tracking-tight leading-none">CRM</span>
          </button>

          {/* 4. More (Opens Bottom Sheet) */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 min-h-[48px] py-1 transition-all rounded-xl ${
              isMoreTabActive
                ? "text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            <div
              className={`p-1.5 rounded-full transition-transform active:scale-95 ${
                isMoreTabActive
                  ? "bg-blue-100/70 dark:bg-blue-900/40"
                  : ""
              }`}
            >
              <Grid className="w-5 h-5" />
            </div>
            <span className="text-[11px] tracking-tight leading-none">
              {isMoreTabActive
                ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                : "More"}
            </span>
          </button>
        </div>
      </nav>

      {/* ── Native Swiggy/Blinkit Style Bottom Sheet Drawer (lg:hidden) ── */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-fade"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="All Modules"
            className="relative bg-white dark:bg-slate-900 rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl border-t border-slate-200 dark:border-slate-800 animate-slide-up-sheet overflow-hidden"
          >
            {/* Grab Handle */}
            <div className="py-2.5 flex justify-center shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                    {currentUser?.profile?.companyName ||
                      currentUser?.profile?.developerName ||
                      "Builder Suite"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {userRole === "mandate" ? "Exclusive Mandate" : "Property Developer"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Close sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Grid of Features */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 pt-1 mb-2">
                Operations & Marketing
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon
                  const isSelected = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all min-h-[76px] ${
                        isSelected
                          ? "bg-blue-50/80 dark:bg-blue-900/30 border-blue-400/60 shadow-sm"
                          : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                        )}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Logout Footer (Safe-area padded) */}
            {onLogout && (
              <div
                className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0"
                style={{
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false)
                    onLogout()
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40 font-bold text-sm transition-all active:scale-[0.98] min-h-[48px]"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
