"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
    X,
    Trash2,
    Maximize,
    LayoutGrid,
    Compass,
    Eye,
    ShieldCheck,
    ChevronRight
} from "lucide-react"

import type { UnitLayoutSlot, UnitConfiguration } from "@/lib/builder-types"
import { FACINGS, VIEW_TYPES, STANDARD_BHK_TYPES } from "./unit-constants"

export interface UnitSlotCardItemProps {
    slot: UnitLayoutSlot
    sIdx: number
    configurations: UnitConfiguration[]
    updateSlot: (patch: Partial<UnitLayoutSlot>) => void
    removeSlot: () => void
    onOpenVastu: () => void
}

export function UnitSlotCardItem({
    slot,
    sIdx,
    configurations,
    updateSlot,
    removeSlot,
    onOpenVastu
}: UnitSlotCardItemProps) {
    const config = configurations.find(c => c.id === slot.configId) ||
        configurations.find(c => c.type.toUpperCase().replace(/\s/g, "") === (slot.unitTypeOverride || "").toUpperCase().replace(/\s/g, ""))

    const currentType: string = (slot.configId
        ? configurations.find(c => c.id === slot.configId)?.type
        : slot.unitTypeOverride) || ""

    const isStandardOrConfig = configurations.some(c => c.type === currentType) || (currentType ? STANDARD_BHK_TYPES.includes(currentType) : false)
    const [isCustomMode, setIsCustomMode] = useState(!isStandardOrConfig && !!currentType && !slot.configId)

    const initialCarpet = slot.carpetAreaOverride !== undefined && slot.carpetAreaOverride !== 0
        ? slot.carpetAreaOverride.toString()
        : (slot.carpetAreaOverride === 0 ? "" : (config?.carpetArea !== undefined ? config.carpetArea.toString() : ""))

    const [carpetText, setCarpetText] = useState(initialCarpet)

    useEffect(() => {
        if (slot.carpetAreaOverride !== undefined && slot.carpetAreaOverride !== 0) {
            setCarpetText(slot.carpetAreaOverride.toString())
        } else if (slot.carpetAreaOverride === 0) {
            setCarpetText("")
        } else if (config?.carpetArea !== undefined) {
            setCarpetText(config.carpetArea.toString())
        }
    }, [slot.carpetAreaOverride, config?.carpetArea])

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

                        {/* BHK Selector: Configured Units + Standard Types + Custom Option */}
                        {isCustomMode ? (
                            <div className="flex items-center gap-1.5">
                                <Input
                                    value={slot.unitTypeOverride ?? currentType ?? ""}
                                    onChange={e => updateSlot({ configId: "", unitTypeOverride: e.target.value })}
                                    placeholder="Type BHK (e.g. 2.5BHK)..."
                                    className="h-9 w-36 border-2 border-blue-400 bg-blue-50/40 text-xs font-black text-slate-900 rounded-xl px-2.5 focus:ring-2 focus:ring-blue-400"
                                    autoFocus
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCustomMode(false)}
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 rounded-lg"
                                    title="Switch to Dropdown"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Select
                                value={slot.configId ? `cfg:${slot.configId}` : (slot.unitTypeOverride || "")}
                                onValueChange={v => {
                                    if (v === "__custom__") {
                                        setIsCustomMode(true);
                                        updateSlot({ configId: "", unitTypeOverride: slot.unitTypeOverride || currentType || "" });
                                        return;
                                    }
                                    if (v.startsWith("cfg:")) {
                                        const cfgId = v.slice(4);
                                        const matching = configurations.find(c => c.id === cfgId);
                                        if (matching) {
                                            updateSlot({
                                                configId: matching.id,
                                                unitTypeOverride: undefined,
                                                carpetAreaOverride: matching.carpetArea
                                            });
                                        }
                                        return;
                                    }
                                    // Standard type selected
                                    const matchingConfig = configurations.find(c => c.type.toUpperCase().replace(/\s/g, "") === v.toUpperCase().replace(/\s/g, ""));
                                    if (matchingConfig) {
                                        updateSlot({
                                            configId: matchingConfig.id,
                                            unitTypeOverride: undefined,
                                            carpetAreaOverride: matchingConfig.carpetArea
                                        });
                                    } else {
                                        updateSlot({
                                            configId: "",
                                            unitTypeOverride: v,
                                            carpetAreaOverride: slot.carpetAreaOverride ?? (v === "1BHK" ? 450 : v === "2BHK" ? 650 : v === "3BHK" ? 950 : 850)
                                        });
                                    }
                                }}
                            >
                                <SelectTrigger className="h-9 min-w-32 max-w-[170px] border-2 border-slate-200 bg-white dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white rounded-xl shadow-sm px-2.5">
                                    <SelectValue placeholder="Select BHK">
                                        {currentType || "Select BHK"}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-2xl border-slate-200 z-[9999] max-h-72">
                                    {configurations.length > 0 && (
                                        <>
                                            <div className="px-2 py-1 text-[10px] font-black uppercase text-blue-600 tracking-wider bg-blue-50/50">
                                                Configured Units
                                            </div>
                                            {configurations.map(c => (
                                                <SelectItem key={`cfg-${c.id}`} value={`cfg:${c.id}`} className="text-xs font-bold py-1.5">
                                                    <div className="flex items-center justify-between w-full gap-2">
                                                        <span>{c.type}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">({c.carpetArea || 0} sqft)</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            <div className="h-px bg-slate-100 my-1" />
                                        </>
                                    )}

                                    <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                        Standard BHKs
                                    </div>
                                    {STANDARD_BHK_TYPES.map(type => (
                                        <SelectItem key={type} value={type} className="text-xs font-black uppercase py-1.5">
                                            {type}
                                        </SelectItem>
                                    ))}

                                    <div className="h-px bg-slate-100 my-1" />
                                    <SelectItem value="__custom__" className="text-xs font-black text-blue-600 hover:text-blue-700 py-2 bg-blue-50/40">
                                        ✏️ + Custom BHK / Other...
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {config && (
                            <div className="flex flex-col items-end leading-none">
                                <span className="text-[10px] font-bold text-emerald-600">
                                    ₹{(((config.allInclusivePrice || config.basePrice || 0)) / 100000).toFixed(1)}L
                                </span>
                                <span className="text-[8px] text-gray-400 uppercase tracking-tighter">All In</span>
                            </div>
                        )}
                    </div>

                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={removeSlot} 
                        className="h-8 w-8 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="Delete Slot"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                {/* Data Row: Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-[#1A3C8C] dark:text-blue-400 uppercase tracking-widest pl-1">Carpet Area (SQFT)</Label>
                        <div className="relative">
                            <Input
                                type="text"
                                inputMode="numeric"
                                value={carpetText}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                        setCarpetText(val);
                                        const num = parseFloat(val);
                                        updateSlot({ carpetAreaOverride: isNaN(num) ? 0 : num });
                                    }
                                }}
                                onBlur={() => {
                                    if (!carpetText || carpetText === "0") {
                                        if (config?.carpetArea) {
                                            setCarpetText(config.carpetArea.toString());
                                            updateSlot({ carpetAreaOverride: config.carpetArea });
                                        }
                                    }
                                }}
                                placeholder={config?.carpetArea?.toString() || "e.g. 850"}
                                className="h-10 w-full border-2 border-slate-200 bg-white dark:bg-slate-900 text-base font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-100 px-3 rounded-xl shadow-sm"
                            />
                            <Maximize className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-[#1A3C8C] dark:text-blue-400 uppercase tracking-widest pl-1">Unit Identity (NO.)</Label>
                        <div className="relative">
                            <Input
                                value={slot.slotNumber ?? ""}
                                onChange={e => updateSlot({ slotNumber: e.target.value })}
                                placeholder="101"
                                className="h-10 w-full border-2 border-slate-200 bg-white dark:bg-slate-900 text-base font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-100 px-3 rounded-xl shadow-sm"
                            />
                            <LayoutGrid className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </div>

                {/* Row 2: Facing & View */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 bg-gradient-to-r from-blue-50 to-white p-3 rounded-xl border-2 border-blue-100/50">
                        <Label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <Compass className="w-4 h-4" /> Facing
                        </Label>
                        <Select
                            value={slot.facingOverride || config?.facing || ""}
                            onValueChange={v => updateSlot({ facingOverride: v })}
                        >
                            <SelectTrigger className="h-10 w-full border-slate-200 bg-white dark:bg-slate-900 text-base font-black text-[#1A3C8C] dark:text-blue-400 focus:ring-4 focus:ring-blue-100 px-3 rounded-xl shadow-sm">
                                <SelectValue placeholder={config?.facing ? `Default (${config.facing})` : "Select Facing"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-2xl border-slate-100">
                                {FACINGS.map(f => (
                                    <SelectItem key={f} value={f} className="text-[10px] font-black uppercase py-2">{f}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1 bg-gradient-to-r from-indigo-50 to-white p-3 rounded-xl border-2 border-indigo-100/50">
                        <Label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                            <Eye className="w-4 h-4" /> View Type
                        </Label>
                        <Select
                            value={slot.viewOverride || ""}
                            onValueChange={v => updateSlot({ viewOverride: v })}
                        >
                            <SelectTrigger className="h-10 w-full border-slate-200 bg-white dark:bg-slate-900 text-base font-black text-[#1A3C8C] dark:text-blue-400 focus:ring-4 focus:ring-indigo-100 px-3 rounded-xl shadow-sm">
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
                    <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full h-10 border-slate-200 bg-white dark:bg-slate-900 text-[#1A3C8C] dark:text-blue-400 font-bold rounded-xl justify-between px-3 shadow-sm"
                        onClick={onOpenVastu}
                    >
                        {slot.vastuDetails && Object.keys(slot.vastuDetails).length > 0 ? "Vastu Configured" : "Configure Vastu"}
                        <ChevronRight className="w-4 h-4 opacity-50" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
