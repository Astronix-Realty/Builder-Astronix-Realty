"use client"
import { BrochureUploadCard } from "@/components/builder/shared/atomic-forms/BrochureUploadCard"
import { LegalDocumentsUploader } from "@/components/builder/shared/atomic-forms/LegalDocumentsUploader"
import { CommonPropertySections } from "@/components/builder/shared/CommonPropertySections"

import { useState, useEffect, memo } from "react"
import { v4 as uuidv4 } from "uuid"
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
  Plus, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
  Home, Wifi, Map as MapIcon, Building2, Leaf, Film, Users, Info
} from "lucide-react"
import type {
  TowerData, FloorBreakdown, TownshipData, ConnectivityItem,
  EcoFeature, ApfDetail, VideoGalleryItem, MasterPlanHighlight
} from "@/lib/builder-types"
import { BannerUpload, GalleryUpload, VideoUpload, DocumentUpload, MasterPlanMapUpload, AboutImageUpload, UrlUploadInput } from "@/components/ui/media-uploads"
import { ImageUpload } from "@/components/ui/image-upload"
import { MiniImageUpload } from "@/components/builder/shared/MiniImageUpload"
import { ConnectivityManager } from "@/components/builder/shared/ConnectivityManager"
import { EcoFeaturesManager } from "@/components/builder/shared/EcoFeaturesManager"
import { AmenitiesManager } from "@/components/builder/shared/AmenitiesManager"
import GooglePlacesSearch from "@/components/builder/forms/GooglePlacesSearch"
import AreaSelectInput from "@/components/builder/forms/AreaSelectInput"
import { GmbReviewsSelector } from "@/components/builder/shared/GmbReviewsSelector"
import { GmbMapPreview } from "@/components/builder/shared/GmbMapPreview"

// ─────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────
type TowerUpdater = TowerData | ((prev: TowerData) => TowerData)
type TownshipUpdater = TownshipData | ((prev: TownshipData) => TownshipData)

interface TowerFlowFormProps {
  data: TowerData
  unitConfig?: any;
  unitTemplate?: any;
  onChange: (data: Partial<TowerData> | ((prev: TowerData) => TowerData)) => void;
  projectName?: string
  parentProjectHasSingleRera?: boolean
  townshipName?: string
  townshipData?: TownshipData
  onTownshipChange?: (updater: TownshipUpdater) => void
  showCommonData?: boolean
  user?: any
}

// ─────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────
import { CollapsibleSection } from "@/components/builder/shared/atomic-forms/CollapsibleSection"

function Section({
  id, title, description, icon: Icon, badge, openIds, setOpenIds, children,
}: {
  id: string; title: string; description?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  openIds: string[]; setOpenIds: React.Dispatch<React.SetStateAction<string[]>>
  children: React.ReactNode
}) {
  return (
    <CollapsibleSection
      id={id}
      title={title}
      description={description}
      icon={Icon}
      badge={badge}
      openIds={openIds}
      setOpenIds={setOpenIds}
      variant="compact"
    >
      {children}
    </CollapsibleSection>
  )
}

function Field({ label, required, hint, className, children }: { label: string; required?: boolean; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1 ${className || ""}`}>
      <Label className="text-[10.5px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
        {label}{required && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{hint}</p>}
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

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3">
      <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">{title}</span>
        {action}
      </div>
      <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
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
            className={`text-xs px-4 py-2 rounded-xl border font-semibold transition-all shadow-sm ${banks.includes(b) ? "bg-[#1A3C8C] dark:bg-blue-600 text-white border-transparent" : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-slate-800 hover:border-[#1A3C8C]"}`}
          >{b}</button>
        ))}
      </div>
      {banks.filter(b => !COMMON_BANKS.includes(b)).map(b => (
        <Badge key={b} className="bg-[#2BB673]/10 text-[#2BB673] dark:text-emerald-400 border-0 text-xs font-semibold py-1.5 px-3 rounded-lg gap-2">
          {b}
          <button onClick={() => onChange(banks.filter(x => x !== b))} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
        </Badge>
      ))}
      <div className="flex gap-2 max-w-sm">
        <Input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Add other bank..." className="h-10 text-sm bg-gray-50 dark:bg-slate-800/50/50" />
        <Button type="button" className="h-10 px-6 bg-[#1A3C8C] dark:bg-blue-600 hover:bg-[#1A3C8C] dark:bg-blue-600/90 text-sm font-bold" onClick={() => { if (custom.trim()) { onChange([...(banks || []), custom.trim()]); setCustom("") } }}>Add</Button>
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
        ? "bg-white dark:bg-slate-900 border-blue-100 shadow-lg sm:shadow-xl shadow-blue-50/80"
        : "bg-gray-50 dark:bg-slate-800/50/70 border-gray-100 dark:border-slate-800 shadow-none"
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
                ? "bg-[#1A3C8C] dark:bg-blue-600 text-white shadow-lg shadow-blue-300/40"
                : "bg-[#2BB673] text-white shadow-lg shadow-emerald-300/40"
              : "bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-800 shadow-sm group-hover:border-blue-100 group-hover:shadow-blue-50",
          ].join(" ")}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-8 2xl:h-8" />
          </div>

          <div className="min-w-0">
            <span className={[
              "block font-black uppercase tracking-[0.18em] mb-0.5 sm:mb-1",
              "text-[9px] sm:text-[10px] 2xl:text-xs",
              isOpen
                ? isPartA ? "text-[#1A3C8C] dark:text-blue-400" : "text-[#2BB673] dark:text-emerald-400"
                : "text-gray-400 dark:text-slate-500"
            ].join(" ")}>
              {isPartA ? "Phase One" : "Phase Two"}
            </span>
            <h2 className={[
              "font-bold tracking-tight leading-tight truncate transition-colors",
              "text-base sm:text-xl 2xl:text-3xl",
              isOpen ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-slate-400"
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
            : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 group-hover:border-gray-400"
        ].join(" ")}>
          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 2xl:w-5 2xl:h-5" />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-5 pt-0 sm:px-6 sm:pb-8 2xl:px-10 2xl:pb-12 space-y-4 sm:space-y-6 border-t border-gray-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  )
}

// BHK Config Tags
const BHK_TYPES = ["1BHK", "2BHK", "3BHK", "4BHK", "5BHK", "Studio", "Penthouse", "Duplex"]



// ─────────────────────────────────────────
// BULK IMAGE INPUT
// ─────────────────────────────────────────
function BulkImageInput({ onAdd }: { onAdd: (urls: string[]) => void }) {
  const [text, setText] = useState("")
  const [open, setOpen] = useState(false)

  const handleApply = () => {
    const urls = (text || "").split("\n").map(s => s.trim()).filter(s => s.length > 0)
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
        className="h-20 text-xs bg-white dark:bg-slate-900 font-mono"
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
function TowerFlowFormBase({ data, unitConfig, unitTemplate, onChange, projectName, parentProjectHasSingleRera, townshipName, townshipData, onTownshipChange, showCommonData, user }: TowerFlowFormProps) {
  const [openIds, setOpenIds] = useState<string[]>(["builder", "tower-identity", "location"])
  const [openParts, setOpenParts] = useState<string[]>(["part-a", "part-b"])
  const [detectedAreas, setDetectedAreas] = useState<string[]>(townshipData?.village ? [townshipData.village] : [])

  const handleSyncPrices = () => {
    let configs = unitConfig?.configurations || []
    if (configs.length === 0 || !configs.some((c: any) => (c.allInclusivePrice || 0) > 0)) {
      configs = unitTemplate?.configurations || []
    }

    if (configs.length > 0) {
      const prices = configs.map((c: any) => c.allInclusivePrice || 0).filter((p: number) => p > 0)
      if (prices.length > 0) {
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        
        // Helper to format price in L/Cr
        const formatPrice = (p: number) => {
          if (p >= 10000000) return `₹${(p / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`
          if (p >= 100000) return `₹${(p / 100000).toFixed(0)} L`
          return `₹${p.toLocaleString()}`
        }

        const autoLabel = min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`
        
        onChange(prev => ({
          ...prev,
          priceRangeMin: min,
          priceRangeMax: max,
          priceLabel: autoLabel
        }))
      }
    }
  }

  let configsForCalc = unitConfig?.configurations || []
  if (configsForCalc.length === 0 || !configsForCalc.some((c: any) => (c.allInclusivePrice || 0) > 0)) {
    configsForCalc = unitTemplate?.configurations || []
  }

  const configPrices = configsForCalc
    .map((c: any) => c.allInclusivePrice || 0)
    .filter((p: number) => p > 0)

  const calculatedMin = configPrices.length > 0 ? Math.min(...configPrices) : 0
  const calculatedMax = configPrices.length > 0 ? Math.max(...configPrices) : 0

  const hasDiff = calculatedMin > 0 && (data.priceRangeMin !== calculatedMin || data.priceRangeMax !== calculatedMax)

  useEffect(() => {
    if (hasDiff) {
      handleSyncPrices()
    }
  }, [hasDiff])


  const isBuilder = user?.role === "builder" || user?.userType === "builder"

  useEffect(() => {
    if (isBuilder && townshipData && onTownshipChange) {
      let changed = false;
      const newDocs = { ...townshipData };
      if (!townshipData.builderName && (user.profile?.companyName || user.profile?.name)) {
        newDocs.builderName = user.profile.companyName || user.profile.name || "";
        changed = true;
      }
      if (!townshipData.builderLogo && user.profile?.companyLogo) {
        newDocs.builderLogo = user.profile.companyLogo;
        changed = true;
      }
      if (changed) {
        onTownshipChange(newDocs);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBuilder, user, townshipData?.builderName, townshipData?.builderLogo]);

  const update = <K extends keyof TowerData>(field: K, value: TowerData[K]) => {
    onChange(prev => ({ ...prev, [field]: value }))
  }

  // --- TOWNSHIP UPDATE HELPERS ---
  const updateCommon = <K extends keyof TownshipData>(field: K, value: TownshipData[K]) => {
    if (onTownshipChange) {
      onTownshipChange(prev => ({ ...prev, [field]: value }))
    }
  }

  // Common Data Helpers
  const addConnectivity = () => {
    if (!townshipData) return
    const item: ConnectivityItem = { id: uuidv4(), title: "", type: "custom", distanceKm: "", duration: "" }
    updateCommon("connectivity", [...(townshipData.connectivity || []), item])
  }
  const updateConnectivity = (id: string, patch: Partial<ConnectivityItem>) => {
    if (!townshipData) return
    updateCommon("connectivity", (townshipData.connectivity || []).map(x => x.id === id ? { ...x, ...patch } : x))
  }
  const removeConnectivity = (id: string) => {
    if (!townshipData) return
    updateCommon("connectivity", (townshipData.connectivity || []).filter(x => x.id !== id))
  }


  const addEcoCommon = () => {
    if (!townshipData) return
    const item: EcoFeature = { id: uuidv4(), title: "", description: "", icon: "rainwater_harvesting" }
    updateCommon("ecoFeatures", [...(townshipData.ecoFeatures || []), item])
  }
  const updateEcoCommon = (id: string, patch: Partial<EcoFeature>) => {
    if (!townshipData) return
    updateCommon("ecoFeatures", (townshipData.ecoFeatures || []).map(x => x.id === id ? { ...x, ...patch } : x))
  }
  const removeEcoCommon = (id: string) => {
    if (!townshipData) return
    updateCommon("ecoFeatures", (townshipData.ecoFeatures || []).filter(x => x.id !== id))
  }

  const addVideoGalleryItem = (type: VideoGalleryItem["type"]) => {
    if (!townshipData) return
    const item: VideoGalleryItem = { id: uuidv4(), title: "", landscapeUrl: "", shortUrl: "", type }
    updateCommon("videoGallery", [...(townshipData.videoGallery || []), item])
  }
  const updateVideoGalleryItem = (id: string, patch: Partial<VideoGalleryItem>) => {
    if (!townshipData) return
    updateCommon("videoGallery", (townshipData.videoGallery || []).map(x => x.id === id ? { ...x, ...patch } : x))
  }
  const removeVideoGalleryItem = (id: string) => {
    if (!townshipData) return
    updateCommon("videoGallery", (townshipData.videoGallery || []).filter(x => x.id !== id))
  }

  const addApfCommon = () => {
    if (!townshipData) return
    const item: ApfDetail = { id: uuidv4(), bankName: "", apfNumber: "", certificateUrl: "" }
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



  const configsStr = JSON.stringify(unitConfig?.configurations || unitTemplate?.configurations || [])

  // Auto-calculate total units and units per floor
  useEffect(() => {
    const floors = data.totalFloorsNum || parseInt(String(data.totalFloors || "").replace(/\D/g, "")) || 0
    
    let configs = unitConfig?.configurations || []
    if (configs.length === 0 || !configs.some((c: any) => (c.allInclusivePrice || 0) > 0)) {
      configs = unitTemplate?.configurations || []
    }
    const calculatedPerFloor = configs.reduce((sum: number, c: any) => sum + (Number(c.countPerFloor) || 0), 0)
    
    const updates: Partial<TowerData> = {}
    if (String(calculatedPerFloor) !== String(data.unitsPerFloor)) {
      updates.unitsPerFloor = String(calculatedPerFloor)
    }
    
    if (Object.keys(updates).length > 0) {
      onChange(prev => ({ ...prev, ...updates }))
    }
  }, [data.totalFloorsNum, data.totalFloors, data.unitsPerFloor, data.totalUnits, configsStr, onChange])

  // Gallery images
  const addGallery = () => update("galleryImages", [...(data.galleryImages || []), ""])
  const updateGallery = (i: number, v: string) => {
    const g = [...(data.galleryImages || [])]; g[i] = v; update("galleryImages", g)
  }
  const removeGallery = (i: number) => update("galleryImages", (data.galleryImages || []).filter((_, idx) => idx !== i))



  // Floor breakdown
  const addFloorBreakdown = () => {
    const item: FloorBreakdown = { id: uuidv4(), floorType: "residential", fromFloor: "", toFloor: "", description: "" }
    update("floorsBreakdown", [...(data.floorsBreakdown || []), item])
  }
  const updateFloorBreakdown = (id: string, patch: Partial<FloorBreakdown>) =>
    update("floorsBreakdown", (data.floorsBreakdown || []).map(x => x.id === id ? { ...x, ...patch } : x))
  const removeFloorBreakdown = (id: string) =>
    update("floorsBreakdown", (data.floorsBreakdown || []).filter(x => x.id !== id))


  // Parse floor count from string like "G + 24"
  const parseTotalFloors = (val: string) => {
    const match = val.match(/(\d+)\s*$/); return match ? parseInt(match[1]) : 0
  }

  const VIEW_TYPES = ["3-Side Open", "2-Side Open", "Corner Unit", "Sea View", "Garden View", "City View", "Pool View", "Mountain View", "Road Facing"]
  const FLOOR_TYPES: FloorBreakdown["floorType"][] = ["parking", "podium", "refuge", "residential", "terrace", "gym", "clubhouse"]

  return (
    <div className="space-y-10">

      {/* ══════════════════════════════════════════ */}
      {/* PHASE ONE: TOWER-SPECIFIC DATA             */}
      {/* ══════════════════════════════════════════ */}
      <PartCollapse id="part-a" title="Tower-Specific Data" icon={Building} openParts={openParts} setOpenParts={setOpenParts}>

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
                className="h-12 text-lg font-medium tracking-tight bg-white dark:bg-slate-900/50"
              />
            </Field>

            <Field label="Tower Number">
              <Input
                value={data.towerNumber || ""}
                onChange={e => update("towerNumber", e.target.value)}
                placeholder="e.g. Tower 1, T1"
                className="h-11 bg-white dark:bg-slate-900/50"
              />
            </Field>

            <Field label="Tower Type">
              <Select value={data.towerType || "residential"} onValueChange={v => update("towerType", v as TowerData["towerType"])}>
                <SelectTrigger className="h-11 bg-white dark:bg-slate-900/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="mixed">Mixed Use</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Construction Status" required hint="Determines if CC or OC is needed">
              <Select value={data.constructionStatus || "under-construction"} onValueChange={v => update("constructionStatus", v as TowerData["constructionStatus"])}>
                <SelectTrigger className="h-11 bg-white dark:bg-slate-900/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-construction">Under Construction</SelectItem>
                  <SelectItem value="ready-to-move">Ready to Move</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
          <SectionTitle title="Pricing & Range" />
          <Grid cols={3}>
            <Field label="Minimum Price (₹)" hint="Auto-synced from units">
              <Input 
                type="number" 
                value={data.priceRangeMin || ""} 
                readOnly
                placeholder="—" 
                className="h-10 bg-gray-50 dark:bg-slate-800/50 cursor-not-allowed font-bold text-blue-600 dark:text-blue-400 border-gray-200 dark:border-slate-700"
              />
            </Field>
            <Field label="Maximum Price (₹)" hint="Auto-synced from units">
              <Input 
                type="number" 
                value={data.priceRangeMax || ""} 
                readOnly
                placeholder="—" 
                className="h-10 bg-gray-50 dark:bg-slate-800/50 cursor-not-allowed font-bold text-blue-600 dark:text-blue-400 border-gray-200 dark:border-slate-700"
              />
            </Field>
            <Field label="Display Price Range" hint="Auto-generated label">
              <Input 
                value={data.priceLabel || ""} 
                readOnly
                placeholder="—" 
                className="h-10 bg-gray-50 dark:bg-slate-800/50 cursor-not-allowed font-bold text-blue-600 dark:text-blue-400 border-gray-200 dark:border-slate-700"
              />
            </Field>
          </Grid>
          <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100/50 dark:border-emerald-800/30 rounded-lg text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tight">
            <CheckCircle2 className="w-3 h-3" />
            Auto-synced from unit configurations · ₹{(calculatedMin / 100000).toFixed(0)}L – ₹{(calculatedMax / 100000).toFixed(0)}L
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
          <SectionTitle title="Photo Gallery" />
          <GalleryUpload
            images={data.galleryImages || []}
            onChange={v => update("galleryImages", v)}
          />
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
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
                value={data.description ?? ""} 
                onChange={e => update("description", e.target.value)} 
                rows={3} 
                placeholder="Tower A is an iconic 25-storey residential tower with panoramic city views..." 
                className="bg-white dark:bg-slate-900/50"
              />
            </Field>
            
            <Field label="Vision Statement" hint="Architectural details and exclusive features">
              <Textarea 
                value={data.visionStatement || ""} 
                onChange={e => update("visionStatement", e.target.value)} 
                rows={4} 
                placeholder="Tower A stands as a beacon of modern architecture, offering world-class amenities..." 
                className="bg-white dark:bg-slate-900/50 border-blue-50 focus:border-blue-200"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── 2. TOWER STRUCTURE (KEY STATS) ─────── */}
      <Section id="tower-structure" title="Tower Structure & Stats" description="Floors, lifts, view type, dates — Stats bar + About Tower" icon={BarChart3} openIds={openIds} setOpenIds={setOpenIds}>
        <Grid cols={3}>
          <Field label="Total Lifts" hint="Shown in Stats Snapshot">
            <Input value={data.totalLifts ?? ""} onChange={e => update("totalLifts", e.target.value)} placeholder="3" />
          </Field>
          <Field label="Lifts Configuration" hint="Full detail shown in About section">
            <Input value={data.liftsConfiguration ?? ""} onChange={e => update("liftsConfiguration", e.target.value)} placeholder="3 High-Speed + 1 Service Lift" />
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
            <Input value={data.parkingLevels ?? ""} onChange={e => update("parkingLevels", e.target.value)} placeholder="2 Basement Levels" />
          </Field>
          <Field label="Lobby Details">
            <Input value={data.lobbyDetails ?? ""} onChange={e => update("lobbyDetails", e.target.value)} placeholder="Double-Height Grand Lobby with Concierge" />
          </Field>
          <Field label="Units Per Floor" required hint="Auto-synced from unit configurations">
            <Input type="number" value={data.unitsPerFloor ?? ""} readOnly placeholder="—" className="bg-gray-50 dark:bg-slate-800/50 cursor-not-allowed font-bold text-blue-600 dark:text-blue-400 border-gray-200 dark:border-slate-700" />
          </Field>
        </Grid>

        <SectionTitle title="Construction Status & Dates" />
        <Grid cols={3}>
          <Field label="Launch Date">
            <Input value={data.launchDate ?? ""} onChange={e => update("launchDate", e.target.value)} placeholder="January 2024" />
          </Field>
          <Field label="Possession Date" required>
            <Input value={data.possessionDate ?? ""} onChange={e => update("possessionDate", e.target.value)} placeholder="December 2026" />
          </Field>
        </Grid>

        <SectionTitle title="Auto-Calculated" />
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          <p className="text-xs text-green-700">
            <span className="font-bold">Total Units: {data.totalUnits}</span>
            {" "}({data.totalFloorsNum} floors × {parseInt(data.unitsPerFloor) || 0} units/floor)
          </p>
        </div>
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
              <Textarea value={data.floorPlanDescription || ""} onChange={e => update("floorPlanDescription", e.target.value)} rows={3} placeholder="Brief description for listings..." className="bg-white dark:bg-slate-900/50" />
            </Field>

            <BrochureUploadCard
              title="Tower Brochure"
              subtitle="Upload your comprehensive tower brochure"
              value={data.brochureLink || ""}
              onChange={v => update("brochureLink", v)}
            />


            {data.refugeFloorPlanImage && (
               <div className="pt-2"> 
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 tracking-wider">Refuge Floor Plan (Optional)</label>
                      <AboutImageUpload
                        value={data.refugeFloorPlanImage || ""}
                        onChange={url => update("refugeFloorPlanImage", url)}
                        title="Upload Refuge Floor Plan"
                        description="Layout for the refuge level"
                      />
                    </div>
               </div>
            )}
          </div>
        </div>
      </Section>

      {/* ── 6. TOWER LEGAL / RERA ────────────────── */}
      <Section id="tower-legal" title="Tower Legal / RERA" description="RERA, CC, OC — Tower-specific legal documents" icon={ShieldCheck} openIds={openIds} setOpenIds={setOpenIds}>
        {parentProjectHasSingleRera ? (
          <div className="flex items-start gap-2 px-3 py-4 bg-blue-50/50 rounded-lg border border-blue-100 mb-4">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-bold mb-1">RERA Inherited from Project</p>
              <p className="text-xs text-blue-700">The project was configured with a single RERA for all towers. You do not need to provide separate RERA details for this tower.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-600">Please provide RERA and CC/OC details specifically for this tower.</p>
            </div>

            <SectionTitle title="Property Status & RERA" />
            <Grid cols={2}>
              <Field label="RERA Number">
                <Input value={data.reraNumber ?? ""} onChange={e => update("reraNumber", e.target.value)} placeholder="e.g. P521000..." />
              </Field>
            </Grid>

            <SectionTitle title="Legal Documents" />
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4 mt-[-8px]">Official certificates and approvals in PDF format.</p>

            <LegalDocumentsUploader
              constructionStatus={data.constructionStatus}
              reraCertificateUrl={data.reraCertificateUrl}
              onReraCertificateChange={v => update("reraCertificateUrl", v)}
              ccNumber={data.ccNumber}
              onCcNumberChange={val => update("ccNumber", val)}
              ccCertificateUrl={data.ccCertificateUrl}
              onCcCertificateChange={url => update("ccCertificateUrl", url)}
              ocNumber={data.ocNumber}
              onOcNumberChange={val => update("ocNumber", val)}
              ocCertificateUrl={data.ocCertificateUrl}
              onOcCertificateChange={url => update("ocCertificateUrl", url)}
            />
          </>
        )}
      </Section>
      </PartCollapse>




      {/* ══════════════════════════════════════════ */}
      {/* PHASE TWO: COMMON INHERITED DATA            */}
      {/* (Only shown in Standalone Tower Flow)      */}
      {/* ══════════════════════════════════════════ */}
      {(showCommonData && townshipData) && (
        <>
          <PartCollapse id="part-b" title="Common Inherited Data" icon={Home} openParts={openParts} setOpenParts={setOpenParts}>

          <CommonPropertySections
            data={townshipData}
            onChange={onTownshipChange!}
            openIds={openIds}
            setOpenIds={setOpenIds}
            isBuilder={isBuilder}
            variant="compact"
            useAlternativeIds
          />

          {/* Group Buying is now managed exclusively from Published property cards via Quick Edit */}


          </PartCollapse>
        </>
      )}

    </div>
  )
}

export const TowerFlowForm = memo(TowerFlowFormBase)
export default TowerFlowForm
