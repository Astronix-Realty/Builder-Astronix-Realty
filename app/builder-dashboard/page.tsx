"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Building2, MapPin, DollarSign, ChevronRight, Edit2, Trash2, Home, Layers, Building, Eye, User, Save, Globe, Mail, Phone, FileText, Tag, Percent, Calendar, Clock, Gift, Paintbrush, Image as ImageIcon, LogOut, Settings, Menu, X, Palette, Bell, Shield, Lock, Headphones, Smartphone, MessageSquare, Users, Briefcase, Loader2, RefreshCw, Search } from "lucide-react"
import { toast } from "sonner"
import BannerEditor from "@/components/BannerEditor"
import { ImageUpload } from "@/components/ui/image-upload"
import { InventoryView } from "@/components/builder/inventory/inventory-view"
import { CRMView } from "@/components/builder/crm/crm-view"
import { CRMCloneView } from "@/components/builder/crm/crm-clone-view"
import { ChatView } from "@/components/builder/chat/chat-view"
import { DocumentsView } from "@/components/builder/documents/documents-view"
import { TeamView } from "@/components/builder/team/team-view"
import { BlogView } from "@/components/builder/blog/blog-view"
import { OffersView } from "@/components/builder/offers/offers-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"


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
  establishedYear?: string
  tagline?: string
  state?: string
  reraCertificate?: string
  operatingCities?: string
  experience?: string
  aboutCompany?: string
  specialization?: string
}

interface Property {
  id: string
  townshipName: string
  name?: string
  projects: number
  towers: number
  units: number
  location: string
  status: "published" | "pending" | "draft" | "rejected" | "archived" | "completed"

  totalValue: number
  createdDate: string
  updatedAt?: string
  rejectionReason?: string | null
  flowType?: string
  thumbnail?: string
  searchBlob?: string
}


function DashboardContent() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"properties" | "inventory" | "crm" | "crm2" | "chat" | "documents" | "offers" | "blog" | "settings" | "team">("properties")
  const [activeSettingsTab, setActiveSettingsTab] = useState<"profile" | "preferences">("profile")
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [propertyFilter, setPropertyFilter] = useState<'published' | 'pending' | 'draft' | 'rejected'>('published')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [propertySearchInput, setPropertySearchInput] = useState<Record<string, string>>({
    published: "",
    pending: "",
    draft: "",
    rejected: ""
  })
  const [debouncedPropertySearch, setDebouncedPropertySearch] = useState<Record<string, string>>({
    published: "",
    pending: "",
    draft: "",
    rejected: ""
  })

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPropertySearch(propertySearchInput)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [propertySearchInput])

  const [isFetchingProperties, setIsFetchingProperties] = useState(false)
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null)
  const [movingToDraftId, setMovingToDraftId] = useState<string | null>(null)

  const [selectedPropertyForTowers, setSelectedPropertyForTowers] = useState<{ id: string; name: string } | null>(null)
  const [towersList, setTowersList] = useState<any[]>([])
  const [isFetchingTowers, setIsFetchingTowers] = useState(false)


  // Theme Logic
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')

  const saveThemeToDb = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme })
      })
    } catch (error) {
      console.error("Failed to save theme setting to DB", error)
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    saveThemeToDb(newTheme)
  }

  // Notification Preferences Logic
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    "Offer Expiry Reminders": true
  })

  const saveNotificationsToDb = async (updatedNotifications: Record<string, boolean>) => {
    try {
      await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: updatedNotifications })
      })
    } catch (error) {
      console.error("Failed to save notification preferences to DB", error)
    }
  }

  const handleNotificationChange = (key: string, checked: boolean) => {
    const updated = { ...notifications, [key]: checked }
    setNotifications(updated)
    saveNotificationsToDb(updated)
  }

  useEffect(() => {
    if (currentUser?.profile?.notifications) {
      setNotifications(currentUser.profile.notifications)
    }
  }, [currentUser])

  useEffect(() => {
    // Check database first, then local storage or system preference on mount
    if (currentUser?.profile?.theme) {
      setTheme(currentUser.profile.theme)
    } else {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
      if (savedTheme) {
        setTheme(savedTheme)
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('system')
      }
    }
  }, [currentUser])

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
      if (["properties", "inventory", "crm", "crm2", "chat", "documents", "offers", "blog", "team", "profile", "settings"].includes(tabParam)) {
        setActiveTab(tabParam as any)
      }
    }

    if (filterParam) {
      if (filterParam === "drafts" || filterParam === "draft") {
        setPropertyFilter("draft")
      } else if (filterParam === "pending") {
        setPropertyFilter("pending")
      } else if (filterParam === "published" || filterParam === "active") {
        setPropertyFilter("published")
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
    let name = p.name || p.townshipName || "Untitled Property"
    let location = p.location || "Location not set"

    // Prioritize server-calculated counts
    let projectsCount = p.calculatedCounts?.projectsCount || 0
    let towersCount = p.calculatedCounts?.towersCount || 0
    let unitsCount = p.calculatedCounts?.unitsCount || 0
    let thumbnail = p.thumbnail || undefined

    // Fallback for draft/pending if counts are missing in calculatedCounts
    if (projectsCount === 0) {
      if (flowType === "township") {
        projectsCount = details.projects?.length || 0
      } else if (flowType === "project") {
        projectsCount = 1
      }
    }

    if (towersCount === 0) {
      if (flowType === "township" || flowType === "project") {
        towersCount = details.towers?.length || 0
      } else if (flowType === "tower") {
        towersCount = 1
      }
    }

    if (unitsCount === 0) {
      // Calculate units dynamically from tower structure data
      // generatedUnits is a transient computed array, never persisted to DB
      const towers = details.towers || []
      if (towers.length > 0) {
        unitsCount = towers.reduce((total: number, t: any) => {
          const floors = t.totalFloorsNum || parseInt((String(t.totalFloors || "").match(/\d+/g) || []).at(-1) || "0") || 0
          const perFloor = parseInt(t.unitsPerFloor) || 0
          return total + (floors * perFloor)
        }, 0)
      }

      // Fallback: use township.totalUnits if available
      if (unitsCount === 0) {
        unitsCount = details.township?.totalUnits || details.generatedUnits?.length || 0
      }
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
      details.generatedUnits?.reduce((sum: number, u: any) => sum + (Number(u.price) || 0), 0) ||
      (unitsCount > 0 ? unitsCount * 5000000 : 0)

    let finalStatus: Property['status'] = p.status || defaultStatus
    if (p.status === 'published' || p.status === 'active') finalStatus = 'published'
    else if (p.status === 'pending') finalStatus = 'pending'
    else if (p.status === 'rejected') finalStatus = 'rejected'
    else if (p.status === 'draft') finalStatus = 'draft'
    else if (p.status === 'archived') finalStatus = 'archived'


    const searchTerms: string[] = []
    if (name) searchTerms.push(name)
    if (location) searchTerms.push(location)
    if (flowType) searchTerms.push(flowType)

    if (details) {
      if (details.township?.name) searchTerms.push(details.township.name)
      if (details.township?.city) searchTerms.push(details.township.city)
      if (details.township?.state) searchTerms.push(details.township.state)

      if (Array.isArray(details.projects)) {
        details.projects.forEach((proj: any) => {
          if (proj?.name) searchTerms.push(proj.name)
        })
      }

      if (Array.isArray(details.towers)) {
        details.towers.forEach((tow: any) => {
          if (tow?.name) searchTerms.push(tow.name)
        })
      }

      if (Array.isArray(details.generatedUnits)) {
        details.generatedUnits.forEach((unit: any) => {
          if (unit?.unitNumber) searchTerms.push(unit.unitNumber)
          if (unit?.configuration) searchTerms.push(unit.configuration)
        })
      }
    }

    const searchBlob = searchTerms.filter(Boolean).map(s => s.toLowerCase().trim()).join(" | ")

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
      updatedAt: p.updatedAt,
      rejectionReason: p.rejectionReason || null,
      flowType: flowType,
      thumbnail: thumbnail,
      searchBlob,
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
            mapProperty(p, p.status || 'draft')
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

  // Re-fetch properties when user is available and properties tab is active
  useEffect(() => {
    const userId = currentUser?._id || currentUser?.id;
    if (userId && activeTab === "properties") {
      fetchProperties();
    }
  }, [currentUser?._id, currentUser?.id, activeTab]);

  const handleRefreshProperties = () => {
    if (isFetchingProperties) return
    toast("Fetching data...")
    fetchProperties()
  }


  const [profile, setProfile] = useState<BuilderProfile>({
    companyName: "",
    developerName: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    reraNumber: "",
    website: "",
    establishedYear: "",
    tagline: "",
    state: "",
    reraCertificate: "",
    operatingCities: "",
    experience: "",
    aboutCompany: "",
    specialization: ""
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
      establishedYear: p.establishedYear || "",
      tagline: p.tagline || "",
      state: p.state || "",
      reraCertificate: p.reraCertificate || "",
      operatingCities: p.operatingCities || "",
      experience: p.experience || "",
      aboutCompany: p.aboutCompany || "",
      specialization: p.specialization || ""
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
          establishedYear: profile.establishedYear,
          tagline: profile.tagline,
          state: profile.state,
          reraCertificate: profile.reraCertificate,
          operatingCities: profile.operatingCities,
          experience: profile.experience,
          aboutCompany: profile.aboutCompany,
          specialization: profile.specialization
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

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST" });
      if (res.ok) {
        toast.success("OTP sent to your email!");
        setOtpSent(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setSendingOtp(false);
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
          otp: passwordData.otp,
          newPassword: passwordData.newPassword,
        }),
      });

      if (res.ok) {
        toast.success("Password changed successfully!");
        setIsChangingPassword(false);
        setOtpSent(false);
        setPasswordData({ otp: "", newPassword: "", confirmPassword: "" });
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






  const filteredProperties = useMemo(() => {
    const query = (debouncedPropertySearch[propertyFilter] || "").toLowerCase().trim()
    const matched = properties.filter(p => {
      if (p.status !== propertyFilter) return false
      if (!query) return true
      return p.searchBlob?.includes(query)
    })

    if (!query) return matched

    // Prioritize exact matches or startsWith matches on the property name
    return [...matched].sort((a, b) => {
      const aName = (a.townshipName || "").toLowerCase()
      const bName = (b.townshipName || "").toLowerCase()
      
      const aExact = aName === query
      const bExact = bName === query
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1

      const aStarts = aName.startsWith(query)
      const bStarts = bName.startsWith(query)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1

      return 0
    })
  }, [properties, propertyFilter, debouncedPropertySearch])

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
        <mark className="bg-yellow-100 dark:bg-yellow-500/30 text-yellow-800 dark:text-yellow-250 px-0.5 rounded font-semibold">{match}</mark>
        {after}
      </span>
    )
  }

  const handleMoveToDraft = async (id: string) => {
    try {
      setMovingToDraftId(id)
      const res = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      })
      
      if (!res.ok) throw new Error("Failed to move to draft")
      
      toast.success("Property moved to draft successfully")
      // Instantly update UI without reload
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: "draft" } : p))
    } catch (error) {
      console.error(error)
      toast.error("Failed to move property to draft")
    } finally {
      setMovingToDraftId(null)
    }
  }

  const handleViewTowers = async (propertyId: string, propertyName: string) => {
    setSelectedPropertyForTowers({ id: propertyId, name: propertyName })
    setIsFetchingTowers(true)
    setTowersList([])
    try {
      const res = await fetch(`/api/inventory/${propertyId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.towers) {
          setTowersList(data.towers)
        }
      } else {
        const errorText = await res.text()
        toast.error(`Failed to load towers (HTTP ${res.status}): ${errorText}`)
        console.error("Tower fetch failed:", res.status, errorText)
      }
    } catch (error: any) {
      console.error("Error fetching towers:", error)
      toast.error(`Error loading towers: ${error.message}`)
    } finally {
      setIsFetchingTowers(false)
    }
  }

  const formatBaseRate = (rate: number) => {
    if (!rate) return "N/A"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(rate) + " / sqft"
  }


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
    const targetProp = properties.find(p => p.id === id)
    const isDraft = targetProp?.status === 'draft' || propertyFilter === 'draft'

    const confirmMsg = isDraft 
      ? "Are you sure you want to delete this draft? This will only remove your draft copy."
      : "Are you sure you want to delete this property?"

    if (confirm(confirmMsg)) {
      setDeletingPropertyId(id)
      try {
        const endpoint = isDraft ? `/api/properties/${id}/draft` : `/api/properties/${id}`
        const res = await fetch(endpoint, { method: "DELETE" })
        if (res.ok) {
          // Remove from local state immediately for snappy UX
          setProperties(prev => prev.filter(p => p.id !== id))
          toast.success(isDraft ? "Draft deleted successfully" : "Property deleted successfully")
        } else {
          const errData = await res.json().catch(() => ({}))
          const msg = errData?.error || `HTTP ${res.status}`
          console.error(`[deleteProperty] API returned error for id='${id}':`, msg)
          toast.error(`Failed to delete: ${msg}`)
        }
      } catch (error) {
        console.error("[deleteProperty] Network/fetch error:", error)
        toast.error("An error occurred while deleting. Please try again.")
      } finally {
        setDeletingPropertyId(null)
      }
    }
  }

  // Show loading while checking auth or if user is missing (during redirect)
  if (isLoading || !currentUser) {
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
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "crm" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Users className="h-5 w-5 shrink-0" />
            <span className="text-left leading-tight">Astronix Leads and CRM</span>
          </button>
          <button
            onClick={() => { setActiveTab("crm2"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "crm2" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Users className="h-5 w-5 shrink-0" />
            <span className="text-left leading-tight">Our Leads and CRM</span>
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
            onClick={() => { setActiveTab("team"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "team" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Users className="h-5 w-5" />
            Team
          </button>
          <button
            onClick={() => { setActiveTab("settings"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${activeTab === "settings" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className="text-left leading-tight">Profile & Settings</span>
          </button>
        </nav>

        {/* User Profile - Bottom Sidebar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-2">
          <button 
            onClick={() => { setActiveTab("settings"); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm transition-all text-left group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <div className={`relative w-10 h-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-600 shadow-sm overflow-hidden group-hover:border-slate-100 dark:group-hover:border-slate-700 transition-colors`}>
              {(currentUser?.profile?.logo || profile.logo) ? (
                <Image src={currentUser?.profile?.logo || profile.logo} alt="Company Logo" fill className="object-cover" unoptimized />
              ) : (
                <User className="h-5 w-5 text-slate-500 dark:text-slate-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{currentUser?.profile?.companyName || profile.companyName || currentUser?.name || ""}</p>
              <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-0.5 mb-0.5">
                {currentUser?.profile?.developerName || profile.developerName || "Developer"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{currentUser?.email || ""}</p>
            </div>
            <Settings className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>

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
        {activeTab !== "blog" && (
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
                    {activeTab === "crm" && "Astronix Leads and CRM"}
                    {activeTab === "crm2" && "Our Leads and CRM"}
                    {activeTab === "chat" && "Communications"}
                    {activeTab === "documents" && "Document Center"}

                    {activeTab === "offers" && "Offers Management"}
                    {activeTab === "team" && "Team Management"}
                    {activeTab === "settings" && "Profile & Settings"}
                  </h2>

                  {/* Subtitle (Desktop only) */}
                  <p className="hidden md:block text-sm text-slate-500 dark:text-slate-400">
                    {activeTab === "properties" && "Manage your real estate inventory"}
                    {activeTab === "inventory" && "Track unit status, sales, and availability"}
                    {activeTab === "crm" && "Manage leads, site visits, and bookings"}
                    {activeTab === "crm2" && "Manage leads, site visits, and bookings"}
                    {activeTab === "chat" && "Chat with potential buyers and agents"}
                    {activeTab === "documents" && "Organize brochures, legal docs, and plans"}

                    {activeTab === "offers" && "Create and track special deals"}
                    {activeTab === "team" && "Manage your team members and roles"}
                    {activeTab === "settings" && "Manage company profile and system preferences"}
                  </p>
                </div>
              </div>

              {/* CENTER – DESKTOP ONLY */}
              {activeTab === "properties" && (
                <div className="hidden md:flex items-center gap-6 text-sm font-medium absolute left-1/2 -translate-x-1/2">
                  <button
                    onClick={() => setPropertyFilter("published")}
                    className={`pb-1 transition-colors ${propertyFilter === "published"
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      }`}
                  >
                    Published ({properties.filter(p => p.status === "published").length})
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



                {activeTab === "settings" && activeSettingsTab === "profile" && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50"
                  >
                    {isSavingProfile ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    <span>Save Profile</span>
                  </button>
                )}
              </div>
            </div>

            {/* MOBILE FILTERS (BOTTOM ROW) */}
            {activeTab === "properties" && (
              <div className="md:hidden mt-4 flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setPropertyFilter("published")}
                  className={`flex-1 py-2 text-sm rounded-md font-medium transition ${propertyFilter === "published"
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow"
                    : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                  Published ({properties.filter(p => p.status === "published").length})
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
        )}



        {/* Content Scroll Area */}
        <div className={`flex-1 ${activeTab === "documents" ? "overflow-hidden flex flex-col h-full" : "overflow-y-auto"} ${activeTab === "blog" ? "p-0" : "p-8"}`}>
          {activeTab === "inventory" && <InventoryView userRole={currentUser?.role || "builder"} />}
          {activeTab === "crm" && <CRMView userRole={currentUser?.role || "builder"} />}
          {activeTab === "crm2" && <CRMCloneView userRole={currentUser?.role || "builder"} />}
          {activeTab === "chat" && <ChatView />}
          {activeTab === "documents" && <DocumentsView />}
          {activeTab === "team" && <TeamView />}

          {activeTab === "blog" && <BlogView onMenuClick={() => setIsMobileMenuOpen(true)} />}
          {activeTab === "properties" && (
            <div>
              {/* Add Property Button */}
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-shrink-0">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Your Properties</h2>
                  <p className="text-slate-600 dark:text-slate-400">Manage and create new property listings</p>
                </div>

                {/* Search Bar - Center */}
                <div className="relative flex-1 max-w-md w-full md:mx-6">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={propertySearchInput[propertyFilter] || ""}
                    onChange={(e) => setPropertySearchInput(prev => ({ ...prev, [propertyFilter]: e.target.value }))}
                    placeholder={`Search ${propertyFilter === 'draft' ? 'Draft' : propertyFilter.charAt(0).toUpperCase() + propertyFilter.slice(1)} Properties...`}
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-600 transition-all shadow-sm text-slate-900 dark:text-white"
                  />
                  {propertySearchInput[propertyFilter] && (
                    <button
                      onClick={() => setPropertySearchInput(prev => ({ ...prev, [propertyFilter]: "" }))}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleRefreshProperties}
                  disabled={isFetchingProperties}
                  className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
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
                {isFetchingProperties && filteredProperties.length === 0 ? (
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
                ) : filteredProperties.length === 0 && properties.filter(p => p.status === propertyFilter).length > 0 ? (
                  <div className="col-span-full py-16 px-4 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Properties Found</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      We couldn't find any properties matching "{debouncedPropertySearch[propertyFilter]}" in this tab. Try adjusting your search query.
                    </p>
                    {propertySearchInput[propertyFilter] && (
                      <button
                        onClick={() => setPropertySearchInput(prev => ({ ...prev, [propertyFilter]: "" }))}
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
                            <div className={`p-4 rounded-3xl ${property.flowType === 'township' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' :
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
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-xl border backdrop-blur-sm ${property.status === "published"
                              ? "bg-emerald-500/80 text-white border-emerald-400/50"
                              : property.status === "pending"
                                ? "bg-amber-500/80 text-white border-amber-400/50"
                                : property.status === "rejected"
                                  ? "bg-red-500/80 text-white border-red-400/50"
                                  : "bg-slate-500/80 text-white border-slate-400/50"
                            }`}>
                            {property.status === "published" ? "Published" : property.status === "pending" ? "Pending" : property.status === "draft" ? "Draft" : property.status}
                          </span>

                        </div>
                      </div>

                       {/* Property Header */}
                      <div className="p-5 flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate" title={property.townshipName || property.name || ""}>
                              {highlightMatch(property.townshipName || property.name || "", debouncedPropertySearch[propertyFilter] || "")}
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
                          <span className="truncate">{highlightMatch(property.location || 'Location N/A', debouncedPropertySearch[propertyFilter] || "")}</span>
                        </div>
                      </div>

                      <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                        <div className={`grid gap-4 text-center ${property.flowType === 'township' ? 'grid-cols-3' :
                            property.flowType === 'project' ? 'grid-cols-2' :
                              'grid-cols-1'
                          }`}>
                          {/* Township always shows Projects */}
                          {property.flowType === 'township' && (
                            <div className="relative after:absolute after:right-[-8px] after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-[1px] after:bg-slate-200 dark:after:bg-slate-800">
                              <div className="text-xl font-black text-slate-800 dark:text-white">{property.projects || 0}</div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Projects</div>
                            </div>
                          )}

                          {/* Township & Project show Towers */}
                          {(property.flowType === 'township' || property.flowType === 'project') && (
                            <div className={property.flowType === 'township' ? "relative after:absolute after:right-[-8px] after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-[1px] after:bg-slate-200 dark:after:bg-slate-800" : ""}>
                              <div className="text-xl font-black text-slate-800 dark:text-white">{property.towers || 0}</div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Towers</div>
                            </div>
                          )}

                          {/* Everyone shows Units */}
                          <div>
                            <div className="text-xl font-black text-blue-600 dark:text-blue-400">{property.units || 0}</div>
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

                      {/* Rejection Alert */}
                      {property.status === 'rejected' && property.rejectionReason && (
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
                                  {new Date(property.updatedAt).toLocaleDateString()} at {new Date(property.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex gap-2">
                        <button
                          onClick={() => handleViewTowers(property.id, property.townshipName)}
                          className="flex-1 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>

                        {property.status === 'draft' ? (
                          <a
                            href={`/builder?flow=${property.flowType || "township"}&edit=${property.id}`}
                            className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </a>
                        ) : (
                          <button
                            onClick={() => handleMoveToDraft(property.id)}
                            disabled={movingToDraftId === property.id}
                            className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                          >
                            {movingToDraftId === property.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
                            Move to Draft
                          </button>
                        )}



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
                    {propertyFilter === 'published' ? "You haven't published any properties yet." :
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

          {activeTab === "offers" && <OffersView userRole={currentUser?.role || "builder"} />}


          {
            activeTab === "settings" && (
              <div className="max-w-6xl mx-auto">

                <Tabs value={activeSettingsTab} onValueChange={(val: any) => setActiveSettingsTab(val)} className="space-y-6">
                  <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto inline-flex">
                    <TabsTrigger value="profile" className="flex-1 md:w-48 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-4 py-2">Builder Profile</TabsTrigger>
                    <TabsTrigger value="preferences" className="flex-1 md:w-48 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-4 py-2">System Preferences</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="focus-visible:outline-none animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left Col - Avatar & Basic */}
                      <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8 h-fit">
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
                          <ImageUpload
                            value={profile.logo}
                            onChange={(val) => setProfile({ ...profile, logo: val })}
                            label="Company Logo"
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
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Established Year</label>
                                  <input
                                    type="text"
                                    value={profile.establishedYear}
                                    onChange={(e) => setProfile({ ...profile, establishedYear: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. 1998"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">State</label>
                                  <input
                                    type="text"
                                    value={profile.state}
                                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Maharashtra"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Operating Cities / Locations of Work</label>
                                  <input
                                    type="text"
                                    value={profile.operatingCities}
                                    onChange={(e) => setProfile({ ...profile, operatingCities: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Mumbai, Pune, Thane"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tagline</label>
                                  <input
                                    type="text"
                                    value={profile.tagline}
                                    onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Company tagline or short bio"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">About Company</label>
                                  <textarea
                                    value={profile.aboutCompany}
                                    onChange={(e) => setProfile({ ...profile, aboutCompany: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Detailed description of the company..."
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
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Experience</label>
                                  <input
                                    type="text"
                                    value={profile.experience}
                                    onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. 25+ Years"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Specializations</label>
                                  <input
                                    type="text"
                                    value={profile.specialization}
                                    onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Luxury, Commercial"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Developer Description</label>
                                  <textarea
                                    value={profile.description}
                                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Brief overview or bio of the developer..."
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
                              <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => handleThemeChange('light')} className="peer sr-only" />
                              <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 peer-checked:border-blue-600 dark:peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 transition-all text-center">
                                <div className="w-full h-20 bg-slate-100 rounded-lg mb-3 border border-slate-200 flex flex-col gap-2 p-2 overflow-hidden">
                                  <div className="h-2 w-full bg-white rounded-full"></div>
                                  <div className="h-2 w-2/3 bg-white rounded-full"></div>
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white peer-checked:text-blue-700 dark:peer-checked:text-blue-400">Light</span>
                              </div>
                            </label>
                            <label className="cursor-pointer">
                              <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => handleThemeChange('dark')} className="peer sr-only" />
                              <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 peer-checked:border-blue-600 dark:peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 transition-all text-center">
                                <div className="w-full h-20 bg-slate-800 rounded-lg mb-3 border border-slate-700 flex flex-col gap-2 p-2 overflow-hidden">
                                  <div className="h-2 w-full bg-slate-700 rounded-full"></div>
                                  <div className="h-2 w-2/3 bg-slate-700 rounded-full"></div>
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white peer-checked:text-blue-700 dark:peer-checked:text-blue-400">Dark</span>
                              </div>
                            </label>
                            <label className="cursor-pointer">
                              <input type="radio" name="theme" value="system" checked={theme === 'system'} onChange={() => handleThemeChange('system')} className="peer sr-only" />
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
                          {['Offer Expiry Reminders'].map(item => {
                            const isOn = notifications[item] !== false
                            return (
                              <div key={item} className="flex items-center justify-between">
                                <span className="text-slate-700 dark:text-slate-300">{item}</span>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={isOn}
                                  onClick={() => handleNotificationChange(item, !isOn)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                    isOn ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                      isOn ? 'translate-x-[22px]' : 'translate-x-[2px]'
                                    }`}
                                  />
                                </button>
                              </div>
                            )
                          })}
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
                          </div>
                      </div>

                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )
          }
        </div>
      </main>


      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h3>
              <button
                onClick={() => {
                  setIsChangingPassword(false);
                  setOtpSent(false);
                  setPasswordData({ otp: "", newPassword: "", confirmPassword: "" });
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {!otpSent ? (
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Verify Your Identity</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  We'll send a 6-digit OTP to your registered email address to verify it's you before changing your password.
                </p>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-sm shadow-blue-500/20 disabled:opacity-70 flex justify-center items-center gap-2 mt-4"
                >
                  {sendingOtp ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP to Email"
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Enter 6-digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={passwordData.otp}
                    onChange={(e) => setPasswordData({ ...passwordData, otp: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all tracking-widest"
                    placeholder="123456"
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
                    onClick={() => {
                      setIsChangingPassword(false);
                      setOtpSent(false);
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl transition-all shadow-sm shadow-blue-500/20 font-medium disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Towers View Modal */}
      <Dialog open={!!selectedPropertyForTowers} onOpenChange={(open) => { if (!open) setSelectedPropertyForTowers(null); }}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
          <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Towers in {selectedPropertyForTowers?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              List of configured towers and their pricing information.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[350px] overflow-y-auto pr-1">
            {isFetchingTowers ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Fetching tower list...</p>
              </div>
            ) : towersList.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No Towers Found</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  There are no towers configured or generated for this property.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {towersList.map((tower) => (
                  <div
                    key={tower._id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {tower.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <span>{tower.floorCount || 0} Floors</span>
                          <span className="w-1 h-1 rounded-full bg-slate-350 dark:bg-slate-600"></span>
                          <span>{tower.unitCount || 0} Units</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-black font-mono shadow-sm">
                        {formatBaseRate(tower.baseRate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => setSelectedPropertyForTowers(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default function BuilderDashboard() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
