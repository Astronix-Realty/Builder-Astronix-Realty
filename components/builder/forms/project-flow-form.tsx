"use client"

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
  Plus, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle,
  Home, MapPin, Wifi, Map as MapIcon, Globe, Info, Briefcase, Users, Upload
} from "lucide-react"
import type {
  ProjectData, EcoFeature, VideoGalleryItem,
  ApfDetail, TownshipData, ConnectivityItem, ReraPhase,
  MasterPlanHighlight, DevelopmentPhase, FaqItem, TestimonialItem
} from "@/lib/builder-types"
import { BannerUpload, GalleryUpload, VideoUpload, MasterPlanMapUpload, DocumentUpload, AboutImageUpload } from "@/components/ui/media-uploads"
import { AmenitiesManager } from "@/components/builder/shared/AmenitiesManager"

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
        <Button type="button" className="h-10 px-6 bg-[#1A3C8C] hover:bg-[#1A3C8C]/90 text-sm font-bold" onClick={() => { if (custom.trim()) { onChange([...(banks || []), custom.trim()]); setCustom("") } }}>Add</Button>
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
function ProjectFlowFormBase({ data, onChange, townshipName, townshipData, onTownshipChange, showCommonData, user }: ProjectFlowFormProps) {
  const [openIds, setOpenIds] = useState<string[]>(["builder", "proj-identity", "location"])
  const [openParts, setOpenParts] = useState<string[]>(["part-a", "part-b"])

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
    const item: EcoFeature = { id: uuidv4(), title: "", description: "", icon: "leaf" }
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
    const item: EcoFeature = { id: uuidv4(), title: "", description: "", icon: "leaf" }
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
              <Label className="text-xs font-semibold text-[#1A3C8C] uppercase tracking-wide">Hero Image</Label>
            </div>
            <BannerUpload value={data.heroImage} onChange={v => update("heroImage", v)} />
          </div>

          {/* RIGHT: Fields */}
          <div className="flex-1 space-y-5">
            <Field label="Project Name" required>
              <Input value={data.name ?? ""} onChange={e => update("name", e.target.value)} placeholder="e.g. Skyline Residences" className="h-10 border-gray-200 focus-visible:ring-[#1A3C8C]" />
            </Field>

            <Field label="Tag / Type" hint="Appears as a badge on the listing card.">
              <Input value={data.tagType ?? ""} onChange={e => update("tagType", e.target.value)} placeholder="e.g. Premium Residential Project" className="h-10 border-gray-200 focus-visible:ring-[#1A3C8C]" />
            </Field>

            <Field label="Construction Status" required hint="Determines if CC or OC is needed">
              <Select value={data.constructionStatus} onValueChange={v => update("constructionStatus", v as any)}>
                <SelectTrigger className="h-10 border-gray-200 focus:ring-[#1A3C8C]"><SelectValue placeholder="Select Status..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-construction">Under Construction</SelectItem>
                  <SelectItem value="ready-to-move">Ready to Move</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 mb-6">
          <SectionTitle title="Price Range (Auto from Units)" />
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Price range auto-calculated from Unit configurations — ₹{(data.priceRangeMin / 100000).toFixed(0)}L – ₹{(data.priceRangeMax / 100000).toFixed(0)}L
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <Label className="text-xs font-semibold text-[#1A3C8C] uppercase tracking-wide">Gallery Images</Label>
              <p className="text-[11px] text-gray-400 mt-1">Showcase the property highlights.</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{(data.galleryImages || []).length} / 20</span>
          </div>
          <GalleryUpload images={data.galleryImages || []} onChange={imgs => update("galleryImages", imgs)} max={20} />
        </div>

        <div className="border-t border-gray-100 pt-6 mt-6">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Film className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#1A3C8C] uppercase tracking-wide">Video Gallery</Label>
                <p className="text-[11px] text-gray-400 mt-1">Add walkthrough videos (Max 5).</p>
              </div>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{data.videoGallery?.length || 0} / 5</span>
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
                className="bg-white/50"
              />
            </Field>
            
            <Field label="Vision Statement" hint="The core philosophy behind this development">
              <Textarea 
                value={data.visionStatement} 
                onChange={e => update("visionStatement", e.target.value)} 
                rows={4} 
                placeholder="Our vision is to create a world-class living experience..." 
                className="bg-white/50 border-blue-50 focus:border-blue-200"
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
            <Input type="number" value={data.totalFamilies ?? ""} readOnly placeholder="0" className="bg-gray-50 cursor-not-allowed font-bold text-blue-600" />
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
              <Textarea value={data.masterPlanDescription || ""} onChange={e => update("masterPlanDescription", e.target.value)} rows={3} placeholder="Brief description for listings..." className="bg-white/50" />
            </Field>

            <div className="pt-2">
              {/* Project Master Brochure heading */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Project Master Brochure</p>
                  <p className="text-xs text-[#2BB673]">Upload your comprehensive project brochure</p>
                </div>
              </div>
              <DocumentUpload
                value={data.brochureLink || ""}
                onChange={v => update("brochureLink", v)}
              />
            </div>

            <div className="pt-6 border-t border-gray-100 mt-6">
              <SectionTitle title="Master Plan Legend / Highlights" />
              <p className="text-xs text-gray-500 mb-3">Map labels (Clubhouse, Garden area etc.)</p>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {(data.masterPlanHighlights || []).map(item => (
                  <div key={item.id} className="flex gap-2 group relative">
                    <Input
                      value={item.label}
                      onChange={e => update("masterPlanHighlights", (data.masterPlanHighlights || []).map(x => x.id === item.id ? { ...x, label: e.target.value } : x))}
                      placeholder="e.g. Club House"
                      className="text-xs bg-white/50 pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => removeHighlight(item.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(data.masterPlanHighlights || []).length === 0 && (
                  <p className="text-[11px] text-gray-400 italic text-center py-2 bg-gray-50 rounded-lg">No highlights added</p>
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
        <SectionTitle title="RERA Details" />
        <Grid cols={2}>
          <Field label="RERA Number" required>
            <Input value={data.reraNumber} onChange={e => update("reraNumber", e.target.value)} placeholder="PRM/KA/RERA/..." />
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



      {/* ══════════════════════════════════════════ */}
      {/* PHASE TWO: COMMON INHERITED DATA            */}
      {/* (Only shown in Standalone Project Flow)    */}
      {/* ══════════════════════════════════════════ */}
      {(showCommonData && townshipData) && (
        <>
          <PartCollapse id="part-b" title="Common Inherited Data" icon={Home} openParts={openParts} setOpenParts={setOpenParts}>

          {!isBuilder && (
          <Section id="builder" title="Developer / Builder Info" description="Builder name, logo, contact — Hero pe dikhta hai" icon={Building2} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
             <div className="bg-gray-50/50 p-4 sm:p-5 rounded-2xl border border-gray-100 flex flex-col gap-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <Field label="Builder / Company Name" required hint="Registered company name (auto-filled for builders)">
                   <Input value={townshipData.builderName} onChange={e => updateCommon("builderName", e.target.value)} placeholder="Astronix Realty" className="h-11 border-gray-200 bg-white shadow-sm focus-visible:ring-blue-500 rounded-xl" />
                 </Field>
                 <Field label="Builder Logo URL" hint="A publicly accessible logo URL">
                   <Input value={townshipData.builderLogo} onChange={e => updateCommon("builderLogo", e.target.value)} placeholder="https://..." className="h-11 border-gray-200 bg-white shadow-sm focus-visible:ring-blue-500 rounded-xl" />
                 </Field>
               </div>
             </div>
          </Section>
          )}

          <Section id="location" title="Location Details" description="City, district, pincode — Map pe dikhta hai" icon={MapPin} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            <Grid cols={3}>
              <Field label="City" required>
                <Input value={townshipData.city ?? ""} onChange={e => updateCommon("city", e.target.value)} placeholder="Mumbai" />
              </Field>
              <Field label="District" required>
                <Input value={townshipData.district ?? ""} onChange={e => updateCommon("district", e.target.value)} placeholder="Thane" />
              </Field>
              <Field label="Sub City" required>
                <Input value={townshipData.subCity ?? ""} onChange={e => updateCommon("subCity", e.target.value)} placeholder="Dombivali" />
              </Field>
              <Field label="Village / Area" required>
                <Input value={townshipData.village ?? ""} onChange={e => updateCommon("village", e.target.value)} placeholder="Sonarpada" />
              </Field>
              <Field label="State" required>
                <Input value={townshipData.state ?? ""} onChange={e => updateCommon("state", e.target.value)} placeholder="Maharashtra" />
              </Field>
              <Field label="Country" required>
                <Input value={townshipData.country ?? ""} onChange={e => updateCommon("country", e.target.value)} placeholder="India" />
              </Field>
              <Field label="Pincode" required>
                <Input value={townshipData.pincode ?? ""} onChange={e => updateCommon("pincode", e.target.value)} placeholder="400601" />
              </Field>
            </Grid>
            <SectionTitle title="Nearby Landmark" />
            <Field label="Nearest Landmark" required hint="Eg: Near Viviana Mall, Off Ghodbunder Road">
              <Input value={townshipData.nearbyLandmark ?? ""} onChange={e => updateCommon("nearbyLandmark", e.target.value)} placeholder="Near Viviana Mall" />
            </Field>
          </Section>

          <Section id="maps" title="Google Maps Integration" description="Map embed + directions — Connectivity section" icon={MapIcon} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            <Grid cols={1}>
              <Field label="Google Maps Full URL" required hint="Copy the full Google Maps share link">
                <Input value={townshipData.googleMapLink ?? ""} onChange={e => updateCommon("googleMapLink", e.target.value)} placeholder="https://goo.gl/maps/..." />
              </Field>
              <Field label="Google Plus Code" hint='Eg: "+QR5, Thane, Maharashtra"'>
                <Input value={townshipData.googlePlusCode ?? ""} onChange={e => updateCommon("googlePlusCode", e.target.value)} placeholder="+QR5, Thane, Maharashtra" />
              </Field>
            </Grid>
          </Section>

          <Section id="connectivity" title="Connectivity" description="Airport, Railway, Metro, Hospital, Schools distance" icon={Wifi} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            {(townshipData?.connectivity || []).map(item => (
              <Card key={item.id} className="mb-3 border-gray-100 shadow-none">
                <CardContent className="p-3">
                  <Grid cols={2}>
                    <Field label="Location Name">
                      <Input value={item.title ?? ""} onChange={e => updateConnectivity(item.id, { title: e.target.value })} placeholder="International Airport" className="h-8 text-xs" />
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
                      <Input value={item.distanceKm ?? ""} onChange={e => updateConnectivity(item.id, { distanceKm: e.target.value })} placeholder="18 KM" className="h-8 text-xs" />
                    </Field>
                    <Field label="Travel Time">
                      <Input value={item.duration ?? ""} onChange={e => updateConnectivity(item.id, { duration: e.target.value })} placeholder="25 Mins" className="h-8 text-xs" />
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

          <Section id="eco-common" title="Sustainability & Eco Features" description="Solar, Rainwater, Green Cover — Sustainability section" icon={Leaf} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            <SectionTitle title="Specific Eco Features" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(townshipData?.ecoFeatures || []).map(item => (
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
                      <Input value={item.title ?? ""} onChange={e => updateEcoCommon(item.id, { title: e.target.value })} placeholder="Solar Power" className="h-8 text-xs" />
                    </Field>
                    <div className="mt-2">
                      <Field label="Description">
                        <Input value={item.description ?? ""} onChange={e => updateEcoCommon(item.id, { description: e.target.value })} placeholder="100% renewable energy" className="h-8 text-[11px]" />
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



          <Section id="common-amenities" title="Amenities" description="Clubhouse, Pool, Gym, Security — All shared amenities" icon={Users} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            <div className="pt-1">
              <AmenitiesManager
                amenities={townshipData?.amenities || []}
                onChange={amenities => updateCommon("amenities", amenities)}
                title="Property Amenities"
                description="Add all amenities available at this property — inherited by all projects and towers."
              />
            </div>
          </Section>



          <Section id="common-legal" title="Bank APF Approvals" description="List of pre-approved banks for loans" icon={ShieldCheck} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
            <div className="mb-6">
              <Label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest">Select Active Banks</Label>
              <BankSelector
                banks={townshipData?.approvedBanks || []}
                onChange={banks => updateCommon("approvedBanks", banks)}
              />
            </div>
            <SectionTitle title="Legal Trust & Score" />
            <Grid cols={2}>
              <Field label="Trust Score" hint="Out of 100">
                <Input value={townshipData?.legalTrustScore} onChange={e => updateCommon("legalTrustScore", e.target.value)} placeholder="100" />
              </Field>
              <Field label="Approvals" hint="Eg: PMRDA / Municipal Corporation Approved">
                <Input value={townshipData?.approvals} onChange={e => updateCommon("approvals", e.target.value)} placeholder="Local Authority Approved" />
              </Field>
            </Grid>
            <Field label="Trust Description" hint="Eg: Clear Marketable Title with OC Received">
              <Textarea value={townshipData?.legalTrustDescription} onChange={e => updateCommon("legalTrustDescription", e.target.value)} rows={2} placeholder="This project has clear marketable titles and all necessary permissions." />
            </Field>
            <SectionTitle title="Bank APF Certificates" />
            <div className="space-y-3">
              {(townshipData?.apfDetails || []).map(apf => (
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
                <Input value={townshipData.groupBuying?.discountLabel ?? ""} onChange={e => updateCommon("groupBuying", { ...townshipData.groupBuying, discountLabel: e.target.value })} placeholder="Extra 2% off" className="h-8 text-xs" />
              </Field>
              <Field label="Target Milestone">
                <Input type="number" value={townshipData.groupBuying?.targetCount ?? 500} onChange={e => updateCommon("groupBuying", { ...townshipData.groupBuying, targetCount: Number(e.target.value) })} className="h-8 text-xs" />
              </Field>
            </Grid>
          </Section>

          </PartCollapse>
        </>
      )}

    </div>
  )
}

export const ProjectFlowForm = memo(ProjectFlowFormBase)
export default ProjectFlowForm
