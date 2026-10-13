"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AboutImageUpload } from "@/components/ui/media-uploads"
import {
    Trash2,
    ChevronDown,
    ChevronUp,
    Home,
    Building2,
    Sparkles,
    Grid3X3,
    Check,
    Info,
    Ruler,
    CheckCircle2,
    FileText
} from "lucide-react"

import {
    getDefaultRoomDimensionsForType,
    type UnitConfiguration,
    type RoomDimension,
    type VastuItem,
    type MoveInItem
} from "@/lib/builder-types"

import { Section, Field, Grid } from "./UnitFormPrimitives"
import { FACINGS, VIEW_TYPES } from "./unit-constants"

export interface UnitConfigCardProps {
    config: UnitConfiguration
    index: number
    onChange: (patch: Partial<UnitConfiguration>) => void
    onRemove: () => void
    globalLoadingFactor?: string
}

export function UnitConfigCard({
    config,
    index,
    onChange,
    onRemove,
    globalLoadingFactor
}: UnitConfigCardProps) {
    const [open, setOpen] = useState(index === 0)

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

    const autoFillRooms = (type: string) => {
        const defaultRooms = getDefaultRoomDimensionsForType(type);
        onChange({ roomDimensions: defaultRooms });
    }

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
        if ((!config.roomDimensions || config.roomDimensions.length === 0) && config.type) {
            autoFillRooms(config.type);
        }
        if ((!config.vastuAnalysis || config.vastuAnalysis.length === 0) && config.type) {
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

    const [openIds, setOpenIds] = useState<string[]>(['unit_setup'])

    return (
        <Card className={`border-2 transition-all duration-300 ${open ? "border-[#1A3C8C] shadow-lg" : "border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:border-slate-700"}`}>
            <CardHeader className="py-3 px-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(!open)}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${open ? "bg-[#1A3C8C] dark:bg-blue-600 text-white" : "bg-white dark:bg-slate-900 text-[#1A3C8C] dark:text-blue-400 border border-[#1A3C8C]/20"}`}>
                            {config.type.slice(0, 1)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{config.type} Variant</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                                {config.carpetArea || 0} Sq.Ft • {config.facing || "No Facing"} • ₹{config.ratePerSqft || 0}/sqft
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div 
                            className="text-right"
                            title={`All Inclusive: ₹${(config.allInclusivePrice || 0).toLocaleString('en-IN')}${config.basePrice ? ` (Flat Cost: ₹${config.basePrice.toLocaleString('en-IN')})` : ''}`}
                        >
                            <p className="text-xs font-bold text-emerald-600">
                                {(() => {
                                    const allInPrice = config.allInclusivePrice || config.basePrice || 0;
                                    if (allInPrice >= 10000000) {
                                        return `₹${(allInPrice / 10000000).toFixed(2).replace(/\.00$/, "")}Cr`;
                                    }
                                    if (allInPrice >= 100000) {
                                        return `₹${(allInPrice / 100000).toFixed(1)}L`;
                                    }
                                    return `₹${allInPrice.toLocaleString('en-IN')}`;
                                })()}
                            </p>
                            <p className="text-[9px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">All Inclusive</p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-all active:scale-90">
                            <Trash2 className="w-4 h-4" />
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
                                        const gstAmt = price * gst / 100
                                        const stampAmt = price * stamp / 100
                                        const taxes = gstAmt + stampAmt + reg
                                        const allIn = price + taxes + (config.otherCharges ?? 0)
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
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                value={config.ratePerSqft || ""} 
                                                onChange={e => {
                                                    const rate = Number(e.target.value)
                                                    const flatCost = rate * config.builtUpArea
                                                    const gst = config.gstPercentage ?? 5
                                                    const stamp = config.stampDutyPercentage ?? 6
                                                    const reg = config.registrationCharges ?? 30000
                                                    const gstAmt = flatCost * gst / 100
                                                    const stampAmt = flatCost * stamp / 100
                                                    const taxes = gstAmt + stampAmt + reg
                                                    const allIn = flatCost + taxes + (config.otherCharges ?? 0)
                                                    onChange({ 
                                                        ratePerSqft: rate, 
                                                        basePrice: flatCost, 
                                                        gstAmount: Math.round(gstAmt),
                                                        stampDutyAmount: Math.round(stampAmt),
                                                        totalTaxes: Math.round(taxes), 
                                                        allInclusivePrice: Math.round(allIn),
                                                        isRateOverridden: true
                                                    })
                                                }} 
                                                placeholder="5000" 
                                                className={config.isRateOverridden ? "border-amber-200 bg-amber-50/30" : ""}
                                            />
                                            {config.isRateOverridden && (
                                                <button 
                                                    onClick={() => onChange({ isRateOverridden: false })}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-amber-600 hover:text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded shadow-sm transition-colors"
                                                    title="Click to inherit from Global Configuration"
                                                >
                                                    RESET
                                                </button>
                                            )}
                                        </div>
                                    </Field>
                                    <Field label="Flat Cost (₹)" hint="Built-Up Area × Base Rate">
                                        <Input 
                                             type="number" 
                                             value={config.basePrice || ""} 
                                             onChange={e => {
                                                 const price = Number(e.target.value)
                                                 const gst = config.gstPercentage ?? 5
                                                 const stamp = config.stampDutyPercentage ?? 6
                                                 const reg = config.registrationCharges ?? 30000
                                                 const gstAmt = price * gst / 100
                                                 const stampAmt = price * stamp / 100
                                                 const taxes = gstAmt + stampAmt + reg
                                                 const allIn = price + taxes + (config.otherCharges ?? 0)
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

                                    <Field label="Built-Up Area" hint="Carpet Area + Loading Factor (%)"><Input type="number" value={config.builtUpArea ?? ""} onChange={e => onChange({ builtUpArea: Number(e.target.value) })} placeholder="1020" /></Field>
                                    <Field label="Loading Factor %"><Input type="number" value={config.loadingFactor ?? ""} onChange={e => {
                                        const loading = Number(e.target.value) || parseFloat(globalLoadingFactor || "40") || 40
                                        const builtUp = Math.round(config.carpetArea * (1 + loading / 100))
                                        const price = (config.ratePerSqft || 5000) * builtUp
                                        const gst = config.gstPercentage ?? 5
                                        const stamp = config.stampDutyPercentage ?? 6
                                        const reg = config.registrationCharges ?? 30000
                                        const gstAmt = price * gst / 100
                                        const stampAmt = price * stamp / 100
                                        const taxes = gstAmt + stampAmt + reg
                                        const allIn = price + taxes + (config.otherCharges ?? 0)
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

                                    <Field label="All Inclusive Price (₹)" hint="Flat Cost + All Taxes + Parking + Other Charges">
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
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes + (config.otherCharges ?? 0)
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
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes + (config.otherCharges ?? 0)
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
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes + (config.otherCharges ?? 0)
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
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes + (config.otherCharges ?? 0)
                                                onChange({ stampDutyPercentage: Number(stamp.toFixed(2)), stampDutyAmount: stampAmt, totalTaxes: Math.round(taxes), allInclusivePrice: Math.round(allIn) })
                                            }} 
                                            placeholder="350000" 
                                        />
                                    </Field>
                                    <Field label="All Taxes (₹)" hint="GST Amount + Stamp Duty Amount + Registration">
                                        <Input 
                                            type="number" 
                                            value={config.totalTaxes || ""} 
                                            onChange={e => {
                                                const taxes = Number(e.target.value)
                                                const flat = config.basePrice || 0
                                                const allIn = flat + taxes + (config.otherCharges ?? 0)
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
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes + (config.otherCharges ?? 0)
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
                                    <Field label="Car Parking (₹)">
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
                                                const allIn = flat + taxes + (config.otherCharges ?? 0)
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
                                    <Field label="Bike Parking (₹)">
                                        <Input 
                                            type="number" 
                                            value={config.bikeParkingCharges ?? ""} 
                                            onChange={e => {
                                                const bikePark = Number(e.target.value)
                                                const flat = config.basePrice || 0
                                                const gst = config.gstPercentage ?? 5
                                                const stamp = config.stampDutyPercentage ?? 7
                                                const gstAmt = (flat * gst / 100)
                                                const stampAmt = (flat * stamp / 100)
                                                const reg = config.registrationCharges ?? 30000
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes + (config.otherCharges ?? 0)
                                                onChange({ 
                                                    bikeParkingCharges: bikePark, 
                                                    gstAmount: Math.round(gstAmt),
                                                    stampDutyAmount: Math.round(stampAmt),
                                                    totalTaxes: Math.round(taxes), 
                                                    allInclusivePrice: Math.round(allIn) 
                                                })
                                            }} 
                                            placeholder="50000" 
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
                                                const taxes = gstAmt + stampAmt + reg
                                                const allIn = flat + taxes + other
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

                                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Calculation Breakdown</div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
                                        <span>Base (₹{config.basePrice || 0})</span>
                                        <span className="text-slate-400">+</span>
                                        <span title={`GST (₹${config.gstAmount || 0}) + Stamp Duty (₹${config.stampDutyAmount || 0}) + Reg (₹${config.registrationCharges || 30000})`}>Taxes (₹{config.totalTaxes || 0})</span>
                                        <span className="text-slate-400">+</span>
                                        <span>Other (₹{config.otherCharges || 0})</span>
                                        <span className="text-slate-400">=</span>
                                        <span className="font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">₹{config.allInclusivePrice || 0}</span>
                                    </div>
                                    <div className="mt-2 text-[10px] text-slate-400">
                                        *Taxes = GST (₹{config.gstAmount || 0}) + Stamp Duty (₹{config.stampDutyAmount || 0}) + Reg (₹{config.registrationCharges || 30000})
                                    </div>
                                </div>
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
                                                            <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-indigo-700' : 'text-gray-600 dark:text-slate-400'}`}>{label}</span>
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

                            <Section id="dimensions" title="Room Dimensions Layout" description="Individual room lengths & widths auto-generated by BHK configuration" icon={Ruler} openIds={openIds} setOpenIds={setOpenIds}>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Room Dimensions ({config.type})</p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => autoFillRooms(config.type)}
                                            className="h-7 text-[10px] font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center gap-1"
                                        >
                                            <Sparkles className="w-3 h-3 text-indigo-500" />
                                            Auto-fill {config.type} Rooms
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={addRoom} className="h-7 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50">+ Add Room</Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {(config.roomDimensions || []).map(room => (
                                        <div key={room.id} className="grid grid-cols-4 gap-2 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-xl group/room items-center">
                                            <Input value={room.roomName ?? ""} onChange={e => updateRoom(room.id, { roomName: e.target.value })} placeholder="Room Name" className="h-8 text-[11px] bg-white dark:bg-slate-900 border-0 shadow-sm font-medium" />
                                            <Input value={room.length ?? ""} onChange={e => updateRoom(room.id, { length: e.target.value })} placeholder="Length" className="h-8 text-[11px] bg-white dark:bg-slate-900 border-0 shadow-sm text-center" />
                                            <Input value={room.width ?? ""} onChange={e => updateRoom(room.id, { width: e.target.value })} placeholder="Width" className="h-8 text-[11px] bg-white dark:bg-slate-900 border-0 shadow-sm text-center" />
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">FT</span>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeRoom(room.id)} className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto opacity-0 group-hover/room:opacity-100 transition-all active:scale-90"><Trash2 className="w-3 h-3" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                    {(config.roomDimensions || []).length === 0 && (
                                        <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl space-y-3">
                                            <p className="text-xs text-gray-500 dark:text-slate-400">No room dimensions added yet for this {config.type}.</p>
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => autoFillRooms(config.type)}
                                                    className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 mr-1 text-white" />
                                                    Auto-generate {config.type} Rooms
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addRoom}
                                                    className="h-8 text-xs font-semibold"
                                                >
                                                    + Add Custom Room
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Section>
                        </TabsContent>

                        <TabsContent value="media" className="space-y-6 focus-visible:outline-none">
                            <Section id="checklist" title="Move-in Provisions" description="Furnishing included list" icon={CheckCircle2} openIds={openIds} setOpenIds={setOpenIds}>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Included Objects</p>
                                    <Button variant="ghost" size="sm" onClick={addMoveIn} className="h-7 text-[10px] font-bold text-amber-600 hover:bg-amber-50">+ Add Item</Button>
                                </div>
                                <div className="space-y-2">
                                    {(config.moveInChecklist || []).map(m => (
                                        <div key={m.id} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-xl group/check">
                                            <Switch
                                                checked={m.included}
                                                onCheckedChange={v => updateMoveIn(m.id, { included: v })}
                                            />
                                            <Input value={m.item ?? ""} onChange={e => updateMoveIn(m.id, { item: e.target.value })} placeholder="Modular Kitchen" className="h-8 text-[11px] bg-white dark:bg-slate-900 border-0 shadow-sm flex-1" />
                                            <Button variant="ghost" size="sm" onClick={() => removeMoveIn(m.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover/check:opacity-100 transition-all active:scale-90"><Trash2 className="w-4 h-4" /></Button>
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
                        </TabsContent>
                    </Tabs>
                </CardContent>
            )}
        </Card>
    )
}
