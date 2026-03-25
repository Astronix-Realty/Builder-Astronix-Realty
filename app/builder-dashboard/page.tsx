"use client"

import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Building2, MapPin, DollarSign, ChevronRight, Edit2, Trash2, Home, Layers, Building, Eye, User, Save, Globe, Mail, Phone, FileText, Tag, Percent, Calendar, Clock, Gift, Paintbrush, Image as ImageIcon, LogOut, Settings, Menu, X, Palette, Bell, Shield, Lock, Headphones, Smartphone, MessageSquare, Users, Briefcase } from "lucide-react"
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
  status: "active" | "pending" | "completed"
  totalValue: number
  createdDate: string
  flowType?: string
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
  const [properties, setProperties] = useState<Property[]>([])
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
      if (filterParam === "drafts" || filterParam === "pending") {
        setPropertyFilter("pending")
      } else if (filterParam === "published" || filterParam === "active") {
        setPropertyFilter("active")
      }
    }
  }, [searchParams])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  // Helper to map DB/Storage data to UI format
  const mapProperty = (p: any, defaultStatus: 'active' | 'pending'): Property => {
    const details = p.details || {}
    const flowType = p.flowType

    let name = "Untitled Property"
    let location = "Unknown Location"
    let projectsCount = 0
    let towersCount = 0
    let unitsCount = 0

    if (flowType === "township" && details.township) {
      name = details.township.name || "Untitled Township"
      location = `${details.township.city || ""}, ${details.township.state || ""}`
      projectsCount = details.projects?.length || 0
      towersCount = details.towers?.length || 0
    } else if (flowType === "project" && details.projects?.[0]) {
      name = details.projects[0].name || "Untitled Project"
      location = `${details.projects[0].city || ""}, ${details.projects[0].state || ""}`
      projectsCount = 1
      towersCount = details.towers?.length || 0
    } else if (flowType === "tower" && details.towers?.[0]) {
      name = details.towers[0].name || "Untitled Tower"
      location = `${details.towers[0].city || ""}, ${details.towers[0].state || ""}`
      projectsCount = 0
      towersCount = 1
    }

    unitsCount = details.generatedUnits?.length || 0
    const totalValue = details.generatedUnits?.reduce((sum: number, u: any) => sum + (u.price || 0), 0) || (unitsCount * 5000000)

    let finalStatus: 'active' | 'pending' = defaultStatus
    if (p.status === 'draft') finalStatus = 'pending'
    else if (p.status === 'published') finalStatus = 'active'

    return {
      id: p._id || p.id, // Support MongoDB _id
      townshipName: name,
      projects: projectsCount,
      towers: towersCount,
      units: unitsCount,
      location: location.replace(/^, /, "").replace(/, $/, "") || "Location not set",
      status: finalStatus,
      totalValue: totalValue || 0,
      createdDate: p.createdAt || new Date().toISOString(),
      flowType: flowType
    }
  }

  // Load properties from MongoDB
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch("/api/properties")
        if (res.ok) {
          const data = await res.json()
          if (data.properties) {
            const mapped = data.properties.map((p: any) => 
              mapProperty(p, p.status === 'draft' ? 'pending' : 'active')
            )
            setProperties(mapped)
          }
        }
      } catch (error) {
        console.error("Error loading properties:", error)
      }
    }

    if (currentUser) {
      fetchProperties()
    }
  }, [currentUser])

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
    const savedProfile = localStorage.getItem("builderProfile")
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile))
    } else if (currentUser) {
      // Auto-fill from currentUser if no profile exists
      // Construct address from multiple fields if available
      const fullAddress = [
        currentUser.address,
        currentUser.city,
        currentUser.state
      ].filter(Boolean).join(", ")

      setProfile(prev => ({
        ...prev,
        companyName: currentUser.companyName || prev.companyName,
        developerName: currentUser.developerName || prev.developerName,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone,
        address: fullAddress || prev.address,
        reraNumber: currentUser.reraNumber || prev.reraNumber,
        website: currentUser.website || prev.website,
        logo: currentUser.logo || prev.logo,
      }))
    }
  }, [currentUser])

  const handleSaveProfile = () => {
    // 1. Save to builderProfile (Profile State)
    localStorage.setItem("builderProfile", JSON.stringify(profile))

    // 2. Update currentUser session
    const updatedUser = { ...currentUser, ...profile }
    setCurrentUser(updatedUser)
    localStorage.setItem("currentUser", JSON.stringify(updatedUser))

    // 3. Update in registeredUsers "Database"
    const allUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
    const userIndex = allUsers.findIndex((u: any) => u.email === currentUser.email) // Assuming email is unique/stable identifier or use ID if available

    if (userIndex !== -1) {
      allUsers[userIndex] = { ...allUsers[userIndex], ...profile }
      localStorage.setItem("registeredUsers", JSON.stringify(allUsers))
    }

    alert("Profile saved successfully!")
    setActiveTab("properties")
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
  const [propertyFilter, setPropertyFilter] = useState<'active' | 'pending'>('active')

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
    if (confirm("Are you sure you want to delete this property?")) {
      try {
        const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' })
        if (res.ok) {
          setProperties(prev => prev.filter(p => p.id !== id))
        } else {
          alert("Failed to delete property. Status: " + res.status)
        }
      } catch (error) {
        console.error("Delete property error:", error)
        alert("An error occurred while deleting")
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
            <div className="w-12 h-12 flex items-center justify-center relative">
              <img src="/astronix-logo.png" alt="Astronix Logo" className="w-full h-full object-contain" />
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
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "inventory" ? "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Layers className="h-5 w-5" />
            Inventory
          </button>
          <button
            onClick={() => { setActiveTab("crm"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "crm" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Users className="h-5 w-5" />
            CRM & Leads
          </button>
          <button
            onClick={() => { setActiveTab("chat"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "chat" ? "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <MessageSquare className="h-5 w-5" />
            Chat
          </button>
          <button
            onClick={() => { setActiveTab("documents"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "documents" ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <FileText className="h-5 w-5" />
            Documents
          </button>
          <button
            onClick={() => { setActiveTab("team"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "team" ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Briefcase className="h-5 w-5" />
            Team Access
          </button>
          <button
            onClick={() => { setActiveTab("offers"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "offers" ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Gift className="h-5 w-5" />
            Offers
          </button>
          <button
            onClick={() => { setActiveTab("blog"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "blog" ? "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
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
              {currentUser?.logo ? (
                <Image src={currentUser.logo} alt="Builder Logo" fill className="object-cover" unoptimized />
              ) : (
                <User className="h-5 w-5 text-slate-500 dark:text-slate-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser?.companyName || "Builder"}</p>
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
                  Drafts ({properties.filter(p => p.status === "pending").length})
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
                Drafts ({properties.filter(p => p.status === "pending").length})
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
                {properties.filter(p => p.status === propertyFilter).map((property) => (
                  <div
                    key={property.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Property Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{property.townshipName}</h3>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                            <MapPin className="h-4 w-4" />
                            {property.location}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${property.status === "active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : property.status === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                        >
                          {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Property Stats */}
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{property.projects}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Projects</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{property.towers}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Towers</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{property.units}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Units</div>
                        </div>
                      </div>
                    </div>

                    {/* Property Value */}
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-3">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-medium">Total Value</span>
                      </div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(property.totalValue)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        Created {new Date(property.createdDate).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-2">
                      <a
                        href={`/builder?flow=${property.flowType || "township"}&edit=${property.id}`}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </a>

                      {property.status !== "pending" && (
                        <a
                          href={`/${property.flowType || "township"}/${property.id}`}
                          target="_blank"
                          className="px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
                          title="View Property"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      )}

                      <button
                        onClick={() => deleteProperty(property.id)}
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {properties.filter(p => p.status === propertyFilter).length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Building2 className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Properties Found</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {propertyFilter === 'active' ? "You haven't published any properties yet." : "You don't have any drafts."}
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


                add new offer button ok
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
                    </div>
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
                                  <span className="px-2 py-1 bg-green-500 text-xs font-bold rounded-full animate-pulse">LIVE</span>
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

                  <TabsContent value="profile" className="focus-visible:outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
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
                              <span className="font-medium text-slate-900 dark:text-white">Dec 2024</span>
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
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                              >
                                <Save className="h-5 w-5" />
                                Save Profile
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preferences" className="focus-visible:outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
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
                            <button className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">Change</button>
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
