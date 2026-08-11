"use client"

import React, { useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus, Trash2, Leaf, Sun, Droplets, Wind, Recycle,
  ShieldCheck, Zap, BadgeCheck, Building, CheckCircle2,
  Film, Play
} from "lucide-react"
import type { EcoFeature } from "@/lib/builder-types"

export interface EcoCategoryPreset {
  id: string
  label: string
  title: string
  description: string
  iconKey: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export const PRESET_ECO_CATEGORIES: Record<string, EcoCategoryPreset> = {
  water: {
    id: "water",
    label: "Water / Rainwater Harvesting",
    title: "Water / Rainwater Harvesting",
    description: "Scientific aquifer recharge systems to save every drop of water.",
    iconKey: "droplet",
    icon: Droplets,
    color: "text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800",
  },
  solar: {
    id: "solar",
    label: "Solar Power Generation",
    title: "Solar Power Generation",
    description: "100% renewable solar energy panels for common area lighting.",
    iconKey: "sun",
    icon: Sun,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  },
  waste: {
    id: "waste",
    label: "Waste Management & Composting",
    title: "Waste Management & Composting",
    description: "Zero-waste protocols with in-house organic waste composting units.",
    iconKey: "recycle",
    icon: Recycle,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  },
  green: {
    id: "green",
    label: "Green Cover & Landscaping",
    title: "Green Cover & Landscaping",
    description: "Extensive lush native trees and oxygen-enriching green parks.",
    iconKey: "leaf",
    icon: Leaf,
    color: "text-green-600 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800",
  },
  igbc: {
    id: "igbc",
    label: "IGBC Green Certified",
    title: "IGBC Green Building Certified",
    description: "Certified excellence in sustainable green building architecture.",
    iconKey: "badge",
    icon: BadgeCheck,
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
  },
  security: {
    id: "security",
    label: "Secure Living & Safety",
    title: "Secure Living & 24/7 Safety",
    description: "Multi-tier security infrastructure with smart access control.",
    iconKey: "shield",
    icon: ShieldCheck,
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
  },
  ventilation: {
    id: "ventilation",
    label: "Fresh Air & Ventilation",
    title: "Fresh Air & Ventilation",
    description: "Architectural design optimized for maximum natural cross-ventilation.",
    iconKey: "wind",
    icon: Wind,
    color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800",
  },
  clean_energy: {
    id: "clean_energy",
    label: "Clean Energy & EV Charging",
    title: "Clean Energy & EV Charging",
    description: "Dedicated electric vehicle charging points & smart power backup.",
    iconKey: "zap",
    icon: Zap,
    color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800",
  },
  smart_infra: {
    id: "smart_infra",
    label: "Smart Infrastructure",
    title: "Smart Infrastructure",
    description: "Automated energy-efficient fixtures and smart resource monitoring.",
    iconKey: "building",
    icon: Building,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
  },
  eco_compliant: {
    id: "eco_compliant",
    label: "Eco Compliant Construction",
    title: "Eco Compliant Construction",
    description: "100% environmentally compliant eco-friendly construction standards.",
    iconKey: "check",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  },
}

export function resolveCategoryKey(item: EcoFeature): string {
  const iconStr = (item.icon || "").toLowerCase()
  const titleStr = (item.title || "").toLowerCase()

  if (iconStr.includes("droplet") || iconStr.includes("water") || titleStr.includes("water") || titleStr.includes("rain")) return "water"
  if (iconStr.includes("sun") || iconStr.includes("solar") || titleStr.includes("sun") || titleStr.includes("solar")) return "solar"
  if (iconStr.includes("recycle") || iconStr.includes("waste") || titleStr.includes("waste") || titleStr.includes("compost")) return "waste"
  if (iconStr.includes("leaf") || iconStr.includes("green") || titleStr.includes("green") || titleStr.includes("tree")) return "green"
  if (iconStr.includes("badge") || iconStr.includes("igbc") || titleStr.includes("igbc") || titleStr.includes("certified")) return "igbc"
  if (iconStr.includes("shield") || iconStr.includes("safety") || titleStr.includes("safety") || titleStr.includes("secure")) return "security"
  if (iconStr.includes("wind") || iconStr.includes("air") || titleStr.includes("wind") || titleStr.includes("air")) return "ventilation"
  if (iconStr.includes("zap") || iconStr.includes("ev") || titleStr.includes("ev") || titleStr.includes("charging")) return "clean_energy"
  if (iconStr.includes("building") || iconStr.includes("infra") || titleStr.includes("infra") || titleStr.includes("smart")) return "smart_infra"
  if (iconStr.includes("check") || iconStr.includes("compliant") || titleStr.includes("compliant")) return "eco_compliant"

  return "water"
}

interface EcoFeaturesManagerProps {
  items: EcoFeature[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<EcoFeature>) => void
  onRemove: (id: string) => void
  videoUrl?: string
  onVideoUrlChange?: (url: string) => void
  subtitle?: string
}

export function EcoFeaturesManager({
  items = [],
  onAdd,
  onUpdate,
  onRemove,
  videoUrl,
  onVideoUrlChange,
  subtitle = "Select sustainability & eco categories. Titles and descriptions populate automatically for visitor panel.",
}: EcoFeaturesManagerProps) {

  // Auto-sync empty titles/descriptions with their resolved category preset
  useEffect(() => {
    items.forEach((item) => {
      if (!item.title || !item.description) {
        const catKey = resolveCategoryKey(item)
        const preset = PRESET_ECO_CATEGORIES[catKey]
        if (preset) {
          onUpdate(item.id, {
            icon: preset.iconKey,
            title: preset.title,
            description: preset.description,
          })
        }
      }
    })
  }, [items.length])

  const handleSelectCategory = (id: string, catKey: string) => {
    const preset = PRESET_ECO_CATEGORIES[catKey]
    if (preset) {
      onUpdate(id, {
        icon: preset.iconKey,
        title: preset.title,
        description: preset.description,
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Overview Video Tour Config */}
      {onVideoUrlChange !== undefined && (
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-blue-500" />
            <span>Overview & Sustainability Video Tour URL</span>
          </Label>
          <div className="flex gap-2">
            <Input
              value={videoUrl ?? ""}
              onChange={(e) => onVideoUrlChange(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=... or MP4 URL"
              className="h-9 text-xs bg-white dark:bg-slate-950 flex-1"
            />
            {videoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(videoUrl, "_blank")}
                className="h-9 px-3 text-xs flex items-center gap-1 text-blue-600 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-blue-600" />
                <span>Preview</span>
              </Button>
            )}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Main project video tour displayed on the visitor overview section.
          </p>
        </div>
      )}

      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}

      {/* Specific Eco Features Section */}
      {items.length === 0 ? (
        <div className="text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
          <Leaf className="w-8 h-8 mx-auto text-emerald-500/60 dark:text-emerald-500/40 mb-2" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No eco features added yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Select solar power, rainwater harvesting, green cover & waste management categories.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs h-9"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add First Eco Feature Category
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((item, index) => {
              const currentCatKey = resolveCategoryKey(item)
              const preset = PRESET_ECO_CATEGORIES[currentCatKey] || PRESET_ECO_CATEGORIES.water
              const IconComponent = preset.icon
              const displayTitle = item.title || preset.title
              const displayDesc = item.description || preset.description

              return (
                <Card
                  key={item.id}
                  className="group relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow transition-all duration-200 rounded-xl"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-900 shrink-0">
                        #{index + 1}
                      </Badge>
                      <div className={`p-1.5 rounded-md ${preset.color} shrink-0 border`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {displayTitle}
                      </span>
                    </div>

                    {/* Top-Right Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(item.id)}
                      className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors flex items-center gap-1 font-medium border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
                      title="Remove feature"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Remove</span>
                    </Button>
                  </div>

                  <CardContent className="p-3.5 space-y-3">
                    {/* Primary Icon Category Selection Dropdown */}
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                        Icon Category Selection
                      </Label>
                      <Select
                        value={currentCatKey}
                        onValueChange={(val) => handleSelectCategory(item.id, val)}
                      >
                        <SelectTrigger className="h-9 text-xs bg-slate-50/80 dark:bg-slate-950/50 font-medium border-slate-300 dark:border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {Object.entries(PRESET_ECO_CATEGORIES).map(([k, cfg]) => {
                            const ItemIcon = cfg.icon
                            return (
                              <SelectItem key={k} value={k} className="text-xs py-2">
                                <div className="flex items-center gap-2">
                                  <ItemIcon className="w-4 h-4 text-slate-600 shrink-0" />
                                  <span className="font-medium text-slate-800 dark:text-slate-200">{cfg.label}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Automatic System Predefined Display Preview Box */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Auto Category Title
                        </span>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Visitor Ready
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {displayTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {displayDesc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="w-full border-dashed border-emerald-300 dark:border-emerald-700 text-xs h-9 bg-emerald-50/50 dark:bg-slate-900/50 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Eco Category Feature
          </Button>
        </div>
      )}
    </div>
  )
}
