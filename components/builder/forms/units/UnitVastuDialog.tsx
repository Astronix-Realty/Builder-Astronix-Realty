"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { UnitTemplate, FloorGroup } from "@/lib/builder-types"
import { Field } from "./UnitFormPrimitives"

export interface UnitVastuDialogProps {
    vastuSlotId: { groupId: string; slotId: string } | null
    onClose: () => void
    data: UnitTemplate
    updateGroup: (groupId: string, patch: Partial<FloorGroup>) => void
}

export function UnitVastuDialog({
    vastuSlotId,
    onClose,
    data,
    updateGroup
}: UnitVastuDialogProps) {
    if (!vastuSlotId) return null

    const activeGroup = data.floorGroups?.find(g => g.id === vastuSlotId.groupId)
    const activeSlot = activeGroup?.layout?.find(s => s.id === vastuSlotId.slotId)

    if (!activeGroup || !activeSlot) return null

    const activeConfig = (data.configurations || []).find(c => c.id === activeSlot.configId) ||
        (data.configurations || []).find(c => c.type.toUpperCase().replace(/\s/g, "") === (activeSlot.unitTypeOverride || "").toUpperCase().replace(/\s/g, ""))

    const typeStr = (activeConfig?.type || activeSlot.unitTypeOverride || (activeSlot as any).type || "").trim()
    let bedroomCount = 1
    const match = typeStr.match(/(\d+)\s*BHK/i)
    if (match) {
        bedroomCount = parseInt(match[1], 10)
    } else if (['studio', 'penthouse', 'duplex'].some(k => typeStr.toLowerCase().includes(k))) {
        bedroomCount = 1
    }

    const slotIndex = activeGroup.layout.findIndex(s => s.id === activeSlot.id)

    const updateVastu = (field: string, value: string) => {
        const newLayout = activeGroup.layout.map(s => {
            if (s.id === activeSlot.id) {
                return {
                    ...s,
                    vastuDetails: {
                        ...(s.vastuDetails || {}),
                        [field]: value
                    }
                }
            }
            return s
        })
        updateGroup(activeGroup.id, { layout: newLayout })
    }

    const details = activeSlot.vastuDetails || {}

    return (
        <Dialog open={!!vastuSlotId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-[#1A3C8C]">
                        Vastu Configuration
                        {typeStr && (
                            <span className="text-xs bg-blue-100 text-blue-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                                {typeStr}
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 font-medium">
                        Provide Vastu details for Slot #{slotIndex >= 0 ? slotIndex + 1 : ''} {typeStr ? `(${typeStr})` : ''} layout.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <Field label="1. Main Entrance (Mukhya Dwar)">
                        <Select value={details.mainEntrance || ""} onValueChange={v => updateVastu('mainEntrance', v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="North">North</SelectItem>
                                <SelectItem value="South">South</SelectItem>
                                <SelectItem value="East">East</SelectItem>
                                <SelectItem value="West">West</SelectItem>
                                <SelectItem value="North-East">North-East</SelectItem>
                                <SelectItem value="North-West">North-West</SelectItem>
                                <SelectItem value="South-East">South-East</SelectItem>
                                <SelectItem value="South-West">South-West</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="2. Pooja Room (Mandir)">
                        <Select value={details.poojaRoom || ""} onValueChange={v => updateVastu('poojaRoom', v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="North">North</SelectItem>
                                <SelectItem value="South">South</SelectItem>
                                <SelectItem value="East">East</SelectItem>
                                <SelectItem value="West">West</SelectItem>
                                <SelectItem value="North-East">North-East</SelectItem>
                                <SelectItem value="North-West">North-West</SelectItem>
                                <SelectItem value="South-East">South-East</SelectItem>
                                <SelectItem value="South-West">South-West</SelectItem>
                                <SelectItem value="Center">Center</SelectItem>
                                <SelectItem value="No Pooja Room">No Pooja Room</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="3. Kitchen (Rasoi)">
                        <Select value={details.kitchen || ""} onValueChange={v => updateVastu('kitchen', v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="North">North</SelectItem>
                                <SelectItem value="South">South</SelectItem>
                                <SelectItem value="East">East</SelectItem>
                                <SelectItem value="West">West</SelectItem>
                                <SelectItem value="North-East">North-East</SelectItem>
                                <SelectItem value="North-West">North-West</SelectItem>
                                <SelectItem value="South-East">South-East</SelectItem>
                                <SelectItem value="South-West">South-West</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    {bedroomCount > 0 && (
                        <Field label="4. Master Bedroom">
                            <Select value={details.masterBedroom || ""} onValueChange={v => updateVastu('masterBedroom', v)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="North">North</SelectItem>
                                    <SelectItem value="South">South</SelectItem>
                                    <SelectItem value="East">East</SelectItem>
                                    <SelectItem value="West">West</SelectItem>
                                    <SelectItem value="North-East">North-East</SelectItem>
                                    <SelectItem value="North-West">North-West</SelectItem>
                                    <SelectItem value="South-East">South-East</SelectItem>
                                    <SelectItem value="South-West">South-West</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    )}
                    {bedroomCount > 1 && (
                        <Field label="4b. Bedroom 2">
                            <Select value={details.bedroom2 || ""} onValueChange={v => updateVastu('bedroom2', v)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="North">North</SelectItem>
                                    <SelectItem value="South">South</SelectItem>
                                    <SelectItem value="East">East</SelectItem>
                                    <SelectItem value="West">West</SelectItem>
                                    <SelectItem value="North-East">North-East</SelectItem>
                                    <SelectItem value="North-West">North-West</SelectItem>
                                    <SelectItem value="South-East">South-East</SelectItem>
                                    <SelectItem value="South-West">South-West</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    )}
                    {bedroomCount > 2 && (
                        <Field label="4c. Bedroom 3">
                            <Select value={details.bedroom3 || ""} onValueChange={v => updateVastu('bedroom3', v)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="North">North</SelectItem>
                                    <SelectItem value="South">South</SelectItem>
                                    <SelectItem value="East">East</SelectItem>
                                    <SelectItem value="West">West</SelectItem>
                                    <SelectItem value="North-East">North-East</SelectItem>
                                    <SelectItem value="North-West">North-West</SelectItem>
                                    <SelectItem value="South-East">South-East</SelectItem>
                                    <SelectItem value="South-West">South-West</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    )}
                    {bedroomCount > 3 && (
                        <Field label="4d. Bedroom 4">
                            <Select value={details.bedroom4 || ""} onValueChange={v => updateVastu('bedroom4', v)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="North">North</SelectItem>
                                    <SelectItem value="South">South</SelectItem>
                                    <SelectItem value="East">East</SelectItem>
                                    <SelectItem value="West">West</SelectItem>
                                    <SelectItem value="North-East">North-East</SelectItem>
                                    <SelectItem value="North-West">North-West</SelectItem>
                                    <SelectItem value="South-East">South-East</SelectItem>
                                    <SelectItem value="South-West">South-West</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    )}
                    {bedroomCount > 4 && (
                        <Field label="4e. Bedroom 5">
                            <Select value={details.bedroom5 || ""} onValueChange={v => updateVastu('bedroom5', v)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="North">North</SelectItem>
                                    <SelectItem value="South">South</SelectItem>
                                    <SelectItem value="East">East</SelectItem>
                                    <SelectItem value="West">West</SelectItem>
                                    <SelectItem value="North-East">North-East</SelectItem>
                                    <SelectItem value="North-West">North-West</SelectItem>
                                    <SelectItem value="South-East">South-East</SelectItem>
                                    <SelectItem value="South-West">South-West</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    )}

                    <Field label="5. Bathrooms aur Toilets">
                        <Select value={details.bathrooms || ""} onValueChange={v => updateVastu('bathrooms', v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="North">North</SelectItem>
                                <SelectItem value="South">South</SelectItem>
                                <SelectItem value="East">East</SelectItem>
                                <SelectItem value="West">West</SelectItem>
                                <SelectItem value="North-East">North-East</SelectItem>
                                <SelectItem value="North-West">North-West</SelectItem>
                                <SelectItem value="South-East">South-East</SelectItem>
                                <SelectItem value="South-West">South-West</SelectItem>
                                <SelectItem value="Center">Center</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="6. Brahmasthan (Ghar ka Center)">
                        <Select value={details.brahmasthan || ""} onValueChange={v => updateVastu('brahmasthan', v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Open and Clean">Open and Clean</SelectItem>
                                <SelectItem value="Has Pillar">Has Pillar</SelectItem>
                                <SelectItem value="Has Toilet">Has Toilet</SelectItem>
                                <SelectItem value="Has Kitchen">Has Kitchen</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="7. Flat ka Shape aur Cuts">
                        <Select value={details.shapeAndCuts || ""} onValueChange={v => updateVastu('shapeAndCuts', v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Square">Square</SelectItem>
                                <SelectItem value="Rectangular">Rectangular</SelectItem>
                                <SelectItem value="Cut in North-East">Cut in North-East</SelectItem>
                                <SelectItem value="Cut in North-West">Cut in North-West</SelectItem>
                                <SelectItem value="Cut in South-East">Cut in South-East</SelectItem>
                                <SelectItem value="Cut in South-West">Cut in South-West</SelectItem>
                                <SelectItem value="Irregular Shape">Irregular Shape</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="8. Balcony aur Windows">
                        <Select value={details.balconyAndWindows || ""} onValueChange={v => updateVastu('balconyAndWindows', v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="North">North</SelectItem>
                                <SelectItem value="South">South</SelectItem>
                                <SelectItem value="East">East</SelectItem>
                                <SelectItem value="West">West</SelectItem>
                                <SelectItem value="North-East">North-East</SelectItem>
                                <SelectItem value="North-West">North-West</SelectItem>
                                <SelectItem value="South-East">South-East</SelectItem>
                                <SelectItem value="South-West">South-West</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </div>

                <DialogFooter>
                    <Button onClick={onClose} className="w-full bg-[#1A3C8C] hover:bg-blue-700 text-white">
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
