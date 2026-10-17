"use client"

import React, { useState, memo } from "react"
import { v4 as uuidv4 } from "uuid"
import { ImageUpload } from "@/components/ui/image-upload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2, MapPin, Wifi, Star, Leaf, ShieldCheck, Plus, X, Users
} from "lucide-react"
import GooglePlacesSearch from "@/components/builder/forms/GooglePlacesSearch"
import AreaSelectInput from "@/components/builder/forms/AreaSelectInput"
import { GmbMapPreview } from "@/components/builder/shared/GmbMapPreview"
import { GmbReviewsSelector } from "@/components/builder/shared/GmbReviewsSelector"
import { ConnectivityManager } from "@/components/builder/shared/ConnectivityManager"
import { AmenitiesManager } from "@/components/builder/shared/AmenitiesManager"
import { EcoFeaturesManager } from "@/components/builder/shared/EcoFeaturesManager"
import { CollapsibleSection } from "@/components/builder/shared/atomic-forms/CollapsibleSection"
import { UrlUploadInput } from "@/components/ui/media-uploads"
import type { TownshipData, ConnectivityItem, EcoFeature, ApfDetail } from "@/lib/builder-types"

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3">
      <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
        {title}
      </span>
      <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
    </div>
  )
}

function Grid({ cols = 2, children }: { cols?: 1 | 2 | 3 | 4; children: React.ReactNode }) {
  const cls = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  }
  return <div className={`grid gap-3 ${cls[cols]}`}>{children}</div>
}

function Field({
  label, required, hint, className, children
}: {
  label: string; required?: boolean; hint?: string; className?: string; children: React.ReactNode
}) {
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

const COMMON_BANKS = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Bank of Baroda",
  "Punjab National Bank",
  "Canara Bank",
  "Union Bank of India",
  "Tata Capital",
  "Bajaj Housing Finance",
  "LIC Housing Finance",
]

function BankSelector({
  banks, onChange
}: {
  banks: string[]; onChange: (banks: string[]) => void
}) {
  const [custom, setCustom] = useState("")

  const toggle = (bank: string) => {
    if (banks.includes(bank)) {
      onChange(banks.filter(b => b !== bank))
    } else {
      onChange([...banks, bank])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {COMMON_BANKS.map(bank => {
          const selected = banks.includes(bank)
          return (
            <button
              key={bank}
              type="button"
              onClick={() => toggle(bank)}
              className={[
                "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                selected
                  ? "bg-[#1A3C8C] dark:bg-blue-600 text-white border-[#1A3C8C] dark:border-blue-600 shadow-sm"
                  : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:border-gray-300"
              ].join(" ")}
            >
              {selected && "✓ "}
              {bank}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2 max-w-sm">
        <Input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="Add other bank..."
          className="h-9 text-xs bg-gray-50 dark:bg-slate-800/50"
        />
        <Button
          type="button"
          size="sm"
          className="h-9 px-4 bg-[#1A3C8C] dark:bg-blue-600 hover:bg-[#1A3C8C]/90 text-xs font-bold"
          onClick={() => {
            if (custom.trim()) {
              onChange([...(banks || []), custom.trim()])
              setCustom("")
            }
          }}
        >
          Add
        </Button>
      </div>
    </div>
  )
}

export interface CommonPropertySectionsProps {
  data: TownshipData
  onChange: (updater: TownshipData | ((prev: TownshipData) => TownshipData)) => void
  openIds: string[]
  setOpenIds: React.Dispatch<React.SetStateAction<string[]>>
  isBuilder?: boolean
  variant?: "default" | "compact"
  useAlternativeIds?: boolean
}

export function CommonPropertySectionsBase({
  data,
  onChange,
  openIds,
  setOpenIds,
  isBuilder = false,
  variant = "compact",
  useAlternativeIds = false,
}: CommonPropertySectionsProps) {
  const [detectedAreas, setDetectedAreas] = useState<string[]>([])

  const update = <K extends keyof TownshipData>(field: K, value: TownshipData[K]) => {
    onChange(prev => ({ ...prev, [field]: value }))
  }

  // Section ID resolution based on context
  const builderId = "builder"
  const locationId = "location"
  const connectivityId = "connectivity"
  const ecoId = useAlternativeIds ? "eco-common" : "eco"
  const amenitiesId = useAlternativeIds ? "common-amenities" : "amenities"
  const legalApfId = useAlternativeIds ? "common-legal" : "legal-apf"

  // Handlers for Connectivity
  const addConnectivity = () => {
    const item: ConnectivityItem = { id: uuidv4(), title: "", type: "custom", distanceKm: "", duration: "" }
    update("connectivity", [...(data.connectivity || []), item])
  }
  const updateConnectivity = (id: string, patch: Partial<ConnectivityItem>) => {
    update("connectivity", (data.connectivity || []).map(x => x.id === id ? { ...x, ...patch } : x))
  }
  const removeConnectivity = (id: string) => {
    update("connectivity", (data.connectivity || []).filter(x => x.id !== id))
  }

  // Handlers for Eco Features
  const addEco = () => {
    const item: EcoFeature = { id: uuidv4(), title: "", description: "", icon: "rainwater_harvesting" }
    update("ecoFeatures", [...(data.ecoFeatures || []), item])
  }
  const updateEco = (id: string, patch: Partial<EcoFeature>) => {
    update("ecoFeatures", (data.ecoFeatures || []).map(x => x.id === id ? { ...x, ...patch } : x))
  }
  const removeEco = (id: string) => {
    update("ecoFeatures", (data.ecoFeatures || []).filter(x => x.id !== id))
  }

  // Handlers for APF
  const addApf = () => {
    const item: ApfDetail = { id: uuidv4(), bankName: "", apfNumber: "", certificateUrl: "" }
    update("apfDetails", [...(data.apfDetails || []), item])
  }
  const updateApf = (id: string, patch: Partial<ApfDetail>) => {
    update("apfDetails", (data.apfDetails || []).map(x => x.id === id ? { ...x, ...patch } : x))
  }
  const removeApf = (id: string) => {
    update("apfDetails", (data.apfDetails || []).filter(x => x.id !== id))
  }

  return (
    <>
      {/* ── 1. DEVELOPER / BUILDER INFO ────────────────── */}
      {!isBuilder && (
        <CollapsibleSection
          id={builderId}
          title="Developer / Builder Info"
          description="Builder name, logo, contact — Hero pe dikhta hai"
          icon={Building2}
          badge="Common"
          openIds={openIds}
          setOpenIds={setOpenIds}
          variant={variant}
        >
          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <div className="shrink-0">
                <div className="mb-2 text-center sm:text-left">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Company Logo</Label>
                </div>
                <ImageUpload value={data.builderLogo} onChange={v => update("builderLogo", v)} />
              </div>
              <div className="flex-1 w-full">
                <Field label="Builder / Company Name" required hint="Registered company name (auto-filled for builders)">
                  <Input
                    value={data.builderName}
                    onChange={e => update("builderName", e.target.value)}
                    placeholder="Astronix Realty"
                    className="h-11 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm focus-visible:ring-blue-500 rounded-xl"
                  />
                </Field>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── 2. LOCATION & GOOGLE MAPS ─────────────────── */}
      <CollapsibleSection
        id={locationId}
        title="Location & Google Maps Details"
        description="City, district, pincode & Google Maps Integration — Auto-filled from Google Places"
        icon={MapPin}
        badge="Common"
        openIds={openIds}
        setOpenIds={setOpenIds}
        variant={variant}
      >
        <div className="mb-5">
          <GooglePlacesSearch
            initialSearchText={data.nearbyLandmark || ""}
            onLocationSelected={(loc) => {
              if (loc.areaOptions && loc.areaOptions.length > 0) {
                setDetectedAreas(loc.areaOptions)
              }
              onChange((prev) => {
                const next = { ...prev }
                if (loc.city) next.city = loc.city
                if (loc.district) next.district = loc.district
                if (loc.subCity) next.subCity = loc.subCity
                if (loc.village) next.village = loc.village
                if (loc.state) next.state = loc.state
                if (loc.country) next.country = loc.country
                if (loc.pincode) next.pincode = loc.pincode
                if (loc.nearbyLandmark) next.nearbyLandmark = loc.nearbyLandmark
                if (loc.googleMapLink) next.googleMapLink = loc.googleMapLink
                if (loc.googlePlusCode) next.googlePlusCode = loc.googlePlusCode
                if (loc.coordinates) next.coordinates = { lat: String(loc.coordinates.lat || ''), lng: String(loc.coordinates.lng || '') }
                if (loc.gmbReviews && loc.gmbReviews.length > 0) {
                  next.allGmbReviews = loc.gmbReviews
                  if (!prev.gmbReviews || prev.gmbReviews.length === 0) {
                    next.gmbReviews = loc.gmbReviews.slice(0, 3)
                  }
                }
                return next
              })
            }}
          />
        </div>

        <Grid cols={2}>
          <Field label="City" required>
            <Input value={data.city ?? ""} onChange={e => update("city", e.target.value)} placeholder="Thane" />
          </Field>
          <Field label="District" required>
            <Input value={data.district ?? ""} onChange={e => update("district", e.target.value)} placeholder="Thane" />
          </Field>
          <Field label="Sub City" required>
            <Input value={data.subCity ?? ""} onChange={e => update("subCity", e.target.value)} placeholder="Dombivali East" />
          </Field>
          <Field label="Area" required hint="Choose from map suggestions / gaon list or type custom">
            <AreaSelectInput
              value={data.village ?? ""}
              onChange={val => update("village", val)}
              subCity={data.subCity ?? ""}
              city={data.city ?? ""}
              detectedOptions={detectedAreas}
              placeholder="Select or type area/gaon (e.g. MIDC, Sonarpada)"
            />
          </Field>
          <Field label="State" required>
            <Input value={data.state ?? ""} onChange={e => update("state", e.target.value)} placeholder="Maharashtra" />
          </Field>
          <Field label="Country" required>
            <Input value={data.country ?? ""} onChange={e => update("country", e.target.value)} placeholder="India" />
          </Field>
          <Field label="Pincode" required>
            <Input value={data.pincode ?? ""} onChange={e => update("pincode", e.target.value)} placeholder="421204" />
          </Field>
        </Grid>

        <SectionTitle title="Nearby Landmark" />
        <Field label="Nearest Landmark" required hint="Eg: Near KATTAMAI Mandir, Manpada-Kattamai Road, Dombivali East">
          <Input value={data.nearbyLandmark ?? ""} onChange={e => update("nearbyLandmark", e.target.value)} placeholder="Near KATTAMAI Mandir, Manpada-Kattamai Road, Dombivali East" />
        </Field>

        <SectionTitle title="Google Maps Integration" />
        <Grid cols={2}>
          <Field label="Google Maps Full URL" required hint="Auto-filled from search or paste share link">
            <Input value={data.googleMapLink ?? ""} onChange={e => update("googleMapLink", e.target.value)} placeholder="https://goo.gl/maps/..." />
          </Field>
          <Field label="Google Plus Code" hint='Eg: "+QR5, Thane, Maharashtra"'>
            <Input value={data.googlePlusCode ?? ""} onChange={e => update("googlePlusCode", e.target.value)} placeholder="+QR5, Thane, Maharashtra" />
          </Field>
          <Field label="Latitude" hint="Auto-filled from map search">
            <Input value={data.coordinates?.lat ?? ""} onChange={e => update("coordinates", { ...(data.coordinates || {lat: "", lng: ""}), lat: e.target.value })} placeholder="19.2183" />
          </Field>
          <Field label="Longitude" hint="Auto-filled from map search">
            <Input value={data.coordinates?.lng ?? ""} onChange={e => update("coordinates", { ...(data.coordinates || {lat: "", lng: ""}), lng: e.target.value })} placeholder="73.0867" />
          </Field>
        </Grid>

        {/* GMB Pin Map Preview */}
        <div className="mt-4">
          <GmbMapPreview
            googleMapLink={data.googleMapLink}
            coordinates={data.coordinates}
            locationName={data.village || data.subCity}
            city={data.city}
            district={data.district}
            nearbyLandmark={data.nearbyLandmark}
          />
        </div>

        {/* GMB Reviews Selection */}
        <div className="mt-6">
          <GmbReviewsSelector
            allReviews={data.allGmbReviews || data.gmbReviews || []}
            selectedReviews={data.gmbReviews || []}
            onChange={(selected, all) => {
              update("gmbReviews", selected)
              if (all) update("allGmbReviews", all)
            }}
          />
        </div>
      </CollapsibleSection>

      {/* ── 3. CONNECTIVITY ────────────────────────────── */}
      <CollapsibleSection
        id={connectivityId}
        title="Connectivity"
        description="Airport, Railway, Metro, Hospital, Schools distance"
        icon={Wifi}
        badge="Common"
        openIds={openIds}
        setOpenIds={setOpenIds}
        variant={variant}
      >
        <ConnectivityManager
          items={data.connectivity || []}
          onAdd={addConnectivity}
          onUpdate={updateConnectivity}
          onRemove={removeConnectivity}
        />
      </CollapsibleSection>

      {/* ── 4. LIFESTYLE & AMENITIES ────────────────────── */}
      <CollapsibleSection
        id={amenitiesId}
        title="Lifestyle & Amenities"
        description="Social, Recreation, Community, Green, Security, General tabs"
        icon={Star}
        badge="Common"
        openIds={openIds}
        setOpenIds={setOpenIds}
        variant={variant}
      >
        <AmenitiesManager
          amenities={data.amenities || []}
          onChange={(val) => update("amenities", val)}
        />
      </CollapsibleSection>

      {/* ── 5. SUSTAINABILITY & ECO FEATURES ───────────── */}
      <CollapsibleSection
        id={ecoId}
        title="Sustainability & Eco Features"
        description="Solar, Rainwater, Green Cover — Sustainability section"
        icon={Leaf}
        badge="Common"
        openIds={openIds}
        setOpenIds={setOpenIds}
        variant={variant}
      >
        <EcoFeaturesManager
          items={data.ecoFeatures || []}
          onAdd={addEco}
          onUpdate={updateEco}
          onRemove={removeEco}
          videoUrl={data.landscapeVideoUrl}
          onVideoUrlChange={(url) => update("landscapeVideoUrl", url)}
        />
      </CollapsibleSection>

      {/* ── 6. BANK APF APPROVALS ───────────────────────── */}
      <CollapsibleSection
        id={legalApfId}
        title="Bank APF Approvals"
        description="Common bank approvals for the township"
        icon={ShieldCheck}
        badge="Common"
        openIds={openIds}
        setOpenIds={setOpenIds}
        variant={variant}
      >
        {useAlternativeIds && (
          <div className="mb-6">
            <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 mb-3 block tracking-widest">
              Select Active Banks
            </Label>
            <BankSelector
              banks={data.approvedBanks || []}
              onChange={banks => update("approvedBanks", banks)}
            />
          </div>
        )}

        <SectionTitle title="Bank APF Approvals" />
        {(data.apfDetails || []).map(item => (
          <Card key={item.id} className="mb-3 border-gray-100 dark:border-slate-800">
            <CardContent className="p-3 relative">
              <button
                type="button"
                onClick={() => removeApf(item.id)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
              <Grid cols={3}>
                <Field label="Bank Name">
                  <Input
                    value={item.bankName ?? ""}
                    onChange={e => updateApf(item.id, { bankName: e.target.value })}
                    placeholder="HDFC Bank"
                  />
                </Field>
                <Field label="APF Number">
                  <Input
                    value={item.apfNumber ?? ""}
                    onChange={e => updateApf(item.id, { apfNumber: e.target.value })}
                    placeholder="APF/HDFC/2023/001"
                  />
                </Field>
                <Field label="Certificate URL">
                  <UrlUploadInput
                    value={item.certificateUrl ?? ""}
                    onChange={(url) => updateApf(item.id, { certificateUrl: url })}
                    placeholder="Upload or paste URL"
                  />
                </Field>
              </Grid>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addApf}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Bank APF
        </Button>
      </CollapsibleSection>
    </>
  )
}

export const CommonPropertySections = memo(CommonPropertySectionsBase)
export default CommonPropertySections
