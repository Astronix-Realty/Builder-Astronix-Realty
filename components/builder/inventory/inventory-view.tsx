"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Users,
    Search,
    Filter,
    Home,
    CheckCircle2,
    Lock,
    Clock,
    Ban,
    Building,
    Layers,
    LayoutGrid,
    RefreshCw,
    CircleDollarSign,
    CheckSquare,
    X,
    User,
    Phone,
    Banknote
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// --- Types ---

interface SavedProperty {
    _id: string
    id: string
    flowType: "township" | "project" | "tower"
    name: string
    details: {
        township?: any
        projects?: any[]
        towers: any[]
        generatedUnits: any[]
    }
    createdAt: string
    status: string
}

interface Unit {
    id: string
    unitNumber: string
    floorNumber: number
    price: number
    configuration: string
    status: "available" | "sold" | "blocked" | "reserved"
    towerId: string
    area?: number
    ratePerSqft?: number

    // Customer / Booking Details
    customerName?: string
    customerPhone?: string
    bookingAmount?: number
    bookingDate?: string
}

// --- Component ---
interface InventoryViewProps {
    userRole?: "builder" | "mandate"
}

export function InventoryView({ userRole = "builder" }: InventoryViewProps) {
    const [properties, setProperties] = useState<SavedProperty[]>([])
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
    const [selectedTowerId, setSelectedTowerId] = useState<string>("all")
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Filtering State
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [configFilter, setConfigFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")

    // Selection & Bulk Actions
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])

    // Edit State
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
    const [customerForm, setCustomerForm] = useState({
        name: "",
        phone: "",
        amount: ""
    })

    // Tower Pricing State
    const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false)
    const [towerRateForm, setTowerRateForm] = useState({
        rate: "",
        applyToAllConfigurations: true
    })

    // Data Loading
    useEffect(() => {
        loadProperties()
    }, [])

    useEffect(() => {
        if (selectedPropertyId) {
            // Only fetch if we don't have the full details (e.g. generatedUnits) yet
            // or if we want to ensure fresh data on every selection
            fetchFullProperty(selectedPropertyId)
        }
    }, [selectedPropertyId])

    const loadProperties = async (showFullLoader = true) => {
        if (showFullLoader) setLoading(true)
        else setIsRefreshing(true)
        try {
            const res = await fetch("/api/properties?status=published")
            if (res.ok) {
                const data = await res.json()
                const publishedOnly = (data.properties || []).filter((p: any) => 
                    p.status === "published" || p.status === "active" || p.status === "pending"
                )
                
                let targetId = selectedPropertyId;
                
                if (targetId) {
                    const isStillValid = publishedOnly.some((p: any) => (p._id || p.id) === targetId)
                    if (!isStillValid) {
                        targetId = publishedOnly.length > 0 ? (publishedOnly[0]._id || publishedOnly[0].id) : ""
                    }
                } else if (publishedOnly.length > 0) {
                    targetId = (publishedOnly[0]._id || publishedOnly[0].id)?.toString() || ""
                }

                if (targetId) {
                    setSelectedPropertyId(targetId)
                    const fullRes = await fetch(`/api/properties/${targetId}`)
                    if (fullRes.ok) {
                        const fullData = await fullRes.json()
                        const updatedProperty = fullData.property
                        const isValid = updatedProperty.status === "published" || updatedProperty.status === "active" || updatedProperty.status === "pending"
                        
                        if (isValid) {
                            const mergedProperties = publishedOnly.map(p => 
                                ((p._id || p.id)?.toString() === targetId) ? updatedProperty : p
                            )
                            setProperties(mergedProperties)
                        } else {
                            setProperties(publishedOnly.filter(p => (p._id || p.id)?.toString() !== targetId))
                            setSelectedPropertyId("")
                        }
                    } else {
                        setProperties(publishedOnly)
                    }
                } else {
                    setSelectedPropertyId("")
                    setProperties(publishedOnly)
                }
            }
        } catch (e) {
            console.error("Failed to load properties", e)
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }

    // --- Auto Sync Logic ---
    useEffect(() => {
        const interval = setInterval(() => {
            if (selectedPropertyId && !isRefreshing && !loading) {
                fetchFullProperty(selectedPropertyId)
            }
        }, 60000) // Auto-sync every 60 seconds

        return () => clearInterval(interval)
    }, [selectedPropertyId, isRefreshing, loading])

    const fetchFullProperty = async (id: string) => {
        if (!id) return
        try {
            const res = await fetch(`/api/properties/${id}`)
            if (res.ok) {
                const data = await res.json()
                const updatedProperty = data.property
                
                // Root-level fix: Ensure the property is still published before keeping it in inventory
                const isValid = updatedProperty.status === "published" || updatedProperty.status === "active"
                
                setProperties(prev => {
                    const newProps = prev.map(p => 
                        ((p as any)._id?.toString() === id || p.id?.toString() === id) ? updatedProperty : p
                    ).filter(p => p.status === "published" || p.status === "active")
                    
                    // If the selected property was just filtered out, reset selection
                    if (!isValid && selectedPropertyId === id) {
                        setTimeout(() => {
                            setSelectedPropertyId(newProps.length > 0 ? ((newProps[0] as any)._id || newProps[0].id)?.toString() : "")
                        }, 0)
                    }
                    
                    return newProps
                })
            }
        } catch (e) {
            console.error("Failed to fetch full property", e)
        }
    }

    // Save changes to backend
    const handleUnitClick = (unit: Unit) => {
        if (isSelectionMode) {
            setSelectedUnitIds(prev =>
                prev.includes(unit.id)
                    ? prev.filter(id => id !== unit.id)
                    : [...prev, unit.id]
            )
        } else {
            setEditingUnit(unit)
            setCustomerForm({
                name: unit.customerName || "",
                phone: unit.customerPhone || "",
                amount: unit.bookingAmount?.toString() || ""
            })
        }
    }

    const handleSingleStatusChange = async (status: Unit['status']) => {
        if (!editingUnit || !currentProperty) return

        if ((status === "sold" || status === "reserved") && !customerForm.name.trim()) {
            toast.error("Please enter the buyer's name")
            return
        }

        if ((status === "sold" || status === "reserved") && !customerForm.phone.trim()) {
            toast.error("Please enter the buyer's phone number")
            return
        }

        const bookingAmt = parseFloat(customerForm.amount)
        if ((status === "sold" || status === "reserved") && (isNaN(bookingAmt) || bookingAmt <= 0)) {
            toast.error("Please enter a valid booking amount")
            return
        }

        // --- Optimistic Update ---
        const updatedUnit: Unit = {
            ...editingUnit,
            status,
            customerName: status === "available" ? "" : (customerForm.name || editingUnit.customerName || ""),
            customerPhone: status === "available" ? "" : (customerForm.phone || editingUnit.customerPhone || ""),
            bookingAmount: status === "available" ? 0 : 
                           (customerForm.amount === "" ? (editingUnit.bookingAmount || 0) : parseFloat(customerForm.amount)),
            bookingDate: status === "available" ? null : (editingUnit.bookingDate || new Date().toISOString())
        }

        // Update local properties state immediately
        setProperties(prev => prev.map(p => {
            const pId = (p._id || p.id)?.toString()
            if (pId === selectedPropertyId) {
                const updatedUnits = (p.details?.generatedUnits || []).map((u: any) => 
                    (u.id === editingUnit.id || u._id?.toString() === editingUnit.id) ? updatedUnit : u
                )
                return { ...p, details: { ...p.details, generatedUnits: updatedUnits } }
            }
            return p
        }))
        setEditingUnit(null)

        console.log(`[InventoryView] Updating unit ${editingUnit.id} to ${status}`, {
            propertyId: selectedPropertyId,
            updatedUnit
        })

        try {
            const res = await fetch(`/api/units/${editingUnit.id}?propertyId=${selectedPropertyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status,
                    customerName: updatedUnit.customerName,
                    customerPhone: updatedUnit.customerPhone,
                    bookingAmount: updatedUnit.bookingAmount,
                    bookingDate: updatedUnit.bookingDate
                })
            })

            if (res.ok) {
                toast.success(`Unit marked as ${status}`)
                // Full sync in background
                fetchFullProperty(selectedPropertyId, false)
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to update unit")
                // Revert on error
                fetchFullProperty(selectedPropertyId, false)
            }
        } catch (e) {
            console.error("Failed to update unit status", e)
            toast.error("An error occurred while updating unit")
            fetchFullProperty(selectedPropertyId, false)
        }
    }

    const handleBulkStatusChange = async (status: Unit['status']) => {
        if (!currentProperty || selectedUnitIds.length === 0) return

        if (!confirm(`Are you sure you want to mark ${selectedUnitIds.length} units as ${status}?`)) return

        // --- Optimistic Update ---
        setProperties(prev => prev.map(p => {
            const pId = (p._id || p.id)?.toString()
            if (pId === selectedPropertyId) {
                const updatedUnits = (p.details?.generatedUnits || []).map((u: any) => {
                    const uId = (u.id || u._id?.toString())
                    if (selectedUnitIds.includes(uId)) {
                        return { 
                            ...u, 
                            status,
                            customerName: status === "available" ? "" : u.customerName,
                            customerPhone: status === "available" ? "" : u.customerPhone,
                            bookingAmount: status === "available" ? 0 : u.bookingAmount,
                            bookingDate: status === "available" ? null : u.bookingDate
                        }
                    }
                    return u
                })
                return { ...p, details: { ...p.details, generatedUnits: updatedUnits } }
            }
            return p
        }))

        try {
            const res = await fetch(`/api/units/bulk?propertyId=${selectedPropertyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unitIds: selectedUnitIds,
                    status
                })
            })

            if (res.ok) {
                toast.success(`Bulk updated ${selectedUnitIds.length} units to ${status}`)
                fetchFullProperty(selectedPropertyId, false)
                setSelectedUnitIds([])
                setIsSelectionMode(false)
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to update units in bulk")
                fetchFullProperty(selectedPropertyId, false)
            }
        } catch (e) {
            console.error("Failed to update bulk status", e)
            toast.error("An error occurred during bulk update")
            fetchFullProperty(selectedPropertyId, false)
        }
    }

    const handleTowerPriceUpdate = async () => {
        if (!currentProperty || selectedTowerId === "all") return

        const rate = parseFloat(towerRateForm.rate)
        if (isNaN(rate) || rate <= 0) {
            alert("Please enter a valid rate per sqft")
            return
        }

        try {
            const res = await fetch(`/api/towers/${selectedTowerId}/pricing`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ratePerSqft: rate })
            })

            if (res.ok) {
                fetchFullProperty(selectedPropertyId)
                setIsPricingDialogOpen(false)
                setTowerRateForm({ rate: "", applyToAllConfigurations: true })
                alert(`Successfully updated all units in tower to ₹${rate}/sqft`)
            }
        } catch (e) {
            console.error("Failed to update tower pricing", e)
        }
    }

    // --- Derived Data ---

    const currentProperty = properties.find((p: any) => 
        (p._id?.toString() === selectedPropertyId || p.id?.toString() === selectedPropertyId)
    )

    // Hierarchy Options
    const data = currentProperty?.details || {}
    const projects = data.projects || []
    const towers = data.towers || []

    // Filtered Towers based on Project Selection
    const visibleTowers = selectedProjectId === "all"
        ? towers
        : towers.filter((t: any) => (t._dbId || t.id)?.toString() === selectedProjectId)

    // Units Processing
    const allUnits = data.generatedUnits || []

    const filteredUnits = allUnits.filter((unit: Unit) => {
        // Hierarchy
        if (selectedTowerId !== "all" && unit.towerId !== selectedTowerId) return false
        if (selectedProjectId !== "all" && selectedTowerId === "all") {
            const tower = towers.find((t: any) => (t._dbId || t.id)?.toString() === unit.towerId)
            if (tower?.projectId !== selectedProjectId) return false
        }

        // Filters
        if (statusFilter !== "all" && (unit.status || "available") !== statusFilter) return false
        if (configFilter !== "all" && unit.configuration !== configFilter) return false
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            return unit.unitNumber.toLowerCase().includes(term) ||
                unit.configuration.toLowerCase().includes(term) ||
                (unit.customerName || "").toLowerCase().includes(term)
        }

        return true
    })

    // Stats
    const stats = {
        total: filteredUnits.length,
        available: filteredUnits.filter((u: Unit) => (u.status || "available") === "available").length,
        sold: filteredUnits.filter((u: Unit) => u.status === "sold").length,
        reserved: filteredUnits.filter((u: Unit) => u.status === "reserved").length,
        blocked: filteredUnits.filter((u: Unit) => u.status === "blocked").length,
        revenue: filteredUnits
            .filter((u: Unit) => u.status === "sold")
            .reduce((sum: number, u: Unit) => sum + (u.price || 0), 0)
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Inventory System...</div>
    if (properties.length === 0) return (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl m-8">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Published Properties</h3>
            <p className="text-muted-foreground">Inventory only shows properties that have been approved and published.</p>
        </div>
    )

    return (
        <div className="flex h-full flex-col bg-slate-50/50 dark:bg-slate-950 p-6 space-y-6">
            {/* Top Controls */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Inventory Management</h2>
                    <p className="text-muted-foreground">Track usage, sales, pricing, and unit status</p>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                        <SelectTrigger className="w-[200px] md:w-[250px] bg-white dark:bg-slate-900 shadow-sm">
                            <SelectValue placeholder="Select Property" />
                        </SelectTrigger>
                        <SelectContent>
                            {properties.map((p: any, idx: number) => {
                                const data = p.details || {}
                                const name = p.name || data.township?.name ||
                                    data.projects?.[0]?.name ||
                                    data.towers?.[0]?.name ||
                                    `Property ${p._id?.slice(-4) || idx}`
                                return <SelectItem key={p._id?.toString() || p.id?.toString() || idx} value={p._id?.toString() || p.id?.toString() || `prop-${idx}`}>{name}</SelectItem>
                            })}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => loadProperties(false)} disabled={isRefreshing} title="Refresh Data">
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {currentProperty && (
                <div className="grid grid-cols-12 gap-6 h-full min-h-0">

                    {/* Sidebar Filters */}
                    <div className="col-span-12 md:col-span-3 space-y-6">
                        {/* Hierarchy Filters */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Filter Units</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {currentProperty.flowType === "township" && (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Project Phase</Label>
                                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Projects" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Projects</SelectItem>
                                                {projects.map((proj: any) => (
                                                    <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Tower</Label>
                                    <Select value={selectedTowerId} onValueChange={setSelectedTowerId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Towers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem key="all" value="all">All Towers</SelectItem>
                                            {visibleTowers.map((tw: any, idx: number) => (
                                                <SelectItem key={(tw._dbId || tw.id)?.toString() || `tower-${idx}`} value={(tw._dbId || tw.id)?.toString() || `tower-${idx}`}>{tw.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="available">Available</SelectItem>
                                            <SelectItem value="sold">Sold</SelectItem>
                                            <SelectItem value="reserved">Reserved</SelectItem>
                                            <SelectItem value="blocked">Blocked</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Configuration</Label>
                                    <Select value={configFilter} onValueChange={setConfigFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Configs" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem key="all" value="all">Check All</SelectItem>
                                            {Array.from(new Set(allUnits.map((u: any) => u.configuration).filter(Boolean))).map((cfg: any, idx: number) => (
                                                <SelectItem key={cfg || idx} value={cfg || `cfg-${idx}`}>{cfg}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Search Unit / Customer</Label>
                                    <Input
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="col-span-12 md:col-span-9 space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Card className="p-4 flex flex-col justify-between shadow-sm">
                                <p className="text-sm text-muted-foreground font-medium">Total Units</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </Card>
                            <Card className="p-4 bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900 flex flex-col justify-between shadow-sm">
                                <p className="text-sm text-green-700 dark:text-green-400 font-medium">Available</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.available}</p>
                            </Card>
                            <Card className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900 flex flex-col justify-between shadow-sm">
                                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Sold</p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stats.sold}</p>
                            </Card>
                            <Card className="p-4 bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900 flex flex-col justify-between shadow-sm border-l-4 border-l-slate-400">
                                <p className="text-sm text-slate-700 dark:text-slate-400 font-medium">Blocked</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-300">{stats.blocked}</p>
                            </Card>
                            <Card className="p-4 bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900 flex flex-col justify-between shadow-sm">
                                <span className="text-sm text-purple-700 dark:text-purple-400 font-medium">Revenue</span>
                                <p className="text-xl font-bold text-purple-900 dark:text-purple-300">
                                    ₹{(stats.revenue / 10000000).toFixed(2)} Cr
                                </p>
                            </Card>
                        </div>

                        {/* Interactive Grid Card */}
                        <Card className="flex-1 min-h-[600px] flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b">
                                <div className="flex items-center gap-4">
                                    <CardTitle className="text-base font-medium flex items-center gap-2">
                                        <LayoutGrid className="h-5 w-5" />
                                        Unit Grid
                                    </CardTitle>

                                    {/* Selection Mode Toggle */}
                                    <div className="flex items-center gap-2 pl-4 border-l">
                                        <Switch
                                            id="select-mode"
                                            checked={isSelectionMode}
                                            onCheckedChange={(checked) => {
                                                setIsSelectionMode(checked)
                                                if (!checked) setSelectedUnitIds([])
                                            }}
                                        />
                                        <Label htmlFor="select-mode" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                                            {isSelectionMode ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Users className="h-4 w-4 text-muted-foreground" />}
                                            Bulk Actions
                                        </Label>
                                    </div>
                                </div>

                                {/* Legend or Bulk Actions */}
                                {isSelectionMode && selectedUnitIds.length > 0 ? (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                        <Badge variant="secondary" className="mr-2">{selectedUnitIds.length} Selected</Badge>
                                        <Button size="sm" variant="outline" className="h-8 border-green-200 bg-green-50 text-green-700 hover:bg-green-100" onClick={() => handleBulkStatusChange("available")}>
                                            Mark Available
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-8 border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100" onClick={() => handleBulkStatusChange("blocked")}>
                                            Bulk Block
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        {selectedTowerId !== "all" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold"
                                                onClick={() => {
                                                    const firstUnit = allUnits.find(u => u.towerId === selectedTowerId)
                                                    setIsPricingDialogOpen(true)
                                                    setTowerRateForm(prev => ({ ...prev, rate: (firstUnit?.ratePerSqft || "").toString() }))
                                                }}
                                            >
                                                <CircleDollarSign className="h-4 w-4 mr-1.5" />
                                                Update Tower Pricing
                                            </Button>
                                        )}
                                        <div className="flex gap-3 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Available</div>
                                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Sold</div>
                                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reserved</div>
                                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Blocked</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-900/30 space-y-8">
                                {filteredUnits.length > 0 ? (
                                    Object.entries(
                                        filteredUnits.reduce((acc, unit) => {
                                            const floor = unit.floorNumber || 0
                                            if (!acc[floor]) acc[floor] = []
                                            acc[floor].push(unit)
                                            return acc
                                        }, {} as Record<number, Unit[]>)
                                    )
                                        .sort(([a], [b]) => Number(b) - Number(a)) // Show highest floor at top
                                        .map(([floor, floorUnits]: [string, any], idx: number) => (
                                            <div key={floor || idx} className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                                                        Floor {floor}
                                                    </span>
                                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                                                </div>

                                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                                                    {floorUnits.map((unit: any, idx: number) => {
                                                        const status = unit.status || "available"
                                                        const isSelected = selectedUnitIds.includes(unit.id)

                                                        let baseClass = "relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition-all duration-300 hover:scale-105 hover:shadow-lg group/unit"
                                                        let colorClass = ""
                                                        let textClass = ""

                                                        if (status === "sold") {
                                                            colorClass = "bg-red-50 hover:bg-red-100 border-red-100 dark:bg-red-900/20 dark:border-red-900/50"
                                                            textClass = "text-red-700 dark:text-red-300"
                                                        } else if (status === "reserved") {
                                                            colorClass = "bg-amber-50 hover:bg-amber-100 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/50"
                                                            textClass = "text-amber-700 dark:text-amber-300"
                                                        } else if (status === "blocked") {
                                                            colorClass = "bg-slate-100 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                                                            textClass = "text-slate-700 dark:text-slate-300"
                                                        } else {
                                                            colorClass = "bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-200 dark:bg-slate-900 dark:border-slate-800"
                                                            textClass = "text-slate-900 dark:text-slate-100"
                                                        }

                                                        if (isSelectionMode && isSelected) {
                                                            colorClass += " ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950 scale-95"
                                                        }

                                                        const unitKey = unit.id || `${unit.towerId}-${unit.unitNumber}-${idx}`

                                                        return (
                                                            <button
                                                                key={unitKey}
                                                                onClick={() => handleUnitClick(unit)}
                                                                className={`${baseClass} ${colorClass}`}
                                                            >
                                                                {isSelectionMode && (
                                                                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border shadow-sm flex items-center justify-center transition-all ${isSelected ? "bg-blue-600 border-blue-600 scale-110" : "bg-white dark:bg-slate-800 border-slate-200"}`}>
                                                                        {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                                    </div>
                                                                )}

                                                                <span className={`text-[11px] font-black leading-none mb-1 ${textClass}`}>{unit.unitNumber.split('-').pop()}</span>
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{unit.configuration}</span>

                                                                {/* Status Dot for better visual */}
                                                                {!isSelectionMode && (
                                                                    <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${status === 'sold' ? 'bg-red-500' : status === 'reserved' ? 'bg-amber-500' : status === 'blocked' ? 'bg-slate-500' : 'bg-emerald-500'}`} />
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                                        <Layers className="h-12 w-12 mb-4 opacity-20" />
                                        <p className="text-sm font-medium">No units found matching filters.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Enhanced Edit Dialog */}
            <Dialog open={!!editingUnit} onOpenChange={(open) => !open && setEditingUnit(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2 text-xl font-black">
                                    Unit {editingUnit?.unitNumber}
                                    <Badge variant="secondary" className="uppercase">{editingUnit?.configuration}</Badge>
                                </div>
                                {editingUnit?.status === 'sold' && (
                                    <p className="text-xs font-bold text-red-600 uppercase tracking-tighter">
                                        Sold to {editingUnit.customerName || "N/A"}
                                    </p>
                                )}
                            </div>
                            <Badge 
                                variant={editingUnit?.status === 'available' ? 'default' : 'outline'} 
                                className={editingUnit?.status === 'available' ? "capitalize bg-green-600" : "capitalize border-red-600 text-red-600"}
                            >
                                {editingUnit?.status || "Available"}
                            </Badge>
                        </DialogTitle>
                        <DialogDescription>
                            Tower {towers.find((t: any) => t.id === editingUnit?.towerId)?.name || "Unknown"}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="status" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="status">Status & Action</TabsTrigger>
                            <TabsTrigger value="details">Details & Pricing</TabsTrigger>
                        </TabsList>

                        <TabsContent value="status" className="py-4 space-y-4">
                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant={editingUnit?.status === "available" ? "default" : "outline"}
                                    className={editingUnit?.status === "available" ? "bg-green-600 hover:bg-green-700 h-12" : "border-green-600 text-green-600 hover:bg-green-50 h-12"}
                                    onClick={() => handleSingleStatusChange("available")}
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    {editingUnit?.status === "available" ? "Unit Available" : "Mark as Available"}
                                </Button>
                                <Button
                                    variant={editingUnit?.status === "blocked" ? "default" : "outline"}
                                    className={editingUnit?.status === "blocked" ? "bg-slate-600 hover:bg-slate-700 h-12" : "border-slate-500 text-slate-600 hover:bg-slate-50 h-12"}
                                    onClick={() => handleSingleStatusChange(editingUnit?.status === "blocked" ? "available" : "blocked")}
                                >
                                    <Lock className="h-4 w-4 mr-2" />
                                    {editingUnit?.status === "blocked" ? "Unblock Unit" : "Block Unit"}
                                </Button>
                                <Button
                                    variant={editingUnit?.status === "reserved" ? "default" : "outline"}
                                    className={editingUnit?.status === "reserved" ? "bg-amber-500 hover:bg-amber-600 h-12" : "border-amber-500 text-amber-600 hover:bg-amber-50 h-12"}
                                    onClick={() => handleSingleStatusChange(editingUnit?.status === "reserved" ? "available" : "reserved")}
                                >
                                    <Clock className="h-4 w-4 mr-2" />
                                    {editingUnit?.status === "reserved" ? "Unreserve Unit" : "Reserve Unit"}
                                </Button>
                                <Button
                                    variant={editingUnit?.status === "sold" ? "default" : "outline"}
                                    className={editingUnit?.status === "sold" ? "bg-red-600 hover:bg-red-700 h-12" : "bg-white border-red-600 text-red-600 hover:bg-red-50 h-12"}
                                    onClick={() => handleSingleStatusChange(editingUnit?.status === "sold" ? "available" : "sold")}
                                >
                                    <CircleDollarSign className="h-4 w-4 mr-2" />
                                    {editingUnit?.status === "sold" ? "Mark Unsold" : "Mark as Sold"}
                                </Button>
                            </div>

                            {/* Customer Details Form (Only if selling or already sold) */}
                            <div className="rounded-lg border p-4 bg-slate-50 dark:bg-slate-900/50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        <User className="h-4 w-4 text-blue-500" /> 
                                        {editingUnit?.status === 'available' ? "New Buyer Details" : "Current Customer Info"}
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        Unit Price: ₹{editingUnit?.price?.toLocaleString()}
                                    </Badge>
                                </div>
                                <div className="grid gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase text-slate-400">Customer Name</Label>
                                        <Input
                                            placeholder="Enter buyer's full name"
                                            className="h-10 text-sm font-semibold bg-white"
                                            value={customerForm.name}
                                            onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                                        />
                                    </div>

                                    {/* Collapsible extra details maybe? For now keeping it simple as requested */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Phone Number</Label>
                                            <Input
                                                placeholder="Mobile number"
                                                className="h-9 text-xs bg-white/50"
                                                value={customerForm.phone}
                                                onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Booking Amount</Label>
                                            <Input
                                                placeholder="Amount paid"
                                                type="number"
                                                className="h-9 text-xs bg-white/50"
                                                value={customerForm.amount}
                                                onChange={e => setCustomerForm({ ...customerForm, amount: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium italic">
                                    * Sale process will be completed when you click &apos;Mark as Sold&apos; above.
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="details" className="py-4 text-sm space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Configuration</span>
                                    <span className="font-medium">{editingUnit?.configuration}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Price</span>
                                    <span className="font-medium">
                                        {editingUnit && new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(editingUnit.price)}
                                    </span>
                                </div>

                                {editingUnit?.status === "sold" && (
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg space-y-2">
                                        <p className="font-semibold text-green-800 dark:text-green-300">Sale Record</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <span className="text-muted-foreground">Customer:</span>
                                            <span>{editingUnit.customerName || "-"}</span>

                                            <span className="text-muted-foreground">Contact:</span>

                                            <span>{editingUnit.customerPhone || "-"}</span>

                                            <span className="text-muted-foreground">Booked On:</span>
                                            <span>{editingUnit.bookingDate ? new Date(editingUnit.bookingDate).toLocaleDateString() : "-"}</span>

                                            <span className="text-muted-foreground">Amount:</span>
                                            <span>{editingUnit.bookingAmount ? `₹${editingUnit.bookingAmount}` : "-"}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Tower Pricing Update Dialog */}
            <Dialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CircleDollarSign className="h-5 w-5 text-blue-500" />
                            Update Tower Pricing
                        </DialogTitle>
                        <DialogDescription>
                            Change the base rate for all units in <b>{visibleTowers.find((t: any) => t.id === selectedTowerId)?.name}</b>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">New Base Rate (₹ per sq.ft)</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                                <Input
                                    className="pl-8 h-12 text-lg font-black"
                                    placeholder="e.g. 6500"
                                    type="number"
                                    value={towerRateForm.rate}
                                    onChange={e => setTowerRateForm({ ...towerRateForm, rate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/50">
                            <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-1">Impact Analysis</p>
                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed font-medium">
                                This will update the final price for every unit in this tower by multiplying their Area with this new rate.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPricingDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleTowerPriceUpdate}>
                            Apply Tower-wide Price
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
