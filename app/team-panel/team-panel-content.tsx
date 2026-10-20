"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Building2,
  Layers,
  Users,
  MessageSquare,
  FileText,
  Gift,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react"
import { toast } from "sonner"
import { InventoryView } from "@/components/builder/inventory/inventory-view"
import { CRMView } from "@/components/builder/crm/crm-view"
import { CRMCloneView } from "@/components/builder/crm/crm-clone-view"
import { ChatView } from "@/components/builder/chat/chat-view"
import { DocumentsView } from "@/components/builder/documents/documents-view"
import { BlogView } from "@/components/builder/blog/blog-view"
import { OffersView } from "@/components/builder/offers/offers-view"
import { AssignedPropertyDetails } from "@/components/builder/team/assigned-property-details"

type ActiveTab =
  | "dashboard"
  | "properties"
  | "inventory"
  | "crm"
  | "crm2"
  | "chat"
  | "documents"
  | "offers"
  | "blog"
  | "settings"

const NAV_ITEMS: {
  id: ActiveTab
  label: string
  icon: React.ElementType
  color: string
  activeColor: string
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "text-slate-600 dark:text-slate-400",
    activeColor: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white",
  },
  {
    id: "properties",
    label: "Properties",
    icon: Building2,
    color: "text-slate-600 dark:text-slate-400",
    activeColor: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Layers,
    color: "text-slate-600 dark:text-slate-400",
    activeColor: "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
  },
  {
    id: "crm",
    label: "Astronix Leads and CRM",
    icon: Users,
    color: "text-slate-600 dark:text-slate-400",
    activeColor: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
  },
  {
    id: "crm2",
    label: "Our Leads and CRM",
    icon: Users,
    color: "text-slate-600 dark:text-slate-400",
    activeColor: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
  },
  {
    id: "chat",
    label: "Chat",
    icon: MessageSquare,
    color: "text-slate-600 dark:text-slate-400",
    activeColor: "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400",
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    color: "text-slate-600 dark:text-slate-400",
    activeColor: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  },
  {
    id: "offers",
    label: "Offers",
    icon: Gift,
    color: "text-slate-600 dark:text-slate-400",
    activeColor: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  },
  {
    id: "blog",
    label: "Blog",
    icon: FileText,
    color: "text-slate-600 dark:text-slate-400",
    activeColor: "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
  },
  {
    id: "settings",
    label: "Profile & Settings",
    icon: Settings,
    color: "text-slate-600 dark:text-slate-400",
    activeColor: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white",
  },
]

export default function TeamPanelContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Auth check
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (!res.ok) {
          router.push("/login")
          return
        }
        const data = await res.json()
        setCurrentUser(data.user)
      } catch {
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [router])

  // Handle query params (e.g. ?tab=inventory)
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && NAV_ITEMS.some((n) => n.id === tabParam)) {
      setActiveTab(tabParam as ActiveTab)
    }
  }, [searchParams])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl mx-auto">
              {/* Welcome Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black">
                    {(currentUser?.profile?.name || currentUser?.email || "T").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Welcome, {currentUser?.profile?.name || currentUser?.email}!</h2>
                    <p className="text-emerald-100 text-sm">Team Leader — Builder Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ</p>
                    {currentUser?.profile?.userId && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-mono">
                        🪪 {currentUser.profile.userId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned Property */}
              {currentUser?.profile?.propertyName && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Assigned Property</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{currentUser.profile.propertyName}</p>
                      <p className="text-xs text-slate-500">You manage all features for this property</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Access Grid */}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Access</p>
              <div className="grid grid-cols-2 gap-3">
                {NAV_ITEMS.filter((n) => n.id !== "dashboard" && n.id !== "settings" && n.id !== "properties").map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-slate-700 dark:text-slate-300 text-sm font-medium transition-all"
                    >
                      <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-left leading-tight">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      case "properties":
        return (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-7 h-7 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Property</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Property assigned to you by the builder</p>
                </div>
              </div>
              {currentUser?.profile?.propertyName ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-white/50" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{currentUser.profile.propertyName}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Assigned property — you have full management access</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-xs text-slate-400 mb-1">Your User ID</p>
                        <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">{currentUser.profile.userId || "—"}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <p className="text-xs text-slate-400 mb-1">Access Level</p>
                        <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Full Management</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">⚠️ You cannot add new properties. Contact your builder for any property additions.</p>
                    </div>
                  </div>
                  
                  {/* Property Towers Details */}
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
                    <AssignedPropertyDetails 
                      propertyId={currentUser.profile.propertyId} 
                      propertyName={currentUser.profile.propertyName} 
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
                  <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No property assigned yet</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Contact your builder to assign a property.</p>
                </div>
              )}
            </div>
          </div>
        )
      case "inventory":
        return (
          <div className="flex-1 overflow-auto">
            <InventoryView userRole="builder" />
          </div>
        )
      case "crm":
        return (
          <div className="flex-1 overflow-auto">
            <CRMView userRole="builder" />
          </div>
        )
      case "crm2":
        return (
          <div className="flex-1 overflow-auto">
            <CRMCloneView userRole="builder" />
          </div>
        )
      case "chat":
        return (
          <div className="flex-1 overflow-auto">
            <ChatView />
          </div>
        )
      case "documents":
        return (
          <div className="flex-1 overflow-hidden flex flex-col h-full">
            <DocumentsView />
          </div>
        )
      case "offers":
        return (
          <div className="flex-1 overflow-auto">
            <OffersView userRole="builder" />
          </div>
        )
      case "blog":
        return (
          <div className="flex-1 overflow-auto">
            <BlogView onMenuClick={() => setIsMobileMenuOpen(true)} />
          </div>
        )
      case "settings":
        return (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-7 h-7 text-slate-600 dark:text-slate-400" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile & Settings</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your team member profile</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <User className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {currentUser?.name || "Team Member"}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{currentUser?.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                      Team Member
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                    <input
                      type="text"
                      defaultValue={currentUser?.name || ""}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue={currentUser?.email || ""}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-500 text-sm cursor-not-allowed"
                    />
                  </div>
                  <button className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Read-Only Assigned Property Info for Profile Tab */}
              {currentUser?.profile?.propertyName && (
                <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assigned Property Data</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Read-only tower & unit data configured by your Builder for <span className="font-bold text-slate-900 dark:text-white">{currentUser.profile.propertyName}</span>.</p>
                  </div>
                  <div className="p-6">
                    <AssignedPropertyDetails 
                      propertyId={currentUser.profile.propertyId} 
                      propertyName={currentUser.profile.propertyName} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl transition-all duration-300 ease-in-out md:translate-x-0 md:static ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center relative rounded-2xl bg-white border border-slate-200 dark:border-slate-700/50 shadow-md overflow-hidden group transition-all duration-300 p-1">
              <img
                src="/astronix-logo.png"
                alt="Astronix Logo"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Builder Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ
              </h1>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium tracking-wide">
                TEAM PANEL
              </p>
            </div>
          </div>
          <button
            className="md:hidden p-1 rounded-lg text-slate-500 hover:text-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
                  isActive
                    ? `${item.activeColor} shadow-sm`
                    : `${item.color} hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white`
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-left leading-tight">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Bottom User Info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="relative w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white dark:border-slate-600 shadow-sm overflow-hidden">
              <span className="text-white font-black text-base">{(currentUser?.profile?.name || currentUser?.email || "T").charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {currentUser?.profile?.name || currentUser?.email || "Team Leader"}
              </p>
              {currentUser?.profile?.userId && (
                <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate">{currentUser.profile.userId}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-all shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950 relative transition-colors duration-300">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 dark:border-slate-700/50 overflow-hidden flex items-center justify-center p-0.5 shadow-sm">
              <img src="/astronix-logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">Team Panel</span>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto flex flex-col">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
