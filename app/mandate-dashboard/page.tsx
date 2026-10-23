"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { InventoryView } from "@/components/builder/inventory/inventory-view"
import { CRMView } from "@/components/builder/crm/crm-view"
import { CRMCloneView } from "@/components/builder/crm/crm-clone-view"
import { ChatView } from "@/components/builder/chat/chat-view"
import { DocumentsView } from "@/components/builder/documents/documents-view"
import { TeamView } from "@/components/builder/team/team-view"
import { BlogView } from "@/components/builder/blog/blog-view"
import { OffersView } from "@/components/builder/offers/offers-view"
import { BillsView } from "@/components/builder/bills/bills-view"
import { FeedbackView } from "@/components/builder/feedback/feedback-view"
import { AdsStudioView } from "@/components/builder/ads-studio/AdsStudioView"
import PropertyHierarchyModal, { HierarchyPropertyInfo } from "@/components/PropertyHierarchyModal"
import { MobileBottomNav } from "@/components/builder/shared/MobileBottomNav"
import {
  DashboardSidebar,
  DashboardHeader,
  PropertiesView,
  SettingsView,
  Property,
  DashboardProfile,
  DashboardTab,
  PropertyFilter,
  ActiveSettingsTab,
} from "@/components/builder/dashboard"

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get("tab")
      const validTabs = [
        "bills",
        "properties",
        "inventory",
        "crm",
        "crm2",
        "chat",
        "documents",
        "offers",
        "blog",
        "team",
        "settings",
        "feedback",
        "ads-studio",
      ]
      if (tabParam && validTabs.includes(tabParam)) return tabParam as DashboardTab
      try {
        const stored = sessionStorage.getItem("mandate_active_tab")
        if (stored && validTabs.includes(stored)) return stored as DashboardTab
      } catch (e) {}
    }
    return "properties"
  })

  const [activeSettingsTab, setActiveSettingsTab] = useState<ActiveSettingsTab>("profile")
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const filterParam = params.get("filter")
      if (filterParam === "drafts" || filterParam === "draft") return "draft"
      if (filterParam === "pending") return "pending"
      if (filterParam === "published" || filterParam === "active") return "published"
      if (filterParam === "rejected") return "rejected"
      try {
        const stored = sessionStorage.getItem("mandate_property_filter")
        if (stored && ["published", "pending", "draft", "rejected"].includes(stored)) {
          return stored as PropertyFilter
        }
      } catch (e) {}
    }
    return "published"
  })

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab)
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("mandate_active_tab", tab)
        const url = new URL(window.location.href)
        url.searchParams.set("tab", tab)
        window.history.replaceState({}, "", url.toString())
      } catch (e) {}
    }
  }

  const handleFilterChange = (filter: PropertyFilter) => {
    setPropertyFilter(filter)
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("mandate_property_filter", filter)
        const url = new URL(window.location.href)
        url.searchParams.set("filter", filter)
        window.history.replaceState({}, "", url.toString())
      } catch (e) {}
    }
  }

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("astronix_sidebar_collapsed")
      if (stored === "true") {
        setIsSidebarCollapsed(true)
      }
    } catch (e) {}
  }, [])

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem("astronix_sidebar_collapsed", String(next))
      } catch (e) {}
      return next
    })
  }

  // Desktop keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        const target = e.target as HTMLElement
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return
        }
        e.preventDefault()
        handleToggleSidebar()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [propertySearchInput, setPropertySearchInput] = useState<Record<string, string>>({
    published: "",
    pending: "",
    draft: "",
    rejected: "",
  })
  const [debouncedPropertySearch, setDebouncedPropertySearch] = useState<Record<string, string>>({
    published: "",
    pending: "",
    draft: "",
    rejected: "",
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
  const [selectedPropertyForHierarchy, setSelectedPropertyForHierarchy] =
    useState<HierarchyPropertyInfo | null>(null)

  // Theme Logic
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light")

  const saveThemeToDb = async (newTheme: "light" | "dark" | "system") => {
    try {
      await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      })
    } catch (error) {
      console.error("Failed to save theme setting to DB", error)
    }
  }

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    saveThemeToDb(newTheme)
  }

  // Notification Preferences Logic
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    "Offer Expiry Reminders": true,
  })

  const saveNotificationsToDb = async (updatedNotifications: Record<string, boolean>) => {
    try {
      await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: updatedNotifications }),
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
    if (currentUser?.profile?.theme) {
      setTheme(currentUser.profile.theme)
    } else {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null
      if (savedTheme) {
        setTheme(savedTheme)
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("system")
      }
    }
  }, [currentUser])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  // Auth: fetch current user
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

  // Handle Query Params
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    const filterParam = searchParams.get("filter")

    if (tabParam) {
      if (
        [
          "properties",
          "inventory",
          "crm",
          "crm2",
          "chat",
          "documents",
          "offers",
          "blog",
          "team",
          "profile",
          "settings",
          "feedback",
          "bills",
          "ads-studio",
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam as any)
        try {
          sessionStorage.setItem("mandate_active_tab", tabParam)
        } catch (e) {}
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

  const mapProperty = (
    p: any,
    defaultStatus: "published" | "pending" | "draft" | "rejected"
  ): Property => {
    const details = p.details || {}
    const flowType = p.flowType || p.type

    const name = p.name || p.townshipName || "Untitled Property"
    const location = p.location || "Location not set"

    const snapshotProjects = Array.isArray(details?.projects)
      ? details.projects
      : Array.isArray(p.projects)
      ? p.projects
      : []
    // Count calculations: prioritize real calculated counts if available
    let projectsCount = 0
    if (flowType === "township") {
      projectsCount = (p.calculatedCounts?.projectsCount && p.calculatedCounts.projectsCount > 0)
        ? p.calculatedCounts.projectsCount
        : (snapshotProjects.length > 0 ? snapshotProjects.length : 1)
    } else if (flowType === "project") {
      projectsCount = 1
    } else {
      projectsCount = 0
    }

    const directTowers = Array.isArray(details?.towers)
      ? details.towers
      : Array.isArray(p.towers)
      ? p.towers
      : []
    const projectEmbeddedTowers = snapshotProjects.reduce(
      (acc: number, proj: any) => acc + (Array.isArray(proj?.towers) ? proj.towers.length : 0),
      0
    )
    
    let towersCount = 0
    if (p.calculatedCounts?.towersCount !== undefined && p.calculatedCounts.towersCount !== null && p.calculatedCounts.towersCount > 0) {
      towersCount = p.calculatedCounts.towersCount
    } else {
      const derivedTowers = directTowers.length + projectEmbeddedTowers
      towersCount = derivedTowers > 0 ? derivedTowers : (flowType === "tower" ? 1 : 0)
    }

    const snapshotUnits = Array.isArray(details?.generatedUnits)
      ? details.generatedUnits
      : Array.isArray(p.generatedUnits)
      ? p.generatedUnits
      : []
    const allTowersList = [...directTowers]
    snapshotProjects.forEach((proj: any) => {
      if (Array.isArray(proj?.towers)) {
        proj.towers.forEach((tow: any) => {
          if (!allTowersList.some((t: any) => t.id === tow.id || t.name === tow.name)) {
            allTowersList.push(tow)
          }
        })
      }
    })

    let calculatedTowerUnits = 0
    if (allTowersList.length > 0) {
      calculatedTowerUnits = allTowersList.reduce((sum: number, t: any) => {
        if (Array.isArray(t.units) && t.units.length > 0) return sum + t.units.length
        if (typeof t.totalUnits === "number" && t.totalUnits > 0) return sum + t.totalUnits
        if (typeof t.totalUnits === "string" && parseInt(t.totalUnits) > 0)
          return sum + parseInt(t.totalUnits)
        const floors =
          t.totalFloorsNum ||
          parseInt((String(t.totalFloors || "").match(/\d+/g) || []).at(-1) || "0") ||
          0
        const perFloor = parseInt(t.unitsPerFloor) || 0
        return sum + floors * perFloor
      }, 0)
    }

    let unitsCount = 0
    if (p.calculatedCounts?.unitsCount !== undefined && p.calculatedCounts.unitsCount !== null && p.calculatedCounts.unitsCount > 0) {
      unitsCount = p.calculatedCounts.unitsCount
    } else if (snapshotUnits.length > 0) {
      unitsCount = snapshotUnits.length
    } else if (calculatedTowerUnits > 0) {
      unitsCount = calculatedTowerUnits
    } else {
      unitsCount =
        Number(p.units) ||
        Number(p.totalUnits) ||
        Number(details?.township?.totalUnits) ||
        Number(details?.totalUnits) ||
        0
    }

    let thumbnail = p.thumbnail || undefined

    if (!thumbnail) {
      thumbnail =
        details?.township?.heroImage ||
        details?.projects?.find((pr: any) => pr.heroImage)?.heroImage ||
        details?.towers?.find((tw: any) => tw.heroImage)?.heroImage ||
        details?.heroImage
    }

    // Calculate real valuation from actual unit prices if available
    let totalValue = Number(p.totalValue) || 0
    if (!totalValue && details.generatedUnits && Array.isArray(details.generatedUnits)) {
      totalValue = details.generatedUnits.reduce((sum: number, u: any) => {
        const uPrice = Number(u.price) || 0
        if (uPrice > 0) return sum + uPrice
        const rate = Number(u.ratePerSqft) || 0
        const area = Number(u.carpetArea || u.area || u.builtUpArea) || 0
        return sum + (rate * area)
      }, 0)
    }

    let finalStatus: Property["status"] = p.status || defaultStatus
    if (p.status === "published" || p.status === "active") finalStatus = "published"
    else if (p.status === "pending") finalStatus = "pending"
    else if (p.status === "rejected") finalStatus = "rejected"
    else if (p.status === "draft") finalStatus = "draft"
    else if (p.status === "archived") finalStatus = "archived"

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

    const searchBlob = searchTerms
      .filter(Boolean)
      .map((s) => s.toLowerCase().trim())
      .join(" | ")

    let reraNumber = ""
    if (p.reraNumber) reraNumber = p.reraNumber
    else if (details.reraNumber) reraNumber = details.reraNumber
    else if (details.township?.reraNumber) reraNumber = details.township.reraNumber
    else if (Array.isArray(details.projects) && details.projects[0]?.reraNumber)
      reraNumber = details.projects[0].reraNumber
    else if (Array.isArray(details.towers) && details.towers[0]?.reraNumber)
      reraNumber = details.towers[0].reraNumber
    else if (Array.isArray(p.reraPhases) && p.reraPhases[0]?.reraNumber)
      reraNumber = p.reraPhases[0].reraNumber
    else if (Array.isArray(details.township?.reraPhases) && details.township.reraPhases[0]?.reraNumber)
      reraNumber = details.township.reraPhases[0].reraNumber
    else if (Array.isArray(details.reraPhases) && details.reraPhases[0]?.reraNumber)
      reraNumber = details.reraPhases[0].reraNumber
    else {
      reraNumber = "Pending / Applied"
    }

    const groupBuyingRaw =
      p.groupBuying || details?.groupBuying || details?.township?.groupBuying || undefined
    const groupBuying = groupBuyingRaw
      ? {
          ...groupBuyingRaw,
          targetCount:
            Number(groupBuyingRaw.targetCount) > 0
              ? Number(groupBuyingRaw.targetCount)
              : undefined,
        }
      : undefined

    return {
      id: p._id || p.id,
      slug: p.slug || details?.slug || details?.township?.slug || p._id,
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
      reraNumber,
      groupBuying: groupBuying || undefined,
      downPaymentPercent:
        typeof p.downPaymentPercent === "number"
          ? p.downPaymentPercent
          : typeof details?.downPaymentPercent === "number"
          ? details.downPaymentPercent
          : typeof details?.township?.downPaymentPercent === "number"
          ? details.township.downPaymentPercent
          : 20,
      details,
      rawProjects: snapshotProjects,
      rawTowers: directTowers,
      rawUnits: snapshotUnits,
      builderId: p.builderId,
      developer: {
        name: (
          details.builderName ||
          details.township?.builderName ||
          details.project?.builderName ||
          details.townshipData?.builderName ||
          details.developerName ||
          details.township?.developerName ||
          details.project?.developerName ||
          details.brandName ||
          details.township?.brandName ||
          details.companyName ||
          details.township?.companyName ||
          details.promoterName ||
          p.builderName ||
          p.developerName ||
          name
        ).trim(),
        logo:
          details.builderLogo ||
          details.township?.builderLogo ||
          details.project?.builderLogo ||
          details.townshipData?.builderLogo ||
          details.developerLogo ||
          details.township?.developerLogo ||
          details.project?.developerLogo ||
          details.brandLogo ||
          details.township?.brandLogo ||
          details.companyLogo ||
          details.township?.companyLogo ||
          p.builderLogo ||
          p.developerLogo ||
          "",
      },
    }
  }

  const fetchProperties = async () => {
    setIsFetchingProperties(true)
    try {
      const res = await fetch("/api/properties")
      if (res.ok) {
        const data = await res.json()
        if (data.properties) {
          const mapped = data.properties.map((p: any) =>
            mapProperty(p, p.status || "draft")
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
    const userId = currentUser?._id || currentUser?.id
    if (userId && (activeTab === "properties" || activeTab === "ads-studio")) {
      fetchProperties()
    }
  }, [currentUser?._id, currentUser?.id, activeTab])

  const handleRefreshProperties = () => {
    if (isFetchingProperties) return
    toast("Fetching data...")
    fetchProperties()
  }

  const [profile, setProfile] = useState<DashboardProfile>({
    companyName: "",
    developerName: "",
    fullName: "",
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
    specialization: "",
    panNumber: "",
    aadharNumber: "",
    preferredAreas: "",
  })

  useEffect(() => {
    if (!currentUser) return
    const p = currentUser.profile || {}
    const fullAddress = [p.address, p.city, p.state].filter(Boolean).join(", ")

    setProfile({
      companyName: p.companyName || "",
      developerName: p.developerName || "",
      fullName: p.fullName || "",
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
      specialization: p.specialization || "",
      panNumber: p.panNumber || "",
      aadharNumber: p.aadharNumber || "",
      preferredAreas: p.preferredAreas || "",
    })
  }, [currentUser])

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: profile.companyName,
          developerName: profile.developerName,
          fullName: profile.fullName,
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
          specialization: profile.specialization,
          panNumber: profile.panNumber,
          aadharNumber: profile.aadharNumber,
          preferredAreas: profile.preferredAreas,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data.user)
        toast.success("Profile saved successfully!")
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || "Failed to save profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("An error occurred while saving profile")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSendOtp = async () => {
    setSendingOtp(true)
    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST" })
      if (res.ok) {
        toast.success("OTP sent to your email!")
        setOtpSent(true)
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || "Failed to send OTP")
      }
    } catch (error) {
      console.error("Error sending OTP:", error)
      toast.error("An error occurred. Please try again.")
    } finally {
      setSendingOtp(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setIsSavingProfile(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: passwordData.otp,
          newPassword: passwordData.newPassword,
        }),
      })

      if (res.ok) {
        toast.success("Password changed successfully!")
        setIsChangingPassword(false)
        setOtpSent(false)
        setPasswordData({ otp: "", newPassword: "", confirmPassword: "" })
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || "Failed to change password")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const filteredProperties = useMemo(() => {
    const query = (debouncedPropertySearch[propertyFilter] || "").toLowerCase().trim()
    const matched = properties.filter((p) => {
      if (p.status !== propertyFilter) return false
      if (!query) return true
      return p.searchBlob?.includes(query)
    })

    if (!query) return matched

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
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "draft" } : p))
      )
    } catch (error) {
      console.error(error)
      toast.error("Failed to move property to draft")
    } finally {
      setMovingToDraftId(null)
    }
  }

  const handleViewTowers = (
    propertyId: string,
    propertyName: string,
    flowType?: string,
    status?: string
  ) => {
    setSelectedPropertyForHierarchy({
      id: propertyId,
      name: propertyName,
      flowType,
      status,
    })
  }

  const deleteProperty = async (id: string) => {
    if (!id) return
    const targetProp = properties.find((p) => p.id === id)
    const isDraft = targetProp?.status === "draft" || propertyFilter === "draft"

    const confirmMsg = isDraft
      ? "Are you sure you want to delete this draft? This will only remove your draft copy."
      : "Are you sure you want to delete this property?"

    if (confirm(confirmMsg)) {
      setDeletingPropertyId(id)
      try {
        const endpoint = isDraft
          ? `/api/properties/${id}/draft`
          : `/api/properties/${id}`
        const res = await fetch(endpoint, { method: "DELETE" })
        if (res.ok) {
          setProperties((prev) => prev.filter((p) => p.id !== id))
          toast.success(
            isDraft ? "Draft deleted successfully" : "Property deleted successfully"
          )
        } else {
          const errData = await res.json().catch(() => ({}))
          const msg = errData?.error || `HTTP ${res.status}`
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

  const handleUpdateGroupBuying = (propertyId: string, newGroupBuyingData: any) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId ? { ...p, groupBuying: newGroupBuyingData } : p
      )
    )
  }

  const handleUpdateDownPayment = (propertyId: string, newPercent: number) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId ? { ...p, downPaymentPercent: newPercent } : p
      )
    )
  }

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

  const propertyCounts = {
    published: properties.filter((p) => p.status === "published").length,
    pending: properties.filter((p) => p.status === "pending").length,
    draft: properties.filter((p) => p.status === "draft").length,
    rejected: properties.filter((p) => p.status === "rejected").length,
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        role="mandate"
        currentUser={currentUser}
        profile={profile}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50 dark:bg-slate-950 relative transition-colors duration-300">
        <DashboardHeader
          activeTab={activeTab}
          role="mandate"
          currentUser={currentUser}
          activeSettingsTab={activeSettingsTab}
          onSaveProfile={handleSaveProfile}
          isSavingProfile={isSavingProfile}
          showAddProperty={showAddProperty}
          setShowAddProperty={setShowAddProperty}
          propertyFilter={propertyFilter}
          onFilterChange={handleFilterChange}
          propertyCounts={propertyCounts}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        <div
          className={`flex-1 pb-24 lg:pb-0 ${
            activeTab === "documents" || activeTab === "feedback"
              ? "overflow-hidden p-0"
              : "overflow-y-auto software-scrollbar p-4 sm:p-6 lg:p-8"
          }`}
        >
          {activeTab === "bills" && <BillsView />}
          {activeTab === "inventory" && (
            <InventoryView userRole={currentUser?.role || "mandate"} />
          )}
          {activeTab === "crm" && (
            <CRMView userRole={currentUser?.role || "mandate"} />
          )}
          {activeTab === "crm2" && (
            <CRMCloneView userRole={currentUser?.role || "mandate"} />
          )}
          {activeTab === "chat" && <ChatView />}
          {activeTab === "documents" && <DocumentsView />}
          {activeTab === "team" && <TeamView />}
          {activeTab === "blog" && <BlogView onMenuClick={() => {}} />}
          {activeTab === "offers" && (
            <OffersView userRole={currentUser?.role || "mandate"} />
          )}
          {activeTab === "feedback" && <FeedbackView />}
          {activeTab === "ads-studio" && (
            <AdsStudioView currentUser={currentUser} initialProperties={properties} />
          )}
          {activeTab === "properties" && (
            <PropertiesView
              role="mandate"
              properties={properties}
              filteredProperties={filteredProperties}
              propertyFilter={propertyFilter}
              propertySearchInput={propertySearchInput[propertyFilter] || ""}
              onSearchInputChange={(val) =>
                setPropertySearchInput((prev) => ({
                  ...prev,
                  [propertyFilter]: val,
                }))
              }
              debouncedSearchQuery={
                debouncedPropertySearch[propertyFilter] || ""
              }
              isFetchingProperties={isFetchingProperties}
              onRefreshProperties={handleRefreshProperties}
              showAddProperty={showAddProperty}
              setShowAddProperty={setShowAddProperty}
              onViewHierarchy={handleViewTowers}
              onMoveToDraft={handleMoveToDraft}
              movingToDraftId={movingToDraftId}
              onDeleteProperty={deleteProperty}
              deletingPropertyId={deletingPropertyId}
              onUpdateGroupBuying={handleUpdateGroupBuying}
              onUpdateDownPayment={handleUpdateDownPayment}
            />
          )}
          {activeTab === "settings" && (
            <SettingsView
              role="mandate"
              currentUser={currentUser}
              profile={profile}
              setProfile={setProfile}
              propertiesCount={properties.length}
              activeSettingsTab={activeSettingsTab}
              setActiveSettingsTab={setActiveSettingsTab}
              onSaveProfile={handleSaveProfile}
              isSavingProfile={isSavingProfile}
              theme={theme}
              onThemeChange={handleThemeChange}
              notifications={notifications}
              onNotificationChange={handleNotificationChange}
              isChangingPassword={isChangingPassword}
              setIsChangingPassword={setIsChangingPassword}
              passwordData={passwordData}
              setPasswordData={setPasswordData}
              handleSendOtp={handleSendOtp}
              sendingOtp={sendingOtp}
              otpSent={otpSent}
              handlePasswordChange={handlePasswordChange}
            />
          )}
        </div>

        {/* Desktop Software Bottom Telemetry & Status Bar */}
        <footer className="hidden lg:flex h-7 px-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 select-none z-10 shrink-0">
          {/* Left: System Status & Workspace Context */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Live Engine</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Workspace: <strong className="text-slate-700 dark:text-slate-300 font-semibold">Mandate Agency</strong></span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Properties: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{properties.length}</strong></span>
          </div>

          {/* Center: Desktop Shortcuts & Navigation Guide */}
          <div className="flex items-center gap-2">
            <span className="software-kbd">Ctrl+B</span>
            <span className="text-[10px] text-slate-400">Sidebar</span>
            <span className="text-slate-300 dark:text-slate-700 mx-1">•</span>
            <span className="software-kbd">Ctrl+K</span>
            <span className="text-[10px] text-slate-400">Command</span>
            <span className="text-slate-300 dark:text-slate-700 mx-1">•</span>
            <span className="software-kbd">/</span>
            <span className="text-[10px] text-slate-400">Search</span>
            <span className="text-slate-300 dark:text-slate-700 mx-1">•</span>
            <span className="software-kbd">Esc</span>
            <span className="text-[10px] text-slate-400">Close</span>
          </div>

          {/* Right: Telemetry & Version */}
          <div className="flex items-center gap-3">
            <span>Theme: <strong className="text-slate-700 dark:text-slate-300 font-semibold uppercase">{theme}</strong></span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">24ms Latency</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">Astronix OS v2.4</span>
          </div>
        </footer>
      </main>

      <PropertyHierarchyModal
        isOpen={!!selectedPropertyForHierarchy}
        onClose={() => setSelectedPropertyForHierarchy(null)}
        property={selectedPropertyForHierarchy}
      />

      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentUser={currentUser}
        onLogout={handleLogout}
        userRole="mandate"
      />
    </div>
  )
}

export default function MandateDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading Dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
