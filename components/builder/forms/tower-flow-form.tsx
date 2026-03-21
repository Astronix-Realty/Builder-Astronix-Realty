"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building, BarChart3, FileText, Layers, MapPin, ShieldCheck,
  Plus, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle,
  Home, Wifi, Star, Map as MapIcon, Building2, Leaf, Film, Users
} from "lucide-react"
import type {
  TowerData, FloorBreakdown, TownshipData, ConnectivityItem,
  AmenityItem, EcoFeature, ApfDetail, VideoGalleryItem, MasterPlanHighlight
} from "@/lib/builder-types"
import { BannerUpload, GalleryUpload, VideoUpload, DocumentUpload, MasterPlanMapUpload, AboutImageUpload } from "@/components/ui/media-uploads"

// ─────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────
interface TowerFlowFormProps {
  data: TowerData
  onChange: (data: TowerData) => void
  projectName?: string
  townshipName?: string
  townshipData?: TownshipData
  onTownshipChange?: (data: TownshipData) => void
  showCommonData?: boolean
}

// ─────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────
function Section({
  id, title, description, icon: Icon, badge, openIds, setOpenIds, children,
}: {
  id: string; title: string; description?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  openIds: string[]; setOpenIds: React.Dispatch<React.SetStateAction<string[]>>
  children: React.ReactNode
}) {
  const isOpen = openIds.includes(id)
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpenIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#1A3C8C]/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-[#1A3C8C]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">{title}</span>
              {badge && <Badge className="bg-[#2BB673]/10 text-[#2BB673] border-0 text-[10px] font-bold">{badge}</Badge>}
            </div>
            {description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{description}</p>}
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  )
}

function Grid({ cols = 2, children }: { cols?: 1 | 2 | 3; children: React.ReactNode }) {
  return (
    <div className={`grid gap-4 ${cols === 1 ? "grid-cols-1" : cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
      {children}
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3">
      <div className="h-px flex-1 bg-gray-100" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</span>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
  )
}

// ─────────────────────────────────────────
// BANK TAGS
// ─────────────────────────────────────────
const COMMON_BANKS = ["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Kotak Bank", "Bank of Baroda", "IDFC First", "Yes Bank", "Bajaj Finance", "LIC HFL"]

function BankSelector({ banks, onChange }: { banks: string[]; onChange: (b: string[]) => void }) {
  const [custom, setCustom] = useState("")
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {COMMON_BANKS.map(b => (
          <button key={b} type="button"
            onClick={() => onChange(banks.includes(b) ? banks.filter(x => x !== b) : [...banks, b])}
            className={`text-xs px-4 py-2 rounded-xl border font-semibold transition-all shadow-sm ${banks.includes(b) ? "bg-[#1A3C8C] text-white border-transparent" : "bg-white text-gray-600 border-gray-100 hover:border-[#1A3C8C]"}`}
          >{b}</button>
        ))}
      </div>
      {banks.filter(b => !COMMON_BANKS.includes(b)).map(b => (
        <Badge key={b} className="bg-[#2BB673]/10 text-[#2BB673] border-0 text-xs font-semibold py-1.5 px-3 rounded-lg gap-2">
          {b}
          <button onClick={() => onChange(banks.filter(x => x !== b))} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
        </Badge>
      ))}
      <div className="flex gap-2 max-w-sm">
        <Input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Add other bank..." className="h-10 text-sm bg-gray-50/50" />
        <Button type="button" className="h-10 px-6 bg-[#1A3C8C] hover:bg-[#1A3C8C]/90 text-sm font-bold" onClick={() => { if (custom.trim()) { onChange([...banks, custom.trim()]); setCustom("") } }}>Add</Button>
      </div>
    </div>
  )
}

function PartCollapse({
  title, id, openParts, setOpenParts, children, icon: Icon
}: {
  title: string; id: string; openParts: string[]; setOpenParts: React.Dispatch<React.SetStateAction<string[]>>; children: React.ReactNode; icon: React.ComponentType<{ className?: string }>
}) {
  const isOpen = openParts.includes(id)
  const isPartA = id === "part-a"

  return (
    <div className={[
      "mb-4 sm:mb-6 2xl:mb-8 rounded-2xl sm:rounded-3xl border transition-all duration-500 overflow-hidden",
      isOpen
        ? "bg-white border-blue-100 shadow-lg sm:shadow-xl shadow-blue-50/80"
        : "bg-gray-50/70 border-gray-100 shadow-none"
    ].join(" ")}>

      <button
        type="button"
        onClick={() => setOpenParts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
        className="w-full text-left flex items-center justify-between group transition-colors px-4 py-4 sm:px-6 sm:py-5 2xl:px-10 2xl:py-7 gap-3 sm:gap-5"
      >
        <div className="flex items-center gap-3 sm:gap-4 2xl:gap-6 min-w-0">
          <div className={[
            "shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-500",
            "w-10 h-10 sm:w-12 sm:h-12 2xl:w-16 2xl:h-16",
            isOpen
              ? isPartA
                ? "bg-[#1A3C8C] text-white shadow-lg shadow-blue-300/40"
                : "bg-[#2BB673] text-white shadow-lg shadow-emerald-300/40"
              : "bg-white text-gray-400 border border-gray-100 shadow-sm group-hover:border-blue-100 group-hover:shadow-blue-50",
          ].join(" ")}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-8 2xl:h-8" />
          </div>

          <div className="min-w-0">
            <span className={[
              "block font-black uppercase tracking-[0.18em] mb-0.5 sm:mb-1",
              "text-[9px] sm:text-[10px] 2xl:text-xs",
              isOpen
                ? isPartA ? "text-[#1A3C8C]" : "text-[#2BB673]"
                : "text-gray-400"
            ].join(" ")}>
              {isPartA ? "Phase One" : "Phase Two"}
            </span>
            <h2 className={[
              "font-bold tracking-tight leading-tight truncate transition-colors",
              "text-base sm:text-xl 2xl:text-3xl",
              isOpen ? "text-gray-900" : "text-gray-500"
            ].join(" ")}>
              {title}
            </h2>
          </div>
        </div>

        <div className={[
          "shrink-0 flex items-center justify-center rounded-full border transition-all duration-500",
          "w-7 h-7 sm:w-9 sm:h-9 2xl:w-11 2xl:h-11",
          isOpen
            ? "bg-gray-900 border-gray-900 text-white rotate-180"
            : "bg-white border-gray-200 text-gray-400 group-hover:border-gray-400"
        ].join(" ")}>
          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 2xl:w-5 2xl:h-5" />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-5 pt-0 sm:px-6 sm:pb-8 2xl:px-10 2xl:pb-12 space-y-4 sm:space-y-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// IMAGE UPLOAD FIELD (URL input)

// ─────────────────────────────────────────
// BULK IMAGE INPUT
// ─────────────────────────────────────────
function BulkImageInput({ onAdd }: { onAdd: (urls: string[]) => void }) {
  const [text, setText] = useState("")
  const [open, setOpen] = useState(false)

  const handleApply = () => {
    const urls = text.split("\n").map(s => s.trim()).filter(s => s.length > 0)
    onAdd(urls)
    setText("")
    setOpen(false)
  }

  if (!open) return (
    <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-[10px] text-blue-600 font-bold uppercase py-0 h-6">
      + Bulk Add URLs
    </Button>
  )

  return (
    <Card className="p-3 bg-blue-50/30 border-blue-100 mb-3 border-dashed">
      <Label className="text-[10px] font-bold uppercase text-blue-700 mb-2 block">Paste multiple URLs (One per line)</Label>
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={"https://...img1.jpg\nhttps://...img2.jpg"}
        className="h-20 text-xs bg-white font-mono"
      />
      <div className="flex justify-end gap-2 mt-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-[10px] h-7 font-bold">CANCEL</Button>
        <Button type="button" size="sm" onClick={handleApply} className="text-[10px] h-7 bg-blue-600 font-bold">APPLY BATCH</Button>
      </div>
    </Card>
  )
}

export function TowerFlowForm({ data, onChange, projectName, townshipName, townshipData, onTownshipChange, showCommonData }: TowerFlowFormProps) {
  const [openIds, setOpenIds] = useState<string[]>(["builder", "tower-identity", "location"])
  const [openParts, setOpenParts] = useState<string[]>(["part-a", "part-b"])

  const update = <K extends keyof TowerData>(field: K, value: TowerData[K]) => {
    onChange({ ...data, [field]: value })
  }

  // --- TOWNSHIP UPDATE HELPERS ---
  const updateCommon = <K extends keyof TownshipData>(field: K, value: TownshipData[K]) => {
    if (onTownshipChange && townshipData) {
      onTownshipChange({ ...townshipData, [field]: value })
    }
  }

  // Common Data Helpers
  const addConnectivity = () => {
    if (!townshipData) return
    const item: ConnectivityItem = { id: crypto.randomUUID(), title: "", type: "custom", distanceKm: "", duration: "" }
    updateCommon("connectivity", [...townshipData.connectivity, item])
  }
  const updateConnectivity = (id: string, patch: Partial<ConnectivityItem>) => {
    if (!townshipData) return
    updateCommon("connectivity", townshipData.connectivity.map(x => x.id === id ? { ...x, ...patch } : x))
  }
  const removeConnectivity = (id: string) => {
    if (!townshipData) return
    updateCommon("connectivity", townshipData.connectivity.filter(x => x.id !== id))
  }

  const addAmenityCommon = (cat: AmenityItem["category"]) => {
    if (!townshipData) return
    const item: AmenityItem = { id: crypto.randomUUID(), title: "", category: cat }
    updateCommon("amenities", [...townshipData.amenities, item])
  }
  const updateAmenityCommon = (id: string, patch: Partial<AmenityItem>) => {
    if (!townshipData) return
    updateCommon("amenities", townshipData.amenities.map(x => x.id === id ? { ...x, ...patch } : x))
  }
  const removeAmenityCommon = (id: string) => {
    if (!townshipData) return
    updateCommon("amenities", townshipData.amenities.filter(x => x.id !== id))
  }

  const addEcoCommon = () => {
    if (!townshipData) return
    const item: EcoFeature = { id: crypto.randomUUID(), title: "", description: "", icon: "leaf" }
    updateCommon("ecoFeatures", [...townshipData.ecoFeatures, item])
  }
  const updateEcoCommon = (id: string, patch: Partial<EcoFeature>) => {
    if (!townshipData) return
    updateCommon("ecoFeatures", townshipData.ecoFeatures.map(x => x.id === id ? { ...x, ...patch } : x))
  }
  const removeEcoCommon = (id: string) => {
    if (!townshipData) return
    updateCommon("ecoFeatures", townshipData.ecoFeatures.filter(x => x.id !== id))
  }

  const addVideoGalleryItem = (type: VideoGalleryItem["type"]) => {
    if (!townshipData) return
    const item: VideoGalleryItem = { id: crypto.randomUUID(), title: "", landscapeUrl: "", shortUrl: "", type }
    updateCommon("videoGallery", [...townshipData.videoGallery, item])
  }
  const updateVideoGalleryItem = (id: string, patch: Partial<VideoGalleryItem>) => {
    if (!townshipData) return
    updateCommon("videoGallery", townshipData.videoGallery.map(x => x.id === id ? { ...x, ...patch } : x))
  }
  const removeVideoGalleryItem = (id: string) => {
    if (!townshipData) return
    updateCommon("videoGallery", townshipData.videoGallery.filter(x => x.id !== id))
  }

  const addApfCommon = () => {
    if (!townshipData) return
    const item: ApfDetail = { id: crypto.randomUUID(), bankName: "", apfNumber: "", certificateUrl: "" }
    updateCommon("apfDetails", [...(townshipData.apfDetails || []), item])
  }
  const updateApfCommon = (id: string, patch: Partial<ApfDetail>) => {
    if (!townshipData) return
    updateCommon("apfDetails", (townshipData.apfDetails || []).map(x => x.id === id ? { ...x, ...patch } : x))
  }
  const removeApfCommon = (id: string) => {
    if (!townshipData) return
    updateCommon("apfDetails", (townshipData.apfDetails || []).filter(x => x.id !== id))
  }

  const AMENITY_CATS: AmenityItem["category"][] = ["social", "recreation", "community", "green", "security", "general"]


  // Auto-calculate total units
  useEffect(() => {
    const floors = data.totalFloorsNum || parseInt(data.totalFloors?.replace(/\D/g, "")) || 0
    const perFloor = parseInt(data.unitsPerFloor) || 0
    const total = floors * perFloor
    if (total !== data.totalUnits) {
      onChange({ ...data, totalUnits: total })
    }
  }, [data.totalFloorsNum, data.unitsPerFloor, data.totalFloors, data.totalUnits, data, onChange])

  // Gallery images
  const addGallery = () => update("galleryImages", [...(data.galleryImages || []), ""])
  const updateGallery = (i: number, v: string) => {
    const g = [...(data.galleryImages || [])]; g[i] = v; update("galleryImages", g)
  }
  const removeGallery = (i: number) => update("galleryImages", (data.galleryImages || []).filter((_, idx) => idx !== i))



  // Floor breakdown
  const addFloorBreakdown = () => {
    const item: FloorBreakdown = { id: crypto.randomUUID(), floorType: "residential", fromFloor: "", toFloor: "", description: "" }
    update("floorsBreakdown", [...data.floorsBreakdown, item])
  }
  const updateFloorBreakdown = (id: string, patch: Partial<FloorBreakdown>) =>
    update("floorsBreakdown", data.floorsBreakdown.map(x => x.id === id ? { ...x, ...patch } : x))
  const removeFloorBreakdown = (id: string) =>
    update("floorsBreakdown", data.floorsBreakdown.filter(x => x.id !== id))

  // Tower amenities
  const addTowerAmenity = () => {
    const item = { id: crypto.randomUUID(), title: "", description: "" }
    update("towerAmenities", [...(data.towerAmenities || []), item])
  }
  const updateTowerAmenity = (id: string, patch: any) =>
    update("towerAmenities", (data.towerAmenities || []).map(x => x.id === id ? { ...x, ...patch } : x))
  const removeTowerAmenity = (id: string) =>
    update("towerAmenities", (data.towerAmenities || []).filter(x => x.id !== id))

  // Parse floor count from string like "G + 24"
  const parseTotalFloors = (val: string) => {
    const match = val.match(/(\d+)\s*$/); return match ? parseInt(match[1]) : 0
  }

  const VIEW_TYPES = ["3-Side Open", "2-Side Open", "Corner Unit", "Sea View", "Garden View", "City View", "Pool View", "Mountain View", "Road Facing"]
  const FLOOR_TYPES: FloorBreakdown["floorType"][] = ["parking", "podium", "refuge", "residential", "terrace", "gym", "clubhouse"]

  return (
    <div className="space-y-10">
      {/* ══════════════════════════════════════════ */}
      {/* PART A: COMMON INHERITED DATA              */}
      {/* (Only shown in Standalone Tower Flow)      */}
      {/* ══════════════════════════════════════════ */}
      {(showCommonData && townshipData) && (
        <>
          <PartCollapse id="part-a" title="Common Inherited Data" icon={Home} openParts={openParts} setOpenParts={setOpenParts}>

          <Section id="builder" title="Developer / Builder Info" description="Builder name, logo, contact — Hero pe dikhta hai" icon={Building2} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            <Grid cols={2}>
              <Field label="Builder / Company Name" required>
                <Input value={townshipData.builderName} onChange={e => updateCommon("builderName", e.target.value)} placeholder="Astronix Realty" />
              </Field>
              <Field label="Builder Logo URL">
                <Input value={townshipData.builderLogo} onChange={e => updateCommon("builderLogo", e.target.value)} placeholder="https://..." />
              </Field>
            </Grid>
          </Section>

          <Section id="location" title="Location Details" description="City, district, pincode — Map pe dikhta hai" icon={MapPin} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            <Grid cols={3}>
              <Field label="City" required>
                <Input value={townshipData.city} onChange={e => updateCommon("city", e.target.value)} placeholder="Mumbai" />
              </Field>
              <Field label="District" required>
                <Input value={townshipData.district} onChange={e => updateCommon("district", e.target.value)} placeholder="Thane" />
              </Field>
              <Field label="Sub City" required>
                <Input value={townshipData.subCity} onChange={e => updateCommon("subCity", e.target.value)} placeholder="Dombivali" />
              </Field>
              <Field label="Village / Area" required>
                <Input value={townshipData.village || ""} onChange={e => updateCommon("village", e.target.value)} placeholder="Sonarpada" />
              </Field>
              <Field label="State" required>
                <Input value={townshipData.state} onChange={e => updateCommon("state", e.target.value)} placeholder="Maharashtra" />
              </Field>
              <Field label="Country" required>
                <Input value={townshipData.country} onChange={e => updateCommon("country", e.target.value)} placeholder="India" />
              </Field>
              <Field label="Pincode" required>
                <Input value={townshipData.pincode} onChange={e => updateCommon("pincode", e.target.value)} placeholder="400601" />
              </Field>
            </Grid>
            <SectionTitle title="Nearby Landmark" />
            <Field label="Nearest Landmark" required hint="Eg: Near Viviana Mall, Off Ghodbunder Road">
              <Input value={townshipData.nearbyLandmark} onChange={e => updateCommon("nearbyLandmark", e.target.value)} placeholder="Near Viviana Mall" />
            </Field>
          </Section>

          <Section id="maps" title="Google Maps Integration" description="Map embed + directions — Connectivity section" icon={MapIcon} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            <Grid cols={1}>
              <Field label="Google Maps Full URL" required hint="Copy the full Google Maps share link">
                <Input value={townshipData.googleMapLink} onChange={e => updateCommon("googleMapLink", e.target.value)} placeholder="https://goo.gl/maps/..." />
              </Field>
              <Field label="Google Plus Code" hint='Eg: "+QR5, Thane, Maharashtra"'>
                <Input value={townshipData.googlePlusCode} onChange={e => updateCommon("googlePlusCode", e.target.value)} placeholder="+QR5, Thane, Maharashtra" />
              </Field>
            </Grid>
          </Section>

          <Section id="connectivity" title="Connectivity" description="Airport, Railway, Metro, Hospital, Schools distance" icon={Wifi} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            {townshipData.connectivity.map(item => (
              <Card key={item.id} className="mb-3 border-gray-100 shadow-none">
                <CardContent className="p-3">
                  <Grid cols={2}>
                    <Field label="Location Name">
                      <Input value={item.title} onChange={e => updateConnectivity(item.id, { title: e.target.value })} placeholder="International Airport" className="h-8 text-xs" />
                    </Field>
                    <Field label="Type">
                      <Select value={item.type} onValueChange={v => updateConnectivity(item.id, { type: v as ConnectivityItem["type"] })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["airport", "railway", "metro", "highway", "hospital", "school", "mall", "it-park", "bus", "custom"].map(t => (
                            <SelectItem key={t} value={t} className="text-xs">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Distance">
                      <Input value={item.distanceKm} onChange={e => updateConnectivity(item.id, { distanceKm: e.target.value })} placeholder="18 KM" className="h-8 text-xs" />
                    </Field>
                    <Field label="Travel Time">
                      <Input value={item.duration} onChange={e => updateConnectivity(item.id, { duration: e.target.value })} placeholder="25 Mins" className="h-8 text-xs" />
                    </Field>
                  </Grid>
                  <button type="button" onClick={() => removeConnectivity(item.id)} className="mt-2 text-[10px] text-red-400 hover:text-red-600 flex items-center gap-1 font-bold uppercase tracking-wider">
                    <X className="w-3 h-3" /> Remove Item
                  </button>
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addConnectivity} className="w-full border-dashed text-xs h-9 bg-gray-50/50 hover:bg-gray-50">
              <Plus className="w-4 h-4 mr-1 text-blue-600" /> Add Connectivity Point
            </Button>
          </Section>

          <Section id="amenities-common" title="Lifestyle & Amenities" description="Social, Recreation, Community, Green, Security, General tabs" icon={Star} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            {AMENITY_CATS.map(cat => {
              const catItems = townshipData.amenities.filter(a => a.category === cat)
              return (
                <div key={cat} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1A3C8C] opacity-80">{cat}</span>
                    <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-2 font-bold text-blue-600" onClick={() => addAmenityCommon(cat)}>
                      <Plus className="w-3 h-3 mr-1" /> Add {cat}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {catItems.map(item => (
                      <div key={item.id} className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                        <Input value={item.title} onChange={e => updateAmenityCommon(item.id, { title: e.target.value })} placeholder="Swimming Pool" className="h-7 text-[11px] bg-white border-none shadow-none" />
                        <button type="button" onClick={() => removeAmenityCommon(item.id)} className="shrink-0 text-red-300 hover:text-red-500 transition-colors px-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </Section>

          <Section id="eco-common" title="Sustainability & Eco Features" description="Solar, Rainwater, Green Cover — Sustainability section" icon={Leaf} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            <SectionTitle title="Specific Eco Features" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {townshipData.ecoFeatures.map(item => (
                <Card key={item.id} className="border-gray-100 shadow-none bg-gray-50/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                        <Leaf className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <button onClick={() => removeEcoCommon(item.id)} className="text-red-300 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <Field label="Feature Title">
                      <Input value={item.title} onChange={e => updateEcoCommon(item.id, { title: e.target.value })} placeholder="Solar Power" className="h-8 text-xs" />
                    </Field>
                    <div className="mt-2">
                      <Field label="Description">
                        <Input value={item.description} onChange={e => updateEcoCommon(item.id, { description: e.target.value })} placeholder="100% renewable energy" className="h-8 text-[11px]" />
                      </Field>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addEcoCommon} className="w-full border-dashed mt-3 text-xs h-9">
              <Plus className="w-4 h-4 mr-1 text-green-600" /> Add Sustainability Feature
            </Button>
          </Section>



          <Section id="common-legal" title="Bank APF Approvals" description="List of pre-approved banks for loans" icon={ShieldCheck} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            <div className="mb-6">
              <Label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest">Select Active Banks</Label>
              <BankSelector
                banks={townshipData.approvedBanks}
                onChange={banks => updateCommon("approvedBanks", banks)}
              />
            </div>
            <SectionTitle title="Legal Trust & Score" />
            <Grid cols={2}>
              <Field label="Trust Score" hint="Out of 100">
                <Input value={townshipData.legalTrustScore} onChange={e => updateCommon("legalTrustScore", e.target.value)} placeholder="100" />
              </Field>
              <Field label="Approvals" hint="Eg: PMRDA / Municipal Corporation Approved">
                <Input value={townshipData.approvals} onChange={e => updateCommon("approvals", e.target.value)} placeholder="Local Authority Approved" />
              </Field>
            </Grid>
            <Field label="Trust Description" hint="Eg: Clear Marketable Title with OC Received">
              <Textarea value={townshipData.legalTrustDescription} onChange={e => updateCommon("legalTrustDescription", e.target.value)} rows={2} placeholder="This project has clear marketable titles and all necessary permissions." />
            </Field>
            <SectionTitle title="Bank APF Certificates" />
            <div className="space-y-3">
              {(townshipData.apfDetails || []).map(apf => (
                <div key={apf.id} className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl relative group border border-gray-100">
                  <Field label="Bank Name">
                    <Input value={apf.bankName} onChange={e => updateApfCommon(apf.id, { bankName: e.target.value })} placeholder="HDFC Bank" className="h-8 text-xs bg-white" />
                  </Field>
                  <Field label="APF Number">
                    <Input value={apf.apfNumber} onChange={e => updateApfCommon(apf.id, { apfNumber: e.target.value })} placeholder="APF-123456" className="h-8 text-xs bg-white" />
                  </Field>
                  <button onClick={() => removeApfCommon(apf.id)} className="absolute -top-1 -right-1 bg-white border shadow-sm p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addApfCommon} className="w-full text-xs h-9 border-dashed">
                <Plus className="w-4 h-4 mr-1 text-indigo-600" /> Add APF Certificate Info
              </Button>
            </div>
          </Section>

          <Section id="group-buying-common" title="Group Buying" description="Interest count + discount — GroupBuyingSection component" icon={Users} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            <Grid cols={2}>
              <Field label="Enable Group Buying">
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => updateCommon("groupBuying", { ...townshipData.groupBuying, enabled: !townshipData.groupBuying?.enabled })}
                    className={`w-10 h-6 rounded-full transition-colors relative ${townshipData.groupBuying?.enabled ? "bg-[#2BB673]" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${townshipData.groupBuying?.enabled ? "left-5" : "left-1"}`} />
                  </button>
                  <span className="text-[11px] font-bold text-gray-500">{townshipData.groupBuying?.enabled ? "ACTIVE" : "INACTIVE"}</span>
                </div>
              </Field>
              <Field label="Discount Label" hint="Shown on card">
                <Input value={townshipData.groupBuying?.discountLabel || ""} onChange={e => updateCommon("groupBuying", { ...townshipData.groupBuying, discountLabel: e.target.value })} placeholder="Extra 2% off" className="h-8 text-xs" />
              </Field>
              <Field label="Target Milestone">
                <Input type="number" value={townshipData.groupBuying?.targetCount || 500} onChange={e => updateCommon("groupBuying", { ...townshipData.groupBuying, targetCount: Number(e.target.value) })} className="h-8 text-xs" />
              </Field>
            </Grid>
          </Section>

          </PartCollapse>
        </>
      )}

      <PartCollapse id="part-b" title="Tower-Specific Data" icon={Building} openParts={openParts} setOpenParts={setOpenParts}>

      {/* ── 1. TOWER IDENTITY ──────────────────── */}
      <Section id="tower-identity" title="Tower Identity" description="Name, hero image, gallery — Tower Hero Section" icon={Building} openIds={openIds} setOpenIds={setOpenIds}>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Hero Image Upload */}
          <div className="flex-1">
            <BannerUpload
              value={data.heroImage || ""}
              onChange={v => update("heroImage", v)}
            />
          </div>

          {/* Right Column: Tower Details */}
          <div className="flex-1 flex flex-col gap-6 pt-2">
            <Field label="Tower Name" required>
              <Input
                value={data.name || ""}
                onChange={e => update("name", e.target.value)}
                placeholder="e.g. Tower A - Skyline"
                className="h-12 text-lg font-medium tracking-tight bg-white/50"
              />
            </Field>

            <Field label="Tower Type">
              <Select value={data.towerType || "residential"} onValueChange={v => update("towerType", v as TowerData["towerType"])}>
                <SelectTrigger className="h-11 bg-white/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="mixed">Mixed Use</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Construction Status" required hint="Determines if CC or OC is needed">
              <Select value={data.constructionStatus || "under-construction"} onValueChange={v => update("constructionStatus", v as TowerData["constructionStatus"])}>
                <SelectTrigger className="h-11 bg-white/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-construction">Under Construction</SelectItem>
                  <SelectItem value="ready-to-move">Ready to Move</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <SectionTitle title="Photo Gallery" />
          <GalleryUpload
            images={data.galleryImages || []}
            onChange={v => update("galleryImages", v)}
          />
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <SectionTitle title="Tower Video Gallery" />
          <VideoUpload
            videos={data.videoGallery || []}
            onChange={v => update("videoGallery", v)}
          />
        </div>
      </Section>

      <Section id="tower-about" title="About Tower" description="Tower characteristics and unique positioning" icon={FileText} openIds={openIds} setOpenIds={setOpenIds}>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: About Image */}
          <div className="flex-1">
            <AboutImageUpload
              value={data.aboutImageUrl || ""}
              onChange={v => update("aboutImageUrl", v)}
              title="Upload Tower Profile Image"
              description="A majestic shot highlighting this specific tower's profile"
            />
          </div>

          {/* Right: Text Fields */}
          <div className="flex-1 space-y-6">
            <Field label="Short Description / Tagline" hint="Appears in property cards (1-2 lines)">
              <Textarea 
                value={data.description} 
                onChange={e => update("description", e.target.value)} 
                rows={3} 
                placeholder="Tower A is an iconic 25-storey residential tower with panoramic city views..." 
                className="bg-white/50"
              />
            </Field>
            
            <Field label="Vision Statement" hint="Architectural details and exclusive features">
              <Textarea 
                value={data.visionStatement || ""} 
                onChange={e => update("visionStatement", e.target.value)} 
                rows={4} 
                placeholder="Tower A stands as a beacon of modern architecture, offering world-class amenities..." 
                className="bg-white/50 border-blue-50 focus:border-blue-200"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── 2. TOWER STRUCTURE (KEY STATS) ─────── */}
      <Section id="tower-structure" title="Tower Structure & Stats" description="Floors, lifts, view type, dates — Stats bar + About Tower" icon={BarChart3} openIds={openIds} setOpenIds={setOpenIds}>
        <Grid cols={3}>
          <Field label="Total Lifts" hint="Shown in Stats Snapshot">
            <Input value={data.totalLifts} onChange={e => update("totalLifts", e.target.value)} placeholder="3" />
          </Field>
          <Field label="Lifts Configuration" hint="Full detail shown in About section">
            <Input value={data.liftsConfiguration} onChange={e => update("liftsConfiguration", e.target.value)} placeholder="3 High-Speed + 1 Service Lift" />
          </Field>
          <Field label="View Type" hint="Shown in Stats Snapshot">
            <Select value={data.viewType} onValueChange={v => update("viewType", v)}>
              <SelectTrigger><SelectValue placeholder="Select view type" /></SelectTrigger>
              <SelectContent>
                {VIEW_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Parking Levels" hint="Shown in About Tower section">
            <Input value={data.parkingLevels} onChange={e => update("parkingLevels", e.target.value)} placeholder="2 Basement Levels" />
          </Field>
          <Field label="Lobby Details">
            <Input value={data.lobbyDetails} onChange={e => update("lobbyDetails", e.target.value)} placeholder="Double-Height Grand Lobby with Concierge" />
          </Field>
          <Field label="Units Per Floor" required hint="Used for total units calculation">
            <Input type="number" value={data.unitsPerFloor} onChange={e => update("unitsPerFloor", e.target.value)} placeholder="8" />
          </Field>
        </Grid>

        <SectionTitle title="Construction Status & Dates" />
        <Grid cols={3}>
          <Field label="Launch Date">
            <Input value={data.launchDate} onChange={e => update("launchDate", e.target.value)} placeholder="January 2024" />
          </Field>
          <Field label="Possession Date" required>
            <Input value={data.possessionDate} onChange={e => update("possessionDate", e.target.value)} placeholder="December 2026" />
          </Field>
        </Grid>

        <SectionTitle title="Auto-Calculated" />
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-xl">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          <p className="text-xs text-green-700">
            <span className="font-bold">Total Units: {data.totalUnits}</span>
            {" "}({data.totalFloorsNum} floors × {parseInt(data.unitsPerFloor) || 0} units/floor)
          </p>
        </div>
      </Section>


      {/* ── 4. FLOOR PLAN BREAKDOWN ─────────────── */}
      <Section id="tower-floors" title="Floor Distribution Breakdown" description="Parking, Podium, Refuge, Residential floors — Floor View Slider" icon={Layers} openIds={openIds} setOpenIds={setOpenIds}>
        <p className="text-xs text-gray-500 mb-3">Tower ke andar har floor type ki range define karo — visitor panel mein interactive floor view slider pe dikhega</p>
        {data.floorsBreakdown.map(item => (
          <Card key={item.id} className="mb-3 border-gray-100">
            <CardContent className="p-3">
              <Grid cols={2}>
                <Field label="Floor Type">
                  <Select value={item.floorType} onValueChange={v => updateFloorBreakdown(item.id, { floorType: v as FloorBreakdown["floorType"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FLOOR_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Description">
                  <Input value={item.description} onChange={e => updateFloorBreakdown(item.id, { description: e.target.value })} placeholder="Basement Parking / Grand Lobby..." />
                </Field>
                <Field label="From Floor">
                  <Input value={item.fromFloor} onChange={e => updateFloorBreakdown(item.id, { fromFloor: e.target.value })} placeholder="B2 or 1" />
                </Field>
                <Field label="To Floor">
                  <Input value={item.toFloor} onChange={e => updateFloorBreakdown(item.id, { toFloor: e.target.value })} placeholder="B1 or 24" />
                </Field>
              </Grid>
              <button type="button" onClick={() => removeFloorBreakdown(item.id)} className="mt-2 text-xs text-red-400 flex items-center gap-1">
                <X className="w-3 h-3" /> Remove
              </button>
            </CardContent>
          </Card>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addFloorBreakdown} className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-1" /> Add Floor Range
        </Button>
      </Section>

      {/* ── 4. FLOOR PLAN IMAGES ─────────────────── */}
      <Section id="tower-floorplan" title="Floor Plan Images" description="Architectural layout & highlights" icon={FileText} openIds={openIds} setOpenIds={setOpenIds}>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Master Plan Image */}
          <div className="flex-1">
            <MasterPlanMapUpload
              value={data.typicalFloorPlanImage || ""}
              onChange={v => update("typicalFloorPlanImage", v)}
              title="Upload Tower Floor Plan"
              description="Architectural layout or site map of the Tower"
            />
          </div>

          {/* Right: Description & Brochure */}
          <div className="flex-1 space-y-6">
            <Field label="Short Description" hint="Brief explanation of the layout">
              <Textarea value={data.floorPlanDescription || ""} onChange={e => update("floorPlanDescription", e.target.value)} rows={3} placeholder="Brief description for listings..." className="bg-white/50" />
            </Field>

            <div className="pt-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Tower Brochure</p>
                  <p className="text-xs text-[#2BB673]">Upload your comprehensive tower brochure</p>
                </div>
              </div>
              <DocumentUpload
                value={data.brochureLink || ""}
                onChange={v => update("brochureLink", v)}
              />
            </div>


            {data.refugeFloorPlanImage && (
               <div className="pt-2"> 
                   <Field label="Refuge Floor Plan (Optional)">
                      <Input value={data.refugeFloorPlanImage || ""} onChange={e => update("refugeFloorPlanImage", e.target.value)} placeholder="https://...refuge-floor-plan.jpg" />
                   </Field>
               </div>
            )}
          </div>
        </div>
      </Section>

      {/* ── 5. TOWER-SPECIFIC AMENITIES ─────────── */}
      <Section id="tower-amenities" title="Tower Amenities" description="Tower-exclusive amenities — unique to this tower" icon={MapPin} openIds={openIds} setOpenIds={setOpenIds}>
        <p className="text-xs text-gray-500 mb-3">Township Amenities sabhi towers pe dikhenge. Yahan sirf is tower ke exclusive amenities add karo (Eg: Sky Lounge, Rooftop Gym).</p>
        {(data.towerAmenities || []).map(item => (
          <Card key={item.id} className="mb-3 border-gray-100">
            <CardContent className="p-3">
              <Grid cols={2}>
                <Field label="Amenity Name">
                  <Input value={item.title} onChange={e => updateTowerAmenity(item.id, { title: e.target.value })} placeholder="Sky Lounge" />
                </Field>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Field label="Description">
                      <Input value={item.description} onChange={e => updateTowerAmenity(item.id, { description: e.target.value })} placeholder="30th floor rooftop lounge with city views" />
                    </Field>
                  </div>
                  <button type="button" onClick={() => removeTowerAmenity(item.id)} className="mb-0.5 text-red-400"><X className="w-4 h-4" /></button>
                </div>
              </Grid>
            </CardContent>
          </Card>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addTowerAmenity} className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-1" /> Add Tower Amenity
        </Button>
      </Section>

      {/* ── 6. TOWER LEGAL / RERA ────────────────── */}
      <Section id="tower-legal" title="Tower Legal / RERA" description="RERA, CC, OC — Tower-specific legal documents" icon={ShieldCheck} openIds={openIds} setOpenIds={setOpenIds}>
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-600">Optional: Only fill karo agar is tower ka apna alag RERA / CC number hai. Warna Project/Township ka data use hoga.</p>
        </div>

        <SectionTitle title="Property Status & RERA" />
        <Grid cols={2}>
          <Field label="RERA Number">
            <Input value={data.reraNumber} onChange={e => update("reraNumber", e.target.value)} placeholder="PRM/KA/RERA/..." />
          </Field>
        </Grid>

        <SectionTitle title="Legal Documents" />
        <p className="text-xs text-gray-400 mb-4 mt-[-8px]">Official certificates and approvals in PDF format.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. RERA Certificate */}
          <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 hover:border-gray-200 transition-colors shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-blue-100/50 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#1A3C8C]" />
              </div>
              <Label className="text-[11px] font-bold uppercase tracking-wider text-[#1A3C8C]">RERA Certificate</Label>
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Required</span>
            </div>

            <div className="flex-1">
              <DocumentUpload
                value={data.reraCertificateUrl || ""}
                onChange={v => update("reraCertificateUrl", v)}
                title="RERA Certificate"
                description="Official registration document."
                buttonLabel="View RERA"
              />
            </div>
          </div>

          {/* 2. CC Certificate (Visible for both UC and RM) */}
          {(data.constructionStatus === "under-construction" || data.constructionStatus === "ready-to-move") && (
            <div className="bg-blue-50/20 rounded-2xl p-5 border border-blue-100/50 hover:border-blue-200 transition-colors shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#1A3C8C]" />
                </div>
                <Label className="text-[11px] font-bold uppercase tracking-wider text-[#1A3C8C]">Commencement (CC)</Label>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Required</span>
              </div>
              
              <div className="mb-4">
                <Input value={data.ccNumber || ""} onChange={e => update("ccNumber", e.target.value)} placeholder="CC Number (e.g. CC/2023/102)" className="text-xs bg-white/50" />
              </div>

              <div className="flex-1">
                <DocumentUpload
                  value={data.ccCertificateUrl || ""}
                  onChange={v => update("ccCertificateUrl", v)}
                  title="CC Certificate"
                  description="Official Commencement Certificate PDF."
                  buttonLabel="View CC"
                />
              </div>
            </div>
          )}

          {/* 3. OC Certificate (Visible if Ready to Move) */}
          {data.constructionStatus === "ready-to-move" && (
            <div className="bg-green-50/10 rounded-2xl p-5 border border-green-100/50 hover:border-green-200 transition-colors shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-green-100/50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <Label className="text-[11px] font-bold uppercase tracking-wider text-green-700">Occupancy (OC)</Label>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Required</span>
              </div>

              <div className="mb-4">
                <Input value={data.ocNumber || ""} onChange={e => update("ocNumber", e.target.value)} placeholder="OC Number (e.g. OC/2024/099)" className="text-xs bg-white/50" />
              </div>

              <div className="flex-1">
                <DocumentUpload
                  value={data.ocCertificateUrl || ""}
                  onChange={v => update("ocCertificateUrl", v)}
                  title="OC Certificate"
                  description="Official Occupancy Certificate PDF."
                  buttonLabel="View OC"
                />
              </div>
            </div>
          )}
        </div>
      </Section>
      </PartCollapse>
    </div>
  )
}

export default TowerFlowForm
