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
} from "lucide-react"
import { DashboardTab, DashboardProfile } from "./dashboard-types"

interface DashboardSidebarProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  onLogout: () => void
  role: "builder" | "mandate"
  currentUser: any
  profile: DashboardProfile
}

export function DashboardSidebar({
  activeTab,
  onTabChange,
  onLogout,
  role,
  currentUser,
  profile,
}: DashboardSidebarProps) {
  const panelTitle = role === "mandate" ? "MANDATE PANEL" : "BUILDER PANEL"

  return (
    <aside className="hidden lg:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shadow-xl static z-30 shrink-0">
      {/* Branding Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center relative rounded-full bg-[#050b18] border border-slate-700/50 shadow-xl overflow-hidden group transition-all duration-300 hover:border-blue-500/40">
            <img
              src="/astronix-logo.png"
              alt="Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ Logo"
              className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              {panelTitle}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <button
          onClick={() => onTabChange("bills")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
            activeTab === "bills"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Receipt className="h-5 w-5" />
          Bills
        </button>

        <button
          onClick={() => onTabChange("properties")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
            activeTab === "properties"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Building2 className="h-5 w-5" />
          Properties
        </button>

        <button
          onClick={() => onTabChange("inventory")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
            activeTab === "inventory"
              ? "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Layers className="h-5 w-5" />
          Inventory
        </button>

        <button
          onClick={() => onTabChange("crm")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
            activeTab === "crm"
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="h-5 w-5 shrink-0" />
          <span className="text-left leading-tight">Astronix Leads and CRM</span>
        </button>

        <button
          onClick={() => onTabChange("crm2")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
            activeTab === "crm2"
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="h-5 w-5 shrink-0" />
          <span className="text-left leading-tight">Our Leads and CRM</span>
        </button>

        <button
          onClick={() => onTabChange("chat")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
            activeTab === "chat"
              ? "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          Chat
        </button>

        <button
          onClick={() => onTabChange("documents")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
            activeTab === "documents"
              ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText className="h-5 w-5" />
          Documents
        </button>

        <button
          onClick={() => onTabChange("offers")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
            activeTab === "offers"
              ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Gift className="h-5 w-5" />
          Offers
        </button>

        <button
          onClick={() => onTabChange("blog")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
            activeTab === "blog"
              ? "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText className="h-5 w-5" />
          Blog
        </button>

        <button
          onClick={() => onTabChange("team")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
            activeTab === "team"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="h-5 w-5" />
          Team
        </button>

        <button
          onClick={() => onTabChange("settings")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
            activeTab === "settings"
              ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="text-left leading-tight">Profile & Settings</span>
        </button>

        <button
          onClick={() => onTabChange("feedback")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all mt-4 border border-dashed ${
            activeTab === "feedback"
              ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Headphones className="h-5 w-5" />
          Feedback & Support
        </button>
      </nav>

      {/* User Profile - Bottom Sidebar */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-2">
        <button
          onClick={() => onTabChange("settings")}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm transition-all text-left group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <div className="relative w-10 h-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-600 shadow-sm overflow-hidden group-hover:border-slate-100 dark:group-hover:border-slate-700 transition-colors">
            {currentUser?.profile?.logo || profile.logo ? (
              <Image
                src={currentUser?.profile?.logo || profile.logo || ""}
                alt="Company Logo"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <User className="h-5 w-5 text-slate-500 dark:text-slate-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {currentUser?.profile?.companyName ||
                profile.companyName ||
                currentUser?.name ||
                ""}
            </p>
            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-0.5 mb-0.5">
              {currentUser?.profile?.developerName ||
                profile.developerName ||
                (role === "mandate" ? profile.fullName || "Mandate Partner" : "Developer")}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
              {currentUser?.email || ""}
            </p>
          </div>
          <Settings className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
