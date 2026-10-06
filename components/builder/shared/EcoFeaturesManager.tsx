"use client"

import React, { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Plus, Trash2, Leaf, Film, Play, Camera, RotateCcw, Sparkles, Image as ImageIcon,
  ExternalLink, Eye, Video, CheckCircle, AlertCircle, Link as LinkIcon
} from "lucide-react"
import type { EcoFeature } from "@/lib/builder-types"
import {
  PRESET_ECO_CATEGORIES,
  resolveCategoryKey,
  getEcoCategoryDefaultImage,
  isCustomEcoImage,
  ECO_IMAGE_PROFILES,
  validateImageAgainstProfile
} from "@/lib/eco-categories"
import { ECO_CATEGORY_IMAGE_MAP, resolveEcoCategoryMapping } from "@/lib/ecoCategoryResolver"
import { uploadFileToServer } from "@/components/ui/media-uploads"

function FeatureImageUpload({ image, onUpdate }: { image: string, onUpdate: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFileToServer(file)
      onUpdate(url)
    } catch (error) {
      console.error("Upload failed", error)
      alert("Failed to upload image")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="mt-2">
      <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="w-full h-9 whitespace-nowrap bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
      >
        <ImageIcon className="w-3 h-3 mr-2 text-slate-500" />
        {uploading ? "Uploading..." : "Click to Upload Custom Photo"}
      </Button>
    </div>
  )
}

export { PRESET_ECO_CATEGORIES, resolveCategoryKey, getEcoCategoryDefaultImage, isCustomEcoImage, ECO_IMAGE_PROFILES, validateImageAgainstProfile }

interface EcoFeaturesManagerProps {
  items: EcoFeature[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<EcoFeature>) => void
  onRemove: (id: string) => void
  videoUrl?: string
  onVideoUrlChange?: (url: string) => void
  subtitle?: string
}

/**
 * Parses video URLs (YouTube, Vimeo, MP4/WebM) into embeddable URLs or video stream info
 */
function getEmbedVideoInfo(url: string): { type: "iframe" | "video" | "unknown"; embedUrl: string } {
  if (!url || !url.trim()) return { type: "unknown", embedUrl: "" }
  const trimmed = url.trim()

  // YouTube URL parsing
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch && ytMatch[1]) {
    return { type: "iframe", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0` }
  }

  // Vimeo URL parsing
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
  if (vimeoMatch && vimeoMatch[1]) {
    return { type: "iframe", embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` }
  }

  // Direct Video file extension (.mp4, .webm, .mov, etc.)
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(trimmed)) {
    return { type: "video", embedUrl: trimmed }
  }

  // Fallback to iframe for other web video links
  return { type: "iframe", embedUrl: trimmed }
}

export function EcoFeaturesManager({
  items = [],
  onAdd,
  onUpdate,
  onRemove,
  videoUrl,
  onVideoUrlChange,
  subtitle = "Select sustainability & eco categories, configure infrastructure photography, video tour and log text.",
}: EcoFeaturesManagerProps) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  // Auto-sync missing default images & titles/descriptions without overwriting custom images
  useEffect(() => {
    items.forEach((item) => {
      const catKey = item.icon && PRESET_ECO_CATEGORIES[item.icon]
        ? item.icon
        : resolveEcoCategoryMapping(item.title || item.description, item.icon).id
      const preset = PRESET_ECO_CATEGORIES[catKey] || PRESET_ECO_CATEGORIES.rainwater_harvesting

      const patch: Partial<EcoFeature> = {}

      if (!item.title && preset) {
        patch.title = preset.title
      }
      if (!item.description && preset) {
        patch.description = preset.description
      }
      // Only set image if empty (protect existing custom or saved images)
      if (!item.image) {
        patch.image = preset.defaultImage
      }
      if (!item.icon) {
        patch.icon = preset.id
      }

      if (Object.keys(patch).length > 0) {
        onUpdate(item.id, patch)
      }
    })
  }, [items.length])

  // Category Selection Handler — Auto assigns exact category infrastructure photo with 0ms latency
  const handleSelectCategory = (id: string, catKey: string) => {
    const profile = ECO_IMAGE_PROFILES[catKey]
    const preset = PRESET_ECO_CATEGORIES[catKey] || ECO_CATEGORY_IMAGE_MAP[catKey]
    if (preset) {
      const item = items.find(i => i.id === id)
      // Custom image protection: Check if current image is a custom user-uploaded URL
      const isCustom = item ? isCustomEcoImage(item.image) : false

      const patch: Partial<EcoFeature> = {
        icon: catKey,
        title: preset.title || (preset as any).label,
        description: preset.description || (preset as any).defaultDescription || "",
      }

      // If user hasn't set a custom image, update synchronously to new category's exact infrastructure photo
      if (!isCustom) {
        patch.image = profile?.image || preset.defaultImage || (preset as any).image
      }

      onUpdate(id, patch)
    }
  }

  // Reset to default smart infrastructure photo for category
  const handleResetImage = (item: EcoFeature) => {
    const catKey = item.icon && PRESET_ECO_CATEGORIES[item.icon]
      ? item.icon
      : resolveEcoCategoryMapping(item.title || item.description, item.icon).id
    const profile = ECO_IMAGE_PROFILES[catKey]
    const preset = PRESET_ECO_CATEGORIES[catKey] || ECO_CATEGORY_IMAGE_MAP[catKey]
    if (preset) {
      onUpdate(item.id, { image: profile?.image || preset.defaultImage || (preset as any).image })
    }
  }

  const embedInfo = videoUrl ? getEmbedVideoInfo(videoUrl) : null

  return (
    <div className="space-y-4">
      {/* Overview Video Tour Config Card */}
      {onVideoUrlChange !== undefined && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900/60 dark:via-blue-950/20 dark:to-indigo-950/20 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                <Video className="w-3.5 h-3.5" />
              </div>
              <span>Overview & Sustainability Video Tour URL</span>
            </Label>
            {videoUrl && videoUrl.trim() ? (
              <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Video Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-medium text-slate-500 bg-white dark:bg-slate-950">
                Optional Video Link
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <Input
                value={videoUrl ?? ""}
                onChange={(e) => onVideoUrlChange(e.target.value)}
                placeholder="Paste YouTube, Vimeo, or MP4 video URL (e.g., https://www.youtube.com/watch?v=...)"
                className="h-9 text-xs pl-8 bg-white dark:bg-slate-950 font-medium border-slate-300 dark:border-slate-700 shadow-2xs focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>

            {videoUrl && videoUrl.trim() && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsVideoModalOpen(true)}
                className="h-9 px-3.5 text-xs flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shrink-0 shadow-sm transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Preview Tour</span>
              </Button>
            )}
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-blue-500 shrink-0" />
            <span>This video tour will be embedded directly in the visitor Overview & Eco Highlights panel.</span>
          </p>
        </div>
      )}

      {/* In-App Video Preview Modal Dialog Popup */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl rounded-2xl">
          <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Overview Video Tour Preview</span>
                  <Badge variant="outline" className="text-[9.5px] bg-blue-500/20 text-blue-300 border-blue-500/40">
                    Interactive Preview
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-[11px] text-slate-400">
                  Preview how visitors will experience the video tour in your project showcase.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Video Player Canvas */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
            {embedInfo && embedInfo.type === "iframe" ? (
              <iframe
                src={embedInfo.embedUrl}
                title="Sustainability & Overview Video Tour"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : embedInfo && embedInfo.type === "video" ? (
              <video
                src={embedInfo.embedUrl}
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
                <p className="text-xs font-semibold text-slate-200">Unable to generate inline video player</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  The provided URL might require opening directly in a new window.
                </p>
              </div>
            )}
          </div>

          {/* Dialog Footer Actions */}
          <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
              {videoUrl}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(videoUrl, "_blank")}
                className="h-8 text-xs text-slate-300 hover:text-white border-slate-700 bg-slate-800 hover:bg-slate-700 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open in New Tab</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsVideoModalOpen(false)}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Done Previewing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            Select rainwater harvesting, solar power, EV charging, green roof, or vertical garden.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, index) => {
              const catKey = (item.icon && PRESET_ECO_CATEGORIES[item.icon])
                ? item.icon
                : resolveEcoCategoryMapping(item.title || item.description, item.icon).id

              const preset = PRESET_ECO_CATEGORIES[catKey] || PRESET_ECO_CATEGORIES.rainwater_harvesting
              const IconComponent = preset.icon
              const displayTitle = item.title || preset.title

              // Infrastructure Photo assignment
              const defaultCatImg = preset.defaultImage
              const currentImg = item.image || defaultCatImg
              const isCustomImage = isCustomEcoImage(item.image)

              return (
                <Card
                  key={item.id}
                  className="group relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-900 shrink-0">
                        #{index + 1}
                      </Badge>
                      <div className={`p-1.5 rounded-md ${preset.color} shrink-0 border`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
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

                  {/* 📸 EXACT INFRASTRUCTURE PHOTOGRAPHY CANVAS */}
                  {item.image && (
                    <div className="relative h-36 w-full bg-slate-900 overflow-hidden group/photo border-b border-slate-100 dark:border-slate-800">
                      <img
                        src={item.image}
                        alt={displayTitle}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />
  
                      {/* Image Status Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[9.5px] font-bold flex items-center gap-1 backdrop-blur-md border shadow-xs bg-purple-600/90 text-white border-purple-400/40">
                          <Camera className="w-2.5 h-2.5" />
                          Custom Uploaded Photo
                        </span>
                      </div>
  
                      {/* Remove Image Button */}
                      <button
                        type="button"
                        onClick={() => handleResetImage(item)}
                        className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 hover:bg-black/90 text-white text-[9.5px] font-bold rounded-md backdrop-blur-md flex items-center gap-1 border border-white/20 transition-all active:scale-95"
                        title="Remove photo"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-red-400" />
                        <span>Remove Photo</span>
                      </button>
  
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-bold drop-shadow-md">
                        <span className="truncate">{displayTitle}</span>
                      </div>
                    </div>
                  )}

                  <CardContent className="p-3.5 space-y-3">
                    {/* Primary Icon Category Selection Dropdown (All 24 Categories) */}
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                        Icon Category Selection
                      </Label>
                      <Select
                        value={catKey}
                        onValueChange={(val) => handleSelectCategory(item.id, val)}
                      >
                        <SelectTrigger className="h-9 text-xs bg-slate-50/80 dark:bg-slate-950/50 font-medium border-slate-300 dark:border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {Object.entries(PRESET_ECO_CATEGORIES)
                            .filter(([k, cfg]) => k === cfg.id)
                            .map(([k, cfg]) => {
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

                    {/* Log Text / Detail Description Input Field */}
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                        Log Text / Detail Description
                      </Label>
                      <Input
                        value={item.description ?? ""}
                        onChange={(e) => {
                          const newDesc = e.target.value
                          onUpdate(item.id, { description: newDesc })
                        }}
                        placeholder="e.g. Advanced groundwater recharge system"
                        className="h-9 text-xs bg-slate-50/80 dark:bg-slate-950/50 font-medium border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    
                    {/* Custom Title Input for Custom Categories */}
                    {catKey === "custom" && (
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                          Custom Feature Title
                        </Label>
                        <Input
                          value={item.title ?? ""}
                          onChange={(e) => {
                            const newTitle = e.target.value
                            onUpdate(item.id, { title: newTitle })
                          }}
                          placeholder="e.g. My Custom Eco Feature"
                          className="h-9 text-xs bg-slate-50/80 dark:bg-slate-950/50 font-medium border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    )}

                    {/* Photo URL / Custom Override Input Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-slate-500" />
                          <span>Category Photo URL (Auto or Custom)</span>
                        </Label>
                        {isCustomImage && (
                          <button
                            type="button"
                            onClick={() => handleResetImage(item)}
                            className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                          >
                            <RotateCcw className="w-2.5 h-2.5" /> Reset to Category Photo
                          </button>
                        )}
                      </div>
                      <FeatureImageUpload 
                        image={item.image ?? ""} 
                        onUpdate={(url) => onUpdate(item.id, { image: url })} 
                      />
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
