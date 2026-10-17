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
  Building2, BarChart3, FileText, Film, Leaf, ShieldCheck,
  Plus, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
  Home, MapPin, Wifi, Map as MapIcon, Globe, Info, Briefcase, Users, Upload
} from "lucide-react"
import type {
  ProjectData, EcoFeature, VideoGalleryItem,
  ApfDetail, TownshipData, ConnectivityItem, ReraPhase,
  MasterPlanHighlight, DevelopmentPhase, FaqItem, TestimonialItem
} from "@/lib/builder-types"
import { BannerUpload, GalleryUpload, VideoUpload, MasterPlanMapUpload, DocumentUpload, AboutImageUpload, UrlUploadInput } from "@/components/ui/media-uploads"
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
type ProjectUpdater = ProjectData | ((prev: ProjectData) => ProjectData)
type TownshipUpdater = TownshipData | ((prev: TownshipData) => TownshipData)

interface ProjectFlowFormProps {
  data: ProjectData
  onChange: (updater: ProjectUpdater) => void
  townshipName?: string
  townshipData?: TownshipData
  onTownshipChange?: (updater: TownshipUpdater) => void
  showCommonData?: boolean
  user?: any
}

import { CollapsibleSection, type SectionId } from "@/components/builder/shared/atomic-forms/CollapsibleSection"

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

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3">
      <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">{title}</span>
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
function ProjectFlowFormBase({ data, onChange, townshipName, townshipData, onTownshipChange, showCommonData, user }: ProjectFlowFormProps) {
  const [openIds, setOpenIds] = useState<string[]>(["builder", "proj-identity", "location"])
  const [openParts, setOpenParts] = useState<string[]>(["part-a", "part-b"])
  const [detectedAreas, setDetectedAreas] = useState<string[]>(townshipData?.village ? [townshipData.village] : [])

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

  const update = <K extends keyof ProjectData>(field: K, value: ProjectData[K]) => {
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


  // Gallery images
  const addGallery = () => update("galleryImages", [...(data.galleryImages || []), ""])
  const updateGallery = (i: number, v: string) => {
    const g = [...(data.galleryImages || [])]; g[i] = v; update("galleryImages", g)
  }
  const removeGallery = (i: number) => update("galleryImages", (data.galleryImages || []).filter((_, idx) => idx !== i))

  // Eco features
  const addEco = () => {
    const item: EcoFeature = { id: uuidv4(), title: "", description: "", icon: "rainwater_harvesting" }
    update("ecoFeatures", [...(data.ecoFeatures || []), item])
  }
  const updateEco = (id: string, patch: Partial<EcoFeature>) =>
    update("ecoFeatures", (data.ecoFeatures || []).map(x => x.id === id ? { ...x, ...patch } : x))
  const removeEco = (id: string) =>
    update("ecoFeatures", (data.ecoFeatures || []).filter(x => x.id !== id))


  // Video gallery
  const addVideo = (type: VideoGalleryItem["type"]) => {
    const item: VideoGalleryItem = { id: uuidv4(), title: "", landscapeUrl: "", shortUrl: "", type }
    update("videoGallery", [...(data.videoGallery || []), item])
  }
  const updateVideo = (id: string, patch: Partial<VideoGalleryItem>) =>
    update("videoGallery", (data.videoGallery || []).map(x => x.id === id ? { ...x, ...patch } : x))
  const removeVideo = (id: string) =>
    update("videoGallery", (data.videoGallery || []).filter(x => x.id !== id))

  // APF Details
  const addApf = () => {
    const item: ApfDetail = { id: uuidv4(), bankName: "", apfNumber: "", certificateUrl: "" }
    update("apfDetails", [...(data.apfDetails || []), item])
  }
  const updateApf = (id: string, patch: Partial<ApfDetail>) =>
    update("apfDetails", (data.apfDetails || []).map(x => x.id === id ? { ...x, ...patch } : x))
  const removeApf = (id: string) =>
    update("apfDetails", (data.apfDetails || []).filter(x => x.id !== id))

  // Master Plan Highlights
  const addHighlight = () => {
    const item: MasterPlanHighlight = { id: uuidv4(), label: "" }
    update("masterPlanHighlights", [...(data.masterPlanHighlights || []), item])
  }
  const removeHighlight = (id: string) =>
    update("masterPlanHighlights", (data.masterPlanHighlights || []).filter(x => x.id !== id))

  return (
    <div className="space-y-10">

      {/* ══════════════════════════════════════════ */}
      {/* PHASE ONE: PROJECT-SPECIFIC DATA           */}
      {/* ══════════════════════════════════════════ */}
      <PartCollapse id="part-a" title="Project-Specific Data" icon={Building2} openParts={openParts} setOpenParts={setOpenParts}>

      {/* ── 1. PROJECT IDENTITY ────────────────── */}
      <Section id="proj-identity" title="Project Identity" description="Name, tag, price range, hero image — Project Hero Section" icon={Building2} openIds={openIds} setOpenIds={setOpenIds}>
        {/* Layout matching the provided design: Left = Hero Image, Right = Text Fields */}
        <div className="flex flex-col md:flex-row gap-8 mb-8 mt-2">
          {/* LEFT: Hero Image */}
          <div className="flex-1">
            <div className="mb-2">
              <Label className="text-xs font-semibold text-[#1A3C8C] dark:text-blue-400 uppercase tracking-wide">Hero Image</Label>
            </div>
            <BannerUpload value={data.heroImage} onChange={v => update("heroImage", v)} />
          </div>

          {/* RIGHT: Fields */}
          <div className="flex-1 space-y-5">
            <Field label="Project Name" required>
              <Input value={data.name ?? ""} onChange={e => update("name", e.target.value)} placeholder="e.g. Skyline Residences" className="h-10 border-gray-200 dark:border-slate-700 focus-visible:ring-[#1A3C8C]" />
            </Field>

            <Field label="Phase No / Name">
              <Input value={data.phaseName ?? ""} onChange={e => update("phaseName", e.target.value)} placeholder="e.g. Phase 1" className="h-10 border-gray-200 dark:border-slate-700 focus-visible:ring-[#1A3C8C]" />
            </Field>

            <Field label="Tag / Type" hint="Appears as a badge on the listing card.">
              <Input value={data.tagType ?? ""} onChange={e => update("tagType", e.target.value)} placeholder="e.g. Premium Residential Project" className="h-10 border-gray-200 dark:border-slate-700 focus-visible:ring-[#1A3C8C]" />
            </Field>

            <Field label="Construction Status" required hint="Determines if CC or OC is needed">
              <Select value={data.constructionStatus} onValueChange={v => update("constructionStatus", v as any)}>
                <SelectTrigger className="h-10 border-gray-200 dark:border-slate-700 focus:ring-[#1A3C8C]"><SelectValue placeholder="Select Status..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-construction">Under Construction</SelectItem>
                  <SelectItem value="ready-to-move">Ready to Move</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 pt-6 mb-6">
          <SectionTitle title="Pricing & Range" />
          <Grid cols={3}>
            <Field label="Minimum Price (₹)" hint="Auto-synced from towers">
              <Input 
                type="number" 
                value={data.priceRangeMin || ""} 
                readOnly
                placeholder="—" 
                className="h-10 bg-gray-50 dark:bg-slate-800/50 cursor-not-allowed font-bold text-blue-600 dark:text-blue-400 border-gray-200 dark:border-slate-700"
              />
            </Field>
            <Field label="Maximum Price (₹)" hint="Auto-synced from towers">
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
            Auto-synced from tower configurations · ₹{((data.priceRangeMin || 0) / 100000).toFixed(0)}L – ₹{((data.priceRangeMax || 0) / 100000).toFixed(0)}L
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <Label className="text-xs font-semibold text-[#1A3C8C] dark:text-blue-400 uppercase tracking-wide">Gallery Images</Label>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Showcase the property highlights.</p>
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">{(data.galleryImages || []).length} / 20</span>
          </div>
          <GalleryUpload images={data.galleryImages || []} onChange={imgs => update("galleryImages", imgs)} max={20} />
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 pt-6 mt-6">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Film className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#1A3C8C] dark:text-blue-400 uppercase tracking-wide">Video Gallery</Label>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Add walkthrough videos (Max 5).</p>
              </div>
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">{data.videoGallery?.length || 0} / 5</span>
          </div>
          <VideoUpload videos={data.videoGallery || []} onChange={vids => update("videoGallery", vids)} max={5} />
        </div>
      </Section>

      {/* ── 2. ABOUT PROJECT ──────────────────── */}
      <Section id="proj-about" title="About Project" description="Core project values and descriptive highlights" icon={FileText} openIds={openIds} setOpenIds={setOpenIds}>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: About Image */}
          <div className="flex-1">
            <AboutImageUpload
              value={data.aboutImageUrl || ""}
              onChange={v => update("aboutImageUrl", v)}
              title="Upload Project About Image"
              description="Showcase the architectural grandeur of your project"
            />
          </div>

          {/* Right: Text Fields */}
          <div className="flex-1 space-y-6">
            <Field label="Short Description / Tagline" hint="Appears in property cards (1-2 lines)">
              <Textarea 
                value={data.description} 
                onChange={e => update("description", e.target.value)} 
                rows={3} 
                placeholder="A premium residential project where luxury meets nature..." 
                className="bg-white dark:bg-slate-900/50"
              />
            </Field>
            
            <Field label="Vision Statement" hint="The core philosophy behind this development">
              <Textarea 
                value={data.visionStatement} 
                onChange={e => update("visionStatement", e.target.value)} 
                rows={4} 
                placeholder="Our vision is to create a world-class living experience..." 
                className="bg-white dark:bg-slate-900/50 border-blue-50 focus:border-blue-200"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── 3. KEY STATISTICS ──────────────────── */}
      <Section id="proj-stats" title="Project Statistics" description="Area, dates, families — Stats bar" icon={BarChart3} openIds={openIds} setOpenIds={setOpenIds}>
        <Grid cols={2}>
          <Field label="Project Land Area">
            <Input type="number" value={data.totalArea ?? ""} onChange={e => update("totalArea", e.target.value)} placeholder="10.5" />
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
            <Input value={data.launchDate ?? ""} onChange={e => update("launchDate", e.target.value)} placeholder="January 2024" />
          </Field>
          <Field label="Possession Date" hint="Eg: December 2026">
            <Input value={data.possessionDate ?? ""} onChange={e => update("possessionDate", e.target.value)} placeholder="December 2026" />
          </Field>
          <Field label="Total Families (approx)" hint="Auto-synced from Units step">
            <Input type="number" value={data.totalFamilies ?? ""} readOnly placeholder="0" className="bg-gray-50 dark:bg-slate-800/50 cursor-not-allowed font-bold text-blue-600" />
          </Field>
        </Grid>

      </Section>

      {/* ── 4. MASTER PLAN ─────────────────────── */}
      <Section id="proj-masterplan" title="Master Plan" description="Architectural layout & highlights" icon={MapIcon} openIds={openIds} setOpenIds={setOpenIds}>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Master Plan Image */}
          <div className="flex-1">
            <MasterPlanMapUpload
              value={data.masterplanImage || ""}
              onChange={v => update("masterplanImage", v)}
            />
          </div>

          {/* Right: Description & Brochure */}
          <div className="flex-1 space-y-6">
            <Field label="Short Description" hint="Brief explanation of the layout">
              <Textarea value={data.masterPlanDescription || ""} onChange={e => update("masterPlanDescription", e.target.value)} rows={3} placeholder="Brief description for listings..." className="bg-white dark:bg-slate-900/50" />
            </Field>

            <BrochureUploadCard
              title="Project Master Brochure"
              subtitle="Upload your comprehensive project brochure"
              value={data.brochureLink || ""}
              onChange={v => update("brochureLink", v)}
            />

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 mt-6">
              <SectionTitle title="Master Plan Legend / Highlights" />
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">Map labels (Clubhouse, Garden area etc.)</p>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {(data.masterPlanHighlights || []).map(item => (
                  <div key={item.id} className="flex gap-2 group relative">
                    <Input
                      value={item.label}
                      onChange={e => update("masterPlanHighlights", (data.masterPlanHighlights || []).map(x => x.id === item.id ? { ...x, label: e.target.value } : x))}
                      placeholder="e.g. Club House"
                      className="text-xs bg-white dark:bg-slate-900/50 pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => removeHighlight(item.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(data.masterPlanHighlights || []).length === 0 && (
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 italic text-center py-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg">No highlights added</p>
                )}
              </div>

              <Button type="button" variant="outline" size="sm" onClick={addHighlight} className="w-full border-dashed mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Plus className="w-3 h-3 mr-1" /> Add Highlight
              </Button>
            </div>
          </div>
        </div>
      </Section>


      <Section id="proj-legal" title="Project Legal / RERA" description="RERA, CC, OC — Official documentation" icon={ShieldCheck} openIds={openIds} setOpenIds={setOpenIds}>
        <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <Label className="text-sm font-bold text-blue-900 mb-3 block">Does this entire project (all towers) have a single RERA number?</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="hasSingleRera" checked={data.hasSingleRera === true} onChange={() => update("hasSingleRera", true)} className="w-4 h-4 text-[#1A3C8C]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Yes, single RERA for entire project</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="hasSingleRera" checked={data.hasSingleRera === false} onChange={() => { onChange(prev => ({ ...prev, hasSingleRera: false, reraNumber: "", reraCertificateUrl: "" })); }} className="w-4 h-4 text-[#1A3C8C]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">No, different RERA per tower</span>
            </label>
          </div>
        </div>

        {data.hasSingleRera === true && (
          <>
            <SectionTitle title="RERA Details" />
            <Grid cols={2}>
              <Field label="RERA Number" required>
                <Input value={data.reraNumber} onChange={e => update("reraNumber", e.target.value)} placeholder="e.g. P521000..." />
              </Field>
              <Field label="Approvals" hint="Eg: PMRDA / Municipal Corporation Approved">
                <Input value={data.approvalStatus || ""} onChange={e => update("approvalStatus", e.target.value)} placeholder="Thane Municipal Corporation Approved" />
              </Field>
            </Grid>
            <div className="mt-4 mb-8">
              <Field label="Description" hint="Eg: Clear Marketable Title with OC Received">
                <Textarea value={data.legalTrustDescription || ""} onChange={e => update("legalTrustDescription", e.target.value)} rows={2} placeholder="Clear Marketable Title with OC Received" />
              </Field>
            </div>

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
        
        {data.hasSingleRera === false && (
          <div className="text-center py-8 text-gray-500 dark:text-slate-400">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="font-semibold text-gray-600 dark:text-slate-300">Tower-Level RERA Selected</p>
            <p className="text-sm">You can enter the RERA number for each tower individually in the next step.</p>
          </div>
        )}
      </Section>

      </PartCollapse>



      {/* ══════════════════════════════════════════ */}
      {/* PHASE TWO: COMMON INHERITED DATA            */}
      {/* (Only shown in Standalone Project Flow)    */}
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

export const ProjectFlowForm = memo(ProjectFlowFormBase)
export default ProjectFlowForm
