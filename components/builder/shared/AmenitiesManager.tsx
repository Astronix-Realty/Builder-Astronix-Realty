"use client"

import React, { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Plus, X, Star, Users, Gamepad2, Home, Leaf, ShieldCheck, Info, ChevronDown, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MiniImageUpload } from "./MiniImageUpload"
import { AmenityItem } from "@/lib/builder-types"

interface AmenitiesManagerProps {
    amenities: AmenityItem[]
    onChange: (amenities: AmenityItem[]) => void
    title?: string
    description?: string
}

const CATEGORIES: { id: AmenityItem["category"]; label: string; icon: any; suggestions: string[] }[] = [
    { 
        id: "social", 
        label: "Social", 
        icon: Users,
        suggestions: ["Amphitheatre", "Party Lawn", "Sky Lounge", "Senior Citizen Area", "Co-working Space"]
    },
    { 
        id: "recreation", 
        label: "Recreation", 
        icon: Gamepad2,
        suggestions: ["Swimming Pool", "Kids Pool", "Jacuzzi", "Gymnasium", "Indoor Games", "Mini Theatre"]
    },
    { 
        id: "community", 
        label: "Community", 
        icon: Home,
        suggestions: ["Clubhouse", "Multipurpose Hall", "Creche", "Convenience Store", "Guest Suites"]
    },
    { 
        id: "green", 
        label: "Green", 
        icon: Leaf,
        suggestions: ["Jogging Track", "Yoga Deck", "Meditation Plaza", "Landscaped Garden", "Zen Garden"]
    },
    { 
        id: "security", 
        label: "Security", 
        icon: ShieldCheck,
        suggestions: ["CCTV Surveillance", "RFID Access", "Intercom Facility", "Manned Security", "Gated Community"]
    },
    { 
        id: "general", 
        label: "General", 
        icon: Info,
        suggestions: ["Ample Parking", "Power Backup", "Wi-Fi Connectivity", "Sewage Treatment", "Rainwater Harvesting"]
    }
]

export function AmenitiesManager({ amenities, onChange, title, description }: AmenitiesManagerProps) {
    const [activeTab, setActiveTab] = useState<AmenityItem["category"]>("social")
    const [inputValue, setInputValue] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)

    const addAmenity = (name: string, cat: AmenityItem["category"] = activeTab) => {
        if (!name.trim()) return
        const newItem: AmenityItem = {
            id: uuidv4(),
            title: name.trim(),
            category: cat,
            image: ""
        }
        onChange([...amenities, newItem])
        setInputValue("")
        setShowSuggestions(false)
    }

    const removeAmenity = (id: string) => {
        onChange(amenities.filter(a => a.id !== id))
    }

    const updateAmenity = (id: string, patch: Partial<AmenityItem>) => {
        onChange(amenities.map(a => a.id === id ? { ...a, ...patch } : a))
    }

    const filteredSuggestions = CATEGORIES.find(c => c.id === activeTab)?.suggestions.filter(
        s => !amenities.some(a => a.title.toLowerCase() === s.toLowerCase())
    ) || []

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                {title && <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    {title}
                </h3>}
                {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AmenityItem["category"])} className="w-full">
                <TabsList className="bg-gray-100/80 p-1 rounded-xl h-auto flex-wrap sm:flex-nowrap justify-start mb-6 gap-1">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon
                        const count = amenities.filter(a => a.category === cat.id).length
                        return (
                            <TabsTrigger 
                                key={cat.id} 
                                value={cat.id}
                                className="px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#1A3C8C] text-xs font-semibold gap-2 flex-shink-0"
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {cat.label}
                                {count > 0 && (
                                    <span className="bg-blue-100 text-[#1A3C8C] px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                        {count}
                                    </span>
                                )}
                            </TabsTrigger>
                        )
                    })}
                </TabsList>

                {CATEGORIES.map((cat) => (
                    <TabsContent key={cat.id} value={cat.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ring-0 focus-visible:ring-0">
                        {/* INPUT SECTION */}
                        <div className="relative">
                            <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                    <Input
                                        placeholder={`Add a ${cat.label} amenity...`}
                                        value={inputValue}
                                        onChange={(e) => {
                                            setInputValue(e.target.value)
                                            setShowSuggestions(true)
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                addAmenity(inputValue)
                                            }
                                        }}
                                        className="h-11 rounded-xl border-gray-200 bg-white shadow-sm focus-visible:ring-blue-500 pl-4"
                                    />
                                    {inputValue && (
                                        <button 
                                            onClick={() => setInputValue("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 outline-none"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <Button 
                                    onClick={() => addAmenity(inputValue)}
                                    disabled={!inputValue.trim()}
                                    className="h-11 px-6 rounded-xl bg-[#1A3C8C] hover:bg-[#1A3C8C]/90 text-white font-bold transition-all disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add
                                </Button>
                            </div>

                            {/* SUGGESTIONS POPUP */}
                            {showSuggestions && filteredSuggestions.length > 0 && (
                                <Card className="absolute left-0 right-0 top-[110%] z-50 shadow-2xl border-blue-50 rounded-2xl overflow-hidden py-1">
                                    <CardContent className="p-0">
                                        <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider uppercase tracking-widest">Quick Suggestions</span>
                                            <button 
                                                onClick={() => setShowSuggestions(false)}
                                                className="text-[10px] font-medium text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                                            >
                                                CLOSE
                                            </button>
                                        </div>
                                        <div className="max-h-[220px] overflow-y-auto">
                                            {filteredSuggestions.map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => addAmenity(s)}
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between group"
                                                >
                                                    <span className="font-semibold">{s}</span>
                                                    <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* LIST SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {amenities.filter(a => a.category === cat.id).length === 0 ? (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                                        <cat.icon className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-medium">No {cat.label} amenities added yet.</p>
                                    <p className="text-xs text-gray-400 mt-1">Add items from the suggestion list or type your own.</p>
                                </div>
                            ) : (
                                amenities
                                    .filter(a => a.category === cat.id)
                                    .map((amenity) => (
                                        <div 
                                            key={amenity.id}
                                            className="group relative flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 animate-in zoom-in-95"
                                        >
                                            <MiniImageUpload 
                                                value={amenity.image} 
                                                onChange={(url) => updateAmenity(amenity.id, { image: url })}
                                                size={56}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <Input 
                                                    value={amenity.title}
                                                    onChange={(e) => updateAmenity(amenity.id, { title: e.target.value })}
                                                    placeholder="Amenity Name"
                                                    className="h-8 border-none bg-transparent font-bold text-gray-900 placeholder:text-gray-300 focus-visible:ring-0 p-0 text-base"
                                                />
                                                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#2BB673] font-bold uppercase tracking-wider">
                                                    <Check className="w-3 h-3" />
                                                    Ready to view
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeAmenity(amenity.id)}
                                                className="shrink-0 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                            )}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
