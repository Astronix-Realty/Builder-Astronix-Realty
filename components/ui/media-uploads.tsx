"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, Plus, Film, AlertCircle, FileText, Map as MapIcon } from "lucide-react"

// ── Shared upload helper ─────────────────────────────────────
async function uploadFileToServer(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch("/api/upload", { method: "POST", body: formData })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Upload failed (${res.status})`)
  }
  const data = await res.json()
  return data.url as string
}

// ── BANNER UPLOAD ──────────────────────────────────────────────
export function BannerUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    try {
      setIsUploading(true)
      const url = await uploadFileToServer(file)
      onChange(url)
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full h-[260px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${value ? "border-transparent" : "border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300"
          }`}
        onClick={() => !isUploading && fileRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-blue-600">Uploading...</span>
          </div>
        ) : value ? (
          <>
            <Image src={value} alt="Banner" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
              <Upload className="w-7 h-7 text-white" />
              <span className="text-white font-semibold text-sm">Change Cover Image</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange("") }}
              className="absolute top-3 right-3 bg-white/90 text-red-500 p-2 rounded-xl hover:bg-red-50 shadow opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-white rounded-2xl shadow-md text-blue-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <Upload className="w-7 h-7" />
            </div>
            <span className="font-bold text-gray-800 text-base">Upload Cover Image</span>
            <span className="text-xs text-gray-500 mt-1">High quality banner for your township page</span>
            <span className="text-[10px] text-gray-400 mt-3 bg-gray-100 px-3 py-1 rounded-full">JPEG, PNG, WEBP up to 10MB</span>
          </>
        )}
        <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>

      {/* URL fallback input */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste image URL..."
          className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// ── GALLERY UPLOAD ─────────────────────────────────────────────
export function GalleryUpload({ images, onChange, max = 20 }: { images: string[]; onChange: (imgs: string[]) => void; max?: number }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setError("")

    // Strict validation for images only
    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.startsWith("image/")) {
        setError("Invalid file type: Only image files are allowed in the Image Gallery.")
        if (fileRef.current) fileRef.current.value = ""
        return
      }
    }

    try {
      setIsUploading(true)
      const newUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        try {
          const url = await uploadFileToServer(files[i])
          newUrls.push(url)
        } catch (err: any) {
          console.warn(`Skipped file ${files[i].name}:`, err.message)
        }
      }
      onChange([...images, ...newUrls].slice(0, max))
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 mt-2">
        {images.map((img, i) => (
          <div key={i} className="relative w-28 h-28 rounded-xl border border-gray-200 overflow-hidden group shadow-sm">
            <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute top-1.5 right-1.5 bg-white/90 text-red-600 p-1 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {images.length < max && (
          <div
            className={`w-28 h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${isUploading
                ? "border-blue-300 bg-blue-50"
                : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 text-gray-400"
              }`}
            onClick={() => !isUploading && fileRef.current?.click()}
          >
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-7 h-7 mb-1" />
                <span className="text-[11px] font-semibold text-gray-500">Add Photos</span>
              </>
            )}
          </div>
        )}
        <input type="file" multiple ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// ── VIDEO UPLOAD ───────────────────────────────────────────────
export function VideoUpload({ videos, onChange, max = 5 }: {
  videos: { id: string; title?: string; landscapeUrl?: string; shortUrl?: string; type?: string }[];
  onChange: (v: any[]) => void;
  max?: number
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [linkInput, setLinkInput] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // State for the modal
  const [modalOpen, setModalOpen] = useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null)
  const [currentVideoType, setCurrentVideoType] = useState<'uploaded' | 'youtube' | 'other_url' | null>(null)

  // Helper to determine video type and URL for playback
  const getVideoPlaybackInfo = (videoItem: { landscapeUrl?: string; shortUrl?: string; type?: string }) => {
    const url = videoItem.landscapeUrl || videoItem.shortUrl;
    if (!url) return null;

    if (url.startsWith("/uploads")) {
      return { url, type: 'uploaded' };
    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      // Extract YouTube video ID
      let videoId = '';
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
      const match = url.match(youtubeRegex);
      if (match && match[1]) {
        videoId = match[1];
      }
      return { url: `https://www.youtube.com/embed/${videoId}?autoplay=1`, type: 'youtube' };
    } else if (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg")) {
      return { url, type: 'other_url' };
    }
    return null;
  };

  const openVideoModal = (videoItem: { landscapeUrl?: string; shortUrl?: string; type?: string }) => {
    const info = getVideoPlaybackInfo(videoItem);
    if (info) {
      setCurrentVideoUrl(info.url);
      setCurrentVideoType(info.type as 'uploaded' | 'youtube' | 'other_url');
      setModalOpen(true);
    }
  };

  const closeVideoModal = () => {
    setModalOpen(false);
    setCurrentVideoUrl(null);
    setCurrentVideoType(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")

    // Strict validation for videos only
    if (!file.type.startsWith("video/")) {
      setError("Invalid file type: Only video files are allowed in the Video Gallery.")
      if (fileRef.current) fileRef.current.value = ""
      return
    }

    try {
      setIsUploading(true)

      // Auto-detect if video is a short (vertical) or walkthrough (landscape)
      const detectType = (): Promise<"short" | "walkthrough"> => new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          resolve(video.videoHeight > video.videoWidth ? "short" : "walkthrough");
        }
        video.onerror = () => resolve("walkthrough"); // fallback
        video.src = URL.createObjectURL(file);
      });

      const detectedType = await detectType();
      const url = await uploadFileToServer(file)

      const newItem = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        landscapeUrl: detectedType === "walkthrough" ? url : "",
        shortUrl: detectedType === "short" ? url : "",
        type: detectedType,
      }
      onChange([...videos, newItem].slice(0, max))
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const handleAddLink = () => {
    const url = linkInput.trim()
    if (!url) return
    setError("")

    // Basic validation to prevent obvious image links in video gallery
    if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i)) {
      setError("Image links are not allowed. Please provide a valid video link.")
      return
    }

    // Auto-detect short for links
    const isAutoShort = url.includes("shorts") || url.includes("tiktok.com") || url.includes("instagram.com/reel");
    const finalType = isAutoShort ? "short" : "walkthrough"
    const newItem = {
      id: crypto.randomUUID(),
      title: "Video Link",
      landscapeUrl: finalType === "walkthrough" ? url : "",
      shortUrl: finalType === "short" ? url : "",
      type: finalType,
    }
    onChange([...videos, newItem].slice(0, max))
    setLinkInput("")
  }

  return (
    <div className="space-y-4">
      {/* Video Grid */}
      <div className="flex flex-wrap gap-4 mt-2">
        {videos.map((vid, i) => {
          const src = vid.landscapeUrl || vid.shortUrl || ""
          const isYT = src.includes("youtube.com") || src.includes("youtu.be")
          const ytMatch = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/)
          const ytThumb = isYT && ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg` : null
          const isLocal = src.startsWith("/uploads")
          const isShort = vid.type === "short"

          return (
            <div
              key={vid.id || i}
              className={`relative rounded-xl border border-gray-200 overflow-hidden group shadow-sm bg-gray-900 cursor-pointer ${isShort ? "w-24 h-36" : "w-36 h-28"
                }`}
              onClick={() => openVideoModal(vid)}
            >
              {/* Type Badge - Premium glassmorphism */}
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {isShort ? "Short" : "Long"}
                </span>
              </div>

              {/* YouTube thumbnail */}
              {ytThumb && (
                <img src={ytThumb} alt="thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              )}
              {/* Local uploaded video preview */}
              {isLocal && (
                <video src={src} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" muted preload="metadata" />
              )}
              {/* Generic URL preview */}
              {!ytThumb && !isLocal && (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <Film className="w-8 h-8 text-gray-500" />
                </div>
              )}

              {/* Play button overlay - Frosty glass */}
              <div className="absolute inset-0 flex items-center justify-center transition-all bg-black/0 group-hover:bg-black/20">
                <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-xl transition-all group-hover:scale-110 group-hover:bg-white/40">
                  <svg className="w-4 h-4 text-white ml-1 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>

              {/* Title info */}
              {vid.title && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-6 pb-2 px-3 text-white text-[10px] font-medium truncate">
                  {vid.title}
                </div>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(videos.filter((_, idx) => idx !== i)) }}
                className="absolute top-2 right-2 bg-white/90 text-red-600 p-1.5 rounded-full hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10 hover:scale-110"
              >
                <X className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Add New Video Panel - Premium Look */}
      {videos.length < max && (
        <div className="bg-gradient-to-br from-orange-50/60 to-white border border-orange-100 shadow-sm rounded-2xl p-5 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-bl from-orange-100/50 rounded-bl-full pointer-events-none" />

          <div className="mb-4 pb-4 border-b border-orange-100/80">
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-orange-600" />
              </div>
              Add Video Content
              <span className="ml-2 text-[10px] font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                Auto-detects Shorts & Landscape
              </span>
            </h4>
          </div>

          <div className="flex flex-col md:flex-row gap-5 items-center">
            {/* Upload Button */}
            <button
              type="button"
              onClick={() => !isUploading && fileRef.current?.click()}
              className="w-full md:w-auto flex-shrink-0 bg-white border border-gray-300 hover:border-orange-400 hover:bg-orange-50/30 text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 group"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" /> Upload File
                </>
              )}
            </button>

            <div className="hidden md:flex flex-col items-center justify-center">
              <div className="h-4 w-px bg-gray-200"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest my-1">OR</span>
              <div className="h-4 w-px bg-gray-200"></div>
            </div>
            <div className="md:hidden flex items-center justify-center w-full">
              <div className="h-px flex-1 bg-gray-200"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">OR</span>
              <div className="h-px flex-1 bg-gray-200"></div>
            </div>

            {/* Link Input */}
            <div className="flex-1 flex gap-2 w-full">
              <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-xl px-3 overflow-hidden focus-within:ring-2 focus-within:ring-orange-200 focus-within:border-orange-400 transition-all shadow-sm">
                <Film className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
                  placeholder="Paste YouTube or MP4 link..."
                  className="flex-1 text-sm bg-transparent px-3 py-2.5 text-gray-700 placeholder-gray-400 focus:outline-none"
                />
                {linkInput && (
                  <button type="button" onClick={() => setLinkInput("")} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1 rounded-md transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddLink}
                disabled={!linkInput.trim()}
                className="flex-shrink-0 px-5 py-2.5 bg-gray-900 hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
              >
                Add Link
              </button>
            </div>
          </div>
          <input type="file" ref={fileRef} className="hidden" accept="video/*" onChange={handleFileChange} />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-lg">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── FULLSCREEN PLAYER MODAL ── */}
      {modalOpen && currentVideoUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={closeVideoModal}
        >
          <button
            type="button"
            onClick={closeVideoModal}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/25 p-2.5 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className={`w-full rounded-2xl overflow-hidden shadow-2xl bg-black ${currentVideoType === 'youtube' && currentVideoUrl.includes('shorts')
                ? 'max-w-md aspect-[9/16]'
                : currentVideoType !== 'youtube' && videos.find(v => (v.landscapeUrl === currentVideoUrl || v.shortUrl === currentVideoUrl))?.type === 'short'
                  ? 'max-w-md aspect-[9/16]'
                  : 'max-w-4xl aspect-video'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {currentVideoType === "youtube" ? (
              <iframe
                src={currentVideoUrl}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
              />
            ) : (
              <video
                src={currentVideoUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── DOCUMENT UPLOAD ─────────────────────────────────────────────
export function DocumentUpload({
  value,
  onChange,
  label,
  maxSizeMB = 40,
  accept = ".pdf",
  title = "Upload Document",
  description = "Drop your file here or click to browse.",
  buttonLabel = "View Document"
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
  accept?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")

    // Size validation
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`)
      if (fileRef.current) fileRef.current.value = ""
      return
    }

    try {
      setIsUploading(true)
      const url = await uploadFileToServer(file)
      onChange(url)
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      {label && <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{label}</div>}

      <div
        className={`relative w-full min-h-[160px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group p-6 ${value ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300"
          }`}
        onClick={() => !isUploading && fileRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-blue-600">Uploading Document...</span>
          </div>
        ) : value ? (
          // ── Uploaded state ──────────────────────────────────────
          <div className="flex flex-col items-center text-center gap-4 w-full py-2" onClick={(e) => e.stopPropagation()}>
            {/* PDF icon with success badge */}
            <div className="relative w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 shadow-sm flex-shrink-0">
              <FileText className="w-8 h-8" />
              <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-sm">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* File name */}
            <p className="text-sm font-semibold text-gray-800 max-w-[220px] truncate" title={value.split('/').pop() || 'Document'}>
              {value.split('/').pop() || 'Document Uploaded'}
            </p>

            {/* Always-visible action buttons */}
            <div className="flex items-center gap-2">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-xl transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {buttonLabel}
              </a>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange("") }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-xl transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 transition-transform group-hover:scale-110 shadow-sm relative">
              <FileText className="w-8 h-8" />
              <div className="absolute -bottom-2 right-0 bg-blue-500 text-white p-1.5 rounded-full shadow-md">
                <Upload className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="font-bold text-gray-800 text-base">{title}</span>
            <span className="text-xs text-gray-500 mt-1 max-w-[250px]">{description}</span>

            <div className="flex gap-2 mt-4">
              <span className="text-[10px] text-gray-600 bg-white border border-gray-200 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {accept.includes('pdf') ? 'PDF' : 'Any'} Format
              </span>
              <span className="text-[10px] text-gray-600 bg-white border border-gray-200 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Max {maxSizeMB} MB
              </span>
            </div>
          </div>
        )}
        <input type="file" ref={fileRef} className="hidden" accept={accept} onChange={handleFileChange} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// ── MASTER PLAN MAP UPLOAD ──────────────────────────────────────
export function MasterPlanMapUpload({ 
  value, 
  onChange,
  title = "Upload Master Plan Map",
  description = "Architectural layout or site map of the township"
}: { 
  value: string; 
  onChange: (url: string) => void;
  title?: string;
  description?: string;
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")

    // Strict validation for images only
    if (!file.type.startsWith("image/")) {
      setError("Invalid file type: Only image files are allowed.")
      if (fileRef.current) fileRef.current.value = ""
      return
    }

    try {
      setIsUploading(true)
      const url = await uploadFileToServer(file)
      onChange(url)
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2 h-full">
      <div
        className={`relative w-full h-full min-h-[300px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${value ? "border-transparent bg-gray-50" : "border-blue-200 bg-blue-50/20 hover:bg-blue-50/50 hover:border-blue-300"
          }`}
        onClick={() => !isUploading && fileRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-blue-600">Uploading...</span>
          </div>
        ) : value ? (
          <>
            <div className="absolute inset-0 p-2">
              <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200 bg-white">
                <Image src={value} alt="Master Plan Map" fill className="object-contain" unoptimized />
              </div>
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-opacity backdrop-blur-sm rounded-2xl">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); !isUploading && fileRef.current?.click() }}
                className="bg-white text-gray-800 px-5 py-2.5 rounded-xl font-semibold shadow-xl hover:bg-gray-50 flex items-center gap-2 transition-transform transform hover:scale-105"
              >
                <Upload className="w-4 h-4 text-blue-600" /> Replace Image
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange("") }}
                className="bg-red-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-xl hover:bg-red-600 flex items-center gap-2 transition-transform transform hover:scale-105"
              >
                <X className="w-4 h-4" /> Remove Map
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl shadow-sm text-blue-600 flex items-center justify-center mb-5 transition-transform group-hover:scale-110 group-hover:-translate-y-1">
              <MapIcon className="w-8 h-8" />
            </div>
            <span className="font-bold text-gray-800 text-lg">{title}</span>
            <span className="text-sm text-gray-500 mt-1.5 max-w-[250px]">{description}</span>

            <div className="mt-6 flex flex-col gap-2 w-full max-w-[200px]">
              <div className="bg-white border text-xs px-3 py-2 rounded-lg text-gray-500 shadow-sm flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                High Quality
              </div>
            </div>
          </div>
        )}
        <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
