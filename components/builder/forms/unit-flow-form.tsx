"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
    Settings,
    Plus,
    X,
    Trash2,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Layout,
    Check,
    AlertCircle,
    Info,
    History,
    FileText,
    Download,
    Eye,
    Shield,
    Waves,
    Dumbbell,
    Coffee,
    Baby,
    Car,
    Zap,
    Users,
    Building2,
    MapPin,
    Calendar,
    Phone,
    Copy,
    Share2,
    Printer,
    DollarSign,
    Ruler,
    Layers,
    Home,
    CheckCircle,
    Minus,
    Sparkles,
    Activity,
    Star,
    Compass,
    Maximize,
    Settings2,
    Grid3X3,
    LayoutGrid,
    FlipHorizontal,
    BarChart3,
    ShieldCheck
} from "lucide-react"
import { getVastuDetails } from "@/lib/algorithms/vastu/vastuAlgorithm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { GalleryUpload, AboutImageUpload } from "@/components/ui/media-uploads"

import {
    defaultRoomDimensions,
    defaultVastu,
    type UnitTemplate,
    type UnitConfiguration,
    type RoomDimension,
    type VastuItem,
    type MoveInItem,
    type FacingPremium,
    type FloorGroup,
    type UnitLayoutSlot
} from "@/lib/builder-types"
// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────
const VASTU_STATUS = ["excellent", "good", "neutral", "avoid"] as const
const FACINGS = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"]
const VIEW_TYPES = ["Garden View", "Pool View", "City View", "Road Facing", "Park View", "Mountain View", "Sea View", "Open View"]

// ─────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────
interface UnitFlowFormProps {
    data: UnitTemplate
    onChange: (data: UnitTemplate) => void
    towerName?: string
    projectName?: string
    townshipName?: string
    totalFloors?: number
    unitsPerFloor?: number
}

// ─────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────
function Section({
    id, title, description, icon: Icon, openIds, setOpenIds, children,
}: {
    id: string; title: string; description?: string
    icon: React.ComponentType<{ className?: string }>
    openIds: string[]; setOpenIds: React.Dispatch<React.SetStateAction<string[]>>
    children: React.ReactNode
}) {
    const isOpen = openIds.includes(id)
    return (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <button type="button"
                onClick={() => setOpenIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{title}</span>
                        {description && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{description}</p>}
                    </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />}
            </button>
            {isOpen && <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-slate-800">{children}</div>}
        </div>
    )
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            {children}
            {hint && <p className="text-[11px] text-gray-400 dark:text-slate-500">{hint}</p>}
        </div>
    )
}

function Grid({ cols = 2, children, className = "" }: { cols?: 1 | 2 | 3 | 4; children: React.ReactNode; className?: string }) {
    const cls = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4" }
    return <div className={`grid gap-3 ${cls[cols]} ${className}`}>{children}</div>
}

function SectionTitle({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-2 mt-5 mb-3">
            <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">{title}</span>
            <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
        </div>
    )
}



// ─────────────────────────────────────────
// UNIT CONFIGURATION CARD
// ─────────────────────────────────────────
function UnitConfigCard({
    config, index, onChange, onRemove, globalLoadingFactor
}: {
    config: UnitConfiguration
    index: number
    onChange: (patch: Partial<UnitConfiguration>) => void
    onRemove: () => void
    globalLoadingFactor?: string
}) {
    const [open, setOpen] = useState(index === 0)

    // Auto-calculate derived fields (initial defaults)
    useEffect(() => {
        const loading = config.loadingFactor || parseFloat(globalLoadingFactor || "40") || 40
        const builtUp = config.builtUpArea || Math.round(config.carpetArea * (1 + loading / 100))
        const sbua = config.superBuiltUpArea || builtUp
        
        // If price is missing but area exists, use a default rate to help the user
        if (config.carpetArea > 0 && !config.basePrice && !config.ratePerSqft) {
            const defaultRate = 5000
            const flatCost = defaultRate * builtUp
            const gstAmt = flatCost * 0.05
            const stampAmt = flatCost * 0.07
            const reg = 30000
            const park = 0
            const other = 0
            const taxes = gstAmt + stampAmt + reg
            const allInclusive = flatCost + taxes
            onChange({ 
                builtUpArea: builtUp, 
                superBuiltUpArea: sbua, 
                loadingFactor: loading, 
                ratePerSqft: defaultRate,
                basePrice: flatCost,
                gstAmount: Math.round(gstAmt),
                stampDutyAmount: Math.round(stampAmt),
                totalTaxes: Math.round(taxes),
                allInclusivePrice: Math.round(allInclusive)
            })
        } else if (builtUp !== config.builtUpArea) {
            onChange({ builtUpArea: builtUp, superBuiltUpArea: builtUp })
        }
    }, [config.carpetArea, onChange])

    const addRoom = () => {
        const id = Date.now().toString()
        const r: RoomDimension = { id, roomName: "", length: "", width: "", unit: "ft" }
        const v: VastuItem = { id, element: "", direction: "", status: "good" }
        onChange({
            roomDimensions: [...config.roomDimensions, r],
            vastuAnalysis: [...config.vastuAnalysis, v]
        })
    }
    const updateRoom = (id: string, patch: Partial<RoomDimension>) => {
        const newRooms = config.roomDimensions.map(x => x.id === id ? { ...x, ...patch } : x)
        let newVastu = config.vastuAnalysis
        if (patch.roomName !== undefined) {
            newVastu = config.vastuAnalysis.map(x => x.id === id ? { ...x, element: patch.roomName! } : x)
        }
        onChange({ roomDimensions: newRooms, vastuAnalysis: newVastu })
    }
    const removeRoom = (id: string) => {
        onChange({
            roomDimensions: config.roomDimensions.filter(x => x.id !== id),
            vastuAnalysis: config.vastuAnalysis.filter(x => x.id !== id)
        })
    }
    const addVastu = () => {
        const v: VastuItem = { id: Date.now().toString(), element: "", direction: "", status: "good" }
        onChange({ vastuAnalysis: [...config.vastuAnalysis, v] })
    }
    const updateVastu = (id: string, patch: Partial<VastuItem>) =>
        onChange({ vastuAnalysis: config.vastuAnalysis.map(x => x.id === id ? { ...x, ...patch } : x) })
    const removeVastu = (id: string) =>
        onChange({ vastuAnalysis: config.vastuAnalysis.filter(x => x.id !== id) })

    const autoFillVastu = (type: string) => {
        let rooms: string[] = [
            "Main Entrance",
            "Living Room",
            "Living Room Window",
            "Kitchen",
            "Kitchen Window",
            "Master Bedroom",
            "Master Bedroom Headboard",
            "Master Bedroom Window",
            "Common Washroom",
            "Pooja Room"
        ];

        if (["2BHK", "3BHK", "4BHK", "5BHK", "duplex", "penthouse"].includes(type)) {
            rooms.push(
                "Dining Room",
                "Kids Room",
                "Kids Room Headboard",
                "Kids Room Window",
                "Attached Washroom 1",
                "Balcony 1"
            );
        }
        if (["3BHK", "4BHK", "5BHK", "duplex", "penthouse"].includes(type)) {
            rooms.push(
                "Guest Room",
                "Guest Room Headboard",
                "Guest Room Window",
                "Safe / Locker",
                "Balcony 2"
            );
        }
        if (["4BHK", "5BHK", "duplex", "penthouse"].includes(type)) {
            rooms.push(
                "Bedroom 4",
                "Bedroom 4 Headboard",
                "Bedroom 4 Window",
                "Study Room",
                "Attached Washroom 2",
                "Balcony 3"
            );
        }
        if (["5BHK", "penthouse"].includes(type)) {
            rooms.push(
                "Bedroom 5",
                "Bedroom 5 Headboard",
                "Bedroom 5 Window",
                "Servant Room",
                "Servant Washroom",
                "Balcony 4"
            );
        }
        if (["shop", "office", "showroom"].includes(type)) {
            rooms = ["Main Entrance", "Workspace / Seating", "Cash / Reception", "Common Washroom", "Pantry"];
        }

        const newVastu = rooms.map((room, idx) => ({
            id: `auto-v-${Date.now()}-${idx}`,
            element: room,
            direction: "",
            facing: "",
            status: "neutral" as any
        }));

        onChange({ vastuAnalysis: newVastu });
    }

    useEffect(() => {
        if (config.vastuAnalysis.length === 0 && config.type) {
            autoFillVastu(config.type);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.type]);

    const addMoveIn = () => {
        const m: MoveInItem = { id: Date.now().toString(), item: "", included: true }
        onChange({ moveInChecklist: [...config.moveInChecklist, m] })
    }
    const updateMoveIn = (id: string, patch: Partial<MoveInItem>) =>
        onChange({ moveInChecklist: config.moveInChecklist.map(x => x.id === id ? { ...x, ...patch } : x) })
    const removeMoveIn = (id: string) =>
        onChange({ moveInChecklist: config.moveInChecklist.filter(x => x.id !== id) })

    const addGallery = () => onChange({ galleryImages: [...(config.galleryImages || []), ""] })
    const updateGalleryImg = (i: number, v: string) => {
        const g = [...(config.galleryImages || [])]; g[i] = v; onChange({ galleryImages: g })
    }
    const removeGalleryImg = (i: number) =>
        onChange({ galleryImages: (config.galleryImages || []).filter((_, idx) => idx !== i) })

    const FURNISHING = ["unfurnished", "semi-furnished", "fully-furnished"]

    const [openIds, setOpenIds] = useState<string[]>(['unit_setup'])

    return (
        <Card className={`border-2 transition-all duration-300 ${open ? "border-[#1A3C8C] shadow-lg" : "border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:border-slate-700"}`}>
            <CardHeader className="py-3 px-4 bg-gray-50 dark:bg-slate-800/50/50 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(!open)}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${open ? "bg-[#1A3C8C] dark:bg-blue-600 text-white" : "bg-white dark:bg-slate-900 text-[#1A3C8C] dark:text-blue-400 border border-[#1A3C8C]/20"}`}>
                            {config.type.slice(0, 1)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{config.type} Variant</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                                {config.carpetArea || 0} Sq.Ft • {config.facing || "No Facing"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs font-bold text-emerald-600">₹{((config.basePrice || 0) / 100000).toFixed(1)}L</p>
                            <p className="text-[9px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">Flat Cost</p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1.5 rounded-md hover:bg-red-50 text-red-400">
                            <X className="w-4 h-4" />
                        </button>
                        {open ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-500" /> : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500" />}
                    </div>
                </div>
            </CardHeader>
            {open && (
                <CardContent className="px-4 pb-4 pt-4 [&_input[type=number]::-webkit-inner-spin-button]:appearance-none [&_input[type=number]::-webkit-outer-spin-button]:appearance-none [&_input[type=number]]:[-moz-appearance:textfield]">
                    <Tabs defaultValue="specs" className="w-full">
                        <TabsList className="grid grid-cols-3 w-full bg-gray-100 dark:bg-slate-800/50 p-1 mb-6 rounded-xl">
                            <TabsTrigger value="specs" className="text-xs rounded-lg data-[state=active]:bg-white dark:bg-slate-900 data-[state=active]:shadow-sm">Specs & Pricing</TabsTrigger>
                            <TabsTrigger value="canvas" className="text-xs rounded-lg data-[state=active]:bg-white dark:bg-slate-900 data-[state=active]:shadow-sm">Dream Canvas</TabsTrigger>
                            <TabsTrigger value="media" className="text-xs rounded-lg data-[state=active]:bg-white dark:bg-slate-900 data-[state=active]:shadow-sm">Media & Extras</TabsTrigger>
                        </TabsList>

                        <TabsContent value="specs" className="space-y-6 focus-visible:outline-none">
                            <Section id="unit_setup" title="Unit Setup & Areas" description="Primary identification and measurements" icon={Home} openIds={openIds} setOpenIds={setOpenIds}>
                                <Grid cols={3}>
                                    <Field label="Unit Type" required>
                                        <Select value={config.type} onValueChange={v => onChange({ type: v as any })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1BHK">1BHK</SelectItem>
                                                <SelectItem value="2BHK">2BHK</SelectItem>
                                                <SelectItem value="3BHK">3BHK</SelectItem>
                                                <SelectItem value="4BHK">4BHK</SelectItem>
                                                <SelectItem value="5BHK">5BHK</SelectItem>
                                                <SelectItem value="studio">Studio</SelectItem>
                                                <SelectItem value="penthouse">Penthouse</SelectItem>
                                                <SelectItem value="duplex">Duplex</SelectItem>
                                                <SelectItem value="shop">Shop / Retail</SelectItem>
                                                <SelectItem value="office">Office Space</SelectItem>
                                                <SelectItem value="showroom">Showroom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Facing">
                                        <Select value={config.facing} onValueChange={v => onChange({ facing: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {FACINGS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Carpet Area (sqft)" required><Input type="number" value={config.carpetArea ?? ""} onChange={e => {
                                        const area = Number(e.target.value)
                                        const loading = config.loadingFactor || parseFloat(globalLoadingFactor || "40") || 40
                                        const builtUp = Math.round(area * (1 + loading / 100))
                                        const price = (config.ratePerSqft || 5000) * builtUp
                                        const gst = config.gstPercentage ?? 5
                                        const stamp = config.stampDutyPercentage ?? 6
                                        const reg = config.registrationCharges ?? 30000
                                        const park = config.parkingCharges ?? 0
                                        const other = config.otherCharges ?? 0
                                        const gstAmt = price * gst / 100
                                        const stampAmt = price * stamp / 100
                                        const taxes = gstAmt + stampAmt + reg
                                        const allIn = price + taxes
                                        onChange({ 
                                            carpetArea: area, 
                                            builtUpArea: builtUp, 
                                            superBuiltUpArea: builtUp, 
                                            basePrice: price, 
                                            gstAmount: Math.round(gstAmt),
                                            stampDutyAmount: Math.round(stampAmt),
                                            totalTaxes: Math.round(taxes), 
                                            allInclusivePrice: Math.round(allIn) 
                                        })
                                    }} placeholder="850" /></Field>
                                    
                                    <Field label="Base Rate (₹/sqft)">
                                        <Input 
                                            type="number" 
                                            value={config.ratePerSqft || ""} 
                                            onChange={e => {
                                                const rate = Number(e.target.value)
                                                const flatCost = rate * config.builtUpArea
                                                const gst = config.gstPercentage ?? 5
                                                const stamp = config.stampDutyPercentage ?? 6
                                                const reg = config.registrationCharges ?? 30000
                                                const park = config.parkingCharges ?? 0
                                                const other = config.otherCharges ?? 0
                                                const gstAmt = flatCost * gst / 100
                                                const stampAmt = flatCost * stamp / 100
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flatCost + taxes
                                                onChange({ 
                                                    ratePerSqft: rate, 
                                                    basePrice: flatCost, 
                                                    gstAmount: Math.round(gstAmt),
                                                    stampDutyAmount: Math.round(stampAmt),
                                                    totalTaxes: Math.round(taxes), 
                                                    allInclusivePrice: Math.round(allIn) 
                                                })
                                            }} 
                                            placeholder="5000" 
                                        />
                                    </Field>
                                    <Field label="Flat Cost (₹)">
                                        <Input 
                                            type="number" 
                                            value={config.basePrice || ""} 
                                            onChange={e => {
                                                const price = Number(e.target.value)
                                                const gst = config.gstPercentage ?? 5
                                                const stamp = config.stampDutyPercentage ?? 6
                                                const reg = config.registrationCharges ?? 30000
                                                const park = config.parkingCharges ?? 0
                                                const other = config.otherCharges ?? 0
                                                const gstAmt = price * gst / 100
                                                const stampAmt = price * stamp / 100
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = price + taxes
                                                onChange({ 
                                                    basePrice: price, 
                                                    ratePerSqft: config.builtUpArea > 0 ? Math.round(price / config.builtUpArea) : 0, 
                                                    gstAmount: Math.round(gstAmt),
                                                    stampDutyAmount: Math.round(stampAmt),
                                                    totalTaxes: Math.round(taxes), 
                                                    allInclusivePrice: Math.round(allIn) 
                                                })
                                            }} 
                                            placeholder="5000000" 
                                        />
                                    </Field>

                                    <Field label="Built-Up Area" hint="Total slab area"><Input type="number" value={config.builtUpArea ?? ""} onChange={e => onChange({ builtUpArea: Number(e.target.value) })} placeholder="1020" /></Field>
                                    <Field label="Loading Factor %"><Input type="number" value={config.loadingFactor ?? ""} onChange={e => {
                                        const loading = Number(e.target.value) || parseFloat(globalLoadingFactor || "40") || 40
                                        const builtUp = Math.round(config.carpetArea * (1 + loading / 100))
                                        const price = (config.ratePerSqft || 5000) * builtUp
                                        const gst = config.gstPercentage ?? 5
                                        const stamp = config.stampDutyPercentage ?? 6
                                        const reg = config.registrationCharges ?? 30000
                                        const park = config.parkingCharges ?? 0
                                        const other = config.otherCharges ?? 0
                                        const gstAmt = price * gst / 100
                                        const stampAmt = price * stamp / 100
                                        const taxes = gstAmt + stampAmt + reg
                                        const allIn = price + taxes
                                        onChange({ 
                                            loadingFactor: loading, 
                                            builtUpArea: builtUp, 
                                            superBuiltUpArea: builtUp, 
                                            basePrice: price, 
                                            gstAmount: Math.round(gstAmt),
                                            stampDutyAmount: Math.round(stampAmt),
                                            totalTaxes: Math.round(taxes), 
                                            allInclusivePrice: Math.round(allIn) 
                                        })
                                    }} placeholder="40" /></Field>

                                    <Field label="All Inclusive Price (₹)">
                                        <Input 
                                            type="number" 
                                            value={config.allInclusivePrice || ""} 
                                            onChange={e => {
                                                const allIn = Number(e.target.value)
                                                const flat = config.basePrice || 0
                                                const taxes = allIn - flat
                                                onChange({ allInclusivePrice: allIn, totalTaxes: Math.round(taxes) })
                                            }} 
                                            placeholder="5500000" 
                                        />
                                    </Field>

                                    <Field label="GST (%)">
                                        <Input 
                                            type="number" 
                                            value={config.gstPercentage ?? ""} 
                                            onChange={e => {
                                                const gst = Number(e.target.value)
                                                const flat = config.basePrice || 0
                                                const gstAmt = (flat * gst / 100)
                                                const stamp = config.stampDutyPercentage ?? 7
                                                const stampAmt = (flat * stamp / 100)
                                                const reg = config.registrationCharges ?? 30000
                                                const park = config.parkingCharges ?? 0
                                                const other = config.otherCharges ?? 0
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes
                                                onChange({ 
                                                    gstPercentage: gst, 
                                                    gstAmount: Math.round(gstAmt), 
                                                    stampDutyAmount: Math.round(stampAmt),
                                                    totalTaxes: Math.round(taxes), 
                                                    allInclusivePrice: Math.round(allIn) 
                                                })
                                            }} 
                                            placeholder="5" 
                                        />
                                    </Field>
                                    <Field label="GST Amount (₹)" hint="GST % of Flat Cost">
                                        <Input 
                                            type="number" 
                                            value={config.gstAmount ?? ""} 
                                            onChange={e => {
                                                const gstAmt = Number(e.target.value)
                                                const flat = config.basePrice || 0
                                                const gst = flat > 0 ? (gstAmt / flat) * 100 : 0
                                                const stampAmt = config.stampDutyAmount || 0
                                                const reg = config.registrationCharges || 0
                                                const park = config.parkingCharges || 0
                                                const other = config.otherCharges || 0
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes
                                                onChange({ gstPercentage: Number(gst.toFixed(2)), gstAmount: gstAmt, totalTaxes: Math.round(taxes), allInclusivePrice: Math.round(allIn) })
                                            }} 
                                            placeholder="250000" 
                                        />
                                    </Field>

                                    <Field label="Stamp Duty (%)">
                                        <Input 
                                            type="number" 
                                            value={config.stampDutyPercentage ?? ""} 
                                            onChange={e => {
                                                const stamp = Number(e.target.value)
                                                const flat = config.basePrice || 0
                                                const gst = config.gstPercentage ?? 5
                                                const gstAmt = (flat * gst / 100)
                                                const stampAmt = (flat * stamp / 100)
                                                const reg = config.registrationCharges ?? 30000
                                                const park = config.parkingCharges ?? 0
                                                const other = config.otherCharges ?? 0
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes
                                                onChange({ 
                                                    stampDutyPercentage: stamp, 
                                                    gstAmount: Math.round(gstAmt),
                                                    stampDutyAmount: Math.round(stampAmt), 
                                                    totalTaxes: Math.round(taxes), 
                                                    allInclusivePrice: Math.round(allIn) 
                                                })
                                            }} 
                                            placeholder="5" 
                                        />
                                    </Field>
                                    <Field label="Stamp Duty Amount (₹)" hint="Stamp Duty % of Flat Cost">
                                        <Input 
                                            type="number" 
                                            value={config.stampDutyAmount ?? ""} 
                                            onChange={e => {
                                                const stampAmt = Number(e.target.value)
                                                const flat = config.basePrice || 0
                                                const stamp = flat > 0 ? (stampAmt / flat) * 100 : 0
                                                const gstAmt = config.gstAmount || 0
                                                const reg = config.registrationCharges || 0
                                                const park = config.parkingCharges || 0
                                                const other = config.otherCharges || 0
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes
                                                onChange({ stampDutyPercentage: Number(stamp.toFixed(2)), stampDutyAmount: stampAmt, totalTaxes: Math.round(taxes), allInclusivePrice: Math.round(allIn) })
                                            }} 
                                            placeholder="350000" 
                                        />
                                    </Field>
                                    <Field label="All Taxes (₹)">
                                        <Input 
                                            type="number" 
                                            value={config.totalTaxes || ""} 
                                            onChange={e => {
                                                const taxes = Number(e.target.value)
                                                const flat = config.basePrice || 0
                                                const allIn = flat + taxes
                                                onChange({ totalTaxes: taxes, allInclusivePrice: Math.round(allIn) })
                                            }} 
                                            placeholder="250000" 
                                        />
                                    </Field>
                                    <Field label="Registration (₹)">
                                        <Input 
                                            type="number" 
                                            value={config.registrationCharges ?? ""} 
                                            onChange={e => {
                                                const reg = Number(e.target.value)
                                                const flat = config.basePrice || 0
                                                const gst = config.gstPercentage ?? 5
                                                const stamp = config.stampDutyPercentage ?? 7
                                                const gstAmt = (flat * gst / 100)
                                                const stampAmt = (flat * stamp / 100)
                                                const park = config.parkingCharges ?? 0
                                                const other = config.otherCharges ?? 0
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes
                                                onChange({ 
                                                    registrationCharges: reg, 
                                                    gstAmount: Math.round(gstAmt),
                                                    stampDutyAmount: Math.round(stampAmt),
                                                    totalTaxes: Math.round(taxes), 
                                                    allInclusivePrice: Math.round(allIn) 
                                                })
                                            }} 
                                            placeholder="30000" 
                                        />
                                    </Field>
                                    <Field label="Parking (₹)">
                                        <Input 
                                            type="number" 
                                            value={config.parkingCharges ?? ""} 
                                            onChange={e => {
                                                const park = Number(e.target.value)
                                                const flat = config.basePrice || 0
                                                const gst = config.gstPercentage ?? 5
                                                const stamp = config.stampDutyPercentage ?? 7
                                                const gstAmt = (flat * gst / 100)
                                                const stampAmt = (flat * stamp / 100)
                                                const reg = config.registrationCharges ?? 30000
                                                const other = config.otherCharges ?? 0
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes
                                                onChange({ 
                                                    parkingCharges: park, 
                                                    gstAmount: Math.round(gstAmt),
                                                    stampDutyAmount: Math.round(stampAmt),
                                                    totalTaxes: Math.round(taxes), 
                                                    allInclusivePrice: Math.round(allIn) 
                                                })
                                            }} 
                                            placeholder="500000" 
                                        />
                                    </Field>
                                    <Field label="Other Charges (₹)">
                                        <Input 
                                            type="number" 
                                            value={config.otherCharges ?? ""} 
                                            onChange={e => {
                                                const other = Number(e.target.value)
                                                const flat = config.basePrice || 0
                                                const gst = config.gstPercentage ?? 5
                                                const stamp = config.stampDutyPercentage ?? 7
                                                const gstAmt = (flat * gst / 100)
                                                const stampAmt = (flat * stamp / 100)
                                                const reg = config.registrationCharges ?? 30000
                                                const park = config.parkingCharges ?? 0
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes
                                                onChange({ 
                                                    otherCharges: other, 
                                                    gstAmount: Math.round(gstAmt),
                                                    stampDutyAmount: Math.round(stampAmt),
                                                    totalTaxes: Math.round(taxes), 
                                                    allInclusivePrice: Math.round(allIn) 
                                                })
                                            }} 
                                            placeholder="100000" 
                                        />
                                    </Field>
                                </Grid>
                            </Section>

                            {["shop", "office", "showroom"].includes(config.type) && (
                                <Section id="comm_areas" title="Commercial Specs" description="Frontage and depth details" icon={Building2} openIds={openIds} setOpenIds={setOpenIds}>
                                    <Grid cols={3}>
                                        <Field label="Frontage" hint="Entrance width"><Input value={config.frontage || ""} onChange={e => onChange({ frontage: e.target.value })} placeholder="15 Ft" /></Field>
                                        <Field label="Depth"><Input value={config.depth || ""} onChange={e => onChange({ depth: e.target.value })} placeholder="40 Ft" /></Field>
                                        <Field label="Mezzanine Area"><Input value={config.mezzanineArea || ""} onChange={e => onChange({ mezzanineArea: e.target.value })} placeholder="200 Sqft" /></Field>
                                    </Grid>
                                </Section>
                            )}

                            {config.type === "penthouse" && (
                                <Section id="pent_areas" title="Penthouse Specs" description="Terrace details" icon={Sparkles} openIds={openIds} setOpenIds={setOpenIds}>
                                    <Grid cols={3}>
                                        <Field label="Private Terrace Area (Sqft)"><Input type="number" value={config.privateTerraceArea || ""} onChange={e => onChange({ privateTerraceArea: Number(e.target.value) })} placeholder="500" /></Field>
                                    </Grid>
                                </Section>
                            )}



                            {!["shop", "office", "showroom", "studio"].includes(config.type) && (
                                <Section id="spatial_interiors" title="Standard Interiors & Spaces" description="Rooms, aesthetics, and finishes" icon={Grid3X3} openIds={openIds} setOpenIds={setOpenIds}>
                                    <Grid cols={3}>
                                        <Field label="Bathrooms"><Input type="number" value={config.bathroomCount || ''} onChange={e => onChange({ bathroomCount: Number(e.target.value) })} placeholder="2" /></Field>
                                        <Field label="Balconies"><Input type="number" value={config.balconyCount || ''} onChange={e => onChange({ balconyCount: Number(e.target.value) })} placeholder="2" /></Field>
                                        <Field label="View Type">
                                            <Select value={config.viewType} onValueChange={v => onChange({ viewType: v })}>
                                                <SelectTrigger><SelectValue placeholder="Select view" /></SelectTrigger>
                                                <SelectContent>
                                                    {VIEW_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </Grid>

                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-gray-700 dark:text-slate-300 uppercase mb-3">Bonus Add-on Rooms</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[
                                                { key: "servantRoom", label: "Servant" },
                                                { key: "studyRoom", label: "Study" },
                                                { key: "poojaRoom", label: "Pooja" },
                                                { key: "dryBalcony", label: "Dry Balcony" },
                                            ].map(({ key, label }) => {
                                                const isSelected = config[key as keyof UnitConfiguration] as boolean
                                                return (
                                                    <div
                                                        key={key}
                                                        onClick={() => onChange({ [key]: !isSelected } as any)}
                                                        className={`flex items-center px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:bg-slate-800/50'}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white dark:bg-slate-900'}`}>
                                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-indigo-700' : 'text-gray-600 dark:text-slate-400 dark:text-slate-400'}`}>{label}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </Section>
                            )}
                        </TabsContent>

                        <TabsContent value="canvas" className="space-y-6 focus-visible:outline-none">
                            <Section id="about" title="About Variant" description="Short tagline or description for 'Your Dream Canvas'" icon={Info} openIds={openIds} setOpenIds={setOpenIds}>
                                <div className="space-y-4">
                                    <Field label="Tagline / Short Title">
                                        <Input
                                            value={config.tagline ?? ""}
                                            onChange={e => onChange({ tagline: e.target.value })}
                                            placeholder="e.g. The Pinnacle of Luxury"
                                            className="bg-white dark:bg-slate-900"
                                        />
                                    </Field>
                                    <Field label="Description">
                                        <Textarea
                                            value={config.description ?? ""}
                                            onChange={e => onChange({ description: e.target.value })}
                                            placeholder="Describe the unique selling point of this unit (e.g. Spacious 3 BHK with double height balcony)..."
                                            className="min-h-[80px] bg-white dark:bg-slate-900 resize-none"
                                        />
                                    </Field>
                                </div>
                            </Section>

                            <Section id="dimensions" title="Room Dimensions Layout" description="Individual room lengths" icon={Ruler} openIds={openIds} setOpenIds={setOpenIds}>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Add Dimensions</p>
                                    <Button variant="ghost" size="sm" onClick={addRoom} className="h-7 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50">+ Add Room</Button>
                                </div>
                                <div className="space-y-2">
                                    {(config.roomDimensions || []).map(room => (
                                        <div key={room.id} className="grid grid-cols-4 gap-2 bg-gray-50 dark:bg-slate-800/50/50 p-2 rounded-xl group/room">
                                            <Input value={room.roomName ?? ""} onChange={e => updateRoom(room.id, { roomName: e.target.value })} placeholder="Room Name" className="h-8 text-[11px] bg-white dark:bg-slate-900 border-0 shadow-sm" />
                                            <Input value={room.length ?? ""} onChange={e => updateRoom(room.id, { length: e.target.value })} placeholder="Len" className="h-8 text-[11px] bg-white dark:bg-slate-900 border-0 shadow-sm text-center" />
                                            <Input value={room.width ?? ""} onChange={e => updateRoom(room.id, { width: e.target.value })} placeholder="Wid" className="h-8 text-[11px] bg-white dark:bg-slate-900 border-0 shadow-sm text-center" />
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">FT</span>
                                                <Button variant="ghost" size="sm" onClick={() => removeRoom(room.id)} className="h-6 w-6 p-0 text-red-300 hover:text-red-500 hover:bg-red-50 ml-auto opacity-0 group-hover/room:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                    {(config.roomDimensions || []).length === 0 && <p className="text-[10px] text-gray-400 dark:text-slate-500 italic py-2 text-center">No dimensions added yet.</p>}
                                </div>
                            </Section>

                            <Section id="vastu" title="Vastu Compliance & Scoring" description="Deep analysis of spatial energies and floorplan harmony" icon={Star} openIds={openIds} setOpenIds={setOpenIds}>
                                {(() => {
                                    // Calculate Overall Score out of 10
                                    let totalEarned = 0;
                                    let totalPossible = 0;
                                    (config.vastuAnalysis || []).forEach(v => {
                                        if (v.direction && v.direction !== "N/A") {
                                            totalPossible += 1.0;
                                            totalEarned += getVastuDetails(v.element, v.direction, v.facing).score;
                                        }
                                    });
                                    const rawScore = totalPossible > 0 ? (totalEarned / totalPossible) * 10 : 0;
                                    const overallScore = rawScore.toFixed(1);

                                    const getScoreColor = (score: number) => {
                                        if (score >= 8.5) return "text-emerald-500 bg-emerald-50 border-emerald-200"
                                        if (score >= 6.0) return "text-blue-500 bg-blue-50 border-blue-200"
                                        if (score >= 4.0) return "text-amber-500 bg-amber-50 border-amber-200"
                                        return "text-red-500 bg-red-50 border-red-200"
                                    }
                                    const scoreColorClass = getScoreColor(Number(overallScore))
                                    const scoreLabel = Number(overallScore) >= 8.5 ? "Highly Compliant" : Number(overallScore) >= 6.0 ? "Good Compliance" : Number(overallScore) >= 4.0 ? "Average / Needs Remedies" : "Major Vastu Dosha";

                                    return (
                                        <>
                                            {/* Top Scoring Header */}
                                            <div className="flex items-center justify-between mb-6 p-4 rounded-xl border bg-gray-50 dark:bg-slate-800/50">
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Overall Vastu Rating</h4>
                                                    <p className="text-[11px] text-gray-500 dark:text-slate-400 max-w-sm">Evaluated based on standard directional sciences for {(config.vastuAnalysis || []).length} plotted zones.</p>
                                                    {totalPossible > 0 && <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${scoreColorClass}`}>{scoreLabel}</span>}
                                                </div>
                                                <div className="text-right">
                                                    {totalPossible > 0 ? (
                                                        <div className="flex items-baseline gap-1">
                                                            <span className={`text-4xl font-extrabold tracking-tighter ${scoreColorClass.split(' ')[0]}`}>{overallScore}</span>
                                                            <span className="text-sm font-bold text-gray-400 dark:text-slate-500">/10</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xl font-bold text-gray-300">N/A</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-slate-800 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Spatial Mappings (Auto-curated for {config.type})</p>
                                                    {(config.vastuAnalysis || []).length > 0 && (
                                                        <Button variant="outline" size="sm" onClick={() => { if (confirm("Are you sure you want to reset Vastu elements to default for " + config.type + "? All current Vastu data will be lost.")) autoFillVastu(config.type); }} className="h-6 px-2 text-[9px] bg-emerald-50 text-emerald-600 border-emerald-200">
                                                            Reset / Auto-Fill ({config.type})
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Column Headings */}
                                            {(config.vastuAnalysis || []).length > 0 && (
                                                <div className="flex gap-2 items-center px-[14px] mb-1 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                                                    <div className="flex-1 pl-3">Vastu Element</div>
                                                    <div className="w-32 pl-3">Location</div>
                                                    <div className="w-32 pl-3">Facing (Opt.)</div>
                                                    <div className="w-24 text-center">Status</div>
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                {(config.vastuAnalysis || []).map(v => {
                                                    const details = getVastuDetails(v.element, v.direction, v.facing)

                                                    return (
                                                        <div key={v.id} className="relative flex flex-col gap-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-sm group/vastu hover:border-emerald-200 transition-colors">
                                                            <div className="flex gap-2 items-center">
                                                                <div className="h-8 flex-1 bg-gray-50 dark:bg-slate-800/50 flex items-center px-3 rounded-md border-0 text-[11px] font-semibold text-gray-700 dark:text-slate-300 shadow-sm truncate">
                                                                    {v.element}
                                                                </div>

                                                                <Select value={v.direction} onValueChange={val => updateVastu(v.id, { direction: val, status: getVastuDetails(v.element, val, v.facing).status as any })}>
                                                                    <SelectTrigger className="h-8 text-[11px] w-32 bg-gray-50 dark:bg-slate-800/50 border-0 shadow-sm"><SelectValue placeholder="Location" /></SelectTrigger>
                                                                    <SelectContent className="bg-white dark:bg-slate-900">
                                                                        <SelectItem value="N/A" className="text-gray-400 dark:text-slate-500 font-bold text-[11px]">Not Available (N/A)</SelectItem>
                                                                        {["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West", "Center"].map(dir => (
                                                                            <SelectItem key={dir} value={dir} className="text-[11px]">{dir}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>

                                                                <Select value={v.facing || "none"} onValueChange={val => updateVastu(v.id, { facing: val, status: getVastuDetails(v.element, v.direction, val).status as any })}>
                                                                    <SelectTrigger className="h-8 text-[11px] w-32 bg-gray-50 dark:bg-slate-800/50 border-0 shadow-sm"><SelectValue placeholder="Facing (Opt.)" /></SelectTrigger>
                                                                    <SelectContent className="bg-white dark:bg-slate-900">
                                                                        <SelectItem value="none" className="text-gray-400 dark:text-slate-500 text-[11px]">N/A</SelectItem>
                                                                        {["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"].map(dir => (
                                                                            <SelectItem key={dir} value={dir} className="text-[11px]">{dir}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>

                                                                <div className={`h-8 px-3 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-widest w-24 shrink-0 shadow-sm border border-transparent
                                                                    ${details.status === 'excellent' ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200/50' :
                                                                        details.status === 'good' ? 'bg-blue-100/50 text-blue-700' :
                                                                            details.status === 'avoid' ? 'bg-red-100/50 text-red-700' :
                                                                                'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}
                                                                >
                                                                    {details.status}
                                                                </div>
                                                            </div>

                                                            {/* AI Vastu Recommendation / Note */}
                                                            {(v.element && v.direction) && (
                                                                <div className="pl-1 pt-1.5 flex items-start gap-2">
                                                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${details.status === 'excellent' ? 'bg-emerald-400' : details.status === 'good' ? 'bg-blue-400' : details.status === 'avoid' ? 'bg-red-400' : 'bg-gray-300'}`} />
                                                                    <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed italic">{details.note}</p>
                                                                </div>
                                                            )}

                                                            <Button variant="ghost" size="sm" onClick={() => removeVastu(v.id)} className="absolute top-2 right-2 h-7 w-7 p-0 text-red-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/vastu:opacity-100 transition-opacity bg-white dark:bg-slate-900/80 backdrop-blur"><Trash2 className="w-3.5 h-3.5" /></Button>
                                                        </div>
                                                    )
                                                })}
                                                {(config.vastuAnalysis || []).length === 0 && (
                                                    <div className="border border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl p-6 text-center">
                                                        <Star className="w-6 h-6 text-emerald-300 mx-auto mb-2" />
                                                        <p className="text-xs font-semibold text-emerald-800">No Vastu Mapping Provided</p>
                                                        <p className="text-[11px] text-emerald-600/80 mt-1 max-w-xs mx-auto">Add key zones like Main Entrance, Kitchen, and Master Bedroom to generate the Vastu Score.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )
                                })()}
                            </Section>
                        </TabsContent>

                        <TabsContent value="media" className="space-y-6 focus-visible:outline-none">
                            <Section id="checklist" title="Move-in Provisions" description="Furnishing included list" icon={CheckCircle} openIds={openIds} setOpenIds={setOpenIds}>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Included Objects</p>
                                    <Button variant="ghost" size="sm" onClick={addMoveIn} className="h-7 text-[10px] font-bold text-amber-600 hover:bg-amber-50">+ Add Item</Button>
                                </div>
                                <div className="space-y-2">
                                    {(config.moveInChecklist || []).map(m => (
                                        <div key={m.id} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/50/50 p-2 rounded-xl group/check">
                                            <Switch
                                                checked={m.included}
                                                onCheckedChange={v => updateMoveIn(m.id, { included: v })}
                                            />
                                            <Input value={m.item ?? ""} onChange={e => updateMoveIn(m.id, { item: e.target.value })} placeholder="Modular Kitchen" className="h-8 text-[11px] bg-white dark:bg-slate-900 border-0 shadow-sm flex-1" />
                                            <Button variant="ghost" size="sm" onClick={() => removeMoveIn(m.id)} className="h-8 w-8 p-0 text-red-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/check:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    ))}
                                    {(config.moveInChecklist || []).length === 0 && <p className="text-[10px] text-gray-400 dark:text-slate-500 italic py-2 text-center">No provisions added.</p>}
                                </div>
                            </Section>

                            <Section id="media_core" title="Core Visual Assets" description="Banners and layout images" icon={FileText} openIds={openIds} setOpenIds={setOpenIds}>
                                <Grid cols={2}>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 tracking-wider">Hero Showcase Image</label>
                                        <AboutImageUpload 
                                            value={config.heroImage || ''} 
                                            onChange={url => onChange({ heroImage: url })} 
                                            title="Upload Hero Image" 
                                            description="Best main photo for the banner" 
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 tracking-wider">2D Layout Image</label>
                                        <AboutImageUpload 
                                            value={config.floorPlanImage2D || ''} 
                                            onChange={url => onChange({ floorPlanImage2D: url })} 
                                            title="Upload 2D Plan" 
                                            description="High quality 2D floor plan layout" 
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 tracking-wider">3D Layout Image</label>
                                        <AboutImageUpload 
                                            value={config.floorPlanImage3D || ''} 
                                            onChange={url => onChange({ floorPlanImage3D: url })} 
                                            title="Upload 3D Plan" 
                                            description="Isometric 3D layout view" 
                                        />
                                    </div>
                                </Grid>
                            </Section>

                            <Section id="media_gallery" title="Interior Gallery" description="Multi-shot room views" icon={LayoutGrid} openIds={openIds} setOpenIds={setOpenIds}>
                                <div className="mt-4">
                                    <GalleryUpload
                                        images={config.galleryImages || []}
                                        onChange={urls => onChange({ galleryImages: urls })}
                                        max={20}
                                    />
                                </div>
                            </Section>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            )}
        </Card>
    )
}

// ─────────────────────────────────────────
// BHK CONSTANTS
// ─────────────────────────────────────────
const BHK_OPTIONS: UnitConfiguration["type"][] = ["1BHK", "2BHK", "3BHK", "4BHK", "5BHK", "studio", "penthouse", "duplex", "shop", "office", "showroom"]

// ─────────────────────────────────────────
// MAIN FORM
// ─────────────────────────────────────────
export function UnitFlowForm({
    data, onChange, towerName, projectName, townshipName,
    totalFloors, unitsPerFloor
}: UnitFlowFormProps) {
    const [activeTab, setActiveTab] = useState("pricing")
    const [openIds, setOpenIds] = useState<string[]>(["legal-status", "pricing-rules", "default-specs"])
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false)
    const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])
    const [collapsedConfigGroups, setCollapsedConfigGroups] = useState<string[]>([])

    const updateData = (patch: Partial<UnitTemplate>) => {
        const newData = { ...data, ...patch }
        
        // Cascade global pricing changes to all units
        const pricingFields = [
            'baseRatePerSqft', 
            'parkingCharges', 
            'gstPercentage', 
            'stampDutyPercentage', 
            'registrationCharges', 
            'loadingFactor',
            'maintenancePerSqft',
            'maintenanceType',
            'otherChargesAmount',
            'otherChargesType',
            'defaultFlooringType',
            'defaultWallFinish',
            'defaultCeilingHeight',
            'defaultFurnishingStatus'
        ]
        const hasPricingChange = pricingFields.some(field => field in patch)
        
        if (hasPricingChange && newData.configurations) {
            newData.configurations = newData.configurations.map(config => {
                const loading = parseFloat(newData.loadingFactor || "40") || 40
                const builtUp = Math.round(config.carpetArea * (1 + loading / 100))
                const rate = parseFloat(newData.baseRatePerSqft || "0")
                const basePrice = Math.round(rate * builtUp)
                
                const gst = parseFloat(newData.gstPercentage || "5")
                const stamp = parseFloat(newData.stampDutyPercentage || "7")
                const reg = parseFloat(newData.registrationCharges || "30000")
                
                const gstAmt = Math.round(basePrice * gst / 100)
                const stampAmt = Math.round(basePrice * stamp / 100)
                const taxes = gstAmt + stampAmt + reg
                const allInclusive = basePrice + taxes
                
                return {
                    ...config,
                    loadingFactor: loading,
                    builtUpArea: builtUp,
                    superBuiltUpArea: builtUp,
                    ratePerSqft: rate,
                    basePrice: basePrice,
                    parkingCharges: parseFloat(newData.parkingCharges || "0"),
                    gstPercentage: gst,
                    gstAmount: gstAmt,
                    stampDutyPercentage: stamp,
                    stampDutyAmount: stampAmt,
                    registrationCharges: reg,
                    totalTaxes: taxes,
                    allInclusivePrice: allInclusive,
                    maintenancePerSqft: parseFloat(newData.maintenancePerSqft || "0"),
                    maintenanceType: newData.maintenanceType || "monthly",
                    otherCharges: newData.otherChargesType === "rs" 
                        ? parseFloat(newData.otherChargesAmount || "0")
                        : newData.otherChargesType === "stamp_duty_percentage"
                            ? Math.round(basePrice * (parseFloat(newData.otherChargesAmount || "0") / 100))
                            : 0,
                    flooringType: newData.defaultFlooringType || config.flooringType,
                    wallFinish: newData.defaultWallFinish || config.wallFinish,
                    ceilingHeight: newData.defaultCeilingHeight || config.ceilingHeight,
                    furnishingStatus: newData.defaultFurnishingStatus || config.furnishingStatus
                }
            })
        }
        
        onChange(newData)
    }

    const toggleGroupCollapse = (id: string) => {
        setCollapsedGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const toggleConfigGroupCollapse = (id: string) => {
        setCollapsedConfigGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    // --- CONFIG HELPERS ---
    const addConfig = (type?: UnitConfiguration["type"], initialArea?: number) => {
        const id = uuidv4()
        const targetType = type || "2BHK"
        const newConfig: UnitConfiguration = {
            id,
            type: targetType,
            carpetArea: initialArea || 850,
            builtUpArea: Math.round((initialArea || 850) * (1 + (parseFloat(data.loadingFactor) || 40) / 100)),
            superBuiltUpArea: Math.round((initialArea || 850) * (1 + (parseFloat(data.loadingFactor) || 40) / 100)),
            loadingFactor: parseFloat(data.loadingFactor) || 40,
            basePrice: 5000000,
            ratePerSqft: 0,
            parkingCharges: 500000,
            gstPercentage: 5,
            stampDutyPercentage: 7,
            registrationCharges: 30000,
            maintenancePerSqft: 3.5,
            maintenanceType: "monthly",
            otherCharges: 0,
            facingPremiums: { north: "0", south: "0", east: "0", west: "0", "north-east": "0", "north-west": "0", "south-east": "0", "south-west": "0" },
            facing: "East",
            balconyCount: 1,
            bathroomCount: 2,
            servantRoom: false,
            studyRoom: false,
            poojaRoom: false,
            dryBalcony: true,
            flooringType: data.defaultFlooringType || "",
            wallFinish: data.defaultWallFinish || "",
            ceilingHeight: data.defaultCeilingHeight || "10.5 Ft",
            furnishingStatus: data.defaultFurnishingStatus || "unfurnished",
            viewType: "City View",
            roomDimensions: defaultRoomDimensions.map(r => ({ ...r, id: Math.random().toString(36).substring(7) })),
            vastuAnalysis: defaultVastu.map(v => ({ ...v, id: Math.random().toString(36).substring(7) })),
            moveInChecklist: [],
            floorPlanImage2D: "",
            countPerFloor: 1
        }
        updateData({ configurations: [...(data.configurations || []), newConfig] })
    }

    const updateConfig = (id: string, patch: Partial<UnitConfiguration>) => {
        updateData({ configurations: (data.configurations || []).map(c => c.id === id ? { ...c, ...patch } : c) })
    }

    const removeConfig = (id: string) => {
        updateData({ configurations: (data.configurations || []).filter(c => c.id !== id) })
    }

    // --- INVENTORY HELPERS ---
    const parseFloorRange = (range: string): number[] => {
        if (!range) return []
        const floors: number[] = []
        const parseValue = (v: string) => {
            const clean = v.trim().toUpperCase()
            if (clean === 'G' || clean === '0') return 0
            if (clean.startsWith('B')) return -parseInt(clean.replace('B', ''))
            return parseInt(clean)
        }

        range.split(',').forEach(part => {
            const p = part.trim()
            if (p.includes('-')) {
                const [startStr, endStr] = p.split('-')
                const start = parseValue(startStr)
                const end = parseValue(endStr)
                const min = Math.min(start, end)
                const max = Math.max(start, end)
                for (let i = min; i <= max; i++) if (!isNaN(i)) floors.push(i)
            } else {
                const val = parseValue(p)
                if (!isNaN(val)) floors.push(val)
            }
        })
        return Array.from(new Set(floors)).sort((a, b) => a - b)
    }

    const addGroup = () => {
        setIsAddGroupModalOpen(true)
    }

    const confirmAddGroup = (config: {
        floorRange: string,
        groupTypes: FloorGroup["groupTypes"],
        name: string,
        unitsPerFloor: number,
        initialConfigId?: string,
        floorRise?: number,
        cloneFromGroupId?: string,
        floorPlanUrl?: string
    }) => {
        const id = uuidv4()
        const slotsCount = config.unitsPerFloor
        const floors = parseFloorRange(config.floorRange)

        let layout: UnitLayoutSlot[] = []
        let newConfigs = [...(data.configurations || [])]

        if (config.cloneFromGroupId && config.cloneFromGroupId !== "none") {
            const cloneGroup = (data.floorGroups || []).find(g => g.id === config.cloneFromGroupId)
            if (cloneGroup && cloneGroup.layout) {
                layout = cloneGroup.layout.map((slot, i) => {
                    const originalConfig = (data.configurations || []).find(c => c.id === slot.configId);
                    const newConfigId = `config-${uuidv4()}`;

                    if (originalConfig) {
                        newConfigs.push({
                            ...originalConfig,
                            id: newConfigId
                        });
                    }

                    return {
                        ...slot,
                        id: `slot-${id}-${i}-${uuidv4()}`, // Generate new unique ID for the slot
                        configId: originalConfig ? newConfigId : slot.configId
                    };
                })
            }
        }

        if (layout.length === 0) {
            // Initialize as empty array - user will add units manually
            layout = []
        }

        const newGroup: FloorGroup = {
            id,
            name: config.name || "New Floor Group",
            floorRange: config.floorRange,
            groupTypes: config.groupTypes,
            floors,
            layout,
            floorRise: config.floorRise,
            floorPlanUrl: config.floorPlanUrl
        }
        updateData({
            floorGroups: [...(data.floorGroups || []), newGroup],
            configurations: newConfigs
        })
        setIsAddGroupModalOpen(false)
    }

    const copyDataFromGroup = (sourceGroupId: string, targetGroupId: string) => {
        const sourceGroup = (data.floorGroups || []).find(g => g.id === sourceGroupId);
        const targetGroup = (data.floorGroups || []).find(g => g.id === targetGroupId);
        if (!sourceGroup || !targetGroup) return;

        const newConfigs = [...(data.configurations || [])];
        const newFloorGroups = [...(data.floorGroups || [])];
        const targetGroupIndex = newFloorGroups.findIndex(g => g.id === targetGroupId);
        let updated = false;

        // Clone the whole layout mapping to decouple completely
        const newLayout = [...(targetGroup.layout || [])]

        // Iterate by index to handle identical (dito) layouts perfectly even if slot numbers differ
        newLayout.forEach((targetSlot, index) => {
            const sourceSlot = (sourceGroup.layout || [])[index];
            if (!sourceSlot) return;

            const sourceConfig = (data.configurations || []).find(c => c.id === sourceSlot.configId);

            if (sourceConfig) {
                // IMPORTANT: Generate a brand new isolated ID so they never share memory
                const freshIsolatedId = `config-${targetGroup.id}-${targetSlot.slotNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

                // Keep the target slot's overridden metadata like type if any, but grab all pricing/areas from source
                const newIsolatedConfig = {
                    ...sourceConfig,
                    id: freshIsolatedId
                };

                newConfigs.push(newIsolatedConfig);

                // Tell the slot to point to this shiny new instance
                newLayout[index] = { ...targetSlot, configId: freshIsolatedId, carpetAreaOverride: undefined, unitTypeOverride: undefined };
                updated = true;
            }
        });

        if (updated) {
            newFloorGroups[targetGroupIndex] = { ...targetGroup, layout: newLayout };
            updateData({ configurations: newConfigs, floorGroups: newFloorGroups });
        }
    }

    const updateGroup = (id: string, patch: Partial<FloorGroup>) => {
        updateData({ floorGroups: (data.floorGroups || []).map(g => g.id === id ? { ...g, ...patch } : g) })
    }

    const removeGroup = (id: string) => {
        updateData({ floorGroups: (data.floorGroups || []).filter(g => g.id !== id) })
    }


    return (
        <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full h-14 bg-gray-100 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-8">
                    <TabsTrigger value="pricing" className="rounded-xl data-[state=active]:bg-white dark:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-[#1A3C8C] dark:text-blue-400 gap-2">
                        <Settings2 className="w-4 h-4" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] uppercase font-black opacity-50">Section 1</span>
                            <span className="text-xs font-bold">Global Standards</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="rounded-xl data-[state=active]:bg-white dark:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-[#1A3C8C] dark:text-blue-400 gap-2">
                        <Grid3X3 className="w-4 h-4" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] uppercase font-black opacity-50">Section 2</span>
                            <span className="text-xs font-bold">Tower Skeleton</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="configs" className="rounded-xl data-[state=active]:bg-white dark:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-[#1A3C8C] dark:text-blue-400 gap-2">
                        <Layout className="w-4 h-4" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] uppercase font-black opacity-50">Section 3</span>
                            <span className="text-xs font-bold">Group Blueprints</span>
                        </div>
                    </TabsTrigger>
                </TabsList>

                {/* ── PART A: GLOBAL STANDARDS ── */}
                <TabsContent value="pricing" className="space-y-16 focus-visible:outline-none">
                    <Section id="pricing-rules" title="Pricing & Tax Logic" description="Global rules inherited by all units in this tower" icon={DollarSign} openIds={openIds} setOpenIds={setOpenIds}>
                        <Grid cols={3}>
                            <Field label="Base Rate (₹/sqft)"><Input type="number" value={data.baseRatePerSqft ?? ""} onChange={e => updateData({ baseRatePerSqft: e.target.value })} placeholder="5500" /></Field>
                            <Field label="Parking Charges (₹)"><Input type="number" value={data.parkingCharges ?? ""} onChange={e => updateData({ parkingCharges: e.target.value })} placeholder="500000" /></Field>
                            <Field label="GST (%)"><Input type="number" value={data.gstPercentage ?? ""} onChange={e => updateData({ gstPercentage: e.target.value })} placeholder="5" /></Field>
                            <Field label="Stamp Duty (%)"><Input type="number" value={data.stampDutyPercentage ?? ""} onChange={e => updateData({ stampDutyPercentage: e.target.value })} placeholder="7" /></Field>
                            <Field label="Registration (₹)"><Input type="number" value={data.registrationCharges ?? ""} onChange={e => updateData({ registrationCharges: e.target.value })} placeholder="30000" /></Field>
                            <Field label="Maintenance (₹/sqft)">
                                <div className="flex gap-2">
                                    <Input type="number" value={data.maintenancePerSqft ?? ""} onChange={e => updateData({ maintenancePerSqft: e.target.value })} placeholder="3.5" className="flex-1" />
                                    <Select value={data.maintenanceType} onValueChange={v => updateData({ maintenanceType: v as any })}>
                                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Mo</SelectItem>
                                            <SelectItem value="quarterly">Qt</SelectItem>
                                            <SelectItem value="annually">Yr</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </Field>
                            <Field label="Other Doc Charges">
                                <div className="flex gap-2">
                                    <Select value={data.otherChargesType || "none"} onValueChange={v => updateData({ otherChargesType: v as any, otherChargesAmount: v === "none" ? "" : data.otherChargesAmount })}>
                                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No charges</SelectItem>
                                            <SelectItem value="rs">Rs Amount</SelectItem>
                                            <SelectItem value="stamp_duty_percentage">STAMp duty %</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {data.otherChargesType !== "none" && (
                                        <div className="flex flex-1 gap-2">
                                            <Input 
                                                value={data.otherChargesName || ""} 
                                                onChange={e => updateData({ otherChargesName: e.target.value })} 
                                                placeholder="Charge Name (e.g. Legal Fees)" 
                                                className="flex-1" 
                                            />
                                            <Input 
                                                type="number" 
                                                value={data.otherChargesAmount || ""} 
                                                onChange={e => updateData({ otherChargesAmount: e.target.value })} 
                                                placeholder="E.g. 5000" 
                                                className="w-32" 
                                            />
                                        </div>
                                    )}
                                </div>
                            </Field>
                            <Field label="Loading Factor %"><Input type="number" value={data.loadingFactor ?? ""} onChange={e => updateData({ loadingFactor: e.target.value })} placeholder="40" /></Field>
                        </Grid>
                    </Section>

                    <Section id="default-specs" title="Default Tower Specifications" description="Common unit finishers" icon={CheckCircle} openIds={openIds} setOpenIds={setOpenIds}>
                        <Grid cols={3}>
                            <Field label="Main Flooring"><Input value={data.defaultFlooringType || ''} onChange={e => updateData({ defaultFlooringType: e.target.value })} placeholder="Italian Marble" /></Field>
                            <Field label="Internal Walls"><Input value={data.defaultWallFinish || ''} onChange={e => updateData({ defaultWallFinish: e.target.value })} placeholder="Acrylic Emulsion" /></Field>
                            <Field label="Ceiling Height"><Input value={data.defaultCeilingHeight || ''} onChange={e => updateData({ defaultCeilingHeight: e.target.value })} placeholder="10.5 Ft" /></Field>
                            <Field label="Furnishing">
                                <Select value={data.defaultFurnishingStatus} onValueChange={v => updateData({ defaultFurnishingStatus: v as any })}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unfurnished">Unfurnished</SelectItem>
                                        <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                                        <SelectItem value="fully-furnished">Fully-Furnished</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                        </Grid>
                    </Section>

                    <Section id="key-unit-specs" title="1. Key Unit Specifications" description="Basic things a buyer checks" icon={Home} openIds={openIds} setOpenIds={setOpenIds}>
                        <Grid cols={2}>
                            <Field label="Balcony/Railing"><Input value={data.defaultBalconyRailing || ''} onChange={e => updateData({ defaultBalconyRailing: e.target.value })} placeholder="Ms Railing, Glass Railing, Stainless Steel" /></Field>
                            <Field label="Windows"><Input value={data.defaultWindows || ''} onChange={e => updateData({ defaultWindows: e.target.value })} placeholder="UPVC Windows, Aluminium Powder Coated" /></Field>
                            <Field label="Main Door"><Input value={data.defaultMainDoor || ''} onChange={e => updateData({ defaultMainDoor: e.target.value })} placeholder="Teakwood Frame, Laminate Finish, Digital Lock" /></Field>
                            <Field label="Internal Doors"><Input value={data.defaultInternalDoors || ''} onChange={e => updateData({ defaultInternalDoors: e.target.value })} placeholder="Waterproof Flush doors, Skin doors" /></Field>
                        </Grid>
                    </Section>

                    <Section id="bathroom-kitchen" title="2. Bathroom & Kitchen" description="Most Critical spaces" icon={Waves} openIds={openIds} setOpenIds={setOpenIds}>
                        <Grid cols={2}>
                            <Field label="Kitchen Platform"><Input value={data.defaultKitchenPlatform || ''} onChange={e => updateData({ defaultKitchenPlatform: e.target.value })} placeholder="Granite platform, Engineered Stone" /></Field>
                            <Field label="Kitchen Fittings"><Input value={data.defaultKitchenFittings || ''} onChange={e => updateData({ defaultKitchenFittings: e.target.value })} placeholder="Sink type, Brand (e.g., Kohler, Jaquar)" /></Field>
                            <Field label="Bathroom CP Fittings"><Input value={data.defaultBathroomCpFittings || ''} onChange={e => updateData({ defaultBathroomCpFittings: e.target.value })} placeholder="Grohe, Toto, Jaquar" /></Field>
                            <Field label="Sanitaryware"><Input value={data.defaultSanitaryware || ''} onChange={e => updateData({ defaultSanitaryware: e.target.value })} placeholder="Wall-hung, Floor-mounted" /></Field>
                        </Grid>
                    </Section>

                    <Section id="electrical-automation" title="3. Electrical & Automation" description="Modern buyers technology" icon={Zap} openIds={openIds} setOpenIds={setOpenIds}>
                        <Grid cols={3}>
                            <Field label="Wiring & Switches"><Input value={data.defaultWiringSwitches || ''} onChange={e => updateData({ defaultWiringSwitches: e.target.value })} placeholder="Concealed copper, Modular switches" /></Field>
                            <Field label="Power Backup"><Input value={data.defaultPowerBackup || ''} onChange={e => updateData({ defaultPowerBackup: e.target.value })} placeholder="100% DG backup" /></Field>
                            <Field label="Smart Home Provisions"><Input value={data.defaultSmartHomeProvisions || ''} onChange={e => updateData({ defaultSmartHomeProvisions: e.target.value })} placeholder="Video Door Phone, Wi-Fi" /></Field>
                        </Grid>
                    </Section>

                    <Section id="extra-value-addons" title="4. Extra Value Add-ons" description="Premium touches" icon={Sparkles} openIds={openIds} setOpenIds={setOpenIds}>
                        <Grid cols={3}>
                            <Field label="Plaster/Paint (Exterior)"><Input value={data.defaultPlasterPaint || ''} onChange={e => updateData({ defaultPlasterPaint: e.target.value })} placeholder="Weather-shield paint, Texture finish" /></Field>
                            <Field label="Fire Safety"><Input value={data.defaultFireSafety || ''} onChange={e => updateData({ defaultFireSafety: e.target.value })} placeholder="Fire sprinklers, Smoke detectors" /></Field>
                            <Field label="Vastu Compliance"><Input value={data.defaultVastuCompliance || ''} onChange={e => updateData({ defaultVastuCompliance: e.target.value })} placeholder="Entrance direction" /></Field>
                        </Grid>
                    </Section>
                </TabsContent>

                {/* ── PART B: TOWER SKELETON & INVENTORY ── */}
                <TabsContent value="inventory" className="space-y-16 focus-visible:outline-none">
                    <div className="flex items-center justify-between p-6 bg-orange-50/50 rounded-2xl border border-orange-100 border-dashed mb-16">
                        <div>
                            <h3 className="text-sm font-bold text-orange-900">Tower Skeleton Planner</h3>
                            <p className="text-xs text-orange-700/70 mt-1">Define floors (Basement, Ground, Typical) first. Map BHKs later.</p>
                        </div>
                        <Button onClick={addGroup} className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-2 rounded-xl h-10 px-4 border-0">
                            <Plus className="w-4 h-4" /> Add Floor Group
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            {(data.floorGroups || []).map((group, idx) => (
                                <Card key={group.id} className="border-2 border-gray-100 dark:border-slate-800 overflow-hidden rounded-2xl">
                                    <div className="bg-gray-50 dark:bg-slate-800/50 px-5 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:bg-slate-800/50 transition-colors" onClick={() => toggleGroupCollapse(group.id)}>
                                        <div className="flex items-center gap-3">
                                            {collapsedGroups.includes(group.id) ? <ChevronRight className="w-4 h-4 text-[#1A3C8C] dark:text-blue-400" /> : <ChevronDown className="w-4 h-4 text-[#1A3C8C] dark:text-blue-400" />}
                                            <Badge variant="outline" className="bg-white dark:bg-slate-900 text-[#1A3C8C] dark:text-blue-400 text-[10px] font-bold h-6 uppercase tracking-wider">Group {idx + 1}</Badge>
                                            <Input
                                                value={group.name ?? ""}
                                                onChange={e => updateGroup(group.id, { name: e.target.value })}
                                                onClick={e => e.stopPropagation()}
                                                className="h-8 text-base font-black text-[#1A3C8C] dark:text-blue-400 bg-transparent border-0 focus-visible:ring-0 p-0 w-64"
                                                placeholder="Standard Floors"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center flex-wrap gap-1 max-w-[200px] justify-end" onClick={e => e.stopPropagation()}>
                                                {(group.groupTypes || []).map(t => (
                                                    <Badge key={t} variant="secondary" className="capitalize text-[8px] h-4 px-1">{t}</Badge>
                                                ))}
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeGroup(group.id); }} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                    {!collapsedGroups.includes(group.id) && (
                                        <CardContent className="p-5 space-y-4">
                                            <Grid cols={2}>
                                                <Field label="Assign Floors" hint="E.g. 1-10, 15, 20-30">
                                                    <Input
                                                        value={group.floorRange ?? ""}
                                                        onChange={e => {
                                                            const floors = parseFloorRange(e.target.value)
                                                            updateGroup(group.id, { floorRange: e.target.value, floors })
                                                        }}
                                                        placeholder="1-10, 12, 15-22"
                                                        className="bg-white dark:bg-slate-900"
                                                    />
                                                </Field>
                                                <Field label="Description / Usage" hint="Why this group? (Optional)">
                                                    <Input
                                                        value={group.description || ""}
                                                        onChange={e => updateGroup(group.id, { description: e.target.value })}
                                                        placeholder="Resident lobby and club access"
                                                        className="bg-white dark:bg-slate-900"
                                                    />
                                                </Field>
                                                <Field label="Floor Rise (₹/floor)" hint="Leave empty for global default">
                                                    <Input
                                                        type="number"
                                                        value={group.floorRise !== undefined ? group.floorRise : ""}
                                                        onChange={e => updateGroup(group.id, { floorRise: e.target.value ? Number(e.target.value) : undefined })}
                                                        placeholder="50000"
                                                        className="bg-white dark:bg-slate-900"
                                                    />
                                                </Field>

                                                {/* Dynamic Fields based on Group Type */}
                                                {(group.groupTypes || []).some(t => ['basement', 'podium'].includes(t)) && (
                                                    <>
                                                        <Grid cols={3}>
                                                            <Field label="Car Slots">
                                                                <Input type="number" value={group.carSlots || 0} onChange={e => updateGroup(group.id, { carSlots: Number(e.target.value) })} placeholder="100" />
                                                            </Field>
                                                            <Field label="Bike Slots">
                                                                <Input type="number" value={group.bikeSlots || 0} onChange={e => updateGroup(group.id, { bikeSlots: Number(e.target.value) })} placeholder="50" />
                                                            </Field>
                                                            <Field label="EV Points">
                                                                <Input type="number" value={group.evSlots || 0} onChange={e => updateGroup(group.id, { evSlots: Number(e.target.value) })} placeholder="10" />
                                                            </Field>
                                                        </Grid>
                                                        <Grid cols={2}>
                                                            <Field label="Car Rate (₹/Slot)">
                                                                <Input value={group.carParkingPrice || ""} onChange={e => updateGroup(group.id, { carParkingPrice: e.target.value })} placeholder="5,00,000" />
                                                            </Field>
                                                            <Field label="Bike Rate (₹/Slot)">
                                                                <Input value={group.bikeParkingPrice || ""} onChange={e => updateGroup(group.id, { bikeParkingPrice: e.target.value })} placeholder="50,000" />
                                                            </Field>
                                                        </Grid>
                                                        <Field label="Parking Type" hint="Type of parking arrangement">
                                                            <Select value={group.parkingType || "covered"} onValueChange={v => updateGroup(group.id, { parkingType: v })}>
                                                                <SelectTrigger className="h-12 rounded-xl border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:bg-slate-800/50 transition-all font-bold text-gray-700 dark:text-slate-300 shadow-sm border-2">
                                                                    <SelectValue placeholder="Select Parking Type" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-gray-100 dark:border-slate-800 shadow-2xl z-[100] bg-white dark:bg-slate-900">
                                                                    <SelectItem value="covered" className="rounded-lg my-0.5">Covered Parking</SelectItem>
                                                                    <SelectItem value="open" className="rounded-lg my-0.5">Open Parking</SelectItem>
                                                                    <SelectItem value="stilt" className="rounded-lg my-0.5">Stilt Parking</SelectItem>
                                                                    <SelectItem value="mechanical" className="rounded-lg my-0.5">Mechanical / Puzzle</SelectItem>
                                                                    <SelectItem value="basement" className="rounded-lg my-0.5">Basement Parking</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </Field>
                                                    </>
                                                )}

                                                {(group.groupTypes || []).some(t => ['amenity', 'podium'].includes(t)) && (
                                                    <Field label="Amenities Highlight" hint="Key facilities on this level">
                                                        <Input
                                                            value={group.amenities || ""}
                                                            onChange={e => updateGroup(group.id, { amenities: e.target.value })}
                                                            placeholder="Swimming Pool, Mini Theater, Gym"
                                                            className="bg-white dark:bg-slate-900"
                                                        />
                                                    </Field>
                                                )}

                                                {(group.groupTypes || []).includes('refuge') && (
                                                    <Field label="Refuge Area Size" hint="Sqm / Sqft area">
                                                        <Input
                                                            value={group.utilityInfo || ""}
                                                            onChange={e => updateGroup(group.id, { utilityInfo: e.target.value })}
                                                            placeholder="250 Sq.Ft"
                                                            className="bg-white dark:bg-slate-900"
                                                        />
                                                    </Field>
                                                )}
                                            </Grid>

                                            <div className="flex items-end flex-wrap gap-1">
                                                {(group.floors || []).map(f => (
                                                    <Badge key={f} className="bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 text-[10px] px-1.5 h-5 font-medium">F{f}</Badge>
                                                ))}
                                            </div>

                                            {/* ── CONDITIONAL INVENTORY LOGIC ── */}
                                            {(group.groupTypes || []).some(t => ['typical', 'ground', 'other'].includes(t)) ? (
                                                <>
                                                    <div className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pt-4">Unit / Parking Slot Mapping</div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {(group.layout || []).map((slot, sIdx) => {
                                                            const config = (data.configurations || []).find(c => c.id === slot.configId)
                                                            const updateSlot = (patch: Partial<UnitLayoutSlot>) => {
                                                                const newLayout = [...(group.layout || [])]
                                                                newLayout[sIdx] = { ...slot, ...patch }
                                                                updateGroup(group.id, { layout: newLayout })
                                                            }
                                                            const removeSlot = () => {
                                                                const newLayout = (group.layout || []).filter((_, i) => i !== sIdx)
                                                                updateGroup(group.id, { layout: newLayout })
                                                            }
                                                            return (
                                                                <div key={slot.id} className="p-4 rounded-2xl border-2 border-slate-100 bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl hover:border-blue-400/40 transition-all duration-300 relative group/unit">
                                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1A3C8C] dark:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-full" />

                                                                    <div className="flex flex-col gap-3">
                                                                        {/* Header Row: Slot and Delete */}
                                                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="h-8 px-3 rounded-xl bg-slate-50 flex items-center justify-center">
                                                                                    <span className="text-[10px] font-black text-slate-400 uppercase mr-1.5 tracking-tighter">Slot</span>
                                                                                    <span className="text-lg font-black text-[#1A3C8C] dark:text-blue-400">#{sIdx + 1}</span>
                                                                                </div>
                                                                                <Select
                                                                                    value={slot.configId ? (data.configurations || []).find(c => c.id === slot.configId)?.type : slot.unitTypeOverride}
                                                                                    onValueChange={v => {
                                                                                        const matchingConfig = (data.configurations || []).find(c => c.type.toUpperCase().replace(/\s/g, "") === v.toUpperCase().replace(/\s/g, ""))
                                                                                        if (matchingConfig) {
                                                                                            updateSlot({ configId: matchingConfig.id, unitTypeOverride: undefined })
                                                                                        } else {
                                                                                            updateSlot({ configId: "", unitTypeOverride: v })
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <SelectTrigger className="h-9 w-32 border-2 border-slate-100 bg-slate-50 text-sm font-black text-slate-900 rounded-xl">
                                                                                        <SelectValue placeholder="BHK" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent className="rounded-xl shadow-2xl border-slate-100 z-[9999]">
                                                                                        {["1BHK", "2BHK", "3BHK", "4BHK", "5BHK", "STUDIO", "SHOPS", "OFFICE", "PENTHOUSE"].map(type => (
                                                                                            <SelectItem key={type} value={type} className="text-xs font-black uppercase py-2">{type}</SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                            <Button variant="ghost" size="sm" onClick={removeSlot} className="h-8 w-8 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>

                                                                        {/* Data Row: Large Inputs */}
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                            <div className="space-y-1.5">
                                                                                <Label className="text-[10px] font-black text-[#1A3C8C] dark:text-blue-400 uppercase tracking-widest pl-1">Carpet Area (SQFT)</Label>
                                                                                <div className="relative">
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={slot.carpetAreaOverride || config?.carpetArea || ""}
                                                                                        onChange={e => updateSlot({ carpetAreaOverride: parseFloat(e.target.value) || 0 })}
                                                                                        placeholder="0"
                                                                                        className="h-10 w-full border-2 border-slate-200 bg-slate-50 text-base font-black text-slate-900 focus:ring-4 focus:ring-blue-100 px-3 rounded-xl"
                                                                                    />
                                                                                    <Maximize className="absolute right-3 top-3 w-4 h-4 text-slate-300" />
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-1.5">
                                                                                <Label className="text-[10px] font-black text-[#1A3C8C] dark:text-blue-400 uppercase tracking-widest pl-1">Unit Identity (NO.)</Label>
                                                                                <div className="relative">
                                                                                    <Input
                                                                                        value={slot.slotNumber ?? ""}
                                                                                        onChange={e => updateSlot({ slotNumber: e.target.value })}
                                                                                        placeholder="101"
                                                                                        className="h-10 w-full border-2 border-slate-200 bg-slate-50 text-base font-black text-slate-900 focus:ring-4 focus:ring-blue-100 px-3 rounded-xl"
                                                                                    />
                                                                                    <LayoutGrid className="absolute right-3 top-3 w-4 h-4 text-slate-300" />
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Row 2: Facing & View */}
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                            <div className="space-y-1 bg-gradient-to-r from-blue-50 to-white p-3 rounded-xl border-2 border-blue-100/50">
                                                                                <Label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                                                                    <Compass className="w-4 h-4" /> Facing
                                                                                </Label>
                                                                                <Input
                                                                                    value={slot.facingOverride || ''}
                                                                                    onChange={e => updateSlot({ facingOverride: e.target.value })}
                                                                                    placeholder="East / North"
                                                                                    className="h-10 w-full border-slate-200 bg-white dark:bg-slate-900 text-base font-black text-[#1A3C8C] dark:text-blue-400 focus:ring-4 focus:ring-blue-100 px-3 rounded-xl"
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-1 bg-gradient-to-r from-indigo-50 to-white p-3 rounded-xl border-2 border-indigo-100/50">
                                                                                <Label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                                                                    <Eye className="w-4 h-4" /> View Type
                                                                                </Label>
                                                                                <Select
                                                                                    value={slot.viewOverride || ""}
                                                                                    onValueChange={v => updateSlot({ viewOverride: v })}
                                                                                >
                                                                                    <SelectTrigger className="h-10 w-full border-slate-200 bg-white dark:bg-slate-900 text-base font-black text-[#1A3C8C] dark:text-blue-400 focus:ring-4 focus:ring-indigo-100 px-3 rounded-xl">
                                                                                        <SelectValue placeholder="Select View" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent className="rounded-xl shadow-2xl border-slate-100">
                                                                                        {VIEW_TYPES.map(vt => (
                                                                                            <SelectItem key={vt} value={vt} className="text-[10px] font-black uppercase py-2">{vt}</SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                        </div>

                                                                        {/* Row 3: Vastu Status */}
                                                                        <div className="space-y-1 bg-gradient-to-r from-emerald-50 to-white p-3 rounded-xl border-2 border-emerald-100/50">
                                                                            <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                                                <ShieldCheck className="w-4 h-4" /> Vastu Status
                                                                            </Label>
                                                                            <Select
                                                                                value={slot.vastuOverride || ""}
                                                                                onValueChange={v => updateSlot({ vastuOverride: v })}
                                                                            >
                                                                                <SelectTrigger className="h-10 w-full border-slate-200 bg-white dark:bg-slate-900 text-base font-black text-[#1A3C8C] dark:text-blue-400 focus:ring-4 focus:ring-emerald-100 px-3 rounded-xl">
                                                                                    <SelectValue placeholder="Select Vastu Status" />
                                                                                </SelectTrigger>
                                                                                <SelectContent className="rounded-xl shadow-2xl border-slate-100">
                                                                                    {VASTU_STATUS.map(vs => (
                                                                                        <SelectItem key={vs} value={vs} className="text-[10px] font-black uppercase py-2">{vs}</SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => {
                                                                const configs = data.configurations || []
                                                                const newSlot: UnitLayoutSlot = { id: `slot-${Date.now()}`, slotNumber: ((group.layout?.length || 0) + 1).toString(), configId: configs[0]?.id || "" }
                                                                updateGroup(group.id, { layout: [...(group.layout || []), newSlot] })
                                                            }}
                                                            className="h-auto min-h-[280px] border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-[24px] hover:border-blue-200 hover:bg-blue-50/30 transition-all flex flex-col gap-3 group/add"
                                                        >
                                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center border border-gray-100 dark:border-slate-800 group-hover/add:bg-blue-100 group-hover/add:border-blue-200 transition-all group-hover/add:scale-110">
                                                                <Plus className="w-6 h-6 text-gray-400 dark:text-slate-500 group-hover/add:text-blue-600" />
                                                            </div>
                                                            <span className="text-xs font-black text-gray-400 dark:text-slate-500 group-hover/add:text-blue-600 uppercase tracking-widest">Add Unit</span>
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (group.groupTypes || []).some(t => ['basement', 'podium'].includes(t)) ? (
                                                <div className="p-8 bg-orange-50/20 rounded-2xl border border-orange-100 border-dashed text-center">
                                                    <Car className="w-8 h-8 text-orange-200 mx-auto mb-2" />
                                                    <p className="text-[11px] font-bold text-orange-900 uppercase tracking-widest">
                                                        {(group.groupTypes || []).includes('podium') ? 'Podium' : 'Basement'} Parking Capacity
                                                    </p>
                                                    <p className="text-[10px] text-orange-600/60 mt-1">Individual slot mapping is not required for basement levels. Total counts are defined in the fields above.</p>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 text-center py-8">
                                                    <p className="text-[11px] text-gray-400 dark:text-slate-500">Inventory mapping is not required for this floor type.</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>

                        {/* VISUAL TOWER MAP */}
                        <div className="xl:col-span-1 hidden xl:block relative">
                            <div className="sticky top-6 bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden p-6 h-[calc(100vh-100px)] flex flex-col">
                                <h3 className="text-[#1A3C8C] dark:text-blue-400 font-black text-lg mb-1 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-500" /> Live Tower Map
                                </h3>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-4">Floor wise architecture</p>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1.5 pb-10">
                                    {(() => {
                                        if ((data.floorGroups || []).length === 0) {
                                            return <div className="py-20 text-center text-gray-300 font-bold text-xs uppercase tracking-widest">No Floors yet</div>
                                        }

                                        const allFloorsSet = new Set<number>()
                                        ;(data.floorGroups || []).forEach(g => (g.floors || []).forEach(f => allFloorsSet.add(f)))
                                        const allFloors = Array.from(allFloorsSet).sort((a, b) => b - a)

                                        return allFloors.map(floor => {
                                            const group = (data.floorGroups || []).find(g => (g.floors || []).includes(floor))
                                            if (!group) return null

                                            const isBasement = (group.groupTypes || []).includes('basement')
                                            const isPodium = (group.groupTypes || []).includes('podium')
                                            const isAmenity = (group.groupTypes || []).includes('amenity')
                                            const isRefuge = (group.groupTypes || []).includes('refuge')

                                            let bgColor = "bg-white dark:bg-slate-900"
                                            let borderColor = "border-gray-200 dark:border-slate-700"
                                            let textColor = "text-gray-900 dark:text-white"
                                            if (isBasement) { bgColor = "bg-gray-800"; borderColor = "border-gray-900"; textColor = "text-white" }
                                            else if (isAmenity) { bgColor = "bg-teal-50"; borderColor = "border-teal-200"; textColor = "text-teal-900" }
                                            else if (isPodium) { bgColor = "bg-orange-50"; borderColor = "border-orange-200"; textColor = "text-orange-900" }
                                            else if (isRefuge) { bgColor = "bg-red-50"; borderColor = "border-red-200"; textColor = "text-red-900" }

                                            const displayStr = floor === 0 ? "G" : floor < 0 ? `B${Math.abs(floor)}` : `${floor}`

                                            return (
                                                <div key={floor} className={`flex items-center gap-2 w-full border ${borderColor} ${bgColor} rounded-lg p-1.5 shadow-sm overflow-hidden transition-all hover:scale-[1.02]`}>
                                                    <div className={`w-8 shrink-0 flex items-center justify-center font-black text-xs ${isBasement ? 'text-gray-400 dark:text-slate-500' : 'text-gray-500 dark:text-slate-400'}`}>
                                                        {displayStr}
                                                    </div>
                                                    <div className="flex-1 flex gap-1 h-8">
                                                        {(isBasement || isPodium) && group.carSlots ? (
                                                            <div className={`flex items-center justify-center w-full gap-2 text-[10px] font-bold ${textColor} border-l border-current/20`}>
                                                                <Car className="w-3.5 h-3.5 opacity-70" /> {group.carSlots} Parking
                                                            </div>
                                                        ) : isAmenity ? (
                                                            <div className={`flex items-center justify-center w-full gap-2 text-[10px] uppercase font-black tracking-widest ${textColor} border-l border-current/20`}>
                                                                <Waves className="w-3.5 h-3.5 opacity-70" /> Club
                                                            </div>
                                                        ) : isRefuge ? (
                                                            <div className={`flex items-center justify-center w-full gap-2 text-[10px] uppercase font-black tracking-widest ${textColor} border-l border-current/20`}>
                                                                <Shield className="w-3.5 h-3.5 opacity-70" /> Refuge
                                                            </div>
                                                        ) : group.layout && (group.layout || []).length > 0 ? (
                                                            <div className="flex w-full items-center gap-1 border-l pl-2 border-gray-100 dark:border-slate-800">
                                                                {(group.layout || []).map((s, i) => {
                                                                    const typ = s.configId ? (data.configurations || []).find(c => c.id === s.configId)?.type : s.unitTypeOverride
                                                                    const shortTyp = typ ? typ.replace('BHK', '').substring(0, 3) : "U"
                                                                    
                                                                    // Real-world numbering logic: Floor + Slot (e.g. 5 + 01 = 501)
                                                                    const slotNum = s.slotNumber || (i + 1).toString();
                                                                    const paddedSlot = slotNum.length === 1 ? `0${slotNum}` : slotNum;
                                                                    let unitDisplay = "";
                                                                    
                                                                    if (floor === 0) unitDisplay = `G${paddedSlot}`;
                                                                    else if (floor < 0) unitDisplay = `B${Math.abs(floor)}${paddedSlot}`;
                                                                    else unitDisplay = `${floor}${paddedSlot}`;

                                                                    return (
                                                                        <div key={i} className="flex-1 min-w-0 bg-[#F5F7FA] border border-gray-200 dark:border-slate-700 rounded flex flex-col items-center justify-center py-0.5 shadow-inner">
                                                                            <span className="text-[9px] font-bold text-[#1A3C8C] dark:text-blue-400 leading-none">{unitDisplay}</span>
                                                                            <span className="text-[6px] uppercase tracking-wider text-gray-400 dark:text-slate-500 font-bold">{shortTyp}</span>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center w-full text-[9px] font-bold text-gray-300 uppercase tracking-widest border-l border-gray-100 dark:border-slate-800">
                                                                No Units
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ── PART C: BHK MASTER BLUEPRINTS ── */}
                <TabsContent value="configs" className="space-y-16 focus-visible:outline-none">
                    {(() => {
                        const validSlots = (data.floorGroups || []).flatMap(g =>
                            (g.layout || []).map(s => ({ ...s, groupId: g.id }))
                        ).filter(s => {
                            const typeStr = s.configId ? (data.configurations || []).find(c => c.id === s.configId)?.type : s.unitTypeOverride
                            return !!typeStr
                        })

                        if (validSlots.length === 0) return null

                        let isMismatch = false;
                        const slotsToSync = validSlots.map(slot => {
                            const typeStr = slot.configId ? (data.configurations || []).find(c => c.id === slot.configId)?.type : slot.unitTypeOverride
                            const configObj = slot.configId ? (data.configurations || []).find(c => c.id === slot.configId) : null
                            const areaVal = slot.carpetAreaOverride || configObj?.carpetArea || 0
                            const baseTypeStr = typeStr ? typeStr.toUpperCase().replace(/\s/g, "") : ""

                            return {
                                groupId: slot.groupId,
                                slotId: slot.id,
                                slotNumber: slot.slotNumber,
                                type: baseTypeStr,
                                originalTypeLabel: typeStr,
                                area: areaVal
                            }
                        })

                        if ((data.configurations || []).length !== slotsToSync.length) {
                            isMismatch = true;
                        } else {
                            slotsToSync.forEach((stats, index) => {
                                const c = (data.configurations || [])[index]
                                if (!c) isMismatch = true
                                else {
                                    const exBase = c.type.toUpperCase().replace(/\s/g, "")
                                    if (exBase !== stats.type || c.carpetArea !== stats.area || c.countPerFloor !== 1) {
                                        isMismatch = true;
                                    }
                                }
                            })
                        }

                        if (isMismatch) {
                            return (
                                <div className="p-8 bg-gradient-to-br from-indigo-50 via-blue-50/30 to-white rounded-[32px] border-2 border-indigo-100/50 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-blue-900/5 transition-all hover:border-indigo-200 animate-in fade-in slide-in-from-top-4 duration-500 mb-20">
                                    <div className="flex items-start gap-6">
                                        <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-200 ring-4 ring-indigo-50">
                                            <Sparkles className="w-8 h-8 text-white animate-pulse" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-[22px] font-black text-indigo-900 tracking-tight leading-none">Smart Sync Blueprints</h4>
                                            <p className="text-xs text-indigo-700/60 font-medium leading-relaxed max-w-md">
                                                Aapke Tower Skeleton mein <span className="text-indigo-600 font-black decoration-indigo-200 decoration-2 underline-offset-4 underline">{slotsToSync.length} Unique Slots</span> hain.
                                                Hume unhe Master Blueprint cards mein convert karna chahiye?
                                            </p>
                                            <div className="flex gap-2">
                                                <Badge className="bg-indigo-100 text-indigo-600 border-indigo-200 hover:bg-indigo-200 px-3 py-1 font-black rounded-lg">1-to-1 Mapping</Badge>
                                                <Badge className="bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200 px-3 py-1 font-black rounded-lg">Auto Areas</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            const updatedConfigs: UnitConfiguration[] = []
                                            const availableOldConfigs = [...(data.configurations || [])]
                                            const newMappings: { groupId: string, slotNumber: string, newConfigId: string }[] = []

                                            slotsToSync.forEach((stats) => {
                                                let existingConfig = null
                                                const matchIdx = availableOldConfigs.findIndex(c => c.type.toUpperCase().replace(/\s/g, "") === stats.type)

                                                if (matchIdx >= 0) {
                                                    existingConfig = availableOldConfigs[matchIdx]
                                                }

                                                const id = `config-${stats.groupId}-${stats.slotNumber}-${uuidv4()}`
                                                const originalLabel = BHK_OPTIONS.find(o => o.toUpperCase().replace(/\s/g, "") === stats.type) || stats.originalTypeLabel
                                                const initialArea = stats.area || 850

                                                if (existingConfig) {
                                                    updatedConfigs.push({ ...existingConfig, id, type: originalLabel as any, carpetArea: initialArea, countPerFloor: 1 })
                                                } else {
                                                    updatedConfigs.push({
                                                        id, type: originalLabel as any, carpetArea: initialArea,
                                                        builtUpArea: Math.round(initialArea * (1 + (parseFloat(data.loadingFactor) || 40) / 100)), 
                                                        superBuiltUpArea: Math.round(initialArea * (1 + (parseFloat(data.loadingFactor) || 40) / 100)),
                                                        loadingFactor: parseFloat(data.loadingFactor) || 40, basePrice: 5000000, ratePerSqft: 0, parkingCharges: 500000,
                                                        gstPercentage: 5, stampDutyPercentage: 7, registrationCharges: 30000,
                                                        maintenancePerSqft: 3.5, maintenanceType: "monthly", otherCharges: 0,
                                                        facingPremiums: { north: "0", south: "0", east: "0", west: "0", "north-east": "0", "north-west": "0", "south-east": "0", "south-west": "0" },
                                                        facing: "East", balconyCount: 1, bathroomCount: 2, servantRoom: false, studyRoom: false, poojaRoom: false, dryBalcony: true,
                                                        flooringType: data.defaultFlooringType || "", wallFinish: data.defaultWallFinish || "", ceilingHeight: data.defaultCeilingHeight || "10.5 Ft",
                                                        furnishingStatus: data.defaultFurnishingStatus || "unfurnished", viewType: "City View", roomDimensions: [], vastuAnalysis: [], moveInChecklist: [],
                                                        floorPlanImage2D: "", countPerFloor: 1
                                                    })
                                                }
                                                newMappings.push({ groupId: stats.groupId, slotNumber: stats.slotNumber, newConfigId: id })
                                            })

                                            const updatedFloorGroups = [...(data.floorGroups || [])]
                                            updatedFloorGroups.forEach(g => {
                                                (g.layout || []).forEach(slot => {
                                                    const mapId = newMappings.find(m => m.groupId === g.id && m.slotNumber === slot.slotNumber)?.newConfigId
                                                    if (mapId) {
                                                        slot.configId = mapId
                                                        slot.unitTypeOverride = undefined
                                                        slot.carpetAreaOverride = undefined
                                                    }
                                                })
                                            })
                                            updateData({ configurations: updatedConfigs, floorGroups: updatedFloorGroups })
                                        }}
                                        className="bg-[#1A3C8C] dark:bg-blue-600 hover:bg-[#122b6b] text-white font-black h-16 px-10 rounded-[24px] shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-3 whitespace-nowrap group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                                            <Zap className="w-4 h-4 text-yellow-300" />
                                        </div>
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="text-[10px] uppercase opacity-60 tracking-widest font-bold">Recommended</span>
                                            <span className="text-sm">Execute Smart Sync</span>
                                        </div>
                                    </Button>
                                </div>
                            )
                        }
                        return null
                    })()}


                    <div className="grid gap-6">
                        {(data.floorGroups || []).length === 0 ? (
                            (data.configurations || []).map((config, i) => (
                                <UnitConfigCard key={config.id} index={i} config={config} onChange={patch => updateConfig(config.id, patch)} onRemove={() => removeConfig(config.id)} globalLoadingFactor={data.loadingFactor} />
                            ))
                        ) : (
                            <>
                                {(data.floorGroups || []).map((group, groupIndex) => {
                                    const usedConfigIds = Array.from(new Set((group.layout || []).map(slot => slot.configId)))
                                    const groupConfigs = (data.configurations || []).filter(c => usedConfigIds.includes(c.id))

                                    if (groupConfigs.length === 0) return null

                                    return (
                                        <div key={group.id} className="space-y-8">
                                            <div
                                                className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 cursor-pointer hover:bg-slate-50/50 transition-colors p-2 rounded-xl"
                                                onClick={() => toggleConfigGroupCollapse(group.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {collapsedConfigGroups.includes(group.id) ? (
                                                        <ChevronRight className="w-5 h-5 text-[#1A3C8C] dark:text-blue-400" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-[#1A3C8C] dark:text-blue-400" />
                                                    )}
                                                    <h4 className="text-xl font-black text-[#1A3C8C] dark:text-blue-400">{group.name} Layouts</h4>
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{group.floorRange}</span>
                                                    {group.floorRise !== undefined && (
                                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md uppercase tracking-wide">Rise: ₹{group.floorRise}</span>
                                                    )}
                                                    {group.floorPlanUrl && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                                                            <Layout className="w-3 h-3 text-indigo-600" />
                                                            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-tight">Floor Plan Attached</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {(data.floorGroups || []).length > 1 && (
                                                    <div onClick={e => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger className="h-8 gap-2 bg-blue-50 hover:bg-blue-100 text-[#1A3C8C] dark:text-blue-400 flex items-center px-3 rounded-md transition-all outline-none">
                                                                <Copy className="w-3.5 h-3.5" />
                                                                <span className="text-xs font-bold">Copy Specs From...</span>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border-gray-100 dark:border-slate-800 z-[9999] p-2">
                                                                <div className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider mb-2 px-2 pt-1">Select Source</div>
                                                                {(data.floorGroups || []).filter(g => g.id !== group.id).map(g => (
                                                                    <DropdownMenuItem
                                                                        key={g.id}
                                                                        onClick={() => copyDataFromGroup(g.id, group.id)}
                                                                        className="cursor-pointer py-2.5 px-3 rounded-lg hover:bg-blue-50 focus:bg-blue-50 transition-colors flex items-center justify-between group/item"
                                                                    >
                                                                        <span className="truncate pr-2 text-xs font-bold text-[#1A3C8C] dark:text-blue-400">{g.name}</span>
                                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800/50 px-2 py-1 rounded-md group-hover/item:bg-blue-100 group-hover/item:text-blue-600 transition-colors shrink-0">
                                                                            F: {g.floorRange}
                                                                        </span>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                )}
                                            </div>

                                            {!collapsedConfigGroups.includes(group.id) && (
                                                <div className="grid gap-6 pl-2 md:pl-4 border-l-2 border-dashed border-gray-100 dark:border-slate-800/60 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    {groupConfigs.map((config, i) => (
                                                        <UnitConfigCard key={config.id} index={i} config={config} onChange={patch => updateConfig(config.id, patch)} onRemove={() => removeConfig(config.id)} globalLoadingFactor={data.loadingFactor} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                                {(() => {
                                    const allUsedConfigIds = new Set((data.floorGroups || []).flatMap(g => (g.layout || []).map(s => s.configId)))
                                    const unassignedConfigs = (data.configurations || []).filter(c => !allUsedConfigIds.has(c.id))

                                    if (unassignedConfigs.length === 0) return null

                                    return (
                                        <div className="space-y-12 mt-24">
                                            <div
                                                className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-3 cursor-pointer hover:bg-slate-50/50 transition-colors p-2 rounded-xl"
                                                onClick={() => toggleConfigGroupCollapse("unassigned")}
                                            >
                                                {collapsedConfigGroups.includes("unassigned") ? (
                                                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                                )}
                                                <h4 className="text-xl font-black text-gray-400 dark:text-slate-500">Unassigned Units</h4>
                                            </div>
                                            {!collapsedConfigGroups.includes("unassigned") && (
                                                <div className="grid gap-6 pl-2 md:pl-4 border-l-2 border-dashed border-gray-100 dark:border-slate-800/60 opacity-80 hover:opacity-100 transition-opacity animate-in fade-in slide-in-from-top-2 duration-300">
                                                    {unassignedConfigs.map((config, i) => (
                                                        <UnitConfigCard key={config.id} index={i} config={config} onChange={patch => updateConfig(config.id, patch)} onRemove={() => removeConfig(config.id)} globalLoadingFactor={data.loadingFactor} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })()}
                            </>
                        )}
                    </div>


                </TabsContent>
            </Tabs>

            <AddGroupModal
                isOpen={isAddGroupModalOpen}
                onClose={() => setIsAddGroupModalOpen(false)}
                onAdd={confirmAddGroup}
                configurations={data.configurations || []}
                defaultUnits={unitsPerFloor || 1}
                defaultFloorRise={Number(data.floorRisePerFloor) || 0}
                existingGroups={data.floorGroups || []}
            />
        </div >
    )
}

function AddGroupModal({ isOpen, onClose, onAdd, configurations, defaultUnits, defaultFloorRise, existingGroups }: {
    isOpen: boolean,
    onClose: () => void,
    onAdd: (data: {
        floorRange: string,
        groupTypes: FloorGroup["groupTypes"],
        name: string,
        unitsPerFloor: number,
        floorRise?: number,
        cloneFromGroupId?: string,
        floorPlanUrl?: string
    }) => void,
    configurations: UnitConfiguration[],
    defaultUnits: number,
    defaultFloorRise: number,
    existingGroups: FloorGroup[]
}) {
    const [fromFloor, setFromFloor] = useState("0")
    const [toFloor, setToFloor] = useState("0")
    const [types, setTypes] = useState<FloorGroup["groupTypes"]>(["typical"])
    const [name, setName] = useState("Typical Floors")
    const [floorRise, setFloorRise] = useState(defaultFloorRise)
    const [cloneGroupId, setCloneGroupId] = useState<string>("none")
    const [floorPlanUrl, setFloorPlanUrl] = useState("")

    useEffect(() => {
        if (isOpen) {
            // Find the highest floor already assigned
            let highestFloor = -1; // Default to -1 so next starts at 0 (G)
            if (existingGroups && existingGroups.length > 0) {
                existingGroups.forEach(group => {
                    if (group.floors && group.floors.length > 0) {
                        const maxInGroup = Math.max(...group.floors);
                        if (maxInGroup > highestFloor) {
                            highestFloor = maxInGroup;
                        }
                    }
                });
            }
            
            const nextFloor = highestFloor + 1;
            const nextFloorLabel = nextFloor === 0 ? "0" : (nextFloor < 0 ? `B${Math.abs(nextFloor)}` : `${nextFloor}`);
            
            setFromFloor(nextFloorLabel)
            setToFloor(nextFloorLabel)
            setTypes(["typical"])
            setName("Typical Floors")
            setFloorRise(defaultFloorRise)
            setCloneGroupId("none")
            setFloorPlanUrl("")
        }
    }, [isOpen, defaultFloorRise, existingGroups])

    useEffect(() => {
        if (types.length === 0) {
            setName("Mixed Floor")
            return
        }
        const defaultNames: Record<string, string> = {
            typical: "Typical Floors",
            basement: "Basement",
            ground: "Ground Floor",
            podium: "Podium",
            refuge: "Refuge Floor",
            amenity: "Amenity Area",
            other: "Other Group"
        }

        if (types.length === 1) {
            setName(defaultNames[types[0]])
        } else {
            setName(`${defaultNames[types[0]]} + ${types.length - 1} more`)
        }
    }, [types])

    const handleAdd = () => {
        if (!fromFloor || !toFloor || types.length === 0) return

        const formatForDisplay = (v: string) => {
            let n = parseInt(v.replace(/[^0-9-]/g, "")) || 0
            if (v.toUpperCase().startsWith("B")) n = -Math.abs(n)

            if (n === 0) return "G"
            if (n < 0) return `B${Math.abs(n)}`
            return `${n}`
        }

        const fLabel = formatForDisplay(fromFloor)
        const tLabel = formatForDisplay(toFloor)
        const rangeLabel = fLabel === tLabel ? fLabel : `${fLabel}-${tLabel}`

        onAdd({
            floorRange: rangeLabel,
            groupTypes: types,
            name,
            unitsPerFloor: defaultUnits,
            floorRise,
            cloneFromGroupId: cloneGroupId,
            floorPlanUrl: floorPlanUrl
        })
    }

    const toggleType = (t: any) => {
        setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
    }

    const typeOptions = [
        { id: 'typical', label: 'Typical (Residential)', icon: Home },
        { id: 'amenity', label: 'Amenity Area', icon: Waves },
        { id: 'ground', label: 'Ground Floor', icon: Building2 },
        { id: 'podium', label: 'Podium', icon: Layers },
        { id: 'refuge', label: 'Refuge Floor', icon: Shield },
        { id: 'basement', label: 'Basement / Parking', icon: Car },
        { id: 'other', label: 'Other Purpose', icon: Grid3X3 },
    ]

    const Stepper = ({ value, onChange, label, hint, min = -100 }: { value: string, onChange: (v: string) => void, label: string, hint: string, min?: number }) => {
        // Parse internal number: "G" -> 0, "B1" -> -1, "5" -> 5
        let num = parseInt(value.replace(/[^0-9-]/g, "")) || 0
        if (value.toUpperCase().startsWith("B")) num = -Math.abs(num)

        const displayValue = num === 0 ? "G" : (num < 0 ? `B${Math.abs(num)}` : `${num}`)

        const isAlreadyAssigned = (n: number) => {
            return (existingGroups || []).some(g => (g.floors || []).includes(n))
        }

        const updateValue = (next: number) => {
            if (next === 0) onChange("0")
            else if (next < 0) onChange(`B${Math.abs(next)}`)
            else onChange(`${next}`)
        }

        const isError = isAlreadyAssigned(num)

        return (
            <Field label={label} hint={hint}>
                <div className={`flex items-center gap-1 bg-gray-50 dark:bg-slate-800/50 border p-1 rounded-2xl transition-colors ${isError ? 'border-red-300 bg-red-50' : 'border-gray-100 dark:border-slate-800'}`}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                        onClick={() => updateValue(Math.max(min, num - 1))}
                    >
                        <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 relative">
                        <Input
                            value={displayValue}
                            onChange={e => {
                                const v = e.target.value.toUpperCase()
                                if (v === 'G' || v === '0') onChange("0")
                                else onChange(e.target.value)
                            }}
                            className={`h-10 border-0 bg-transparent text-center font-bold text-sm focus-visible:ring-0 min-w-0 ${isError ? 'text-red-600' : ''}`}
                        />
                        {isError && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                                <Badge className="bg-red-500 text-[8px] h-3 px-1 py-0 pointer-events-none">TAKEN</Badge>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        onClick={() => updateValue(num + 1)}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </Field>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl rounded-[32px] border-0 shadow-2xl overflow-hidden p-0 bg-white dark:bg-slate-900">
                <DialogTitle className="sr-only">Add Floor Group</DialogTitle>
                <div className="bg-[#1A3C8C] dark:bg-blue-600 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-slate-900/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900/10 backdrop-blur-xl flex items-center justify-center mb-5 border border-white/20 shadow-xl">
                                <Layers className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight leading-none">Add Floor Group</h2>
                            <p className="text-blue-100/70 mt-3 text-sm font-medium">Mixed-use floors? Select multiple purposes below.</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6 bg-white dark:bg-slate-900 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <Grid cols={2} className="gap-6">
                        <Stepper
                            label="From Floor"
                            hint="Starting level"
                            value={fromFloor}
                            onChange={setFromFloor}
                        />
                        <Stepper
                            label="To Floor"
                            hint="Ending level"
                            value={toFloor}
                            onChange={setToFloor}
                        />
                    </Grid>

                    <div className="space-y-4">
                        <Label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pl-1">Select Floor Usage (Multiple Allowed)</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {typeOptions.map((opt) => {
                                const Icon = opt.icon
                                const isActive = types.includes(opt.id as any)
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => toggleType(opt.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isActive ? 'bg-blue-50 border-[#1A3C8C] text-[#1A3C8C] dark:text-blue-400' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:border-gray-200 dark:border-slate-700'}`}
                                    >
                                        <div className={`p-2 rounded-lg ${isActive ? 'bg-[#1A3C8C] dark:bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-800'}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold leading-tight">{opt.label}</span>
                                        {isActive && <Check className="w-4 h-4 ml-auto" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-6 border-t border-gray-100 dark:border-slate-800 pt-6">
                        <Grid cols={2} className="gap-6">
                            <Field label="Group Label (Internal)">
                                <Input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="h-12 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50/50 hover:bg-white dark:bg-slate-900 transition-all font-bold text-gray-700 dark:text-slate-300 border-2 shadow-sm focus:ring-[#1A3C8C]/20"
                                    placeholder="E.g. Mixed Use L1"
                                />
                            </Field>
                            <Field label="Floor Rise (₹/floor)" hint="Applies to units in this group">
                                <Input
                                    type="number"
                                    value={floorRise}
                                    onChange={e => setFloorRise(Number(e.target.value))}
                                    className="h-12 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50/50 hover:bg-white dark:bg-slate-900 transition-all font-bold text-gray-700 dark:text-slate-300 border-2 shadow-sm focus:ring-[#1A3C8C]/20"
                                    placeholder="50000"
                                />
                            </Field>
                        </Grid>

                        <div className="bg-blue-50/50 p-4 rounded-2xl border-2 border-dashed border-blue-100/50">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">Group Floor Plan Image</label>
                                <AboutImageUpload
                                    value={floorPlanUrl}
                                    onChange={setFloorPlanUrl}
                                    title="Upload Group Floor Plan"
                                    description="Common layout for this floor group"
                                />
                            </div>
                        </div>

                        {existingGroups.length > 0 && (
                            <Field label="Copy Unit Map From (Optional)" hint="Save time by cloning an existing mapping">
                                <Select value={cloneGroupId} onValueChange={setCloneGroupId}>
                                    <SelectTrigger className="h-12 bg-gray-50 dark:bg-slate-800/50/50 border-gray-100 dark:border-slate-800 border-2 rounded-xl font-bold text-gray-700 dark:text-slate-300">
                                        <SelectValue placeholder="Do not copy (Empty Basic Units)" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-900 rounded-xl">
                                        <SelectItem value="none">Create Blank Units Map</SelectItem>
                                        {existingGroups.map(g => (
                                            <SelectItem key={g.id} value={g.id}>
                                                Clone from &quot;{g.name || g.floorRange}&quot; (Floors: {g.floorRange})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}
                    </div>

                    <div className="pt-2 sticky bottom-0 bg-white dark:bg-slate-900 pb-2 overflow-hidden rounded-b-[32px]">
                        {(() => {
                            const start = parseInt(fromFloor.replace(/[^0-9-]/g, "")) || 0
                            const end = parseInt(toFloor.replace(/[^0-9-]/g, "")) || 0
                            const min = Math.min(start, end)
                            const max = Math.max(start, end)
                            let hasOverlap = false
                            for (let i = min; i <= max; i++) {
                                if ((existingGroups || []).some(g => (g.floors || []).includes(i))) {
                                    hasOverlap = true
                                    break
                                }
                            }

                            return (
                                <>
                                    {hasOverlap && (
                                        <p className="text-[10px] text-red-500 font-bold text-center mb-2 animate-bounce">
                                            ⚠️ One or more floors in this range are already assigned!
                                        </p>
                                    )}
                                    <Button
                                        onClick={handleAdd}
                                        disabled={!fromFloor || !toFloor || types.length === 0 || hasOverlap}
                                        className="w-full h-16 bg-[#1A3C8C] dark:bg-blue-600 hover:bg-[#1A3C8C] dark:bg-blue-600/90 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-200 transition-all active:scale-[0.98] group relative overflow-hidden disabled:opacity-50"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                            {hasOverlap ? "Floor Already Taken" : "Create Mixed-Use Group"}
                                            <CheckCircle className="w-6 h-6 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </span>
                                    </Button>
                                </>
                            )
                        })()}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
