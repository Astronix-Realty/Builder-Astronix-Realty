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
  Building2, BarChart3, FileText, Film, Leaf, ShieldCheck,
  Plus, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle,
  Home, MapPin, Wifi, Star, Map as MapIcon, Globe, Info, Briefcase, Users
} from "lucide-react"
import type {
  ProjectData, EcoFeature, AmenityItem, VideoGalleryItem,
  ApfDetail, TownshipData, ConnectivityItem, ReraPhase,
  MasterPlanHighlight, DevelopmentPhase, FaqItem, TestimonialItem
} from "@/lib/builder-types"

// ─────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────
interface ProjectFlowFormProps {
  data: ProjectData
  onChange: (data: ProjectData) => void
  townshipName?: string       // Show which township this belongs to
  townshipData?: TownshipData
  onTownshipChange?: (data: TownshipData) => void
  showCommonData?: boolean
}

// ─────────────────────────────────────────
// REUSABLE SECTION
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
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {COMMON_BANKS.map(b => (
          <button key={b} type="button"
            onClick={() => onChange(banks.includes(b) ? banks.filter(x => x !== b) : [...banks, b])}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${banks.includes(b) ? "bg-[#1A3C8C] text-white border-transparent" : "bg-white text-gray-600 border-gray-200 hover:border-[#1A3C8C]"}`}
          >{b}</button>
        ))}
      </div>
      {banks.filter(b => !COMMON_BANKS.includes(b)).map(b => (
        <Badge key={b} className="bg-[#2BB673]/10 text-[#2BB673] border-0 text-xs font-medium gap-1">
          {b}
          <button onClick={() => onChange(banks.filter(x => x !== b))}><X className="w-3 h-3" /></button>
        </Badge>
      ))}
      <div className="flex gap-2 mt-2">
        <Input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Add other bank..." className="h-8 text-xs" />
        <Button type="button" size="sm" className="h-8 text-xs" onClick={() => { if (custom.trim()) { onChange([...banks, custom.trim()]); setCustom("") } }}>Add</Button>
      </div>
    </div>
  )
}

// BHK Config Tags
const BHK_TYPES = ["1BHK", "2BHK", "3BHK", "4BHK", "5BHK", "Studio", "Penthouse", "Duplex"]

// ─────────────────────────────────────────
// IMAGE UPLOAD FIELD (URL input)
// ─────────────────────────────────────────
function ImageField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [isValid, setIsValid] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (!value) {
      setIsValid(true)
      return
    }
    const isUrl = /^(https?:\/\/|\/|data:image\/)\S+/.test(value)
    if (!isUrl) {
      setIsValid(false)
      return
    }

    setIsChecking(true)
    const img = new window.Image()
    img.onload = () => { setIsValid(true); setIsChecking(false) }
    img.onerror = () => { setIsValid(false); setIsChecking(false) }
    img.src = value
  }, [value])

  return (
    <Field label={label} hint={!isValid ? "⚠️ Please enter a valid image URL" : "Paste image URL or upload path"}>
      <div className="relative">
        {value && isValid && (
          <div className="relative w-full h-28 mb-2">
            <Image src={value} alt="preview" fill className="object-cover rounded-lg border shadow-sm" unoptimized />
            {isChecking && <div className="absolute inset-0 bg-white/50 animate-pulse rounded-lg" />}
          </div>
        )}
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "https://..."}
          className={`text-xs ${!isValid && value ? "border-red-400 focus-visible:ring-red-400 bg-red-50/30" : ""}`}
        />
      </div>
    </Field>
  )
}

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

// ─────────────────────────────────────────
// MAIN FORM
// ─────────────────────────────────────────
export function ProjectFlowForm({ data, onChange, townshipName, townshipData, onTownshipChange, showCommonData }: ProjectFlowFormProps) {
  const [openIds, setOpenIds] = useState<string[]>(["builder", "proj-identity", "location"])

  const update = <K extends keyof ProjectData>(field: K, value: ProjectData[K]) => {
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

  // Gallery images
  const addGallery = () => update("galleryImages", [...data.galleryImages, ""])
  const updateGallery = (i: number, v: string) => {
    const g = [...data.galleryImages]; g[i] = v; update("galleryImages", g)
  }
  const removeGallery = (i: number) => update("galleryImages", data.galleryImages.filter((_, idx) => idx !== i))

  // Eco features
  const addEco = () => {
    const item: EcoFeature = { id: crypto.randomUUID(), title: "", description: "", icon: "leaf" }
    update("ecoFeatures", [...(data.ecoFeatures || []), item])
  }
  const updateEco = (id: string, patch: Partial<EcoFeature>) =>
    update("ecoFeatures", (data.ecoFeatures || []).map(x => x.id === id ? { ...x, ...patch } : x))
  const removeEco = (id: string) =>
    update("ecoFeatures", (data.ecoFeatures || []).filter(x => x.id !== id))

  // Amenities override
  const addAmenity = (cat: AmenityItem["category"]) => {
    const item: AmenityItem = { id: crypto.randomUUID(), title: "", category: cat }
    update("amenities", [...(data.amenities || []), item])
  }
  const updateAmenity = (id: string, patch: Partial<AmenityItem>) =>
    update("amenities", (data.amenities || []).map(x => x.id === id ? { ...x, ...patch } : x))
  const removeAmenity = (id: string) =>
    update("amenities", (data.amenities || []).filter(x => x.id !== id))

  // Video gallery
  const addVideo = (type: VideoGalleryItem["type"]) => {
    const item: VideoGalleryItem = { id: crypto.randomUUID(), title: "", landscapeUrl: "", shortUrl: "", type }
    update("videoGallery", [...(data.videoGallery || []), item])
  }
  const updateVideo = (id: string, patch: Partial<VideoGalleryItem>) =>
    update("videoGallery", (data.videoGallery || []).map(x => x.id === id ? { ...x, ...patch } : x))
  const removeVideo = (id: string) =>
    update("videoGallery", (data.videoGallery || []).filter(x => x.id !== id))

  // APF Details
  const addApf = () => {
    const item: ApfDetail = { id: crypto.randomUUID(), bankName: "", apfNumber: "", certificateUrl: "" }
    update("apfDetails", [...(data.apfDetails || []), item])
  }
  const updateApf = (id: string, patch: Partial<ApfDetail>) =>
    update("apfDetails", (data.apfDetails || []).map(x => x.id === id ? { ...x, ...patch } : x))
  const removeApf = (id: string) =>
    update("apfDetails", (data.apfDetails || []).filter(x => x.id !== id))

  return (
    <div className="space-y-10">
      {/* ══════════════════════════════════════════ */}
      {/* PART A: COMMON INHERITED DATA              */}
      {/* (Only shown in Standalone Project Flow)    */}
      {/* ══════════════════════════════════════════ */}
      {(showCommonData && townshipData) && (
        <>
          <div className="flex items-center gap-3 py-2 px-4 bg-[#1A3C8C] rounded-xl">
            <Home className="w-4 h-4 text-white" />
            <div>
              <p className="text-white font-bold text-sm">Part A: Common Data</p>
              <p className="text-blue-200 text-[11px]">Yeh data sabhi Towers aur Units pe inherit hoga</p>
            </div>
          </div>

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
            <Grid cols={2}>
              <Field label="Green Cover %" hint="Percentage of total area that is green">
                <Input value={townshipData.greenCoverPercentage} onChange={e => updateCommon("greenCoverPercentage", e.target.value)} placeholder="40" />
              </Field>
            </Grid>
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

          <Section id="media-common" title="Cinematic Tour & Videos" description="Landscape (Desktop) + Short (Mobile) videos" icon={Film} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            {townshipData.videoGallery.map(item => (
              <Card key={item.id} className="mb-3 border-gray-100 shadow-none">
                <CardContent className="p-3">
                  <Grid cols={2}>
                    <Field label="Video Title">
                      <Input value={item.title} onChange={e => updateVideoGalleryItem(item.id, { title: e.target.value })} placeholder="Clubhouse Tour" className="h-8 text-xs" />
                    </Field>
                    <Field label="Type">
                      <Select value={item.type || "walkthrough"} onValueChange={v => updateVideoGalleryItem(item.id, { type: v as VideoGalleryItem["type"] })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["walkthrough", "aerial", "interior", "clubhouse", "short"].map(t => (
                            <SelectItem key={t} value={t} className="text-xs">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {item.type === "short" ? (
                      <Field label="Short URL (Vertical)">
                        <Input value={item.shortUrl} onChange={e => updateVideoGalleryItem(item.id, { shortUrl: e.target.value })} placeholder="https://youtube.com/shorts/..." className="h-8 text-xs" />
                      </Field>
                    ) : (
                      <Field label="Landscape URL">
                        <Input value={item.landscapeUrl} onChange={e => updateVideoGalleryItem(item.id, { landscapeUrl: e.target.value })} placeholder="https://youtube.com/..." className="h-8 text-xs" />
                      </Field>
                    )}
                  </Grid>
                  <button type="button" onClick={() => removeVideoGalleryItem(item.id)} className="mt-2 text-[10px] text-red-400 hover:text-red-500 font-bold uppercase">Remove Video</button>
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-3 mt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => addVideoGalleryItem("walkthrough")} className="flex-1 border-dashed text-xs h-9">
                + Walkthrough
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addVideoGalleryItem("short")} className="flex-1 border-dashed text-xs h-9">
                + Shorts
              </Button>
            </div>
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

          <div className="h-6" />
        </>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* PART B: PROJECT-SPECIFIC DATA              */}
      {/* ══════════════════════════════════════════ */}
      <div className="flex items-center gap-3 py-2 px-4 bg-[#2BB673] rounded-xl mt-16">
        <Building2 className="w-4 h-4 text-white" />
        <div>
          <p className="text-white font-bold text-sm">Part B: Project-Specific Data</p>
          <p className="text-emerald-50 text-[11px] opacity-80">Configure specifications unique to this individual project</p>
        </div>
      </div>

      {/* ── 1. PROJECT IDENTITY ────────────────── */}
      <Section id="proj-identity" title="Project Identity" description="Name, hero image, gallery — Project Hero Section" icon={Building2} openIds={openIds} setOpenIds={setOpenIds}>
        <Grid cols={2}>
          <Field label="Project Name" required>
            <Input value={data.name} onChange={e => update("name", e.target.value)} placeholder="Skyline Residences" />
          </Field>
          <Field label="Tag / Type">
            <Input value={data.tagType} onChange={e => update("tagType", e.target.value)} placeholder="Premium Residential Project" />
          </Field>
          <Field label="Construction Status" required>
            <Select value={data.constructionStatus} onValueChange={v => update("constructionStatus", v as ProjectData["constructionStatus"])}>
              <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pre-launch">Pre-Launch</SelectItem>
                <SelectItem value="under-construction">Under Construction</SelectItem>
                <SelectItem value="ready-to-move">Ready to Move</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Grid>

        <SectionTitle title="Hero / Banner Image" />
        <ImageField label="Hero Image" value={data.heroImage} onChange={v => update("heroImage", v)} placeholder="https://...project-hero.jpg" />

        <div className="flex items-center justify-between mb-3 mt-5">
          <SectionTitle title="Photo Gallery" />
          <BulkImageInput onAdd={urls => update("galleryImages", [...data.galleryImages, ...urls])} />
        </div>
        {data.galleryImages.map((img, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <Input value={img} onChange={e => updateGallery(i, e.target.value)} placeholder={`Gallery photo ${i + 1} URL`} className="text-xs" />
            <button type="button" onClick={() => removeGallery(i)} className="text-red-400 shrink-0"><X className="w-4 h-4" /></button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addGallery} className="w-full border-dashed">
          <Plus className="w-3 h-3 mr-1" /> Add Gallery Photo
        </Button>
      </Section>

      {/* ── 2. ABOUT PROJECT ──────────────────── */}
      <Section id="proj-about" title="About Project" description="Vision statement + Description + About image — About section" icon={FileText} openIds={openIds} setOpenIds={setOpenIds}>
        <Field label="Short Description / Tagline" hint="1-2 lines — appears in property card">
          <Textarea value={data.description} onChange={e => update("description", e.target.value)} rows={3} placeholder="A premium residential project where luxury meets nature..." />
        </Field>
        <div className="mt-3">
          <Field label="Vision Statement" hint="Detailed paragraph — About section right side">
            <Textarea value={data.visionStatement} onChange={e => update("visionStatement", e.target.value)} rows={4} placeholder="Our vision is to create a world-class living experience..." />
          </Field>
        </div>
        <SectionTitle title="About Section Image" />
        <ImageField label="About Image (Left Side of About section)" value={data.aboutImageUrl || ""} onChange={v => update("aboutImageUrl", v)} placeholder="https://...about-aerial.jpg" />
      </Section>

      {/* ── 3. KEY STATISTICS ──────────────────── */}
      <Section id="proj-stats" title="Project Statistics" description="Area, dates, families — Stats bar" icon={BarChart3} openIds={openIds} setOpenIds={setOpenIds}>
        <Grid cols={2}>
          <Field label="Project Land Area">
            <Input type="number" value={data.totalArea} onChange={e => update("totalArea", e.target.value)} placeholder="10.5" />
          </Field>
          <Field label="Area Unit">
            <Select value={data.areaUnit} onValueChange={v => update("areaUnit", v as ProjectData["areaUnit"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="acres">Acres</SelectItem>
                <SelectItem value="sqft">Sq. ft.</SelectItem>
                <SelectItem value="hectares">Hectares</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Launch Date" hint="Eg: January 2024">
            <Input value={data.launchDate} onChange={e => update("launchDate", e.target.value)} placeholder="January 2024" />
          </Field>
          <Field label="Possession Date" hint="Eg: December 2026">
            <Input value={data.possessionDate} onChange={e => update("possessionDate", e.target.value)} placeholder="December 2026" />
          </Field>
          <Field label="Total Families (approx)" hint="Auto-calculated from Towers — can override">
            <Input type="number" value={data.totalFamilies} onChange={e => update("totalFamilies", Number(e.target.value))} placeholder="240" />
          </Field>
        </Grid>

        <SectionTitle title="Price Range (Auto from Units)" />
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Price range auto-calculated from Unit configurations — ₹{(data.priceRangeMin / 100000).toFixed(0)}L – ₹{(data.priceRangeMax / 100000).toFixed(0)}L
        </div>
      </Section>


      {/* ── 4. LEGAL (PROJECT-SPECIFIC) ───────── */}
      <Section id="proj-legal" title="Project Legal / RERA" description="RERA, CC, OC, APF — Project-specific legal documents" icon={ShieldCheck} openIds={openIds} setOpenIds={setOpenIds}>
        <SectionTitle title="Property Status & RERA" />
        <Grid cols={2}>
          <Field label="RERA Number" required>
            <Input value={data.reraNumber} onChange={e => update("reraNumber", e.target.value)} placeholder="PRM/KA/RERA/..." />
          </Field>
        </Grid>
        <Field label="RERA Certificate URL" hint="Paste the link to your RERA certificate PDF or image">
          <Input value={data.reraCertificateUrl} onChange={e => update("reraCertificateUrl", e.target.value)} placeholder="https://maharera.mahaonline.gov.in/..." />
        </Field>

        {data.constructionStatus === "ready-to-move" ? (
          <>
            <SectionTitle title="Occupation Certificate (OC)" />
            <Grid cols={2}>
              <Field label="OC Number" required>
                <Input value={data.ocNumber} onChange={e => update("ocNumber", e.target.value)} placeholder="OC/2024/0001" />
              </Field>
              <Field label="OC Certificate URL" hint="Link to OC document">
                <Input value={data.ocCertificateUrl} onChange={e => update("ocCertificateUrl", e.target.value)} placeholder="https://maharera.mahaonline.gov.in/OC/..." />
              </Field>
            </Grid>
          </>
        ) : (
          <>
            <SectionTitle title="Commencement Certificate (CC)" />
            <Grid cols={2}>
              <Field label="CC Number">
                <Input value={data.ccNumber} onChange={e => update("ccNumber", e.target.value)} placeholder="CC/2023/0001" />
              </Field>
              <Field label="CC Status" hint="Eg: CC Received / CC Applied">
                <Input value={data.ccStatus} onChange={e => update("ccStatus", e.target.value)} placeholder="CC Received" />
              </Field>
            </Grid>
          </>
        )}

      </Section>





    </div>
  )
}

export default ProjectFlowForm
