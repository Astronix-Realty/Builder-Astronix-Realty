"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import Image from "next/image"
import { toast } from "sonner"
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
    CheckCircle2,
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
    ShieldCheck,
    RefreshCw
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
    getDefaultRoomDimensionsForType,
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

import {
    Section,
    Field,
    Grid,
    SectionTitle,
    VASTU_STATUS,
    FACINGS,
    VIEW_TYPES,
    BHK_OPTIONS,
    STANDARD_BHK_TYPES,
    UnitConfigCard,
    UnitSlotCardItem,
    AddGroupModal,
    UnitVastuDialog
} from "./units"

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
    const [vastuSlotId, setVastuSlotId] = useState<{ groupId: string, slotId: string } | null>(null)

    const updateData = (patch: Partial<UnitTemplate>) => {
        const newData = { ...data, ...patch }
        
        // Cascade global pricing changes to all units
        const pricingFields = [
            'baseRatePerSqft', 
            'parkingCharges', 
            'bikeParkingCharges',
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
        
        // Always sync non-overridden units to ensure consistency and fix RESET functionality
        if (newData.configurations) {
            newData.configurations = newData.configurations.map(config => {
                const loading = parseFloat(newData.loadingFactor || "40") || 40
                const builtUp = Math.round(config.carpetArea * (1 + loading / 100))
                
                // Use global rate if not overridden
                const rate = config.isRateOverridden ? (config.ratePerSqft || 0) : parseFloat(newData.baseRatePerSqft || "0")
                const basePrice = Math.round(rate * builtUp)
                
                const gst = parseFloat(newData.gstPercentage || "5")
                const stamp = parseFloat(newData.stampDutyPercentage || "7")
                const reg = parseFloat(newData.registrationCharges || "30000")
                
                const gstAmt = Math.round(basePrice * gst / 100)
                const stampAmt = Math.round(basePrice * stamp / 100)
                const taxes = gstAmt + stampAmt + reg
                
                const parkAmt = parseFloat(newData.parkingCharges || "0") || 0
                const bikeAmt = parseFloat(newData.bikeParkingCharges || "0") || 0
                const otherAmt = newData.otherChargesType === "rs" 
                    ? parseFloat(newData.otherChargesAmount || "0")
                    : newData.otherChargesType === "stamp_duty_percentage"
                        ? Math.round(basePrice * (parseFloat(newData.otherChargesAmount || "0") / 100))
                        : 0
                
                const allInclusive = basePrice + taxes + otherAmt
                
                return {
                    ...config,
                    loadingFactor: loading,
                    builtUpArea: builtUp,
                    superBuiltUpArea: builtUp,
                    ratePerSqft: rate,
                    basePrice: basePrice,
                    parkingCharges: parseFloat(newData.parkingCharges || "0"),
                    bikeParkingCharges: parseFloat(newData.bikeParkingCharges || "0"),
                    gstPercentage: gst,
                    gstAmount: gstAmt,
                    stampDutyPercentage: stamp,
                    stampDutyAmount: stampAmt,
                    registrationCharges: reg,
                    totalTaxes: taxes,
                    allInclusivePrice: allInclusive,
                    maintenancePerSqft: parseFloat(newData.maintenancePerSqft || "0"),
                    maintenanceType: newData.maintenanceType || "monthly",
                    isRateOverridden: config.isRateOverridden ?? false,
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
            gstAmount: 0,
            stampDutyPercentage: 7,
            stampDutyAmount: 0,
            registrationCharges: 30000,
            maintenancePerSqft: 3.5,
            maintenanceType: "monthly",
            otherCharges: 0,
            allInclusivePrice: 0,
            totalTaxes: 0,
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
            roomDimensions: getDefaultRoomDimensionsForType(targetType),
            vastuAnalysis: defaultVastu.map(v => ({ ...v, id: Math.random().toString(36).substring(7) })),
            moveInChecklist: [],
            floorPlanImage2D: "",
            countPerFloor: 1
        }
        updateData({ configurations: [...(data.configurations || []), newConfig] })
    }

    const updateConfig = (id: string, patch: Partial<UnitConfiguration>) => {
        const prevConfig = (data.configurations || []).find(c => c.id === id);
        
        const globalPatch: any = {};
        let updatedConfigs = (data.configurations || []).map(c => c.id === id ? { ...c, ...patch } : c);

        if (patch.parkingCharges !== undefined) {
            globalPatch.parkingCharges = patch.parkingCharges.toString();
        }
        if (patch.bikeParkingCharges !== undefined) {
            globalPatch.bikeParkingCharges = patch.bikeParkingCharges.toString();
        }

        let updatedFloorGroups = data.floorGroups || [];
        let shouldUpdateFloorGroups = false;

        if (patch.parkingCharges !== undefined || patch.bikeParkingCharges !== undefined) {
            updatedFloorGroups = updatedFloorGroups.map(g => ({
                ...g,
                ...(patch.parkingCharges !== undefined && { carParkingPrice: patch.parkingCharges.toString() }),
                ...(patch.bikeParkingCharges !== undefined && { bikeParkingPrice: patch.bikeParkingCharges.toString() })
            }));
            shouldUpdateFloorGroups = true;
        }

        if (patch.facing || patch.carpetArea) {
            updatedFloorGroups = updatedFloorGroups.map(group => ({
                ...group,
                layout: group.layout.map(slot => {
                    if (slot.configId === id) {
                        const newSlot = { ...slot };
                        if (patch.facing && (!slot.facingOverride || slot.facingOverride === prevConfig?.facing)) {
                            newSlot.facingOverride = patch.facing;
                        }
                        if (patch.carpetArea && (!slot.carpetAreaOverride || slot.carpetAreaOverride === prevConfig?.carpetArea)) {
                            newSlot.carpetAreaOverride = patch.carpetArea;
                        }
                        return newSlot;
                    }
                    return slot;
                })
            }));
            shouldUpdateFloorGroups = true;
        }

        if (shouldUpdateFloorGroups) {
            globalPatch.floorGroups = updatedFloorGroups;
        }

        globalPatch.configurations = updatedConfigs;
        updateData(globalPatch);
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
        let newGroups = (data.floorGroups || []).map(g => g.id === id ? { ...g, ...patch } : g)
        
        // Synchronize parking rates across all floor groups
        if (patch.carParkingPrice !== undefined || patch.bikeParkingPrice !== undefined) {
            newGroups = newGroups.map(g => ({
                ...g,
                ...(patch.carParkingPrice !== undefined && { carParkingPrice: patch.carParkingPrice }),
                ...(patch.bikeParkingPrice !== undefined && { bikeParkingPrice: patch.bikeParkingPrice })
            }))
            
            if (patch.carParkingPrice !== undefined || patch.bikeParkingPrice !== undefined) {
                const globalPatch: Partial<UnitTemplate> = { floorGroups: newGroups }
                if (patch.carParkingPrice !== undefined) globalPatch.parkingCharges = patch.carParkingPrice.replace(/,/g, '')
                if (patch.bikeParkingPrice !== undefined) globalPatch.bikeParkingCharges = patch.bikeParkingPrice.replace(/,/g, '')
                updateData(globalPatch)
                return
            }
        }
        updateData({ floorGroups: newGroups })
    }

    const removeGroup = (id: string) => {
        setCollapsedGroups(prev => prev.filter(x => x !== id))
        const remaining = (data.floorGroups || []).filter(g => g.id !== id)
        updateData({ floorGroups: remaining })
        toast.success("Floor group deleted successfully")
    }


    return (
        <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full h-14 bg-gray-100 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-8">
                    <TabsTrigger value="pricing" className="rounded-2xl data-[state=active]:bg-white dark:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-[#1A3C8C] dark:text-blue-400 gap-2">
                        <Settings2 className="w-4 h-4" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] uppercase font-black opacity-50">Section 1</span>
                            <span className="text-xs font-bold">Global Configuration</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="rounded-2xl data-[state=active]:bg-white dark:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-[#1A3C8C] dark:text-blue-400 gap-2">
                        <Grid3X3 className="w-4 h-4" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] uppercase font-black opacity-50">Section 2</span>
                            <span className="text-xs font-bold">Tower Skeleton</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="configs" className="rounded-2xl data-[state=active]:bg-white dark:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-[#1A3C8C] dark:text-blue-400 gap-2">
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

                    <Section id="default-specs" title="Default Tower Specifications" description="Common unit finishers" icon={CheckCircle2} openIds={openIds} setOpenIds={setOpenIds}>
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

                    <Section id="tower-media-gallery" title="Tower Interior Gallery" description="Multi-shot common room views for all units in this tower" icon={LayoutGrid} openIds={openIds} setOpenIds={setOpenIds}>
                        <div className="mt-4">
                            <GalleryUpload
                                images={data.galleryImages || []}
                                onChange={urls => updateData({ galleryImages: urls })}
                                max={20}
                            />
                        </div>
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
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                title="Delete Floor Group"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    removeGroup(group.id);
                                                }}
                                                className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </Button>
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
                                                {(group.groupTypes || []).some(t => ['basement', 'parking', 'podium'].includes(t)) && (
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

                                            {/* ── GROUP FLOOR PLAN IMAGE ── */}
                                            <div className="bg-blue-50/50 p-4 rounded-2xl border-2 border-dashed border-blue-100">
                                                <label className="text-xs font-bold text-blue-900 dark:text-blue-400 uppercase tracking-wider mb-2 block">Group Floor Plan Image</label>
                                                <AboutImageUpload
                                                    value={group.floorPlanUrl}
                                                    onChange={url => updateGroup(group.id, { floorPlanUrl: url })}
                                                    title="Upload Group Floor Plan"
                                                    description="Common layout for this floor group"
                                                />
                                            </div>

                                            {/* ── CONDITIONAL INVENTORY LOGIC ── */}
                                            {(group.groupTypes || []).some(t => ['typical', 'ground', 'other'].includes(t)) ? (
                                                <>
                                                    <div className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pt-4">Unit / Parking Slot Mapping</div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {(group.layout || []).map((slot, sIdx) => {
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
                                                                <UnitSlotCardItem
                                                                    key={slot.id}
                                                                    slot={slot}
                                                                    sIdx={sIdx}
                                                                    configurations={data.configurations || []}
                                                                    updateSlot={updateSlot}
                                                                    removeSlot={removeSlot}
                                                                    onOpenVastu={() => setVastuSlotId({ groupId: group.id, slotId: slot.id })}
                                                                />
                                                            )
                                                        })}
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => {
                                                                const configs = data.configurations || []
                                                                const newSlot: UnitLayoutSlot = { 
                                                                    id: `slot-${Date.now()}`, 
                                                                    slotNumber: ((group.layout?.length || 0) + 1).toString(), 
                                                                    configId: configs[0]?.id || "",
                                                                    carpetAreaOverride: configs[0]?.carpetArea || 850
                                                                }
                                                                updateGroup(group.id, { layout: [...(group.layout || []), newSlot] })
                                                            }}
                                                            className="h-auto min-h-[280px] border-2 border-dashed border-blue-100 dark:border-blue-900/30 bg-blue-50/10 dark:bg-blue-900/5 rounded-[24px] hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all flex flex-col gap-3 group/add shadow-sm"
                                                        >
                                                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center border border-blue-100 dark:border-blue-800 group-hover/add:bg-blue-600 group-hover/add:border-blue-600 transition-all group-hover/add:scale-110 shadow-sm">
                                                                <Plus className="w-8 h-8 text-[#1A3C8C] dark:text-blue-400 group-hover/add:text-white" />
                                                            </div>
                                                            <span className="text-sm font-black text-[#1A3C8C] dark:text-blue-400 uppercase tracking-widest">Add Unit</span>
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (group.groupTypes || []).some(t => ['basement', 'parking', 'podium'].includes(t)) ? (
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
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-[#1A3C8C] dark:text-blue-400 font-black text-lg flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-blue-500" /> Live Tower Map
                                    </h3>
                                    {(() => {
                                        let totalUnitsInTower = 0;
                                        (data.floorGroups || []).forEach(group => {
                                            const validFloors = (group.floors || []).filter(f => f > 0);
                                            validFloors.forEach(floor => {
                                                const slotsToUse = group.floorOverrides?.[floor.toString()] || group.layout || [];
                                                totalUnitsInTower += slotsToUse.length;
                                            });
                                        });
                                        return totalUnitsInTower > 0 ? (
                                            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[10px] font-bold px-2 py-0.5">
                                                {totalUnitsInTower} Units
                                            </Badge>
                                        ) : null;
                                    })()}
                                </div>
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
                                            const isParking = (group.groupTypes || []).includes('parking')
                                            const isPodium = (group.groupTypes || []).includes('podium')
                                            const isAmenity = (group.groupTypes || []).includes('amenity')
                                            const isRefuge = (group.groupTypes || []).includes('refuge')

                                            let bgColor = "bg-white dark:bg-slate-900"
                                            let borderColor = "border-gray-200 dark:border-slate-700"
                                            let textColor = "text-gray-900 dark:text-white"
                                            if (isBasement) { bgColor = "bg-gray-800"; borderColor = "border-gray-900"; textColor = "text-white" }
                                            else if (isParking) { bgColor = "bg-slate-800"; borderColor = "border-slate-900"; textColor = "text-white" }
                                            else if (isAmenity) { bgColor = "bg-teal-50"; borderColor = "border-teal-200"; textColor = "text-teal-900" }
                                            else if (isPodium) { bgColor = "bg-orange-50"; borderColor = "border-orange-200"; textColor = "text-orange-900" }
                                            else if (isRefuge) { bgColor = "bg-red-50"; borderColor = "border-red-200"; textColor = "text-red-900" }

                                            const displayStr = floor === 0 ? "G" : floor < 0 ? `B${Math.abs(floor)}` : `${floor}`

                                            return (
                                                <div key={floor} className={`flex items-center gap-2 w-full border ${borderColor} ${bgColor} rounded-lg p-1.5 shadow-sm overflow-hidden transition-all hover:scale-[1.02]`}>
                                                    <div className={`w-8 shrink-0 flex items-center justify-center font-black text-xs ${isBasement || isParking ? 'text-gray-400 dark:text-slate-500' : 'text-gray-500 dark:text-slate-400'}`}>
                                                        {displayStr}
                                                    </div>
                                                    <div className="flex-1 flex gap-1 h-8">
                                                        {(isParking || isPodium) ? (
                                                            <div className={`flex items-center justify-center w-full gap-2 text-[10px] font-bold uppercase tracking-widest ${textColor} border-l border-current/20`}>
                                                                <Car className="w-3.5 h-3.5 opacity-70" /> {group.carSlots ? `${group.carSlots} Parking` : "Parking Area"}
                                                            </div>
                                                        ) : isBasement ? (
                                                            <div className={`flex items-center justify-center w-full gap-2 text-[10px] uppercase font-black tracking-widest ${textColor} border-l border-current/20`}>
                                                                <Layers className="w-3.5 h-3.5 opacity-70" /> Basement
                                                            </div>
                                                        ) : isAmenity ? (
                                                            <div className={`flex items-center justify-center w-full gap-2 text-[10px] uppercase font-black tracking-widest ${textColor} border-l border-current/20`}>
                                                                <Waves className="w-3.5 h-3.5 opacity-70" /> Club
                                                            </div>
                                                        ) : isRefuge ? (
                                                            <div className={`flex items-center justify-center w-full gap-2 text-[10px] uppercase font-black tracking-widest ${textColor} border-l border-current/20`}>
                                                                <Shield className="w-3.5 h-3.5 opacity-70" /> Refuge
                                                            </div>
                                                            ) : (() => {
                                                                const slotsToUse = group.floorOverrides?.[floor.toString()] || group.layout || []
                                                                return (
                                                                <div className="flex w-full min-h-[30px] items-center gap-1 border-l pl-2 border-gray-100 dark:border-slate-800 relative group/floor">
                                                                    {slotsToUse.length === 0 && (
                                                                        <div className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest w-full text-center">No Units</div>
                                                                    )}
                                                                    {slotsToUse.map((s, i) => {
                                                                        const typ = s.configId ? (data.configurations || []).find(c => c.id === s.configId)?.type : s.unitTypeOverride
                                                                        const shortTyp = typ ? typ : "UNIT"
                                                                        
                                                                        const slotNum = s.slotNumber || (i + 1).toString();
                                                                        const paddedSlot = slotNum.length === 1 ? `0${slotNum}` : slotNum;
                                                                        let unitDisplay = "";
                                                                        
                                                                        if (floor === 0) unitDisplay = `G${paddedSlot}`;
                                                                        else if (floor < 0) unitDisplay = `B${Math.abs(floor)}${paddedSlot}`;
                                                                        else unitDisplay = `${floor}${paddedSlot}`;

                                                                        return (
                                                                            <div key={i} className="flex-1 min-w-0 bg-[#F5F7FA] border border-gray-200 dark:border-slate-700 rounded flex flex-col items-center justify-center py-0.5 shadow-inner">
                                                                                <span className="text-[9px] font-bold text-[#1A3C8C] dark:text-blue-400 leading-none">{unitDisplay}</span>
                                                                                <span className="text-[6px] uppercase tracking-wider text-gray-400 dark:text-slate-500 font-bold truncate max-w-full px-0.5">{shortTyp}</span>
                                                                            </div>
                                                                        )
                                                                    })}

                                                                </div>
                                                                );
                                                            })()}
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
                            // If configId exists, check if it's in configurations. If not, it's an orphaned slot that NEEDS sync.
                            if (s.configId) {
                                const exists = (data.configurations || []).some(c => c.id === s.configId)
                                if (!exists) return true // Orphans need sync!
                                return true // Exists, but logic below will check for mismatch
                            }
                            // If no configId, check for unitTypeOverride
                            return !!s.unitTypeOverride
                        })

                        if (validSlots.length === 0) return null

                        let isMismatch = false;
                        const slotsToSync = validSlots.map(slot => {
                            let typeStr = slot.configId ? (data.configurations || []).find(c => c.id === slot.configId)?.type : slot.unitTypeOverride
                            
                            // Fallback for orphaned slots (if we deleted the default config)
                            if (!typeStr && slot.configId?.includes('2bhk')) typeStr = "2BHK"
                            if (!typeStr) typeStr = "2BHK" // Absolute fallback to avoid sync failure

                            const configObj = slot.configId ? (data.configurations || []).find(c => c.id === slot.configId) : null
                            const areaVal = slot.carpetAreaOverride || configObj?.carpetArea || 850
                            const baseTypeStr = typeStr.toUpperCase().replace(/\s/g, "")

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
                                                        loadingFactor: parseFloat(data.loadingFactor) || 40, 
                                                        basePrice: Math.round((parseFloat(data.baseRatePerSqft) || 5000) * Math.round(initialArea * (1 + (parseFloat(data.loadingFactor) || 40) / 100))), 
                                                        ratePerSqft: parseFloat(data.baseRatePerSqft) || 5000, 
                                                        parkingCharges: parseFloat(data.parkingCharges) || 500000,
                                                        gstPercentage: parseFloat(data.gstPercentage) || 5,
                                                        gstAmount: 0,
                                                        stampDutyPercentage: parseFloat(data.stampDutyPercentage) || 7,
                                                        stampDutyAmount: 0,
                                                        registrationCharges: parseFloat(data.registrationCharges) || 30000,
                                                        maintenancePerSqft: parseFloat(data.maintenancePerSqft) || 3.5, 
                                                        maintenanceType: data.maintenanceType || "monthly", otherCharges: 0,
                                                        allInclusivePrice: 0,
                                                        totalTaxes: 0,
                                                        facingPremiums: { north: "0", south: "0", east: "0", west: "0", "north-east": "0", "north-west": "0", "south-east": "0", "south-west": "0" },
                                                        facing: "East", balconyCount: 1, bathroomCount: 2, servantRoom: false, studyRoom: false, poojaRoom: false, dryBalcony: true,
                                                        flooringType: data.defaultFlooringType || "", wallFinish: data.defaultWallFinish || "", ceilingHeight: data.defaultCeilingHeight || "10.5 Ft",
                                                        furnishingStatus: data.defaultFurnishingStatus || "unfurnished", viewType: "City View", roomDimensions: getDefaultRoomDimensionsForType(originalLabel as any), vastuAnalysis: [], moveInChecklist: [],
                                                        floorPlanImage2D: "", countPerFloor: 1, isRateOverridden: false
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
                            <div className="flex flex-col items-center justify-center py-24 text-center gap-6 bg-slate-50/60 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                    <Layers className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                </div>
                                <div className="space-y-2 max-w-sm">
                                    <h4 className="text-lg font-black text-slate-700 dark:text-slate-300">No Floor Groups Yet</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Group Blueprints are generated from your Tower Skeleton. Please go to <span className="font-bold text-[#1A3C8C] dark:text-blue-400">Section 2 → Tower Skeleton</span> and add at least one floor group first.
                                    </p>
                                </div>
                            </div>
                        ) : (data.configurations || []).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center gap-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl border-2 border-dashed border-blue-100 dark:border-blue-900/30 shadow-inner">
                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center border border-blue-100 dark:border-blue-800 shadow-sm">
                                    <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
                                </div>
                                <div className="space-y-2 max-w-md px-6">
                                    <h4 className="text-lg font-black text-blue-900 dark:text-blue-200">No Blueprints Generated</h4>
                                    <p className="text-sm text-blue-700/60 dark:text-blue-400/60 leading-relaxed">
                                        Aapne floor groups toh bana diye hain, par abhi tak unke <span className="font-bold text-blue-600">Unit Types</span> (2BHK, 3BHK etc.) define nahi kiye.
                                    </p>
                                    <div className="pt-4 flex flex-col gap-2 items-center">
                                        <div className="text-[11px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/40 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800 uppercase tracking-widest">
                                            How to fix:
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            1. Go to <span className="font-bold">Tower Skeleton</span> tab.<br/>
                                            2. Click on a floor group and add <span className="font-bold">Units</span>.<br/>
                                            3. Return here and click <span className="font-bold text-[#1A3C8C] dark:text-blue-400">Execute Smart Sync</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
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
            {/* VASTU DIALOG */}
            <UnitVastuDialog
                vastuSlotId={vastuSlotId}
                onClose={() => setVastuSlotId(null)}
                data={data}
                updateGroup={updateGroup}
            />
        </div>
    )
}
