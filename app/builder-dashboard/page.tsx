"use client"

import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Building2, MapPin, DollarSign, ChevronRight, Edit2, Trash2, Home, Layers, Building, Eye, User, Save, Globe, Mail, Phone, FileText, Tag, Percent, Calendar, Clock, Gift, Paintbrush, Image as ImageIcon, LogOut, Settings, Menu, X, Palette, Bell, Shield, Lock, Headphones, Smartphone, MessageSquare, Users, Briefcase, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import BannerEditor from "@/components/BannerEditor"
import { ImageUpload } from "@/components/ui/image-upload"
import { InventoryView } from "@/components/builder/inventory/inventory-view"
import { CRMView } from "@/components/builder/crm/crm-view"
import { ChatView } from "@/components/builder/chat/chat-view"
import { DocumentsView } from "@/components/builder/documents/documents-view"
import { TeamView } from "@/components/builder/team/team-view"
import { BlogView } from "@/components/builder/blog/blog-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BuilderProfile {
  companyName: string
  developerName: string
  email: string
  phone: string
  address: string
  description: string
  reraNumber: string
  website: string
  logo?: string
}

interface Property {
  id: string
  townshipName: string
  projects: number
  towers: number
  units: number
  location: string
  status: "active" | "pending" | "draft" | "rejected" | "completed"
  totalValue: number
  createdDate: string
  flowType?: string
  thumbnail?: string
}

interface Offer {
  id: string
  offerName: string           // e.g., "Monsoon Dhamaka", "Gudi Padwa Offer"
  benefitText: string         // e.g., "₹2 Lakh Off", "Free Modular Kitchen"
  benefitHighlight: string    // Short highlight for badges e.g., "2L OFF"
  projectId: string           // property id or "all"
  expiryDate: string          // When offer expires
  bannerImage?: string        // Optional banner image URL/base64
  isActive: boolean
  createdAt: string
}

function DashboardContent() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [properties, setProperties] = useState<Property[]>([])
  const [isFetchingProperties, setIsFetchingProperties] = useState(false)
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [showAddOffer, setShowAddOffer] = useState(false)
  const [showBannerEditor, setShowBannerEditor] = useState(false)
  const [bannerType, setBannerType] = useState<'strip' | 'badge' | 'card'>('strip')
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [newOffer, setNewOffer] = useState<Partial<Offer>>({
    offerName: "",
    benefitText: "",
    benefitHighlight: "",
    projectId: "all",
    expiryDate: "",
    bannerImage: "",
    isActive: true
  })

  // Theme Logic
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('system')
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // Auth: fetch current user from API
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

  // Handle Query Params (Redirects from Builder)
  const searchParams = useSearchParams()
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    const filterParam = searchParams.get("filter")

    if (tabParam) {
      if (["properties", "offers", "profile", "settings"].includes(tabParam)) {
        setActiveTab(tabParam as any)
      }
    }

    if (filterParam) {
      if (filterParam === "drafts" || filterParam === "draft") {
        setPropertyFilter("draft")
      } else if (filterParam === "pending") {
        setPropertyFilter("pending")
      } else if (filterParam === "published" || filterParam === "active") {
        setPropertyFilter("active")
      } else if (filterParam === "rejected") {
        setPropertyFilter("rejected")
      }
    }
  }, [searchParams])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  // Helper to map DB/Storage data to UI format
  const mapProperty = (p: any, defaultStatus: 'active' | 'pending' | 'draft' | 'rejected'): Property => {
    const details = p.details || {}
    const flowType = p.flowType || p.type

    // Use root property name or townshipName as fallback
    let name = p.townshipName || p.name || "Untitled Property"
    let location = p.location || "Location not set"
    
    // Prioritize server-calculated counts
    let projectsCount = p.calculatedCounts?.projectsCount || 0
    let towersCount = p.calculatedCounts?.towersCount || 0
    let unitsCount = p.calculatedCounts?.unitsCount || 0
    let thumbnail = p.thumbnail || undefined
    
    // Fallback for draft/pending if counts are missing in calculatedCounts
    if (projectsCount === 0 && towersCount === 0 && unitsCount === 0) {
      if (flowType === "township") {
        projectsCount = details.projects?.length || 0
        towersCount = details.towers?.length || 0
      } else if (flowType === "project") {
        projectsCount = 1
        towersCount = details.towers?.length || 0
      } else if (flowType === "tower") {
        towersCount = 1
      }
      unitsCount = details.generatedUnits?.length || 0
    }

    // Hero Image Discovery (Search hierarchy if thumbnail is missing)
    if (!thumbnail) {
      thumbnail = 
        details?.township?.heroImage || 
        details?.projects?.find((pr: any) => pr.heroImage)?.heroImage || 
        details?.towers?.find((tw: any) => tw.heroImage)?.heroImage ||
        details?.heroImage;
    }

    const totalValue = p.totalValue || 
      details.generatedUnits?.reduce((sum: number, u: any) => sum + (u.price || 0), 0) ||
      (unitsCount > 0 ? unitsCount * 5000000 : 0)

    let finalStatus: Property['status'] = defaultStatus
    if (p.status === 'draft') finalStatus = 'draft'
    else if (p.status === 'pending') finalStatus = 'pending'
    else if (p.status === 'rejected') finalStatus = 'rejected'
    else if (p.status === 'published' || p.status === 'active') finalStatus = 'active'

    return {
      id: p._id || p.id,
      townshipName: name,
      projects: projectsCount,
      towers: towersCount,
      units: unitsCount,
      location: location,
      status: finalStatus,
      totalValue: totalValue || 0,
      createdDate: p.createdAt || new Date().toISOString(),
      flowType: flowType,
      thumbnail: thumbnail,
    }
  }

  // Load properties from MongoDB
  const fetchProperties = async () => {
    setIsFetchingProperties(true)
    try {
      const res = await fetch("/api/properties")
      if (res.ok) {
        const data = await res.json()
        if (data.properties) {
          const mapped = data.properties.map((p: any) => 
            mapProperty(p, p.status === 'draft' ? 'draft' : p.status === 'pending' ? 'pending' : p.status === 'rejected' ? 'rejected' : 'active')
          )
          setProperties(mapped)
        }
      } else {
        throw new Error("Failed to load properties")
      }
    } catch (error) {
      console.error("Error loading properties:", error)
      toast.error("Failed to fetch properties")
    } finally {
      setIsFetchingProperties(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchProperties()
    }
  }, [currentUser])

  const handleRefreshProperties = () => {
    if (isFetchingProperties) return
    toast("Fetching data...")
    fetchProperties()
  }

  // Load mock/local offers for now (Keep localStorage for non-critical settings)
  useEffect(() => {
    const savedOffers = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("builderOffers") || "[]") : []
    setOffers(savedOffers)
  }, [])

  const [profile, setProfile] = useState<BuilderProfile>({
    companyName: "",
    developerName: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    reraNumber: "",
    website: ""
  })

  useEffect(() => {
    if (!currentUser) return;

    // Profile data lives inside currentUser.profile (from User model schema)
    const p = currentUser.profile || {};

    // Construct address from multiple fields if available
    const fullAddress = [
      p.address,
      p.city,
      p.state
    ].filter(Boolean).join(", ");

    setProfile({
      companyName: p.companyName || "",
      developerName: p.developerName || "",
      email: currentUser.email || p.email || "",
      phone: p.phone || "",
      address: fullAddress || "",
      description: p.description || "",
      reraNumber: p.reraNumber || "",
      website: p.website || "",
      logo: p.logo || "",
    });
  }, [currentUser])

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: profile.companyName,
          developerName: profile.developerName,
          phone: profile.phone,
          address: profile.address,
          description: profile.description,
          reraNumber: profile.reraNumber,
          website: profile.website,
          logo: profile.logo,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local currentUser state with the fresh data from DB
        setCurrentUser(data.user);
        toast.success("Profile saved successfully!");
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("An error occurred while saving profile");
    } finally {
      setIsSavingProfile(false);
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (res.ok) {
        toast.success("Password changed successfully!");
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Offer CRUD functions - SIMPLIFIED
  const handleSaveOffer = () => {
    if (!newOffer.offerName || !newOffer.benefitText || !newOffer.expiryDate) {
      alert("Please fill in Offer Name, Benefit, and Expiry Date")
      return
    }

    const offerToSave: Offer = {
      id: editingOffer?.id || `offer-${Date.now()}`,
      offerName: newOffer.offerName || "",
      benefitText: newOffer.benefitText || "",
      benefitHighlight: newOffer.benefitHighlight || newOffer.benefitText?.slice(0, 10) || "",
      projectId: newOffer.projectId || "all",
      expiryDate: newOffer.expiryDate || "",
      bannerImage: newOffer.bannerImage || "",
      isActive: newOffer.isActive ?? true,
      createdAt: editingOffer?.createdAt || new Date().toISOString()
    }

    let updatedOffers: Offer[]
    if (editingOffer) {
      updatedOffers = offers.map(o => o.id === editingOffer.id ? offerToSave : o)
    } else {
      updatedOffers = [...offers, offerToSave]
    }

    setOffers(updatedOffers)
    localStorage.setItem("builderOffers", JSON.stringify(updatedOffers))
    setShowAddOffer(false)
    setEditingOffer(null)
    setNewOffer({
      offerName: "",
      benefitText: "",
      benefitHighlight: "",
      projectId: "all",
      expiryDate: "",
      bannerImage: "",
      isActive: true
    })
  }

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer)
    setNewOffer(offer)
    setShowAddOffer(true)
  }

  const handleDeleteOffer = (id: string) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      const updatedOffers = offers.filter(o => o.id !== id)
      setOffers(updatedOffers)
      localStorage.setItem("builderOffers", JSON.stringify(updatedOffers))
    }
  }

  const toggleOfferStatus = (id: string) => {
    const updatedOffers = offers.map(o =>
      o.id === id ? { ...o, isActive: !o.isActive } : o
    )
    setOffers(updatedOffers)
    localStorage.setItem("builderOffers", JSON.stringify(updatedOffers))
  }

  const [activeTab, setActiveTab] = useState<"properties" | "inventory" | "crm" | "chat" | "documents" | "team" | "offers" | "blog" | "settings">("properties")
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [propertyFilter, setPropertyFilter] = useState<'active' | 'pending' | 'draft' | 'rejected'>('active')

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value)
  }

  const deleteProperty = async (id: string) => {
    if (!id) {
      console.error("[deleteProperty] Called with undefined/empty id — check property card data")
      return
    }
    if (confirm("Are you sure you want to delete this property?")) {
      setDeletingPropertyId(id)
      try {
        const res = await fetch(`/api/properties/${id}`, { method: "DELETE" })
        if (res.ok) {
          // Remove from local state immediately for snappy UX
          setProperties(prev => prev.filter(p => p.id !== id))
          toast.success("Property deleted successfully")
        } else {
          const errData = await res.json().catch(() => ({}))
          const msg = errData?.error || `HTTP ${res.status}`
          console.error(`[deleteProperty] API returned error for id='${id}':`, msg)
          toast.error(`Failed to delete property: ${msg}`)
        }
      } catch (error) {
        console.error("[deleteProperty] Network/fetch error:", error)
        toast.error("An error occurred while deleting. Please try again.")
      } finally {
        setDeletingPropertyId(null)
      }
    }
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - RESPONSIVE (Drawer on Mobile, Fixed on Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl transition-all duration-300 ease-in-out md:translate-x-0 md:static ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center relative rounded-full bg-[#050b18] border border-slate-700/50 shadow-xl overflow-hidden group transition-all duration-300 hover:border-blue-500/40">
              <img src="/astronix-logo.png" alt="Astronix Logo" className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-110" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Builder Astronix Realty</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">BUILDER PANEL</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActiveTab("properties"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "properties" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Building2 className="h-5 w-5" />
            Properties
          </button>
          <button
            onClick={() => { setActiveTab("inventory"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "inventory" ? "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:teal-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Layers className="h-5 w-5" />
            Inventory
          </button>
          <button
            onClick={() => { setActiveTab("crm"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "crm" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:indigo-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Users className="h-5 w-5" />
            CRM & Leads
          </button>
          <button
            onClick={() => { setActiveTab("chat"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "chat" ? "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:sky-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <MessageSquare className="h-5 w-5" />
            Chat
          </button>
          <button
            onClick={() => { setActiveTab("documents"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "documents" ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:orange-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <FileText className="h-5 w-5" />
            Documents
          </button>
          <button
            onClick={() => { setActiveTab("team"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "team" ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:rose-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Briefcase className="h-5 w-5" />
            Team Access
          </button>
          <button
            onClick={() => { setActiveTab("offers"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "offers" ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:purple-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Gift className="h-5 w-5" />
            Offers
          </button>
          <button
            onClick={() => { setActiveTab("blog"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "blog" ? "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:pink-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <FileText className="h-5 w-5" />
            Blog
          </button>
          <button
            onClick={() => { setActiveTab("settings"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "settings" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Settings className="h-5 w-5" />
            Settings & Profile
          </button>
        </nav>

        {/* User Profile - Bottom Sidebar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className={`relative w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-600 shadow-sm overflow-hidden`}>
              {(currentUser?.profile?.logo || profile.logo) ? (
                <Image src={currentUser?.profile?.logo || profile.logo} alt="Builder Logo" fill className="object-cover" unoptimized />
              ) : (
                <User className="h-5 w-5 text-slate-500 dark:text-slate-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser?.profile?.companyName || profile.companyName || "Builder"}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.email || "builder@astronix.com"}</p>
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950 relative transition-colors duration-300">
        {/* Top Header - Contextual */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 sticky top-0 z-10">
          {/* TOP ROW */}
          <div className="flex items-center justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-4">
              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Title */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
                  {activeTab === "properties" && "Property Details"}
                  {activeTab === "inventory" && "Inventory Management"}
                  {activeTab === "crm" && "Lead Management"}
                  {activeTab === "chat" && "Communications"}
                  {activeTab === "documents" && "Document Center"}
                  {activeTab === "team" && "Team Management"}
                  {activeTab === "offers" && "Offers Management"}
                  {activeTab === "blog" && "Blog & News"}
                  {activeTab === "settings" && "Settings & Profile"}
                </h2>

                {/* Subtitle (Desktop only) */}
                <p className="hidden md:block text-sm text-slate-500 dark:text-slate-400">
                  {activeTab === "properties" && "Manage your real estate inventory"}
                  {activeTab === "inventory" && "Track unit status, sales, and availability"}
                  {activeTab === "crm" && "Manage leads, site visits, and bookings"}
                  {activeTab === "chat" && "Chat with potential buyers and agents"}
                  {activeTab === "documents" && "Organize brochures, legal docs, and plans"}
                  {activeTab === "team" && "Manage staff access and performance"}
                  {activeTab === "offers" && "Create and track special deals"}
                  {activeTab === "blog" && "Write and publish articles for your audience"}
                  {activeTab === "settings" && "Manage company profile and system preferences"}
                </p>
              </div>
            </div>

            {/* CENTER – DESKTOP ONLY */}
            {activeTab === "properties" && (
              <div className="hidden md:flex items-center gap-6 text-sm font-medium absolute left-1/2 -translate-x-1/2">
                <button
                  onClick={() => setPropertyFilter("active")}
                  className={`pb-1 transition-colors ${propertyFilter === "active"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    }`}
                >
                  Published ({properties.filter(p => p.status === "active").length})
                </button>

                <button
                  onClick={() => setPropertyFilter("pending")}
                  className={`pb-1 transition-colors ${propertyFilter === "pending"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    }`}
                >
                  Pending ({properties.filter(p => p.status === "pending").length})
                </button>

                <button
                  onClick={() => setPropertyFilter("draft")}
                  className={`pb-1 transition-colors ${propertyFilter === "draft"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    }`}
                >
                  Drafts ({properties.filter(p => p.status === "draft").length})
                </button>

                <button
                  onClick={() => setPropertyFilter("rejected")}
                  className={`pb-1 transition-colors ${propertyFilter === "rejected"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    }`}
                >
                  Rejected ({properties.filter(p => p.status === "rejected").length})
                </button>
              </div>
            )}

            {/* RIGHT */}
            <div className="flex items-center gap-3">
              {activeTab === "properties" && (
                <button
                  onClick={() => setShowAddProperty(prev => !prev)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm"
                >
                  <Plus className="h-5 w-5" />

                  {/* Mobile */}
                  <span className="sm:hidden">Add </span>

                  {/* Desktop */}
                  <span className="hidden sm:inline">Add Property</span>
                </button>

              )}

              {activeTab === "offers" && !showAddOffer && (
                <button
                  onClick={() => setShowAddOffer(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-medium shadow-sm"
                >
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline">Add Offer</span>
                </button>
              )}
            </div>
          </div>

          {/* MOBILE FILTERS (BOTTOM ROW) */}
          {activeTab === "properties" && (
            <div className="md:hidden mt-4 flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setPropertyFilter("active")}
                className={`flex-1 py-2 text-sm rounded-md font-medium transition ${propertyFilter === "active"
                  ? "bg-white dark:bg-slate-900 text-blue-600 shadow"
                  : "text-slate-600 dark:text-slate-400"
                  }`}
              >
                Published ({properties.filter(p => p.status === "active").length})
              </button>

              <button
                onClick={() => setPropertyFilter("pending")}
                className={`flex-1 py-2 text-sm rounded-md font-medium transition ${propertyFilter === "pending"
                  ? "bg-white dark:bg-slate-900 text-blue-600 shadow"
                  : "text-slate-600 dark:text-slate-400"
                  }`}
              >
                Pending ({properties.filter(p => p.status === "pending").length})
              </button>

              <button
                onClick={() => setPropertyFilter("draft")}
                className={`flex-1 py-2 text-sm rounded-md font-medium transition ${propertyFilter === "draft"
                  ? "bg-white dark:bg-slate-900 text-blue-600 shadow"
                  : "text-slate-600 dark:text-slate-400"
                  }`}
              >
                Drafts ({properties.filter(p => p.status === "draft").length})
              </button>
            </div>
          )}
        </header>



        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === "inventory" && <InventoryView />}
          {activeTab === "crm" && <CRMView />}
          {activeTab === "chat" && <ChatView />}
          {activeTab === "documents" && <DocumentsView />}
          {activeTab === "team" && <TeamView />}
          {activeTab === "blog" && <BlogView />}
          {activeTab === "properties" && (
            <div>
              {/* Add Property Button */}
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Your Properties</h2>
                  <p className="text-slate-600 dark:text-slate-400">Manage and create new property listings</p>
                </div>
                <button
                  onClick={handleRefreshProperties}
                  disabled={isFetchingProperties}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetchingProperties ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              {/* Add Property Options with 3 flow types */}
              {showAddProperty && (
                <div className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Start New Property</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">Choose what you want to add:</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Add Township - Full Flow */}
                    <a
                      href="/builder?flow=township"
                      className="group p-6 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Home className="h-6 w-6" />
                      </div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Add Township</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Create a complete township with projects, towers, and units
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Township</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Project</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Tower</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Unit</span>
                      </div>
                    </a>

                    {/* Add Project - Skip Township */}
                    <a
                      href="/builder?flow=project"
                      className="group p-6 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <Layers className="h-6 w-6" />
                      </div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Add Project</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Add a standalone project with towers and units</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Project</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Tower</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Unit</span>
                      </div>
                    </a>

                    {/* Add Tower - Skip Township & Project */}
                    <a
                      href="/builder?flow=tower"
                      className="group p-6 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Building className="h-6 w-6" />
                      </div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Add Tower</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Add a standalone tower with unit configurations</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">Tower</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Unit</span>
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
              {/* End of Add Property Options */}

              {/* Properties Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isFetchingProperties && properties.filter(p => p.status === propertyFilter).length === 0 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-[380px] animate-pulse">
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
                ) : (
                  properties.filter(p => p.status === propertyFilter).map((property) => (
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
                          <div className={`p-4 rounded-3xl ${
                            property.flowType === 'township' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' :
                            property.flowType === 'project' ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/40' :
                            'bg-orange-100 text-orange-600 dark:bg-orange-900/40'
                          }`}>
                            {property.flowType === 'township' ? <Home className="h-10 w-10" /> : 
                             property.flowType === 'project' ? <Layers className="h-10 w-10" /> : 
                             <Building className="h-10 w-10" />}
                          </div>
                        </div>
                      )}
                      
                      {/* Gradient Overlay for Text Readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Hierarchy Badge */}
                      <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 z-20">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">{property.flowType}</span>
                        {property.flowType === "township" && (
                           <>
                             <ChevronRight className="h-3 w-3 text-slate-400" />
                             <Layers className="h-3 w-3 text-blue-500" />
                           </>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4 z-20">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-xl border backdrop-blur-sm ${
                          property.status === "active" 
                            ? "bg-emerald-500/80 text-white border-emerald-400/50" 
                            : property.status === "pending" 
                              ? "bg-amber-500/80 text-white border-amber-400/50" 
                              : "bg-slate-500/80 text-white border-slate-400/50"
                        }`}>
                          {property.status === "active" ? "Published" : property.status === "pending" ? "Draft" : property.status}
                        </span>
                      </div>
                    </div>

                    {/* Property Header */}
                    <div className="p-5 flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate" title={property.townshipName || property.name}>
                            {property.townshipName || property.name}
                          </h3>
                        </div>
                        <div className="shrink-0 text-right">
                           <div className="text-lg font-black text-blue-700 dark:text-blue-400 font-mono tracking-tight">
                              {formatCurrency(property.totalValue || 0)}
                           </div>
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Total Inv. Value</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{property.location || 'Location N/A'}</span>
                      </div>
                    </div>

                    <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                      <div className={`grid gap-4 text-center ${
                        property.flowType === 'township' ? 'grid-cols-3' :
                        property.flowType === 'project' ? 'grid-cols-2' :
                        'grid-cols-1'
                      }`}>
                        {/* Township always shows Projects */}
                        {property.flowType === 'township' && (
                          <div className="relative after:absolute after:right-[-8px] after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-[1px] after:bg-slate-200 dark:after:bg-slate-800">
                            <div className="text-xl font-black text-slate-800 dark:text-white">{property.calculatedCounts?.projectsCount || 0}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Projects</div>
                          </div>
                        )}
                        
                        {/* Township & Project show Towers */}
                        {(property.flowType === 'township' || property.flowType === 'project') && (
                          <div className={property.flowType === 'township' ? "relative after:absolute after:right-[-8px] after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-[1px] after:bg-slate-200 dark:after:bg-slate-800" : ""}>
                            <div className="text-xl font-black text-slate-800 dark:text-white">{property.calculatedCounts?.towersCount || 0}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Towers</div>
                          </div>
                        )}
                        
                        {/* Everyone shows Units */}
                        <div>
                          <div className="text-xl font-black text-blue-600 dark:text-blue-400">{property.calculatedCounts?.unitsCount || 0}</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Units</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-medium uppercase tracking-tight">
                          Synced {new Date(property.createdDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                         ID: <span className="text-slate-300 dark:text-slate-600">{property.id.slice(-6)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex gap-2">
                      <a
                        href={`/builder?flow=${property.flowType || "township"}&edit=${property.id}`}
                        className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </a>



                      <button
                        onClick={() => deleteProperty(property.id)}
                        disabled={deletingPropertyId === property.id}
                        className="px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-white dark:hover:bg-slate-800 hover:text-red-700 dark:hover:border-red-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        title="Delete Property"
                      >
                        {deletingPropertyId === property.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )))}
              </div>

              {/* Empty State */}
              {!isFetchingProperties && properties.filter(p => p.status === propertyFilter).length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Building2 className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Properties Found</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {propertyFilter === 'active' ? "You haven't published any properties yet." : 
                     propertyFilter === 'pending' ? "You don't have any properties pending approval." :
                     propertyFilter === 'rejected' ? "You don't have any rejected properties." :
                     "You don't have any drafts."}
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
          )}

          {/* Offers Tab Content - REDESIGNED with Live Preview */}
          {activeTab === "offers" && (
            <div>
              {/* Offers Header */}
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">🎁 Special Offers</h2>
                  <p className="text-slate-600 dark:text-slate-400">Create attractive offers in seconds - buyers ko turant dikhega!</p>
                </div>
              </div>

              {/* Step-by-Step Offer Creator with Live Preview */}
              {showAddOffer && (
                <div className="mb-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-purple-100 dark:border-slate-800 shadow-xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <Gift className="h-7 w-7" />
                      {editingOffer ? "Edit Offer" : "Create New Offer"}
                    </h3>
                    <p className="text-purple-100 mt-2">Form bharo, preview dekho, publish karo - bas itna simple!</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* LEFT SIDE - Form */}
                    <div className="p-8 border-r border-slate-200 dark:border-slate-800">
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center text-sm font-bold">1</span>
                        Offer Details Bharo
                      </h4>

                      <div className="space-y-6">
                        {/* Offer Name */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Offer ka Naam <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newOffer.offerName || ""}
                            onChange={(e) => setNewOffer({ ...newOffer, offerName: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            placeholder="e.g. Monsoon Dhamaka, Gudi Padwa Special"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Catchy naam do jo buyers ko yaad rahe</p>
                        </div>

                        {/* Benefit/Discount */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Discount / Benefit <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newOffer.benefitText || ""}
                            onChange={(e) => setNewOffer({ ...newOffer, benefitText: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg font-semibold"
                            placeholder="e.g. ₹2 Lakh Off, Free Modular Kitchen"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Ye bada bold text mein dikhega - main attraction!</p>
                        </div>

                        {/* Short Highlight for Badge */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Badge Text (Short)
                          </label>
                          <input
                            type="text"
                            value={newOffer.benefitHighlight || ""}
                            onChange={(e) => setNewOffer({ ...newOffer, benefitHighlight: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            placeholder="e.g. 2L OFF, FREE GIFT"
                            maxLength={15}
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Max 15 characters - photo ke upar sticker mein dikhega</p>
                        </div>

                        {/* Project Selection */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Kis Project ke liye? <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={newOffer.projectId || "all"}
                            onChange={(e) => setNewOffer({ ...newOffer, projectId: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          >
                            <option value="all">🏠 All Properties</option>
                            {properties.map(p => (
                              <option key={p.id} value={p.id}>📍 {p.townshipName}</option>
                            ))}
                          </select>
                        </div>

                        {/* Expiry Date */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Offer Kab Tak? <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={newOffer.expiryDate || ""}
                            onChange={(e) => setNewOffer({ ...newOffer, expiryDate: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Date ke baad offer auto-hide ho jayega</p>
                        </div>

                        {/* Banner Design Section */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            🎨 Custom Banner (Pro Feature!)
                          </label>

                          {newOffer.bannerImage ? (
                            <div className="relative rounded-xl overflow-hidden border-2 border-purple-300 dark:border-purple-800">
                              <div className="relative w-full h-32">
                                <Image
                                  src={newOffer.bannerImage}
                                  alt="Custom Banner"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => setShowBannerEditor(true)}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700"
                                >
                                  <Paintbrush className="h-4 w-4" />
                                  Edit Banner
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewOffer({ ...newOffer, bannerImage: "" })}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowBannerEditor(true)}
                              className="w-full border-2 border-dashed border-purple-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all cursor-pointer group"
                            >
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Paintbrush className="h-7 w-7 text-white" />
                              </div>
                              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Design Custom Banner</p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Canva jaisa editor - Drag, Resize, Edit!</p>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE - Live Preview */}
                    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-sm font-bold">2</span>
                        Live Preview - Click to Edit ✏️
                      </h4>

                      <div className="space-y-6">
                        {/* Preview 1: Listing Strip - With Builder Info */}
                        <div className="group relative">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Listing Page Par (Blue Strip)
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setBannerType('strip')
                                setShowBannerEditor(true)
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Paintbrush className="h-3 w-3" />
                              Edit Design
                            </button>
                          </div>
                          <div
                            onClick={() => {
                              setBannerType('strip')
                              setShowBannerEditor(true)
                            }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all ring-2 ring-transparent hover:ring-purple-400"
                          >
                            {/* Top row: Builder Logo + Company + Project */}
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-bold text-blue-600">
                                {profile.companyName?.[0] || "B"}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs opacity-80">{profile.companyName || "Builder Company"}</p>
                                <p className="text-sm font-medium">
                                  {newOffer.projectId === "all"
                                    ? "All Properties"
                                    : properties.find(p => p.id === newOffer.projectId)?.townshipName || "Project Name"}
                                </p>
                              </div>
                            </div>
                            {/* Main offer content */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                  <Gift className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-lg">{newOffer.offerName || "Offer Title"}</p>
                                  <p className="text-2xl font-black">{newOffer.benefitText || "₹2 Lakh Off"}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                {newOffer.expiryDate && (
                                  <div className="bg-white/20 rounded-lg px-3 py-2">
                                    <p className="text-xs opacity-80">Ends in</p>
                                    <p className="font-bold">
                                      {Math.max(0, Math.ceil((new Date(newOffer.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} Days
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Edit Overlay */}
                          <div className="absolute inset-0 mt-9 bg-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="bg-white text-purple-700 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                              ✏️ Click to Edit
                            </span>
                          </div>
                        </div>

                        {/* Preview 2: Hero Badge/Sticker - Offer Details Only */}
                        <div className="group relative">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              Hero Section Badge (Property Photo)
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setBannerType('badge')
                                setShowBannerEditor(true)
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Paintbrush className="h-3 w-3" />
                              Edit Design
                            </button>
                          </div>
                          <div
                            onClick={() => {
                              setBannerType('badge')
                              setShowBannerEditor(true)
                            }}
                            className="relative bg-slate-300 rounded-xl h-52 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all ring-2 ring-transparent hover:ring-purple-400"
                          >
                            {/* Property Image Placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
                              <Building className="h-16 w-16 text-slate-300" />
                            </div>
                            {/* Offer Badge - Top Left */}
                            <div className="absolute top-3 left-3">
                              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-3 rounded-lg shadow-lg transform -rotate-3">
                                <p className="text-[10px] font-semibold opacity-90">🎁 {newOffer.offerName || "Special Offer"}</p>
                                <p className="text-xl font-black">{newOffer.benefitHighlight || newOffer.benefitText?.slice(0, 12) || "₹2L OFF"}</p>
                                <p className="text-[10px] opacity-80 mt-0.5">Limited Period!</p>
                              </div>
                            </div>
                            {/* Timer Badge - Bottom Right */}
                            {newOffer.expiryDate && (
                              <div className="absolute bottom-3 right-3 bg-black/80 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-bold">
                                  {Math.max(0, Math.ceil((new Date(newOffer.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left
                                </span>
                              </div>
                            )}
                            {/* Edit Overlay */}
                            <div className="absolute inset-0 bg-purple-600/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-white text-purple-700 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                                ✏️ Click to Edit
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Preview 3: Price Card - With Full Builder Info */}
                        <div className="group relative">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Price Card Ke Saath
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setBannerType('card')
                                setShowBannerEditor(true)
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Paintbrush className="h-3 w-3" />
                              Edit Design
                            </button>
                          </div>
                          <div
                            onClick={() => {
                              setBannerType('card')
                              setShowBannerEditor(true)
                            }}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-md border cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all ring-2 ring-transparent hover:ring-purple-400 overflow-hidden"
                          >
                            {/* Header with Builder Info */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border-b flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {profile.companyName?.[0] || "B"}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{profile.companyName || "Builder Company"}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {newOffer.projectId === "all"
                                    ? "All Properties"
                                    : properties.find(p => p.id === newOffer.projectId)?.townshipName || "Project Name"}
                                </p>
                              </div>
                            </div>

                            {/* Price Content */}
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-slate-600 dark:text-slate-400">Base Price</span>
                                <span className="text-xl font-bold text-slate-400 dark:text-slate-600 line-through">₹85 Lac</span>
                              </div>
                              {/* Offer Row - Highlighted */}
                              <div className="flex items-center justify-between mb-3 bg-green-50 dark:bg-green-900/20 -mx-4 px-4 py-3">
                                <div>
                                  <p className="text-green-800 dark:text-green-400 font-bold flex items-center gap-2">
                                    <Gift className="h-4 w-4" />
                                    {newOffer.offerName || "Special Offer"}
                                  </p>
                                  <p className="text-xs text-green-600 dark:text-green-500">{newOffer.benefitText || "₹2 Lakh Off"}</p>
                                </div>
                                <span className="text-green-700 dark:text-green-400 font-black text-xl">-{newOffer.benefitText || "₹2 Lac"}</span>
                              </div>
                              <div className="flex items-center justify-between pt-3 border-t dark:border-slate-700">
                                <span className="text-slate-900 dark:text-white font-semibold">You Pay</span>
                                <span className="text-2xl font-black text-green-600 dark:text-green-400">₹83 Lac</span>
                              </div>
                            </div>
                          </div>
                          {/* Edit Overlay */}
                          <div className="absolute inset-0 mt-9 bg-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="bg-white text-purple-700 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                              ✏️ Click to Edit
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Publish Button */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setShowAddOffer(false)
                        setEditingOffer(null)
                      }}
                      className="px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                        <p>Publish hote hi offer 5 jagah live ho jayega</p>
                      </div>
                      <button
                        onClick={handleSaveOffer}
                        disabled={!newOffer.offerName || !newOffer.benefitText || !newOffer.expiryDate}
                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                      >
                        <Save className="h-5 w-5" />
                        {editingOffer ? "Update Offer" : "🚀 Publish Offer"}
                      </button>
                    </div >
                  </div >
                </div >
              )
              }

              {/* Existing Offers Grid */}
              {
                !showAddOffer && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {offers.map((offer) => {
                        const isExpired = new Date(offer.expiryDate) < new Date()
                        const daysLeft = Math.max(0, Math.ceil((new Date(offer.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                        const propertyName = offer.projectId === "all"
                          ? "All Properties"
                          : properties.find(p => p.id === offer.projectId)?.townshipName || "Unknown"

                        return (
                          <div
                            key={offer.id}
                            className={`bg-white dark:bg-slate-900 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all overflow-hidden ${!offer.isActive || isExpired ? "opacity-60 border-slate-200 dark:border-slate-800" : "border-purple-200 dark:border-purple-900/50"
                              }`}
                          >
                            {/* Offer Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-5 text-white relative">
                              {/* Status Badge */}
                              <div className="absolute top-3 right-3">
                                {isExpired ? (
                                  <span className="px-2 py-1 bg-red-500 text-xs font-bold rounded-full">EXPIRED</span>
                                ) : !offer.isActive ? (
                                  <span className="px-2 py-1 bg-slate-500 text-xs font-bold rounded-full">PAUSED</span>
                                ) : (
                                  <span className="px-2 py-1 bg-green-500 text-xs font-bold rounded-full">LIVE</span>
                                )}
                              </div>

                              <p className="text-purple-200 text-sm font-medium">{offer.offerName}</p>
                              <p className="text-3xl font-black mt-1">{offer.benefitText}</p>

                              {!isExpired && offer.isActive && (
                                <div className="mt-3 flex items-center gap-2 text-purple-100">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm">{daysLeft} days remaining</span>
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="p-5">
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-4">
                                <MapPin className="h-4 w-4" />
                                <span className="text-sm">{propertyName}</span>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => toggleOfferStatus(offer.id)}
                                  disabled={isExpired}
                                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${isExpired
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                    : offer.isActive
                                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                                      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                                    }`}
                                >
                                  {isExpired ? "Expired" : offer.isActive ? "Pause" : "Go Live"}
                                </button>
                                <button
                                  onClick={() => handleEditOffer(offer)}
                                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOffer(offer.id)}
                                  className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Empty State */}
                    {offers.length === 0 && (
                      <div className="text-center py-20 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800/50">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                          <Gift className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Koi Offers Nahi Hai</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                          Special offers create karo aur buyers ko attract karo! Diwali, Holi, New Year - har occasion ke liye offer banao.
                        </p>
                        <button
                          onClick={() => setShowAddOffer(true)}
                          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-xl font-bold text-lg flex items-center gap-3 transition-all mx-auto shadow-lg hover:shadow-xl"
                        >
                          <Plus className="h-6 w-6" />
                          Pehla Offer Banao
                        </button>
                      </div>
                    )}
                  </>
                )
              }
            </div >
          )}

          {
            activeTab === "settings" && (
              <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings & Profile</h2>
                  <p className="text-slate-500 dark:text-slate-400">Manage your company details and system preferences.</p>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                  <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto inline-flex">
                    <TabsTrigger value="profile" className="flex-1 md:w-48 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-4 py-2">Builder Profile</TabsTrigger>
                    <TabsTrigger value="preferences" className="flex-1 md:w-48 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-4 py-2">System Preferences</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="focus-visible:outline-none animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left Col - Avatar & Basic */}
                      <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
                          <ImageUpload
                            value={profile.logo}
                            onChange={(val) => setProfile({ ...profile, logo: val })}
                            label="Builder Logo"
                            className="w-full"
                          />
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Stats</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">Properties</span>
                              <span className="font-medium text-slate-900 dark:text-white">{properties.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">Member Since</span>
                              <span className="font-medium text-slate-900 dark:text-white">{currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Col - Form */}
                      <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                          <div className="space-y-6">
                            {/* Company Info */}
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                Company Details
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                                  <input
                                    type="text"
                                    value={profile.companyName}
                                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Acme Builders"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">RERA Number</label>
                                  <input
                                    type="text"
                                    value={profile.reraNumber}
                                    onChange={(e) => setProfile({ ...profile, reraNumber: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="RERA Registration No."
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Developer Info */}
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                Developer Information
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Developer Name</label>
                                  <input
                                    type="text"
                                    value={profile.developerName}
                                    onChange={(e) => setProfile({ ...profile, developerName: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Full Name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                  <input
                                    type="text"
                                    value={profile.description}
                                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Short bio or tagline"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Contact Info */}
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                Contact & Address
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                                  <input
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                                  <input
                                    type="tel"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website</label>
                                  <input
                                    type="url"
                                    value={profile.website}
                                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Office Address</label>
                                  <textarea
                                    value={profile.address}
                                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-8 flex justify-end">
                              <button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSavingProfile ? (
                                  <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</>
                                ) : (
                                  <><Save className="h-5 w-5" /> Save Profile</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preferences" className="focus-visible:outline-none animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      {/* Appearance */}
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Palette className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          Appearance
                        </h3>
                        <div className="pl-10">
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Choose how Builder Dashboard looks on your device.</p>
                          <div className="grid grid-cols-3 gap-4">
                            <label className="cursor-pointer">
                              <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} className="peer sr-only" />
                              <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 peer-checked:border-blue-600 dark:peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 transition-all text-center">
                                <div className="w-full h-20 bg-slate-100 rounded-lg mb-3 border border-slate-200 flex flex-col gap-2 p-2 overflow-hidden">
                                  <div className="h-2 w-full bg-white rounded-full"></div>
                                  <div className="h-2 w-2/3 bg-white rounded-full"></div>
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white peer-checked:text-blue-700 dark:peer-checked:text-blue-400">Light</span>
                              </div>
                            </label>
                            <label className="cursor-pointer">
                              <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} className="peer sr-only" />
                              <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 peer-checked:border-blue-600 dark:peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 transition-all text-center">
                                <div className="w-full h-20 bg-slate-800 rounded-lg mb-3 border border-slate-700 flex flex-col gap-2 p-2 overflow-hidden">
                                  <div className="h-2 w-full bg-slate-700 rounded-full"></div>
                                  <div className="h-2 w-2/3 bg-slate-700 rounded-full"></div>
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white peer-checked:text-blue-700 dark:peer-checked:text-blue-400">Dark</span>
                              </div>
                            </label>
                            <label className="cursor-pointer">
                              <input type="radio" name="theme" value="system" checked={theme === 'system'} onChange={() => setTheme('system')} className="peer sr-only" />
                              <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 peer-checked:border-blue-600 dark:peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 transition-all text-center">
                                <div className="w-full h-20 bg-gradient-to-br from-slate-100 to-slate-800 rounded-lg mb-3 border border-slate-200 overflow-hidden relative">
                                  <div className="absolute inset-y-0 left-0 w-1/2 bg-slate-100"></div>
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white peer-checked:text-blue-700 dark:peer-checked:text-blue-400">System</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Notifications */}
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          Notification Preferences
                        </h3>
                        <div className="pl-10 grid gap-4">
                          {['New Lead Alerts', 'Weekly Performance Reports', 'Offer Expiry Reminders'].map(item => (
                            <div key={item} className="flex items-center justify-between">
                              <span className="text-slate-700 dark:text-slate-300">{item}</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Security */}
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          Security & Account
                        </h3>
                        <div className="pl-10 space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Lock className="h-5 w-5 text-slate-500" />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">Password</p>
                                <p className="text-xs text-slate-500">Last changed 3 months ago</p>
                              </div>
                            </div>
                            <button
                                onClick={() => setIsChangingPassword(true)}
                                className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                Change
                              </button>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Smartphone className="h-5 w-5 text-slate-500" />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">Two-Factor Authentication</p>
                                <p className="text-xs text-slate-500">Secure your account with 2FA</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )
          }
        </div >
      </main >

      {/* Banner Editor Modal */}
      {
        showBannerEditor && (
          <BannerEditor
            offerName={newOffer.offerName || "Special Offer"}
            benefitText={newOffer.benefitText || "₹2 Lakh Off"}
            benefitHighlight={newOffer.benefitHighlight || "DEAL"}
            bannerType={bannerType}
            onSave={(dataUrl) => {
              setNewOffer({ ...newOffer, bannerImage: dataUrl })
              setShowBannerEditor(false)
            }}
            onClose={() => setShowBannerEditor(false)}
          />
        )
      }

      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h3>
              <button onClick={() => setIsChangingPassword(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingProfile ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h3>
              <button onClick={() => setIsChangingPassword(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingProfile ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div >
  )
}
export default function BuilderDashboard() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
