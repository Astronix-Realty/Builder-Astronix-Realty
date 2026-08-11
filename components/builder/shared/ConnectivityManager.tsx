"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus, Trash2, MapPin, Plane, Train, Building2,
  GraduationCap, ShoppingBag, Building, Bus, Navigation,
  HeartPulse, Wifi
} from "lucide-react"
import type { ConnectivityItem } from "@/lib/builder-types"

interface ConnectivityManagerProps {
  items: ConnectivityItem[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<ConnectivityItem>) => void
  onRemove: (id: string) => void
  subtitle?: string
}

const TYPE_CONFIG: Record<
  ConnectivityItem["type"],
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  airport: { label: "Airport", icon: Plane, color: "text-sky-500 bg-sky-50 dark:bg-sky-950/40" },
  railway: { label: "Railway Station", icon: Train, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40" },
  metro: { label: "Metro Station", icon: Train, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40" },
  highway: { label: "Highway / Expressway", icon: Navigation, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" },
  hospital: { label: "Hospital", icon: HeartPulse, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40" },
  school: { label: "School / College", icon: GraduationCap, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" },
  mall: { label: "Shopping Mall", icon: ShoppingBag, color: "text-pink-500 bg-pink-50 dark:bg-pink-950/40" },
  "it-park": { label: "IT Park / Business Hub", icon: Building, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40" },
  bus: { label: "Bus Stand", icon: Bus, color: "text-teal-500 bg-teal-50 dark:bg-teal-950/40" },
  custom: { label: "Custom Location", icon: MapPin, color: "text-slate-500 bg-slate-50 dark:bg-slate-800" },
}

export function ConnectivityManager({
  items = [],
  onAdd,
  onUpdate,
  onRemove,
  subtitle = "Yeh items sabhi pages (Project/Tower/Unit) pe dikhenge. Har ek important location ke liye ek item add karo.",
}: ConnectivityManagerProps) {
  return (
    <div className="space-y-4">
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}

      {items.length === 0 ? (
        <div className="text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
          <Wifi className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No connectivity items added yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Add nearby airports, stations, highways, hospitals & schools to inform buyers.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add First Location
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.custom
            const IconComponent = config.icon

            return (
              <Card
                key={item.id}
                className="group relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow transition-all duration-200 rounded-xl"
              >
                {/* Header bar with Icon, Badge & Top-Right Remove Button */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge variant="outline" className="text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-900 shrink-0">
                      #{index + 1}
                    </Badge>
                    <div className={`p-1.5 rounded-md ${config.color} shrink-0`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.title?.trim() ? item.title : config.label}
                    </span>
                  </div>

                  {/* PROMINENT REMOVE BUTTON AT TOP RIGHT */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(item.id)}
                    className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors flex items-center gap-1 font-medium border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
                    title="Remove this connectivity point"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">Remove</span>
                  </Button>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                        Location Name
                      </Label>
                      <Input
                        value={item.title ?? ""}
                        onChange={(e) => onUpdate(item.id, { title: e.target.value })}
                        placeholder="e.g. International Airport, Station"
                        className="h-9 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                        Connectivity Type
                      </Label>
                      <Select
                        value={item.type}
                        onValueChange={(v) => onUpdate(item.id, { type: v as ConnectivityItem["type"] })}
                      >
                        <SelectTrigger className="h-9 text-xs bg-slate-50/50 dark:bg-slate-950/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                            const ItemIcon = cfg.icon
                            return (
                              <SelectItem key={key} value={key} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <ItemIcon className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{cfg.label}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                        Distance (KM / Miles)
                      </Label>
                      <Input
                        value={item.distanceKm ?? ""}
                        onChange={(e) => onUpdate(item.id, { distanceKm: e.target.value })}
                        placeholder="e.g. 18 KM"
                        className="h-9 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                        Travel Time
                      </Label>
                      <Input
                        value={item.duration ?? ""}
                        onChange={(e) => onUpdate(item.id, { duration: e.target.value })}
                        placeholder="e.g. 25 Mins drive"
                        className="h-9 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                      />
                    </div>
                  </div>

                  {item.type === "custom" && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                        Custom Type / Category Name
                      </Label>
                      <Input
                        value={item.customType ?? ""}
                        onChange={(e) => onUpdate(item.id, { customType: e.target.value })}
                        placeholder="e.g. Expressway, Sea Link, Temple"
                        className="h-8 text-xs max-w-sm"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="w-full border-dashed border-slate-300 dark:border-slate-700 text-xs h-9 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Connectivity Point
          </Button>
        </div>
      )}
    </div>
  )
}
