"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { AboutImageUpload } from "@/components/ui/media-uploads"
import {
    Minus,
    Plus,
    Layers,
    Home,
    Waves,
    Building2,
    Shield,
    Car,
    Grid3X3,
    Check,
    CheckCircle2
} from "lucide-react"

import type { FloorGroup, UnitConfiguration } from "@/lib/builder-types"
import { Field, Grid } from "./UnitFormPrimitives"

export interface AddGroupModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (data: {
        floorRange: string
        groupTypes: FloorGroup["groupTypes"]
        name: string
        unitsPerFloor: number
        floorRise?: number
        cloneFromGroupId?: string
        floorPlanUrl?: string
    }) => void
    configurations: UnitConfiguration[]
    defaultUnits: number
    defaultFloorRise: number
    existingGroups: FloorGroup[]
}

export function AddGroupModal({
    isOpen,
    onClose,
    onAdd,
    configurations,
    defaultUnits,
    defaultFloorRise,
    existingGroups
}: AddGroupModalProps) {
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
        { id: 'basement', label: 'Basement', icon: Layers },
        { id: 'parking', label: 'Parking Area', icon: Car },
        { id: 'other', label: 'Other Purpose', icon: Grid3X3 },
    ]

    const Stepper = ({ value, onChange, label, hint, min = -100 }: { value: string, onChange: (v: string) => void, label: string, hint: string, min?: number }) => {
        const [inputValue, setInputValue] = useState(() => {
            let num = parseInt(value.replace(/[^0-9-]/g, "")) || 0
            if (value.toUpperCase().startsWith("B")) num = -Math.abs(num)
            return num === 0 ? "G" : (num < 0 ? `B${Math.abs(num)}` : `${num}`)
        })

        useEffect(() => {
            let num = parseInt(value.replace(/[^0-9-]/g, "")) || 0
            if (value.toUpperCase().startsWith("B")) num = -Math.abs(num)
            setInputValue(num === 0 ? "G" : (num < 0 ? `B${Math.abs(num)}` : `${num}`))
        }, [value])

        let num = parseInt(value.replace(/[^0-9-]/g, "")) || 0
        if (value.toUpperCase().startsWith("B")) num = -Math.abs(num)

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
                            value={inputValue ?? ""}
                            onChange={e => {
                                setInputValue(e.target.value.toUpperCase())
                            }}
                            onBlur={() => {
                                let n = parseInt(inputValue.replace(/[^0-9-]/g, "")) || 0
                                if (inputValue.toUpperCase().startsWith("B")) n = -Math.abs(n)
                                if (inputValue.toUpperCase() === 'G' || inputValue === '0') n = 0
                                
                                const formatted = n === 0 ? "G" : (n < 0 ? `B${Math.abs(n)}` : `${n}`)
                                setInputValue(formatted)
                                onChange(formatted)
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
                                <Layers className="w-7 h-7 text-[#1A3C8C] dark:text-white" />
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
                                    value={name ?? ""}
                                    onChange={e => setName(e.target.value)}
                                    className="h-12 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 hover:bg-white dark:bg-slate-900 transition-all font-bold text-gray-700 dark:text-slate-300 border-2 shadow-sm focus:ring-[#1A3C8C]/20"
                                    placeholder="E.g. Mixed Use L1"
                                />
                            </Field>
                            <Field label="Floor Rise (₹/floor)" hint="Applies to units in this group">
                                <Input
                                    type="number"
                                    value={floorRise ?? ""}
                                    onChange={e => setFloorRise(Number(e.target.value))}
                                    className="h-12 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 hover:bg-white dark:bg-slate-900 transition-all font-bold text-gray-700 dark:text-slate-300 border-2 shadow-sm focus:ring-[#1A3C8C]/20"
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
                                    <SelectTrigger className="h-12 bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800 border-2 rounded-xl font-bold text-gray-700 dark:text-slate-300">
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
                                        className="w-full h-16 bg-[#1A3C8C] dark:bg-blue-600 hover:bg-[#1A3C8C]/90 dark:hover:bg-blue-600/90 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-200 transition-all active:scale-[0.98] group relative overflow-hidden disabled:opacity-50"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                            {hasOverlap ? "Floor Already Taken" : "Create Mixed-Use Group"}
                                            <CheckCircle2 className="w-6 h-6 opacity-50 group-hover:opacity-100 transition-opacity" />
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
