"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Users, Search, Home, CheckCircle2, Lock, Clock,
    Building2, Layers, LayoutGrid, RefreshCw, CircleDollarSign,
    CheckSquare, X, User, TrendingUp, Building, Filter,
    ChevronRight, MapPin, AlertCircle, HelpCircle, Phone, Sparkles
} from "lucide-react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HierarchyAccordion } from "./hierarchy-accordion"
import { HierarchyBreadcrumb } from "./hierarchy-breadcrumb"
import { StatusBadge } from "./status-badge"
import { VisitorQaTab } from "./visitor-qa-tab"

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryProperty {
    _id: string
    name: string
    type: "township" | "project" | "tower"
    flowType: string
    location: { city?: string; state?: string; address?: string }
    projectCount: number
    towerCount: number
    unitCount: number
    thumbnail: string | null
    status: string
}

interface InventoryProject {
    _id: string
    name: string
    towerCount: number
    unitCount: number
}

interface InventoryTower {
    _id: string
    name: string
    projectId: string | null
    floorCount: number
    unitCount: number
    baseRate?: number
}

interface InventoryUnit {
    _id: string
    id: string
    unitNumber: string
    floorNumber: number
    configuration: string
    area: number
    carpetArea?: number
    builtUpArea?: number
    price: number
    ratePerSqft: number
    status: "available" | "sold" | "blocked" | "reserved" | "booked" | "published" | "archived"
    towerId: string
    projectId: string | null
    customerName: string
    customerPhone: string
    bookingAmount: number
    bookingDate: string | null
    facing: string
}

interface InventoryHierarchy {
    property: { _id: string; name: string; type: string; flowType: string; location: any }
    projects: InventoryProject[]
    towers: InventoryTower[]
    units: InventoryUnit[]
}

// ─── Component ────────────────────────────────────────────────────────────────

const getCleanUnitNum = (unitNum?: string) => {
    if (!unitNum) return "—";
    if (unitNum.includes("-")) {
        const parts = unitNum.split("-");
        return parts[parts.length - 1].trim() || unitNum;
    }
    return unitNum;
};

interface InventoryViewProps {
    userRole?: "builder" | "mandate"
}

export function InventoryView({ userRole = "builder" }: InventoryViewProps) {
    const router = useRouter()
    // ── Tab State ──────────────────────────────────────────────────────────
    const [activeInventoryViewTab, setActiveInventoryViewTab] = useState<"inventory" | "visitor-qa">("inventory")

    // ── Property List State ────────────────────────────────────────────────
    const [properties, setProperties] = useState<InventoryProperty[]>([])
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
    const [hierarchy, setHierarchy] = useState<InventoryHierarchy | null>(null)

    // ── Loading State ──────────────────────────────────────────────────────
    const [loadingList, setLoadingList] = useState(true)
    const [loadingHierarchy, setLoadingHierarchy] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // ── Hierarchy Filter State ─────────────────────────────────────────────
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
    const [selectedTowerId, setSelectedTowerId] = useState<string>("all")
    const [openProjects, setOpenProjects] = useState<string[]>([])

    // ── Unit Filter State ──────────────────────────────────────────────────
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [configFilter, setConfigFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")

    // ── Bulk Selection ─────────────────────────────────────────────────────
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])

    // ── Unit Edit Dialog ───────────────────────────────────────────────────
    const [editingUnit, setEditingUnit] = useState<InventoryUnit | null>(null)
    const [customerForm, setCustomerForm] = useState({ name: "", phone: "", amount: "", price: "", ratePerSqft: "", allInclusivePrice: "", carpetArea: "", builtUpArea: "" })

    // ── Tower Pricing Dialog ───────────────────────────────────────────────
    const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false)
    const [towerRateForm, setTowerRateForm] = useState({ rate: "", applyToAll: true })

    // ── Error State ────────────────────────────────────────────────────────
    const [listError, setListError] = useState<string | null>(null)
    const [hierarchyError, setHierarchyError] = useState<string | null>(null)

    // ─── Load property list ────────────────────────────────────────────────
    const loadProperties = useCallback(async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true)
        else setLoadingList(true)
        setListError(null)
        try {
            const res = await fetch(`/api/inventory?t=${Date.now()}`, { cache: "no-store" })
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    toast.error("Session expired or unauthorized. Redirecting to login...")
                    setProperties([])
                    setHierarchy(null)
                    setSelectedPropertyId("")
                    router.push("/login")
                    return
                }
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || `Failed to load inventory (Status: ${res.status})`)
            }
            const data = await res.json()
            const props: InventoryProperty[] = data.properties || []
            setProperties(props)

            // Auto-select first property if none selected or current is gone
            const currentStillValid = props.some(p => p._id === selectedPropertyId)
            if (!currentStillValid && props.length > 0) {
                setSelectedPropertyId(props[0]._id)
            } else if (props.length === 0) {
                setSelectedPropertyId("")
                setHierarchy(null)
            }
        } catch (e: any) {
            console.error("[InventoryView] loadProperties error:", e)
            setListError(e.message || "Failed to load properties")
        } finally {
            setLoadingList(false)
            setIsRefreshing(false)
        }
    }, [selectedPropertyId, router])

    // ─── Load hierarchy for selected property ─────────────────────────────
    const loadHierarchy = useCallback(async (propertyId: string, silent = false) => {
        if (!propertyId) return
        if (!silent) setLoadingHierarchy(true)
        setHierarchyError(null)
        try {
            const res = await fetch(`/api/inventory/${propertyId}?t=${Date.now()}`, { cache: "no-store" })
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    toast.error("Session expired or unauthorized. Redirecting to login...")
                    setProperties([])
                    setHierarchy(null)
                    setSelectedPropertyId("")
                    router.push("/login")
                    return
                }
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || `Failed to load hierarchy (Status: ${res.status})`)
            }
            const data: InventoryHierarchy = await res.json()
            setHierarchy(data)
        } catch (e: any) {
            if (silent) {
                console.warn("[InventoryView] Silent background update failed to fetch:", e.message || e)
            } else {
                console.error("[InventoryView] loadHierarchy error:", e)
                setHierarchyError(e.message || "Failed to load inventory data")
            }
            if (!silent) {
                setHierarchy(null)
            }
        } finally {
            setLoadingHierarchy(false)
        }
    }, [router])

    // ─── Effects ──────────────────────────────────────────────────────────
    useEffect(() => { loadProperties() }, [loadProperties])

    useEffect(() => {
        if (selectedPropertyId) {
            setSelectedProjectId("all")
            setSelectedTowerId("all")
            setStatusFilter("all")
            setConfigFilter("all")
            setSearchTerm("")
            setSelectedUnitIds([])
            setIsSelectionMode(false)
            setHierarchy(null)
            setHierarchyError(null)
            loadHierarchy(selectedPropertyId)
        }
    }, [selectedPropertyId, loadHierarchy])


    // Reset tower when project changes
    useEffect(() => { setSelectedTowerId("all") }, [selectedProjectId])

    // Auto-open all projects whenever hierarchy loads
    useEffect(() => {
        if (hierarchy?.projects) {
            setOpenProjects(hierarchy.projects.map(p => p._id))
        }
    }, [hierarchy])

    // Auto-sync every 60 seconds (silent)
    useEffect(() => {
        const interval = setInterval(() => {
            if (selectedPropertyId && !isRefreshing && !loadingHierarchy) {
                loadHierarchy(selectedPropertyId, true)
            }
        }, 60000)
        return () => clearInterval(interval)
    }, [selectedPropertyId, isRefreshing, loadingHierarchy, loadHierarchy])

    // ─── Derived Data ──────────────────────────────────────────────────────
    const currentProperty = useMemo(
        () => properties.find(p => p._id === selectedPropertyId) || null,
        [properties, selectedPropertyId]
    )

    const propertyType = useMemo(
        () => (hierarchy?.property.type || currentProperty?.type || "tower") as string,
        [hierarchy, currentProperty]
    )

    // Normalize towers: all towers have a projectId (no standalone direct towers on township)
    const normalizedTowers = useMemo(() => {
        if (!hierarchy) return []
        const projectIds = new Set(hierarchy.projects.map(p => p._id))
        return hierarchy.towers.map(t => {
            // In strict hierarchy, all towers must have a valid projectId
            if (!t.projectId || !projectIds.has(t.projectId)) {
                console.warn(`[InventoryView] Tower ${t._id} has invalid projectId: ${t.projectId}`)
            }
            return t
        })
    }, [hierarchy])

    // Detect if township has towers directly attached (should not happen in strict hierarchy)
    const hasDirectTowers = useMemo(() => {
        return false // Disabled: strict hierarchy forbids towers on townships
    }, [])

    // Towers visible given project selection
    const visibleTowers = useMemo(() => {
        if (selectedProjectId === "all") return normalizedTowers
        return normalizedTowers.filter(t => t.projectId === selectedProjectId)
    }, [normalizedTowers, selectedProjectId])

    // Units that belong to the selected Township/Project/Tower (ignoring status/config/search filters)
    const scopeUnits = useMemo(() => {
        if (!hierarchy) return []
        return hierarchy.units.filter((unit) => {
            // Filter by tower if specific tower selected
            if (selectedTowerId !== "all" && unit.towerId !== selectedTowerId) return false
            // Filter by project if specific project selected (and no specific tower)
            if (selectedProjectId !== "all" && selectedTowerId === "all") {
                const tower = normalizedTowers.find(t => t._id === unit.towerId)
                const matchesProject = tower?.projectId === selectedProjectId
                if (!matchesProject) return false
            }
            return true
        })
    }, [hierarchy, normalizedTowers, selectedProjectId, selectedTowerId])

    // Filtered units (applying status, config, and search filters on scopeUnits)
    const filteredUnits = useMemo(() => {
        return scopeUnits.filter((unit) => {
            // Attribute filters
            if (statusFilter !== "all" && (unit.status || "available") !== statusFilter) return false
            if (configFilter !== "all" && unit.configuration !== configFilter) return false
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase()
                return (
                    unit.unitNumber.toLowerCase().includes(term) ||
                    unit.configuration.toLowerCase().includes(term) ||
                    unit.customerName.toLowerCase().includes(term) ||
                    unit.facing.toLowerCase().includes(term)
                )
            }
            return true
        })
    }, [scopeUnits, statusFilter, configFilter, searchTerm])

    // Stats calculated on scopeUnits (i.e. respecting hierarchy selection but ignoring search/status/config filters)
    const stats = useMemo(() => {
        const total = scopeUnits.length
        const available = scopeUnits.filter(u => !u.status || u.status === "available" || u.status === "published").length
        const sold = scopeUnits.filter(u => u.status === "sold" || u.status === "booked").length
        const reserved = scopeUnits.filter(u => u.status === "reserved").length
        const blocked = scopeUnits.filter(u => u.status === "blocked").length
        const revenue = scopeUnits
            .filter(u => u.status === "sold" || u.status === "booked")
            .reduce((sum, u) => sum + (u.price || 0), 0)
        return { total, available, sold, reserved, blocked, revenue }
    }, [scopeUnits])

    // Unique configurations for filter dropdown
    const configurations = useMemo(
        () => Array.from(new Set(hierarchy?.units.map(u => u.configuration).filter(Boolean) || [])).sort(),
        [hierarchy]
    )

    // Breadcrumbs showing current hierarchy location
    const breadcrumbs = useMemo(() => {
        if (!hierarchy) return null
        const items = []

        // Root property level
        items.push({
            name: hierarchy.property.name,
            onClick: () => {
                setSelectedProjectId("all")
                setSelectedTowerId("all")
            }
        })

        // Project level (for township properties)
        if (propertyType === "township" && selectedProjectId !== "all") {
            const proj = hierarchy.projects.find(p => p._id === selectedProjectId)
            items.push({
                name: proj?.name || "Unknown Project",
                onClick: () => {
                    setSelectedTowerId("all")
                }
            })
        }

        // Tower level
        if (selectedTowerId !== "all") {
            const tw = normalizedTowers.find(t => t._id === selectedTowerId)
            items.push({
                name: tw?.name || "Unknown Tower",
                onClick: null
            })
        }

        return items
    }, [hierarchy, propertyType, selectedProjectId, selectedTowerId, normalizedTowers])

    // Current inventory scope indicator
    const currentScope = useMemo(() => {
        if (!hierarchy) return ""
        if (selectedTowerId !== "all") return "Tower Inventory"
        if (propertyType === "township") {
            if (selectedProjectId === "all") return "Township Inventory"
            return "Project Inventory"
        }
        if (propertyType === "project") return "Project Inventory"
        return "Tower Inventory"
    }, [hierarchy, propertyType, selectedProjectId, selectedTowerId])

    // ─── Handlers ─────────────────────────────────────────────────────────
    const handleUnitClick = (unit: InventoryUnit) => {
        if (isSelectionMode) {
            setSelectedUnitIds(prev =>
                prev.includes(unit._id) ? prev.filter(id => id !== unit._id) : [...prev, unit._id]
            )
        } else {
            const initialCarpet = unit.carpetArea || unit.area || 0
            const initialBuiltUp = unit.builtUpArea || (initialCarpet > 0 ? Math.round(initialCarpet * 1.2) : 0)
            const rate = unit.ratePerSqft || 0
            const initialPrice = (initialBuiltUp > 0 && rate > 0) ? Math.round(initialBuiltUp * rate) : (unit.price || 0)
            const initialAllInclusive = initialPrice > 0 ? Math.round(initialPrice * 1.13) : 0

            setEditingUnit(unit)
            setCustomerForm({
                name: unit.customerName || "",
                phone: unit.customerPhone || "",
                amount: unit.bookingAmount?.toString() || "",
                price: initialPrice > 0 ? initialPrice.toString() : (unit.price && unit.price > 0 ? unit.price.toString() : ""),
                ratePerSqft: (unit.ratePerSqft && unit.ratePerSqft > 0) ? unit.ratePerSqft.toString() : (rate > 0 ? rate.toString() : ""),
                allInclusivePrice: initialAllInclusive > 0 ? initialAllInclusive.toString() : "",
                carpetArea: initialCarpet > 0 ? initialCarpet.toString() : "",
                builtUpArea: initialBuiltUp > 0 ? initialBuiltUp.toString() : "",
            })
        }
    }

    const handleUnitUpdate = async (status: InventoryUnit["status"]) => {
        if (!editingUnit || !selectedPropertyId) return

        if ((status === "sold" || status === "reserved" || status === "blocked") && !customerForm.name.trim()) {
            toast.error("Please enter the customer's name")
            return
        }
        if ((status === "sold" || status === "reserved" || status === "blocked") && !customerForm.phone.trim()) {
            toast.error("Please enter the customer's phone number")
            return
        }
        const bookingAmt = parseFloat(customerForm.amount)
        if ((status === "sold" || status === "reserved" || status === "blocked") && (isNaN(bookingAmt) || bookingAmt <= 0)) {
            toast.error("Please enter a valid booking/hold amount")
            return
        }

        const parsedPrice = parseFloat(customerForm.price)
        const parsedRate = parseFloat(customerForm.ratePerSqft)
        const parsedCarpet = parseFloat(customerForm.carpetArea)
        const parsedBuiltUp = parseFloat(customerForm.builtUpArea)

        // Optimistic update
        const updatedUnit: InventoryUnit = {
            ...editingUnit,
            status,
            customerName: status === "available" ? "" : (customerForm.name || editingUnit.customerName),
            customerPhone: status === "available" ? "" : (customerForm.phone || editingUnit.customerPhone),
            bookingAmount: status === "available" ? 0 : (parseFloat(customerForm.amount) || editingUnit.bookingAmount),
            bookingDate: status === "available" ? null : (editingUnit.bookingDate || new Date().toISOString()),
            price: !isNaN(parsedPrice) ? parsedPrice : editingUnit.price,
            ratePerSqft: !isNaN(parsedRate) ? parsedRate : editingUnit.ratePerSqft,
            carpetArea: !isNaN(parsedCarpet) ? parsedCarpet : (editingUnit.carpetArea || editingUnit.area),
            builtUpArea: !isNaN(parsedBuiltUp) ? parsedBuiltUp : editingUnit.builtUpArea,
            area: !isNaN(parsedCarpet) ? parsedCarpet : editingUnit.area,
        }
        setHierarchy(prev => prev ? {
            ...prev,
            units: prev.units.map(u => u._id === editingUnit._id ? updatedUnit : u)
        } : null)
        setEditingUnit(null)

        try {
            const res = await fetch(`/api/units/${editingUnit._id}?propertyId=${selectedPropertyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status,
                    customerName: updatedUnit.customerName,
                    customerPhone: updatedUnit.customerPhone,
                    bookingAmount: updatedUnit.bookingAmount,
                    bookingDate: updatedUnit.bookingDate,
                    price: updatedUnit.price,
                    ratePerSqft: updatedUnit.ratePerSqft,
                    area: updatedUnit.area,
                    carpetArea: updatedUnit.carpetArea,
                    builtUpArea: updatedUnit.builtUpArea,
                }),
            })
            if (res.ok) {
                toast.success(`Unit marked as ${status}`)
                loadHierarchy(selectedPropertyId, true)
            } else {
                if (res.status === 401 || res.status === 403) {
                    toast.error("Session expired or unauthorized. Redirecting to login...")
                    setProperties([])
                    setHierarchy(null)
                    setSelectedPropertyId("")
                    router.push("/login")
                    return
                }
                const err = await res.json().catch(() => ({}))
                toast.error(err.error || "Failed to update unit")
                loadHierarchy(selectedPropertyId, true)
            }
        } catch {
            toast.error("An error occurred while updating unit")
            loadHierarchy(selectedPropertyId, true)
        }
    }

    const handleBulkStatusChange = async (status: InventoryUnit["status"]) => {
        if (!selectedPropertyId || selectedUnitIds.length === 0) return
        if (!confirm(`Mark ${selectedUnitIds.length} units as ${status}?`)) return

        // Optimistic update
        setHierarchy(prev => prev ? {
            ...prev,
            units: prev.units.map(u =>
                selectedUnitIds.includes(u._id)
                    ? {
                        ...u, status,
                        customerName: status === "available" ? "" : u.customerName,
                        customerPhone: status === "available" ? "" : u.customerPhone,
                        bookingAmount: status === "available" ? 0 : u.bookingAmount,
                    }
                    : u
            )
        } : null)

        try {
            const res = await fetch(`/api/units/bulk?propertyId=${selectedPropertyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ unitIds: selectedUnitIds, status }),
            })
            if (res.ok) {
                toast.success(`Updated ${selectedUnitIds.length} units`)
                setSelectedUnitIds([])
                setIsSelectionMode(false)
                loadHierarchy(selectedPropertyId, true)
            } else {
                if (res.status === 401 || res.status === 403) {
                    toast.error("Session expired or unauthorized. Redirecting to login...")
                    setProperties([])
                    setHierarchy(null)
                    setSelectedPropertyId("")
                    router.push("/login")
                    return
                }
                const err = await res.json().catch(() => ({}))
                toast.error(err.error || "Bulk update failed")
                loadHierarchy(selectedPropertyId, true)
            }
        } catch {
            toast.error("Bulk update failed")
            loadHierarchy(selectedPropertyId, true)
        }
    }

    const handleTowerPriceUpdate = async () => {
        if (selectedTowerId === "all") return
        const rate = parseFloat(towerRateForm.rate)
        if (isNaN(rate) || rate <= 0) {
            toast.error("Please enter a valid rate per sqft")
            return
        }
        try {
            const res = await fetch(`/api/towers/${selectedTowerId}/pricing?propertyId=${selectedPropertyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ratePerSqft: rate }),
            })
            if (res.ok) {
                toast.success(`Updated all units to ₹${rate}/sqft`)
                setIsPricingDialogOpen(false)
                setTowerRateForm({ rate: "", applyToAll: true })
                // Optimistic update: immediately reflect new baseRate in sidebar
                setHierarchy(prev => prev ? {
                    ...prev,
                    towers: prev.towers.map(t =>
                        t._id === selectedTowerId ? { ...t, baseRate: rate } : t
                    )
                } : null)
                // Full reload (non-silent) to sync all unit prices from DB
                loadHierarchy(selectedPropertyId, false)
            } else {
                if (res.status === 401 || res.status === 403) {
                    toast.error("Session expired or unauthorized. Redirecting to login...")
                    setProperties([])
                    setHierarchy(null)
                    setSelectedPropertyId("")
                    router.push("/login")
                    return
                }
                const err = await res.json().catch(() => ({}))
                toast.error(err.error || "Failed to update pricing")
            }
        } catch {
            toast.error("Failed to update tower pricing")
        }
    }


    // ─── Unit Card Styles ──────────────────────────────────────────────────
    const getUnitStyle = (status: string, isSelected: boolean) => {
        const base = "relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer select-none"
        const statusStyles: Record<string, string> = {
            available: "bg-white hover:bg-emerald-50 border-emerald-200 hover:border-emerald-400 dark:bg-slate-900 dark:border-emerald-800",
            sold: "bg-red-50 hover:bg-red-100 border-red-200 dark:bg-red-950/30 dark:border-red-800",
            reserved: "bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
            blocked: "bg-slate-100 hover:bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-600",
            booked: "bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
            published: "bg-white hover:bg-emerald-50 border-emerald-200 hover:border-emerald-400 dark:bg-slate-900 dark:border-emerald-800",
            archived: "bg-slate-50 hover:bg-slate-100 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700",
        }
        const ring = isSelected ? " ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950 scale-95" : ""
        return `${base} ${statusStyles[status] || statusStyles.available}${ring}`
    }

    const getStatusDot = (status: string) => {
        const dots: Record<string, string> = {
            available: "bg-emerald-500",
            sold: "bg-red-500",
            reserved: "bg-amber-500",
            blocked: "bg-slate-400",
            booked: "bg-blue-500",
            published: "bg-emerald-500",
            archived: "bg-slate-300",
        }
        return dots[status] || dots.available
    }

    const getTextStyle = (status: string) => {
        const styles: Record<string, string> = {
            available: "text-slate-900 dark:text-slate-100",
            sold: "text-red-700 dark:text-red-300",
            reserved: "text-amber-700 dark:text-amber-300",
            blocked: "text-slate-600 dark:text-slate-400",
            booked: "text-blue-700 dark:text-blue-300",
            published: "text-slate-900 dark:text-slate-100",
            archived: "text-slate-500 dark:text-slate-500",
        }
        return styles[status] || styles.available
    }

    // ─── Floor groups ──────────────────────────────────────────────────────
    const groupedHierarchy = useMemo(() => {
        const projectsMap: Record<string, any> = {}

        filteredUnits.forEach(u => {
            const tId = u.towerId || "unknown";
            const towerMeta = normalizedTowers.find(t => t._id === tId) || { _id: tId, name: "System Generated Tower", projectId: u.projectId || "unknown" };
            const pId = towerMeta.projectId || "unknown";
            
            if (!projectsMap[pId]) {
                const projMeta = hierarchy?.projects?.find(p => p._id === pId) || { _id: pId, name: pId === "unknown" ? "System Generated Project" : "Property Project" };
                projectsMap[pId] = { project: projMeta, towers: {} }
            }

            if (!projectsMap[pId].towers[tId]) {
                projectsMap[pId].towers[tId] = { tower: towerMeta, floors: {} }
            }

            const f = typeof u.floorNumber === 'number' ? u.floorNumber : 0
            if (!projectsMap[pId].towers[tId].floors[f]) projectsMap[pId].towers[tId].floors[f] = []
            projectsMap[pId].towers[tId].floors[f].push(u)
        })

        return Object.values(projectsMap).map((pGroup: any) => ({
            project: pGroup.project,
            towers: Object.values(pGroup.towers).map((tGroup: any) => ({
                tower: tGroup.tower,
                floors: Object.entries(tGroup.floors)
                    .map(([floor, units]) => ({ floor: Number(floor), units }))
                    .sort((a, b) => b.floor - a.floor)
            })).sort((a, b) => (a.tower.name || "").localeCompare(b.tower.name || ""))
        })).sort((a, b) => (a.project.name || "").localeCompare(b.project.name || ""))
    }, [filteredUnits, normalizedTowers, hierarchy])

    const groupedTowerFloors = useMemo(() => {
        if (selectedTowerId === "all") return [];
        const groups: Record<number, InventoryUnit[]> = {}
        filteredUnits.forEach(u => {
            const f = typeof u.floorNumber === 'number' ? u.floorNumber : 0
            if (!groups[f]) groups[f] = []
            groups[f].push(u)
        })
        return Object.entries(groups)
            .map(([floor, units]) => ({ floor: Number(floor), units }))
            .sort((a, b) => b.floor - a.floor)
    }, [filteredUnits, selectedTowerId])

    const floorLabel = (floor: number) => {
        if (floor === 0) return "Ground Floor"
        if (floor < 0) return `Basement ${Math.abs(floor)}`
        return `Floor ${floor}`
    }

    // ─── Property type label ───────────────────────────────────────────────
    const typeConfig: Record<string, { icon: typeof Building2; label: string; color: string }> = {
        township: { icon: Building2, label: "Township", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
        project: { icon: Building, label: "Project", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
        tower: { icon: Layers, label: "Tower", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    }

    // ─── Loading / Empty States ────────────────────────────────────────────
    if (loadingList) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
                <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Loading Inventory...</p>
            </div>
        )
    }

    if (listError) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                    <AlertCircle className="h-7 w-7 text-red-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to Load Inventory</h3>
                    <p className="text-sm text-slate-500 mt-1">{listError}</p>
                </div>
                <Button onClick={() => loadProperties()} className="bg-indigo-600 hover:bg-indigo-700">
                    <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                </Button>
            </div>
        )
    }

    if (properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 text-center p-8">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-950/30 dark:to-slate-900 flex items-center justify-center shadow-inner">
                    <Building2 className="h-10 w-10 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Published Properties</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm">
                        Inventory only shows properties that have been published. Publish a property to start tracking units.
                    </p>
                </div>
            </div>
        )
    }

    // ─── Main Render ───────────────────────────────────────────────────────
    const selectedTowerMeta = visibleTowers.find(t => t._id === selectedTowerId)
    const TypeIcon = typeConfig[propertyType]?.icon || Building2

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950 p-6 space-y-5">

            {/* ── Top Header Bar ── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <LayoutGrid className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                    Inventory Management
                                    {currentProperty?.status === "pending" && (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                                            Pending
                                        </Badge>
                                    )}
                                </h2>
                                {currentScope && (
                                    <Badge className={`text-[10px] font-extrabold uppercase px-2 py-0.5 tracking-wider ${
                                        currentScope === "Township Inventory" ? "bg-violet-100 text-violet-700 hover:bg-violet-100 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-855" :
                                        currentScope === "Project Inventory" ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-855" :
                                        "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-855"
                                    }`}>
                                        {currentScope}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Visual interactive grid of all property configurations, pricing, and availability
                            </p>
                        </div>
                    </div>

                    {/* Cascading Hierarchy Selector */}
                    <div className="flex items-center gap-2 flex-wrap md:justify-end">
                        {/* Property Selector */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Property</span>
                            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                                <SelectTrigger className="w-[190px] bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm font-semibold h-10 text-xs">
                                    <SelectValue placeholder="Select Property" />
                                </SelectTrigger>
                                <SelectContent>
                                    {properties.map(p => {
                                        const Ic = typeConfig[p.type]?.icon || Building2
                                        return (
                                            <SelectItem key={p._id} value={p._id}>
                                                <div className="flex items-center gap-2">
                                                    <Ic className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    <span className="truncate max-w-[130px] font-medium">{p.name}</span>
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Project Phase Selector */}
                        {propertyType === "township" && hierarchy && (
                            <>
                                <div className="self-end pb-3 text-slate-300 dark:text-slate-700 hidden sm:block">
                                    <ChevronRight className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Project Phase</span>
                                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                        <SelectTrigger className="w-[170px] bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm font-semibold h-10 text-xs">
                                            <SelectValue placeholder="All Projects" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Projects</SelectItem>
                                            {hierarchy.projects.map(proj => (
                                                <SelectItem key={proj._id} value={proj._id}>
                                                    <span className="font-medium">{proj.name}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        {/* Tower Selector */}
                        {propertyType !== "tower" && visibleTowers.length > 0 && (
                            <>
                                <div className="self-end pb-3 text-slate-300 dark:text-slate-700 hidden sm:block">
                                    <ChevronRight className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tower</span>
                                    <Select value={selectedTowerId} onValueChange={setSelectedTowerId}>
                                        <SelectTrigger className="w-[170px] bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm font-semibold h-10 text-xs">
                                            <SelectValue placeholder="All Towers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Towers</SelectItem>
                                            {visibleTowers.map(tw => (
                                                <SelectItem key={tw._id} value={tw._id}>
                                                    <span className="font-medium">{tw.name}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        <div className="self-end pb-0">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => { loadProperties(true); if (selectedPropertyId) loadHierarchy(selectedPropertyId) }}
                                disabled={isRefreshing || loadingHierarchy}
                                className="h-10 w-10 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 shrink-0 shadow-sm"
                                title="Refresh"
                            >
                                <RefreshCw className={`h-4 w-4 ${(isRefreshing || loadingHierarchy) ? "animate-spin text-indigo-500" : "text-slate-600"}`} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Breadcrumbs Row */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex-wrap">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {breadcrumbs.map((crumb, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                                {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
                                {crumb.onClick ? (
                                    <button
                                        onClick={crumb.onClick}
                                        className="font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        {crumb.name}
                                    </button>
                                ) : (
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{crumb.name}</span>
                                )}
                            </div>
                        ))}
                        {currentProperty?.location?.city && (
                            <>
                                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-1.5" />
                                <span className="text-[11px] font-semibold text-slate-455 flex items-center gap-1">
                                    {currentProperty.location.city}
                                    {currentProperty.location.state ? `, ${currentProperty.location.state}` : ""}
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── Sub-Navigation Tabs ── */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                    onClick={() => setActiveInventoryViewTab('inventory')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        activeInventoryViewTab === 'inventory'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                >
                    <LayoutGrid className="w-4 h-4" />
                    <span>Structure & Unit Inventory</span>
                </button>

                <button
                    onClick={() => setActiveInventoryViewTab('visitor-qa')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        activeInventoryViewTab === 'visitor-qa'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                >
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    <span>Visitor Q&A & FAQs</span>
                    <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2">Q&A</Badge>
                </button>
            </div>

            {activeInventoryViewTab === 'visitor-qa' ? (
                <VisitorQaTab userRole={userRole} />
            ) : (
                <>
                    {/* ── Hierarchy Error ── */}
                    {hierarchyError && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">{hierarchyError}</p>
                    <Button size="sm" variant="outline" onClick={() => loadHierarchy(selectedPropertyId)} className="ml-auto shrink-0 border-red-200 text-red-600 hover:bg-red-50">
                        Retry
                    </Button>
                </div>
            )}

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { 
                        label: "Total Units", 
                        value: stats.total, 
                        icon: Home,
                        gradient: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5",
                        borderColor: "border-blue-100 hover:border-blue-300 dark:border-blue-900/30 dark:hover:border-blue-800",
                        textColor: "text-blue-700 dark:text-blue-400",
                        iconColor: "text-blue-500"
                    },
                    { 
                        label: "Available", 
                        value: stats.available, 
                        icon: CheckCircle2,
                        gradient: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5",
                        borderColor: "border-emerald-100 hover:border-emerald-300 dark:border-emerald-900/30 dark:hover:border-emerald-800",
                        textColor: "text-emerald-700 dark:text-emerald-400",
                        iconColor: "text-emerald-500"
                    },
                    { 
                        label: "Sold", 
                        value: stats.sold, 
                        icon: CircleDollarSign,
                        gradient: "from-rose-500/10 to-red-500/10 dark:from-rose-500/5 dark:to-red-500/5",
                        borderColor: "border-rose-100 hover:border-rose-300 dark:border-rose-900/30 dark:hover:border-rose-800",
                        textColor: "text-rose-700 dark:text-rose-400",
                        iconColor: "text-rose-500"
                    },
                    { 
                        label: "Reserved", 
                        value: stats.reserved, 
                        icon: Clock,
                        gradient: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5",
                        borderColor: "border-amber-100 hover:border-amber-300 dark:border-amber-900/30 dark:hover:border-amber-800",
                        textColor: "text-amber-700 dark:text-amber-400",
                        iconColor: "text-amber-500"
                    },
                    { 
                        label: "Blocked", 
                        value: stats.blocked, 
                        icon: Lock,
                        gradient: "from-slate-500/10 to-zinc-500/10 dark:from-slate-500/5 dark:to-zinc-500/5",
                        borderColor: "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700",
                        textColor: "text-slate-700 dark:text-slate-400",
                        iconColor: "text-slate-500"
                    },
                    { 
                        label: "Revenue", 
                        value: null, 
                        revenue: stats.revenue,
                        icon: TrendingUp,
                        gradient: "from-violet-500/10 to-purple-500/10 dark:from-violet-500/5 dark:to-violet-500/5",
                        borderColor: "border-violet-100 hover:border-violet-300 dark:border-violet-900/30 dark:hover:border-violet-800",
                        textColor: "text-violet-700 dark:text-violet-400",
                        iconColor: "text-violet-500"
                    },
                ].map((card) => {
                    const CardIcon = card.icon
                    return (
                        <Card 
                            key={card.label} 
                            className={`border ${card.borderColor} bg-gradient-to-br ${card.gradient} transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:shadow-slate-950/50 shadow-slate-100 overflow-hidden group`}
                        >
                            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[90px]">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{card.label}</p>
                                    <CardIcon className={`h-4 w-4 ${card.iconColor} group-hover:scale-110 transition-transform`} />
                                </div>
                                {card.revenue !== undefined ? (
                                    <p className={`text-lg font-black tracking-tight ${card.textColor}`}>
                                        ₹{(card.revenue / 10000000).toFixed(2)} <span className="text-xs font-bold uppercase">Cr</span>
                                    </p>
                                ) : (
                                    <p className={`text-2xl font-black tracking-tight ${card.textColor}`}>{card.value}</p>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* ── Main Content: Sidebar + Grid ── */}
            <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">

                {/* ── Left Sidebar: Deep Filters Only ── */}
                <div className="col-span-12 md:col-span-3 space-y-4">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <Filter className="h-4 w-4 text-indigo-500" />
                                Filter Units
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Status */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-9 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        {[
                                            { v: "available", label: "Available", dot: "bg-emerald-500" },
                                            { v: "sold", label: "Sold", dot: "bg-red-500" },
                                            { v: "reserved", label: "Reserved", dot: "bg-amber-500" },
                                            { v: "blocked", label: "Blocked", dot: "bg-slate-400" },
                                        ].map(s => (
                                            <SelectItem key={s.v} value={s.v}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                                                    {s.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Configuration */}
                            {configurations.length > 0 && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configuration</Label>
                                    <Select value={configFilter} onValueChange={setConfigFilter}>
                                        <SelectTrigger className="h-9 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                            <SelectValue placeholder="All Configs" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Configs</SelectItem>
                                            {configurations.map(cfg => (
                                                <SelectItem key={cfg} value={cfg}>{cfg}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Search */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        placeholder="Unit, customer, config..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-8 h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Quick Clear */}
                            {(statusFilter !== "all" || configFilter !== "all" || searchTerm) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setStatusFilter("all")
                                        setConfigFilter("all")
                                        setSearchTerm("")
                                    }}
                                    className="w-full text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                    <X className="h-3.5 w-3.5 mr-1" /> Clear All Filters
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary card for selected tower */}
                    {selectedTowerId !== "all" && selectedTowerMeta && (
                        <Card className="border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/10 shadow-sm">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-indigo-500" />
                                    <p className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                                        {selectedTowerMeta.name}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white dark:bg-slate-900 rounded-lg p-2 text-center">
                                        <p className="text-slate-400 font-medium">Units</p>
                                        <p className="font-black text-slate-900 dark:text-white">{filteredUnits.length}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-lg p-2 text-center">
                                        <p className="text-slate-400 font-medium">Floors</p>
                                        <p className="font-black text-slate-900 dark:text-white">{selectedTowerMeta.floorCount || 0}</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-lg p-2 flex justify-between items-center px-3 border border-indigo-50 dark:border-indigo-900/30">
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Current Rate</p>
                                    <p className="font-black text-indigo-700 dark:text-indigo-400 text-xs">
                                        {selectedTowerMeta.baseRate ? `₹${Number(selectedTowerMeta.baseRate).toLocaleString('en-IN')}/sq.ft` : "—"}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-8 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-100 dark:border-indigo-800 dark:text-indigo-400"
                                    onClick={() => {
                                        const firstUnit = filteredUnits[0]
                                        setIsPricingDialogOpen(true)
                                        setTowerRateForm(prev => ({ ...prev, rate: (firstUnit?.ratePerSqft || "").toString() }))
                                    }}
                                >
                                    <CircleDollarSign className="h-3.5 w-3.5 mr-1.5" />
                                    Update Tower Pricing
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── Right: Unit Grid ── */}
                <div className="col-span-12 md:col-span-9">
                    <Card className="flex flex-col h-full min-h-[550px] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

                        {/* Grid Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <LayoutGrid className="h-4.5 w-4.5 text-slate-500" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Unit Grid</span>
                                </div>
                                {loadingHierarchy && (
                                    <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                                )}
                                <Badge variant="secondary" className="text-xs font-bold">
                                    {filteredUnits.length} {filteredUnits.length === 1 ? "unit" : "units"}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Bulk mode toggle */}
                                <div className="flex items-center gap-2 border-l pl-3 border-slate-100 dark:border-slate-800">
                                    <Switch
                                        id="bulk-mode"
                                        checked={isSelectionMode}
                                        onCheckedChange={checked => {
                                            setIsSelectionMode(checked)
                                            if (!checked) setSelectedUnitIds([])
                                        }}
                                    />
                                    <Label htmlFor="bulk-mode" className="text-xs font-semibold cursor-pointer flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                        {isSelectionMode
                                            ? <CheckSquare className="h-3.5 w-3.5 text-indigo-500" />
                                            : <Users className="h-3.5 w-3.5 text-slate-400" />
                                        }
                                        Bulk Actions
                                    </Label>
                                </div>

                                {/* Bulk action buttons */}
                                {isSelectionMode && selectedUnitIds.length > 0 && (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-3 duration-200">
                                        <Badge className="bg-indigo-600">{selectedUnitIds.length} selected</Badge>
                                        <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange("available")}
                                            className="h-7 text-xs border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                                            Mark Available
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange("blocked")}
                                            className="h-7 text-xs border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100">
                                            Bulk Block
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setSelectedUnitIds([])}
                                            className="h-7 text-xs text-slate-400 hover:text-red-500">
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}

                                {/* Legend */}
                                {!isSelectionMode && (
                                    <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                        {[
                                            { dot: "bg-emerald-500", label: "Available" },
                                            { dot: "bg-red-500", label: "Sold" },
                                            { dot: "bg-amber-500", label: "Reserved" },
                                            { dot: "bg-slate-400", label: "Blocked" },
                                        ].map(s => (
                                            <div key={s.label} className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                                                {s.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Unit Grid Body */}
                        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30 dark:bg-slate-900/30 space-y-6">
                            {loadingHierarchy && !hierarchy ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="relative w-10 h-10">
                                        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                                        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium">Loading units...</p>
                                </div>
                            ) : groupedHierarchy.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                                        <Layers className="h-8 w-8 text-slate-300 dark:text-slate-600 animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {hierarchy && hierarchy.units.length > 0
                                                ? "No units match your active filters"
                                                : "No units found in this scope"}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                            {hierarchy && hierarchy.units.length > 0
                                                ? "Try clearing status, configuration or search filters."
                                                : "There are no units published or generated for this tower or project."}
                                        </p>
                                    </div>
                                    {hierarchy && hierarchy.units.length > 0 && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setStatusFilter("all")
                                                setConfigFilter("all")
                                                setSearchTerm("")
                                            }}
                                            className="h-8 text-xs"
                                        >
                                            Reset Filters
                                        </Button>
                                    )}
                                </div>
                            ) : selectedTowerId !== "all" ? (
                                /* Tower View: Floor -> Units */
                                <div className="space-y-6">
                                    {groupedTowerFloors.map(({ floor, units: floorUnits }: any) => (
                                        <div 
                                            key={floor} 
                                            className="space-y-3"
                                            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 120px' }}
                                        >
                                            {/* Floor label */}
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white dark:bg-slate-950 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 whitespace-nowrap shadow-sm">
                                                    {floorLabel(floor)}
                                                </span>
                                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-850" />
                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{floorUnits.length} Units</span>
                                            </div>

                                            {/* Units Grid */}
                                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2.5">
                                                {floorUnits.map((unit: any, idx: number) => {
                                                    const status = unit.status || "available"
                                                    const isSelected = selectedUnitIds.includes(unit._id)
                                                    const unitKey = unit._id || `${unit.towerId}-${unit.unitNumber}-${idx}`

                                                    return (
                                                        <button
                                                            key={unitKey}
                                                            onClick={() => handleUnitClick(unit)}
                                                            className={getUnitStyle(status, isSelected)}
                                                            title={`${unit.unitNumber} — ${unit.configuration} — ${status}`}
                                                        >
                                                            {/* Selection indicator */}
                                                            {isSelectionMode && (
                                                                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 shadow flex items-center justify-center transition-all ${isSelected
                                                                    ? "bg-blue-600 border-blue-600 scale-110"
                                                                    : "bg-white dark:bg-slate-800 border-slate-300"
                                                                    }`}>
                                                                    {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                                </div>
                                                            )}

                                                            {/* Unit number */}
                                                            <span className={`text-[11px] font-black leading-none mb-0.5 ${getTextStyle(status)}`}>
                                                                {unit.unitNumber.split("-").pop()}
                                                            </span>

                                                            {/* Config */}
                                                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-none">
                                                                {unit.configuration}
                                                            </span>

                                                            {/* Status dot */}
                                                            {!isSelectionMode && (
                                                                <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${getStatusDot(status)}`} />
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Accordion based Township/Project/Tower View */
                                <div className="space-y-4">
                                    <Accordion type="multiple" value={openProjects} onValueChange={setOpenProjects} className="space-y-4">
                                        {groupedHierarchy.map(({ project, towers }) => (
                                            <AccordionItem key={project._id} value={project._id} className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm overflow-hidden px-4">
                                                <AccordionTrigger className="hover:no-underline py-4">
                                                    <div className="flex items-center justify-between w-full pr-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                                                <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{project.name}</h3>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] font-extrabold uppercase bg-slate-50 dark:bg-slate-900">
                                                            {towers.reduce((acc: number, t: any) => acc + t.floors.reduce((fAcc: number, f: any) => fAcc + f.units.length, 0), 0)} Units
                                                        </Badge>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2 pb-4">
                                                    <div className="space-y-6">
                                                        {towers.map(({ tower, floors }: any) => (
                                                            <Card key={`${project._id}-${tower._id}`} className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
                                                                <div className="flex items-center justify-between bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/60 px-4 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Layers className="h-4 w-4 text-indigo-500" />
                                                                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{tower.name}</h4>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="outline" className="text-[9px] font-extrabold uppercase bg-white dark:bg-slate-950">
                                                                            {floors.reduce((acc: number, f: any) => acc + f.units.length, 0)} Units
                                                                        </Badge>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                setSelectedTowerId(tower._id)
                                                                                if (tower.projectId && tower.projectId !== "unknown") {
                                                                                    setSelectedProjectId(tower.projectId)
                                                                                }
                                                                            }}
                                                                            className="h-6 px-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                                                                        >
                                                                            Focus Tower
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                <div className="p-4 space-y-6">
                                                                    {floors.map(({ floor, units: floorUnits }: any) => (
                                                                        <div 
                                                                            key={floor} 
                                                                            className="space-y-3"
                                                                            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 120px' }}
                                                                        >
                                                                            {/* Floor label */}
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white dark:bg-slate-950 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 whitespace-nowrap shadow-sm">
                                                                                    {floorLabel(floor)}
                                                                                </span>
                                                                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-850" />
                                                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{floorUnits.length} Units</span>
                                                                            </div>

                                                                            {/* Units Grid */}
                                                                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2.5">
                                                                                {floorUnits.map((unit: any, idx: number) => {
                                                                                    const status = unit.status || "available"
                                                                                    const isSelected = selectedUnitIds.includes(unit._id)
                                                                                    const unitKey = unit._id || `${unit.towerId}-${unit.unitNumber}-${idx}`

                                                                                    return (
                                                                                        <button
                                                                                            key={unitKey}
                                                                                            onClick={() => handleUnitClick(unit)}
                                                                                            className={getUnitStyle(status, isSelected)}
                                                                                            title={`${unit.unitNumber} — ${unit.configuration} — ${status}`}
                                                                                        >
                                                                                            {/* Selection indicator */}
                                                                                            {isSelectionMode && (
                                                                                                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 shadow flex items-center justify-center transition-all ${isSelected
                                                                                                    ? "bg-blue-600 border-blue-600 scale-110"
                                                                                                    : "bg-white dark:bg-slate-800 border-slate-300"
                                                                                                    }`}>
                                                                                                    {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Unit number */}
                                                                                            <span className={`text-[11px] font-black leading-none mb-0.5 ${getTextStyle(status)}`}>
                                                                                                {unit.unitNumber.split("-").pop()}
                                                                                            </span>

                                                                                            {/* Config */}
                                                                                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-none">
                                                                                                {unit.configuration}
                                                                                            </span>

                                                                                            {/* Status dot */}
                                                                                            {!isSelectionMode && (
                                                                                                <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${getStatusDot(status)}`} />
                                                                                            )}
                                                                                        </button>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
            </>
            )}

            {/* ── Unit Edit Dialog ── */}
            <Dialog open={!!editingUnit} onOpenChange={open => !open && setEditingUnit(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
                    {/* Header */}
                    {(() => {
                        const rawNum = editingUnit?.unitNumber || "";
                        const cleanNum = getCleanUnitNum(rawNum);
                        const towerObj = hierarchy?.towers.find(t => t._id === editingUnit?.towerId);
                        const towerName = towerObj?.name || "Tower";

                        return (
                            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50/70 to-white dark:from-slate-900 dark:to-slate-900/60 text-left">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-500/20 shrink-0">
                                            #{cleanNum}
                                        </div>
                                        <div>
                                            <DialogTitle className="flex items-center gap-2 flex-wrap text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                                <span>Unit {cleanNum}</span>
                                                {editingUnit?.configuration && (
                                                    <Badge variant="outline" className="text-xs font-bold uppercase px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                                                        {editingUnit.configuration}
                                                    </Badge>
                                                )}
                                            </DialogTitle>
                                            <DialogDescription className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{towerName}</span>
                                                <span>•</span>
                                                <span>Floor {editingUnit?.floorNumber ?? "—"}</span>
                                                {currentProperty?.name && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-slate-500">{currentProperty.name}</span>
                                                    </>
                                                )}
                                            </DialogDescription>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <Badge className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full shadow-sm ${
                                            editingUnit?.status === "available" ? "bg-emerald-600 hover:bg-emerald-600 text-white" :
                                            editingUnit?.status === "sold" ? "bg-rose-600 hover:bg-rose-600 text-white" :
                                            editingUnit?.status === "reserved" ? "bg-amber-500 hover:bg-amber-500 text-white" : "bg-slate-600 hover:bg-slate-600 text-white"
                                        }`}>
                                            {editingUnit?.status || "Available"}
                                        </Badge>
                                        {editingUnit?.status === "sold" && editingUnit.customerName && (
                                            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/40 px-2 py-0.5 rounded-md">
                                                Sold to {editingUnit.customerName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </DialogHeader>
                        );
                    })()}

                    {/* Tabs & Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <Tabs defaultValue="status" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
                                <TabsTrigger value="status" className="text-xs font-bold py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                                    Status & Pricing Actions
                                </TabsTrigger>
                                <TabsTrigger value="details" className="text-xs font-bold py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                                    Technical Specs & Breakdown
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab 1: Status & Action */}
                            <TabsContent value="status" className="space-y-4 focus-visible:outline-none mt-0">
                                {/* Section 1: Pricing & Dimensions */}
                                <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                                        Unit Dimensions & Pricing Calculation
                                    </span>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Carpet Area (sq.ft)</Label>
                                            <Input
                                                placeholder="Carpet Area"
                                                type="number"
                                                className="h-10 text-sm font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                                value={customerForm.carpetArea}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const carpet = parseFloat(val) || 0;
                                                    const builtUp = carpet > 0 ? Math.round(carpet * 1.2) : 0;
                                                    const rate = parseFloat(customerForm.ratePerSqft) || 0;
                                                    const newPrice = builtUp > 0 && rate > 0 ? Math.round(builtUp * rate) : (parseFloat(customerForm.price) || 0);
                                                    setCustomerForm(f => ({
                                                        ...f,
                                                        carpetArea: val,
                                                        builtUpArea: builtUp > 0 ? builtUp.toString() : f.builtUpArea,
                                                        price: newPrice > 0 ? newPrice.toString() : f.price,
                                                        allInclusivePrice: newPrice > 0 ? Math.round(newPrice * 1.13).toString() : f.allInclusivePrice
                                                    }));
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Built-Up Area (sq.ft)</Label>
                                            <Input
                                                placeholder="Built-Up Area"
                                                type="number"
                                                className="h-10 text-sm font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                                value={customerForm.builtUpArea}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const builtUp = parseFloat(val) || 0;
                                                    const rate = parseFloat(customerForm.ratePerSqft) || 0;
                                                    const newPrice = builtUp > 0 && rate > 0 ? Math.round(builtUp * rate) : (parseFloat(customerForm.price) || 0);
                                                    setCustomerForm(f => ({
                                                        ...f,
                                                        builtUpArea: val,
                                                        price: newPrice > 0 ? newPrice.toString() : f.price,
                                                        allInclusivePrice: newPrice > 0 ? Math.round(newPrice * 1.13).toString() : f.allInclusivePrice
                                                    }));
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Rate / sq.ft (₹)</Label>
                                            <Input
                                                placeholder="Rate"
                                                type="number"
                                                className="h-10 text-sm font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                                value={customerForm.ratePerSqft}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const rate = parseFloat(val) || 0;
                                                    const builtUp = parseFloat(customerForm.builtUpArea) || (editingUnit?.builtUpArea || (editingUnit?.area ? Math.round(editingUnit.area * 1.2) : 0)) || 0;
                                                    const newPrice = builtUp > 0 && rate > 0 ? Math.round(rate * builtUp) : (parseFloat(customerForm.price) || 0);
                                                    setCustomerForm(f => ({
                                                        ...f,
                                                        ratePerSqft: val,
                                                        price: newPrice > 0 ? newPrice.toString() : f.price,
                                                        allInclusivePrice: newPrice > 0 ? Math.round(newPrice * 1.13).toString() : f.allInclusivePrice
                                                    }));
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Flat Base Price (₹)</Label>
                                            <Input
                                                placeholder="Base Price"
                                                type="number"
                                                className="h-10 text-sm font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                                value={customerForm.price}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const num = parseFloat(val) || 0;
                                                    const builtUp = parseFloat(customerForm.builtUpArea) || (editingUnit?.builtUpArea || (editingUnit?.area ? Math.round(editingUnit.area * 1.2) : 0)) || 0;
                                                    const rate = num > 0 && builtUp > 0 ? Math.round(num / builtUp) : (parseFloat(customerForm.ratePerSqft) || 0);
                                                    setCustomerForm(f => ({
                                                        ...f,
                                                        price: val,
                                                        ratePerSqft: rate > 0 ? rate.toString() : f.ratePerSqft,
                                                        allInclusivePrice: num > 0 ? Math.round(num * 1.13).toString() : ""
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* All-Inclusive & Tax Banner */}
                                    {(() => {
                                        const baseP = parseFloat(customerForm.price) || 0;
                                        const gstP = Math.round(baseP * 0.05);
                                        const stampP = Math.round(baseP * 0.07);
                                        const regP = Math.round(baseP * 0.01);
                                        const allInclP = baseP + gstP + stampP + regP;

                                        return (
                                            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-pink-50/30 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 mt-2">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                                            <CircleDollarSign className="w-3.5 h-3.5" /> Estimated All-Inclusive Price
                                                        </span>
                                                        <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                                                            ₹{allInclP > 0 ? allInclP.toLocaleString("en-IN") : "0"}
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 font-medium">Includes 13% Govt Taxes (excl. legal & parking)</span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                                        <span className="px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-indigo-100 dark:border-indigo-900/50 text-slate-700 dark:text-slate-300">
                                                            GST (5%): <strong className="text-indigo-600 dark:text-indigo-400">₹{gstP.toLocaleString("en-IN")}</strong>
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-indigo-100 dark:border-indigo-900/50 text-slate-700 dark:text-slate-300">
                                                            Stamp (7%): <strong className="text-indigo-600 dark:text-indigo-400">₹{stampP.toLocaleString("en-IN")}</strong>
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-indigo-100 dark:border-indigo-900/50 text-slate-700 dark:text-slate-300">
                                                            Reg (1%): <strong className="text-indigo-600 dark:text-indigo-400">₹{regP.toLocaleString("en-IN")}</strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Section 2: Customer / Buyer Record */}
                                <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-indigo-500" />
                                        {editingUnit?.status === "available" ? "Customer / Hold Details (Optional)" : "Assigned Customer Information"}
                                    </span>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Buyer / Customer Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    placeholder="Customer full name"
                                                    className="pl-9 h-10 text-sm font-medium bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                                    value={customerForm.name}
                                                    onChange={e => setCustomerForm(f => ({ ...f, name: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Contact Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    placeholder="10-digit mobile number"
                                                    className="pl-9 h-10 text-sm font-medium bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                                    value={customerForm.phone}
                                                    onChange={e => setCustomerForm(f => ({ ...f, phone: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Booking / Hold Amount (₹)</Label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                                                <Input
                                                    placeholder="Token amount"
                                                    type="number"
                                                    className="pl-8 h-10 text-sm font-medium bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                                    value={customerForm.amount}
                                                    onChange={e => setCustomerForm(f => ({ ...f, amount: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Status Actions */}
                                <div className="space-y-2 pt-1">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                                        Update Unit Status
                                    </Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        {[
                                            { s: "available" as const, label: "Mark Available", activeLabel: "Available", icon: CheckCircle2, colors: "border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 bg-white dark:bg-slate-950", activeColors: "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20" },
                                            { s: "blocked" as const, label: "Hold Unit", activeLabel: "On Hold", icon: Lock, colors: "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 bg-white dark:bg-slate-950", activeColors: "bg-slate-700 text-white border-slate-700 shadow-md shadow-slate-500/20" },
                                            { s: "reserved" as const, label: "Reserve Unit", activeLabel: "Reserved", icon: Clock, colors: "border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 bg-white dark:bg-slate-950", activeColors: "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20" },
                                            { s: "sold" as const, label: "Mark as Sold", activeLabel: "Mark Unsold", icon: CircleDollarSign, colors: "border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 bg-white dark:bg-slate-950", activeColors: "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20" },
                                        ].map(({ s, label, activeLabel, icon: Icon, colors, activeColors }) => {
                                            const isActive = editingUnit?.status === s;
                                            const targetStatus = isActive && s !== "available" ? "available" : s;
                                            return (
                                                <Button
                                                    key={s}
                                                    variant="outline"
                                                    onClick={() => handleUnitUpdate(targetStatus)}
                                                    className={`h-11 font-bold text-xs border transition-all duration-200 rounded-xl cursor-pointer ${isActive ? activeColors + ' ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900' : colors}`}
                                                >
                                                    <Icon className={`mr-1.5 ${isActive ? 'h-4 w-4' : 'h-3.5 w-3.5 opacity-80'}`} />
                                                    {isActive ? activeLabel : label}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Tab 2: Technical Specifications & Breakdown */}
                            <TabsContent value="details" className="space-y-4 focus-visible:outline-none mt-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {[
                                        { label: "Unit Number", value: getCleanUnitNum(editingUnit?.unitNumber) },
                                        { label: "Floor", value: `${editingUnit?.floorNumber ?? "—"}` },
                                        { label: "Configuration / Typology", value: editingUnit?.configuration || "—" },
                                        { label: "Carpet Area", value: (editingUnit?.carpetArea || editingUnit?.area) ? `${editingUnit?.carpetArea || editingUnit?.area} sq.ft` : "—" },
                                        { label: "Built-Up Area", value: (editingUnit?.builtUpArea || (editingUnit?.area ? Math.round(editingUnit.area * 1.2) : 0)) ? `${editingUnit?.builtUpArea || Math.round((editingUnit?.area || 0) * 1.2)} sq.ft` : "—" },
                                        { label: "Rate / sq.ft", value: editingUnit?.ratePerSqft ? `₹${editingUnit.ratePerSqft.toLocaleString("en-IN")}` : "—" },
                                        { label: "Flat Price (Base)", value: editingUnit?.price ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(editingUnit.price) : "—" },
                                        { label: "GST (5%)", value: editingUnit?.price ? `+₹${Math.round(editingUnit.price * 0.05).toLocaleString("en-IN")}` : "—" },
                                        { label: "Stamp Duty (7%)", value: editingUnit?.price ? `+₹${Math.round(editingUnit.price * 0.07).toLocaleString("en-IN")}` : "—" },
                                        { label: "Registration Fees (1%)", value: editingUnit?.price ? `+₹${Math.round(editingUnit.price * 0.01).toLocaleString("en-IN")}` : "—" },
                                        { label: "All-Inclusive Total", value: editingUnit?.price ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Math.round(editingUnit.price * 1.13)) : "—" },
                                        ...(editingUnit?.facing ? [{ label: "Facing", value: `${editingUnit.facing} (Vastu Compliant)` }] : []),
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                                            <span className="text-xs text-slate-500 font-medium">{label}</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">{String(value ?? "—")}</span>
                                        </div>
                                    ))}
                                </div>

                                {editingUnit?.status === "sold" && (
                                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl p-4 space-y-2 mt-3">
                                        <p className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4" /> Verified Sale Record
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                                            <div>
                                                <span className="text-slate-500 block text-[10px] uppercase font-bold">Buyer</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{editingUnit.customerName || "—"}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block text-[10px] uppercase font-bold">Phone</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{editingUnit.customerPhone || "—"}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block text-[10px] uppercase font-bold">Booking Date</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{editingUnit.bookingDate ? new Date(editingUnit.bookingDate).toLocaleDateString("en-IN") : "—"}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block text-[10px] uppercase font-bold">Token Paid</span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{editingUnit.bookingAmount ? `₹${editingUnit.bookingAmount.toLocaleString("en-IN")}` : "—"}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setEditingUnit(null)} className="h-9 px-4 text-xs font-bold">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Tower Pricing Dialog ── */}
            <Dialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <CircleDollarSign className="h-4 w-4 text-indigo-600" />
                            </div>
                            Update Tower Pricing
                        </DialogTitle>
                        <DialogDescription>
                            Set new base rate for all units in{" "}
                            <strong>{selectedTowerMeta?.name}</strong>. Unit prices will be recalculated as Area × Rate.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTowerMeta?.baseRate ? (
                        <div className="px-4 py-2 mx-1 mt-2 mb-[-8px] rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Rate</span>
                            <span className="text-sm font-black text-indigo-700">₹{Number(selectedTowerMeta.baseRate).toLocaleString('en-IN')}/sq.ft</span>
                        </div>
                    ) : null}

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">New Rate (₹ per sq.ft)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">₹</span>
                                <Input
                                    className="pl-8 h-12 text-xl font-black"
                                    placeholder="e.g. 6500"
                                    type="number"
                                    value={towerRateForm.rate}
                                    onChange={e => setTowerRateForm(f => ({ ...f, rate: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900">
                            <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1">Impact</p>
                            <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 font-medium leading-relaxed">
                                This updates the price for every unit in this tower. Only available units will be recalculated.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPricingDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleTowerPriceUpdate}>
                            Apply Tower-wide Price
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
