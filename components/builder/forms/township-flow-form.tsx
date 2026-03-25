"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2, MapPin, Wifi, Leaf, FileText, Film, Users, ShieldCheck,
  Map as MapIcon, Plus, X, ChevronDown, ChevronUp, Image as ImageIcon,
  Phone, Globe, Star, Zap, Droplets, Sun, Wind, Recycle, CheckCircle2,
  Landmark, History, Calendar, BarChart3, Home,
} from "lucide-react"
import type {
  TownshipData, ConnectivityItem, AmenityItem, EcoFeature,
  VideoGalleryItem, ReraPhase, MasterPlanHighlight, DevelopmentPhase,
  FaqItem, TestimonialItem, ApfDetail,
} from "@/lib/builder-types"
import { BannerUpload, GalleryUpload, VideoUpload, MasterPlanMapUpload, DocumentUpload, AboutImageUpload } from "@/components/ui/media-uploads"
import { AmenitiesManager } from "@/components/builder/shared/AmenitiesManager"

// ─────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────
interface TownshipFlowFormProps {
  data: TownshipData
  onChange: (data: TownshipData) => void
  flowType?: "township"
  user?: any
}

// ─────────────────────────────────────────
// SECTION COMPONENT (Collapsible)
// ─────────────────────────────────────────
type SectionId = string

function Section({
  id, title, description, icon: Icon, badge, openIds, setOpenIds, children,
}: {
  id: SectionId; title: string; description?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  openIds: SectionId[]; setOpenIds: React.Dispatch<React.SetStateAction<SectionId[]>>
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

// ─────────────────────────────────────────
// FIELD HELPERS
// ─────────────────────────────────────────
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

      {/* ── HEADER BUTTON ── */}
      <button
        type="button"
        onClick={() => setOpenParts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
        className="w-full text-left flex items-center justify-between group transition-colors px-4 py-4 sm:px-6 sm:py-5 2xl:px-10 2xl:py-7 gap-3 sm:gap-5"
      >
        {/* Left: Icon + Label */}
        <div className="flex items-center gap-3 sm:gap-4 2xl:gap-6 min-w-0">

          {/* Icon Container */}
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

          {/* Text */}
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

        {/* Right: Chevron Toggle */}
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

      {/* ── CONTENT ── */}
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
// MAIN FORM COMPONENT
// ─────────────────────────────────────────
export function TownshipFlowForm({ data, onChange, user }: TownshipFlowFormProps) {
  const [openIds, setOpenIds] = useState<SectionId[]>(["builder", "identity"])
  const [openParts, setOpenParts] = useState<string[]>(["part-a", "part-b"])

  const isBuilder = user?.role === "builder" || user?.userType === "builder"

  useEffect(() => {
    if (isBuilder) {
      let changed = false;
      const newDocs = { ...data };
      if (!data.builderName && (user.profile?.companyName || user.profile?.name)) {
        newDocs.builderName = user.profile.companyName || user.profile.name || "";
        changed = true;
      }
      if (!data.builderLogo && user.profile?.companyLogo) {
        newDocs.builderLogo = user.profile.companyLogo;
        changed = true;
      }
      if (changed) {
        onChange(newDocs);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBuilder, user, data.builderName, data.builderLogo]);

  const update = <K extends keyof TownshipData>(field: K, value: TownshipData[K]) => {
    onChange({ ...data, [field]: value })
  }

  // Auto-calculations
  const autoTotalFamilies = useMemo(() => data.totalFamilies, [data.totalFamilies])

  // ── Connectivity ──────────────────────────
  const addConnectivity = () => {
    const item: ConnectivityItem = { id: crypto.randomUUID(), title: "", type: "custom", distanceKm: "", duration: "" }
    update("connectivity", [...data.connectivity, item])
  }
  const updateConnectivity = (id: string, patch: Partial<ConnectivityItem>) =>
    update("connectivity", data.connectivity.map(x => x.id === id ? { ...x, ...patch } : x))
  const removeConnectivity = (id: string) =>
    update("connectivity", data.connectivity.filter(x => x.id !== id))


  // ── Eco Features ─────────────────────────
  const addEco = () => {
    const item: EcoFeature = { id: crypto.randomUUID(), title: "", description: "", icon: "leaf" }
    update("ecoFeatures", [...data.ecoFeatures, item])
  }
  const updateEco = (id: string, patch: Partial<EcoFeature>) =>
    update("ecoFeatures", data.ecoFeatures.map(x => x.id === id ? { ...x, ...patch } : x))
  const removeEco = (id: string) =>
    update("ecoFeatures", data.ecoFeatures.filter(x => x.id !== id))

  // ── Video Gallery ─────────────────────────
  const addVideo = (type: VideoGalleryItem["type"]) => {
    const item: VideoGalleryItem = { id: crypto.randomUUID(), title: "", landscapeUrl: "", shortUrl: "", type }
    update("videoGallery", [...data.videoGallery, item])
  }
  const updateVideo = (id: string, patch: Partial<VideoGalleryItem>) =>
    update("videoGallery", data.videoGallery.map(x => x.id === id ? { ...x, ...patch } : x))
  const removeVideo = (id: string) =>
    update("videoGallery", data.videoGallery.filter(x => x.id !== id))

  // ── RERA Phases ───────────────────────────
  const addRera = () => {
    const item: ReraPhase = { id: crypto.randomUUID(), phaseName: "", reraNumber: "", validUntil: "" }
    update("reraPhases", [...data.reraPhases, item])
  }
  const updateRera = (id: string, patch: Partial<ReraPhase>) =>
    update("reraPhases", data.reraPhases.map(x => x.id === id ? { ...x, ...patch } : x))
  const removeRera = (id: string) =>
    update("reraPhases", data.reraPhases.filter(x => x.id !== id))

  // ── APF Details ───────────────────────────
  const addApf = () => {
    const item: ApfDetail = { id: crypto.randomUUID(), bankName: "", apfNumber: "", certificateUrl: "" }
    update("apfDetails", [...(data.apfDetails || []), item])
  }
  const updateApf = (id: string, patch: Partial<ApfDetail>) =>
    update("apfDetails", (data.apfDetails || []).map(x => x.id === id ? { ...x, ...patch } : x))
  const removeApf = (id: string) =>
    update("apfDetails", (data.apfDetails || []).filter(x => x.id !== id))

  // ── Master Plan Highlights ────────────────
  const addHighlight = () => {
    const item: MasterPlanHighlight = { id: crypto.randomUUID(), label: "" }
    update("masterPlanHighlights", [...data.masterPlanHighlights, item])
  }
  const removeHighlight = (id: string) =>
    update("masterPlanHighlights", data.masterPlanHighlights.filter(x => x.id !== id))

  // ── Development Timeline ──────────────────
  const addPhase = () => {
    const item: DevelopmentPhase = { id: crypto.randomUUID(), title: "", description: "", date: "", status: "planned" }
    update("developmentTimeline", [...data.developmentTimeline, item])
  }
  const updatePhase = (id: string, patch: Partial<DevelopmentPhase>) =>
    update("developmentTimeline", data.developmentTimeline.map(x => x.id === id ? { ...x, ...patch } : x))
  const removePhase = (id: string) =>
    update("developmentTimeline", data.developmentTimeline.filter(x => x.id !== id))

  // ── Gallery Images ────────────────────────
  const addGalleryImage = () => update("galleryImages", [...data.galleryImages, ""])
  const updateGalleryImage = (i: number, val: string) => {
    const g = [...data.galleryImages]; g[i] = val; update("galleryImages", g)
  }
  const removeGalleryImage = (i: number) =>
    update("galleryImages", data.galleryImages.filter((_, idx) => idx !== i))

  // ── FAQ ───────────────────────────────────
  const addFaq = () => {
    const item: FaqItem = { id: Date.now().toString(), question: "", answer: "" }
    update("faqs", [...(data.faqs || []), item])
  }
  const updateFaq = (id: string, patch: Partial<FaqItem>) =>
    update("faqs", (data.faqs || []).map(x => x.id === id ? { ...x, ...patch } : x))
  const removeFaq = (id: string) =>
    update("faqs", (data.faqs || []).filter(x => x.id !== id))

  // ── Testimonials ──────────────────────────
  const addTestimonial = () => {
    const item: TestimonialItem = { id: Date.now().toString(), name: "", role: "", message: "", rating: 5 }
    update("testimonials", [...(data.testimonials || []), item])
  }
  const updateTestimonial = (id: string, patch: Partial<TestimonialItem>) =>
    update("testimonials", (data.testimonials || []).map(x => x.id === id ? { ...x, ...patch } : x))
  const removeTestimonial = (id: string) =>
    update("testimonials", (data.testimonials || []).filter(x => x.id !== id))


  return (
    <div className="space-y-10">
      <PartCollapse id="part-a" title="Common Inherited Data" icon={Home} openParts={openParts} setOpenParts={setOpenParts}>

      {/* ── 1. BUILDER / DEVELOPER ─────────────── */}
      {!isBuilder && (
      <Section id="builder" title="Developer / Builder Info" description="Builder name, logo, contact — Hero pe dikhta hai" icon={Building2} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
         <div className="bg-gray-50/50 p-4 sm:p-5 rounded-2xl border border-gray-100 flex flex-col gap-5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <Field label="Builder / Company Name" required hint="Registered company name (auto-filled for builders)">
               <Input value={data.builderName} onChange={e => update("builderName", e.target.value)} placeholder="Astronix Realty" className="h-11 border-gray-200 bg-white shadow-sm focus-visible:ring-blue-500 rounded-xl" />
             </Field>
             <Field label="Builder Logo URL" hint="A publicly accessible logo URL">
               <Input value={data.builderLogo} onChange={e => update("builderLogo", e.target.value)} placeholder="https://..." className="h-11 border-gray-200 bg-white shadow-sm focus-visible:ring-blue-500 rounded-xl" />
             </Field>
           </div>
         </div>
      </Section>
      )}

      {/* ── 2. LOCATION ────────────────────────── */}
      <Section id="location" title="Location Details" description="City, district, pincode — Map pe dikhta hai" icon={MapPin} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
        <Grid cols={2}>
          <Field label="City" required>
            <Input value={data.city} onChange={e => update("city", e.target.value)} placeholder="Mumbai" />
          </Field>
          <Field label="District" required>
            <Input value={data.district} onChange={e => update("district", e.target.value)} placeholder="Thane" />
          </Field>
          <Field label="Sub City" required>
            <Input value={data.subCity} onChange={e => update("subCity", e.target.value)} placeholder="Dombivali" />
          </Field>
          <Field label="Village / Area" required>
            <Input value={data.village || ""} onChange={e => update("village", e.target.value)} placeholder="Sonarpada" />
          </Field>

          <Field label="State" required>
            <Input value={data.state} onChange={e => update("state", e.target.value)} placeholder="Maharashtra" />
          </Field>
          <Field label="Country" required>
            <Input value={data.country} onChange={e => update("country", e.target.value)} placeholder="India" />
          </Field>
          <Field label="Pincode" required>
            <Input value={data.pincode} onChange={e => update("pincode", e.target.value)} placeholder="400601" />
          </Field>
        </Grid>
        <SectionTitle title="Nearby Landmark" />
        <Field label="Nearest Landmark" required hint="Eg: Near Viviana Mall, Off Ghodbunder Road">
          <Input value={data.nearbyLandmark} onChange={e => update("nearbyLandmark", e.target.value)} placeholder="Near Viviana Mall" />
        </Field>
      </Section>

      {/* ── 3. GOOGLE MAPS ─────────────────────── */}
      <Section id="maps" title="Google Maps Integration" description="Map embed + directions — Connectivity section" icon={MapIcon} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
        <Grid cols={1}>
          <Field label="Google Maps Full URL" required hint="Copy the full Google Maps share link">
            <Input value={data.googleMapLink} onChange={e => update("googleMapLink", e.target.value)} placeholder="https://goo.gl/maps/..." />
          </Field>
          <Field label="Google Plus Code" hint='Eg: "+QR5, Thane, Maharashtra"'>
            <Input value={data.googlePlusCode} onChange={e => update("googlePlusCode", e.target.value)} placeholder="+QR5, Thane, Maharashtra" />
          </Field>
          <Field label="Google Business Profile Code" hint="Embed code from Google My Business (optional)">
            <Textarea value={data.gmbProfileCode || ""} onChange={e => update("gmbProfileCode", e.target.value)} rows={2} placeholder="<iframe ...></iframe>" />
          </Field>
        </Grid>
        <SectionTitle title="Coordinates (Optional)" />
        <Grid cols={2}>
          <Field label="Latitude">
            <Input value={data.coordinates?.lat || ""} onChange={e => update("coordinates", { ...data.coordinates, lat: e.target.value, lng: data.coordinates?.lng || "" })} placeholder="19.2183" />
          </Field>
          <Field label="Longitude">
            <Input value={data.coordinates?.lng || ""} onChange={e => update("coordinates", { lat: data.coordinates?.lat || "", lng: e.target.value })} placeholder="72.9781" />
          </Field>
        </Grid>
      </Section>

      {/* ── 4. CONNECTIVITY ─────────────────────── */}
      <Section id="connectivity" title="Connectivity" description="Airport, Railway, Metro, Hospital, Schools distance" icon={Wifi} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
        <p className="text-xs text-gray-500 mb-3">Yeh items sabhi pages (Project/Tower/Unit) pe dikhenge. Har ek important location ke liye ek item add karo.</p>
        {data.connectivity.map(item => (
          <Card key={item.id} className="mb-3 border-gray-100">
            <CardContent className="p-3">
              <Grid cols={2}>
                <Field label="Location Name">
                  <Input value={item.title} onChange={e => updateConnectivity(item.id, { title: e.target.value })} placeholder="International Airport" />
                </Field>
                <Field label="Type">
                  <Select value={item.type} onValueChange={v => updateConnectivity(item.id, { type: v as ConnectivityItem["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["airport", "railway", "metro", "highway", "hospital", "school", "mall", "it-park", "bus", "custom"].map(t => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Distance">
                  <Input value={item.distanceKm} onChange={e => updateConnectivity(item.id, { distanceKm: e.target.value })} placeholder="18 KM" />
                </Field>
                <Field label="Travel Time">
                  <Input value={item.duration} onChange={e => updateConnectivity(item.id, { duration: e.target.value })} placeholder="25 Mins" />
                </Field>
              </Grid>
              <button type="button" onClick={() => removeConnectivity(item.id)} className="mt-2 text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" /> Remove
              </button>
            </CardContent>
          </Card>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addConnectivity} className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-1" /> Add Connectivity Item
        </Button>
      </Section>

      {/* ── 5. AMENITIES ────────────────────────── */}
      <Section id="amenities" title="Lifestyle & Amenities" description="Social, Recreation, Community, Green, Security, General tabs" icon={Star} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
        <AmenitiesManager 
          amenities={data.amenities}
          onChange={(val) => update("amenities", val)}
        />
      </Section>

      {/* ── 6. ECO / SUSTAINABILITY ─────────────── */}
      <Section id="eco" title="Sustainability & Eco Features" description="Solar, Rainwater, Green Cover — Sustainability section" icon={Leaf} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
        <SectionTitle title="Specific Eco Features" />
        {data.ecoFeatures.map(item => (
          <Card key={item.id} className="mb-3 border-gray-100">
            <CardContent className="p-3">
              <Grid cols={3}>
                <Field label="Feature Title">
                  <Input value={item.title} onChange={e => updateEco(item.id, { title: e.target.value })} placeholder="Solar Power" />
                </Field>
                <Field label="Icon">
                  <Select value={item.icon || "leaf"} onValueChange={v => updateEco(item.id, { icon: v as EcoFeature["icon"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["leaf", "zap", "droplet", "sun", "wind", "recycle"].map(ic => (
                        <SelectItem key={ic} value={ic}>{ic}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <button type="button" onClick={() => removeEco(item.id)} className="mt-5 text-red-400 hover:text-red-600 self-start">
                  <X className="w-4 h-4" />
                </button>
              </Grid>
              <div className="mt-2">
                <Field label="Description">
                  <Input value={item.description} onChange={e => updateEco(item.id, { description: e.target.value })} placeholder="100% renewable energy for common areas" />
                </Field>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addEco} className="w-full border-dashed mt-1">
          <Plus className="w-4 h-4 mr-1" /> Add Eco Feature
        </Button>
      </Section>


      {/* ── 8. BANK APF APPROVALS ────────────────── */}
      <Section id="legal-apf" title="Bank APF Approvals" description="Common bank approvals for the township" icon={ShieldCheck} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
        <SectionTitle title="Bank APF Approvals" />
        {(data.apfDetails || []).map(item => (
          <Card key={item.id} className="mb-3 border-gray-100">
            <CardContent className="p-3 relative">
              <button type="button" onClick={() => removeApf(item.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
              <Grid cols={3}>
                <Field label="Bank Name">
                  <Input value={item.bankName} onChange={e => updateApf(item.id, { bankName: e.target.value })} placeholder="HDFC Bank" />
                </Field>
                <Field label="APF Number">
                  <Input value={item.apfNumber} onChange={e => updateApf(item.id, { apfNumber: e.target.value })} placeholder="APF/HDFC/2023/001" />
                </Field>
                <Field label="Certificate URL">
                  <Input value={item.certificateUrl} onChange={e => updateApf(item.id, { certificateUrl: e.target.value })} placeholder="https://..." />
                </Field>
              </Grid>
            </CardContent>
          </Card>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addApf} className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-1" /> Add Bank APF
        </Button>
      </Section>



      {/* ── 9. GROUP BUYING ─────────────────────── */}
      <Section id="groupbuying" title="Group Buying" description="Interest count + discount — GroupBuyingSection component" icon={Users} badge="Common" openIds={openIds} setOpenIds={setOpenIds}>
        <Grid cols={2}>
          <Field label="Enable Group Buying">
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => update("groupBuying", { ...data.groupBuying, enabled: !data.groupBuying?.enabled })}
                className={`w-10 h-6 rounded-full transition-colors relative ${data.groupBuying?.enabled ? "bg-[#2BB673]" : "bg-gray-200"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${data.groupBuying?.enabled ? "left-5" : "left-1"}`} />
              </button>
              <span className="text-sm font-medium text-gray-600">{data.groupBuying?.enabled ? "Active" : "Inactive"}</span>
            </div>
          </Field>
          <Field label="Discount Label (in % or amount)" hint="Text shown on group buying card">
            <Input value={data.groupBuying?.discountLabel || ""} onChange={e => update("groupBuying", { ...data.groupBuying, discountLabel: e.target.value })} placeholder="Extra 2% off on group booking" />
          </Field>
          <Field label="Minimum people required for unlock discount" hint="Goal milestone for group buying">
            <Input type="number" value={data.groupBuying?.targetCount || 500} onChange={e => update("groupBuying", { ...data.groupBuying, targetCount: Number(e.target.value) })} placeholder="500" />
          </Field>
        </Grid>
      </Section>

      </PartCollapse>

      <PartCollapse id="part-b" title="Township-Specific Data" icon={Building2} openParts={openParts} setOpenParts={setOpenParts}>

      {/* ── 9. TOWNSHIP IDENTITY ──────────────── */}
      <Section id="identity" title="Township Identity" description="Name, tagline, price range, hero image — Township Hero Section" icon={Building2} openIds={openIds} setOpenIds={setOpenIds}>
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
            <Field label="Township Name" required>
              <Input value={data.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Royal Meadows" className="h-10 border-gray-200 focus-visible:ring-[#1A3C8C]" />
            </Field>

            <Field label="Tag / Type" hint="Appears as a badge on the listing card.">
              <Input value={data.tagType} onChange={e => update("tagType", e.target.value)} placeholder="e.g. Luxury Integrated Township" className="h-10 border-gray-200 focus-visible:ring-[#1A3C8C]" />
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
          <SectionTitle title="Price Range (Hero Section)" />
          <Grid cols={3}>
            <Field label="Min Price (₹)" hint="Eg: 5000000 for ₹50L">
              <Input type="number" value={data.priceRangeMin || ""} onChange={e => update("priceRangeMin", Number(e.target.value))} placeholder="5000000" className="border-gray-200" />
            </Field>
            <Field label="Max Price (₹)" hint="Eg: 50000000 for ₹5Cr">
              <Input type="number" value={data.priceRangeMax || ""} onChange={e => update("priceRangeMax", Number(e.target.value))} placeholder="50000000" className="border-gray-200" />
            </Field>
            <Field label="Price Label (Override)" hint="Optional: shows instead of auto-range">
              <Input value={data.priceLabel || ""} onChange={e => update("priceLabel", e.target.value)} placeholder="₹50L – ₹5 Cr" className="border-gray-200" />
            </Field>
          </Grid>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <Label className="text-xs font-semibold text-[#1A3C8C] uppercase tracking-wide">Gallery Images</Label>
              <p className="text-[11px] text-gray-400 mt-1">Showcase the property highlights.</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{data.galleryImages.length} / 20</span>
          </div>
          <GalleryUpload images={data.galleryImages} onChange={imgs => update("galleryImages", imgs)} max={20} />
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

      {/* ── 10. ABOUT TOWNSHIP ──────────────────── */}
      <Section id="about" title="About Township" description="Vision, background and architectural essence" icon={FileText} openIds={openIds} setOpenIds={setOpenIds}>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: About Image */}
          <div className="flex-1">
            <AboutImageUpload
              value={data.aboutImageUrl || ""}
              onChange={v => update("aboutImageUrl", v)}
              title="Upload Township About Image"
              description="A stunning aerial or perspective view of the township"
            />
          </div>

          {/* Right: Text Fields */}
          <div className="flex-1 space-y-6">
            <Field label="Short Description / Tagline" hint="Appears in property cards (1-2 lines)">
              <Textarea 
                value={data.description} 
                onChange={e => update("description", e.target.value)} 
                rows={3} 
                placeholder="A mega township where luxury meets nature..." 
                className="bg-white/50"
              />
            </Field>
            
            <Field label="Vision Statement" hint="Detailed core philosophy of the project">
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

      {/* ── 11. KEY STATISTICS ──────────────────── */}
      <Section id="stats" title="Key Statistics" description="Total area, families, launch date — Stats bar" icon={BarChart3} openIds={openIds} setOpenIds={setOpenIds}>
        <Grid cols={3}>
          <Field label="Total Land Area" required>
            <Input type="number" value={data.totalArea} onChange={e => update("totalArea", e.target.value)} placeholder="100" />
          </Field>
          <Field label="Area Unit">
            <Select value={data.areaUnit} onValueChange={v => update("areaUnit", v as TownshipData["areaUnit"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="acres">Acres</SelectItem>
                <SelectItem value="sqft">Sq. ft.</SelectItem>
                <SelectItem value="hectares">Hectares</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Total Projects / Phases" hint="Auto-synced from Projects step">
            <Input type="number" value={data.projectCount} onChange={e => update("projectCount", Number(e.target.value))} placeholder="5" className="bg-gray-50/50" />
          </Field>
          <Field label="Total Towers" hint="Auto-synced from Towers step">
            <Input type="number" value={data.totalTowers} readOnly placeholder="0" className="bg-gray-50 cursor-not-allowed font-bold text-blue-600" />
          </Field>
          <Field label="Total Units" hint="Auto-synced from Units step">
            <Input type="number" value={data.totalUnits} readOnly placeholder="0" className="bg-gray-50 cursor-not-allowed font-bold text-blue-600" />
          </Field>
          <Field label="Total Families" hint="Auto-calculated (can override)">
            <Input type="number" value={data.totalFamilies} onChange={e => update("totalFamilies", Number(e.target.value))} placeholder="2000" className="bg-gray-50/50" />
          </Field>
          <Field label="Launch Date" hint="Eg: January 2022">
            <Input value={data.launchDate} onChange={e => update("launchDate", e.target.value)} placeholder="January 2022" />
          </Field>
        </Grid>
      </Section>

      {/* ── 12. MASTER PLAN ─────────────────────── */}
      <Section id="masterplan" title="Master Plan" description="Architectural layout & highlights" icon={MapIcon} openIds={openIds} setOpenIds={setOpenIds}>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Master Plan Image */}
          <div className="flex-1">
            <MasterPlanMapUpload
              value={data.masterplanImage}
              onChange={v => update("masterplanImage", v)}
            />
          </div>

          {/* Right: Description & Brochure */}
          <div className="flex-1 space-y-6">
            <Field label="Short Description" hint="Brief explanation of the layout">
              <Textarea value={data.masterPlanDescription || ""} onChange={e => update("masterPlanDescription", e.target.value)} rows={3} placeholder="Brief description for listings..." className="bg-white/50" />
            </Field>

            <div className="pt-2">
              {/* Township Master Brochure heading */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Township Master Brochure</p>
                  <p className="text-xs text-[#2BB673]">Upload your comprehensive township brochure</p>
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
                {data.masterPlanHighlights.map(item => (
                  <div key={item.id} className="flex gap-2 group relative">
                    <Input
                      value={item.label}
                      onChange={e => update("masterPlanHighlights", data.masterPlanHighlights.map(x => x.id === item.id ? { ...x, label: e.target.value } : x))}
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
                {data.masterPlanHighlights.length === 0 && (
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

      {/* ── 13. LEGAL (RERA & CC) ────────────────── */}
      <Section id="legal-township" title="Township Legal / RERA" description="RERA, CC, OC — Township-specific legal documents" icon={ShieldCheck} openIds={openIds} setOpenIds={setOpenIds}>
        <SectionTitle title="RERA Details" />
        <Grid cols={2}>
          <Field label="RERA Number" required>
            <Input value={data.reraNumber} onChange={e => update("reraNumber", e.target.value)} placeholder="PRM/KA/RERA/..." />
          </Field>
          <Field label="Approvals" hint="Eg: PMRDA / Municipal Corporation Approved">
            <Input value={data.approvals} onChange={e => update("approvals", e.target.value)} placeholder="Thane Municipal Corporation Approved" />
          </Field>
        </Grid>

        <div className="mt-4">
          <Field label="Description" hint="Eg: Clear Marketable Title with OC Received">
            <Textarea value={data.legalTrustDescription} onChange={e => update("legalTrustDescription", e.target.value)} rows={2} placeholder="This project has clear marketable titles and all necessary permissions from the local authorities." />
          </Field>
        </div>

        <SectionTitle title="Legal Documents" />
        <p className="text-xs text-gray-500 mb-4">Official certificates and approvals in PDF format.</p>

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
    </div>
  )
}

// Legacy export for backward compatibility
export default TownshipFlowForm
