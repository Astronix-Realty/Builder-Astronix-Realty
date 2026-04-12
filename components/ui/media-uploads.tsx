"use client"

import { useState, useRef, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import Image from "next/image"
import { Upload, X, Plus, Film, AlertCircle, FileText, Map as MapIcon, Eye, Download } from "lucide-react"

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

// ── Cloudinary cleanup helper ─────────────────────────────────
// Fire-and-forget: deletes old Cloudinary file silently when replacing
function deleteCloudinaryFile(url: string | undefined) {
  if (!url || !url.includes("cloudinary.com")) return
  fetch("/api/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  }).catch(() => {}) // Swallow errors — best-effort cleanup
}

// ── BANNER UPLOAD ──────────────────────────────────────────────
export function BannerUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    try {
      setIsUploading(true)
      const oldUrl = value
      const url = await uploadFileToServer(file)
      onChangeRef.current(url)
      deleteCloudinaryFile(oldUrl) // Delete old file after new upload succeeds
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
        className={`relative w-full h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${value ? "border-transparent" : "border-blue-200 bg-blue-50/20 hover:bg-blue-50/50 hover:border-blue-400"}`}
        onClick={() => !isUploading && fileRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-blue-600">Uploading...</span>
          </div>
        ) : value ? (
          <>
            <Image src={value} alt="Banner" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity backdrop-blur-[2px]">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); !isUploading && fileRef.current?.click() }}
                className="bg-white text-gray-800 px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" /> Replace
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deleteCloudinaryFile(value); onChangeRef.current("") }}
              className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-lg shadow hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl text-blue-500 flex items-center justify-center mb-3 transition-transform group-hover:scale-110 group-hover:-translate-y-1">
              <Upload className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-700 text-sm">Upload Cover Image</span>
            <span className="text-[11px] text-gray-400 mt-1">High quality banner for your page</span>
            <span className="text-[10px] text-gray-400 mt-3 bg-gray-100 px-2.5 py-1 rounded-full">JPEG · PNG · WEBP</span>
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

// ── GALLERY UPLOAD ─────────────────────────────────────────────
export function GalleryUpload({ images, onChange, max = 20 }: { images: string[]; onChange: (imgs: string[]) => void; max?: number }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

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
      onChangeRef.current([...images, ...newUrls].slice(0, max))
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
          img ? (
          <div key={i} className="relative w-28 h-28 rounded-xl border border-gray-200 overflow-hidden group shadow-sm">
            <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            <button
              type="button"
              onClick={() => { deleteCloudinaryFile(images[i]); onChangeRef.current(images.filter((_, idx) => idx !== i)) }}
              className="absolute top-1.5 right-1.5 bg-white/90 text-red-600 p-1 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          ) : null
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

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

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
        id: uuidv4(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        landscapeUrl: detectedType === "walkthrough" ? url : "",
        shortUrl: detectedType === "short" ? url : "",
        type: detectedType,
      }
      onChangeRef.current([...videos, newItem].slice(0, max))
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
      id: uuidv4(),
      title: "Video Link",
      landscapeUrl: finalType === "walkthrough" ? url : "",
      shortUrl: finalType === "short" ? url : "",
      type: finalType,
    }
    onChangeRef.current([...videos, newItem].slice(0, max))
    setLinkInput("")
  }

  return (
    <div className="space-y-3">
      {/* ── Existing Videos ────────────────────────── */}
      {videos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {videos.map((vid, i) => {
            const src = vid.landscapeUrl || vid.shortUrl || ""
            const isYT = src.includes("youtube.com") || src.includes("youtu.be")
            const ytMatch = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/)
            const ytThumb = isYT && ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg` : null
            const isLocal = src.startsWith("/uploads") || src.includes("cloudinary.com")

            return (
              <div
                key={vid.id || i}
                className="relative w-full h-[200px] rounded-xl border border-gray-200 overflow-hidden group shadow-sm bg-gray-900 cursor-pointer"
                onClick={() => openVideoModal(vid)}
              >
                {/* Thumbnail */}
                {ytThumb && <img src={ytThumb} alt="thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />}
                {isLocal && <video src={src} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" muted preload="metadata" />}
                {!ytThumb && !isLocal && (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center gap-2">
                    <Film className="w-10 h-10 text-gray-500" />
                    <span className="text-[11px] text-gray-400 max-w-[180px] truncate text-center">{src}</span>
                  </div>
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                  <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-xl transition-all group-hover:scale-110">
                    <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>

                {/* Type badge */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-black/50 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    {vid.type === "short" ? "Short" : "Video"}
                  </span>
                </div>

                {/* Title */}
                {vid.title && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent pt-6 pb-2 px-3 text-white text-[11px] font-medium truncate">
                    {vid.title}
                  </div>
                )}

                {/* Delete */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCloudinaryFile(vid.landscapeUrl)
                    deleteCloudinaryFile(vid.shortUrl)
                    onChangeRef.current(videos.filter((_, idx) => idx !== i))
                  }}
                  className="absolute top-2 right-2 bg-white/90 text-red-600 p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add Video Panel ─────────────────────── */}
      {videos.length < max && (
        <div className={`relative w-full border-2 border-dashed rounded-xl overflow-hidden transition-all ${videos.length === 0 ? "h-[200px]" : "h-auto"} border-gray-200 bg-gray-50/30 hover:bg-gray-50/80 hover:border-gray-400`}>
          {videos.length === 0 ? (
            // Empty state — full-size card matching image boxes
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl text-gray-400 flex items-center justify-center mb-3">
                <Film className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-700 text-sm">Add Video or Link</span>
              <span className="text-[11px] text-gray-400 mt-1">Upload a file or paste YouTube / MP4 link</span>
              {/* Invisible click target */}
              <button type="button" onClick={() => !isUploading && fileRef.current?.click()} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
          ) : null}

          {/* Input row */}
          <div className={`${videos.length === 0 ? "absolute bottom-0 inset-x-0 bg-white/80 backdrop-blur-sm border-t border-gray-200" : ""} flex gap-2 p-3`}>
            <button
              type="button"
              onClick={() => !isUploading && fileRef.current?.click()}
              disabled={isUploading}
              className="flex-shrink-0 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-4 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <><div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-3.5 h-3.5" /> Upload</>
              )}
            </button>

            <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-lg px-2.5 overflow-hidden focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 transition-all">
              <Film className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
                placeholder="Paste YouTube or MP4 link..."
                className="flex-1 text-xs bg-transparent px-2 py-2 text-gray-700 placeholder-gray-400 focus:outline-none"
              />
              {linkInput && (
                <button type="button" onClick={() => setLinkInput("")} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddLink}
              disabled={!linkInput.trim()}
              className="flex-shrink-0 px-4 py-2 bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold rounded-lg transition-all"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <input type="file" ref={fileRef} className="hidden" accept="video/*" onChange={handleFileChange} />

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

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

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
      const oldUrl = value
      const url = await uploadFileToServer(file)
      onChangeRef.current(url)
      deleteCloudinaryFile(oldUrl) // Delete old PDF after new one uploads
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

            <p className="text-sm font-semibold text-gray-800 max-w-[220px] truncate" title={value?.split('/').pop()?.split('?')[0] || 'Document'}>
              {value?.split('/').pop()?.split('_').slice(0, -1).join('_') || value?.split('/').pop()?.split('?')[0] || 'Document Uploaded'}
            </p>

            {/* Always-visible action buttons */}
            <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deleteCloudinaryFile(value); onChangeRef.current("") }}
              className="absolute top-3 right-3 bg-white/90 text-red-500 p-1.5 rounded-xl hover:bg-red-50 shadow opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X className="w-4 h-4" />
            </button>
            </div>
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

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

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
      const oldUrl = value
      const url = await uploadFileToServer(file)
      onChange(url)
      deleteCloudinaryFile(oldUrl) // Delete old file after new upload succeeds
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
        className={`relative w-full h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${value ? "border-transparent bg-gray-50" : "border-blue-200 bg-blue-50/20 hover:bg-blue-50/50 hover:border-blue-400"}`}
        onClick={() => !isUploading && fileRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-blue-600">Uploading...</span>
          </div>
        ) : value ? (
          <>
            <div className="absolute inset-0 p-1.5">
              <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-200 bg-white">
                <Image src={value} alt="Master Plan Map" fill className="object-contain" unoptimized />
              </div>
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity backdrop-blur-[2px]">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); !isUploading && fileRef.current?.click() }}
                className="bg-white text-gray-800 px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" /> Replace
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deleteCloudinaryFile(value); onChangeRef.current("") }}
              className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-lg shadow-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="Remove Map"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl text-blue-500 flex items-center justify-center mb-3 transition-transform group-hover:scale-110 group-hover:-translate-y-1">
              <MapIcon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-700 text-sm">{title}</span>
            <span className="text-[11px] text-gray-400 mt-1 max-w-[200px] leading-relaxed">{description}</span>
            <span className="text-[10px] text-gray-400 mt-3 bg-gray-100 px-2.5 py-1 rounded-full">JPEG · PNG · WEBP</span>
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

// ── ABOUT IMAGE UPLOAD ──────────────────────────────────────────────
export function AboutImageUpload({ 
  value, 
  onChange,
  title = "Upload About Image",
  description = "Landscape or aerial view for the about section"
}: { 
  value: string; 
  onChange: (url: string) => void;
  title?: string;
  description?: string;
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")

    if (!file.type.startsWith("image/")) {
      setError("Invalid file type: Only image files are allowed.")
      if (fileRef.current) fileRef.current.value = ""
      return
    }

    try {
      setIsUploading(true)
      const oldUrl = value
      const url = await uploadFileToServer(file)
      onChangeRef.current(url)
      deleteCloudinaryFile(oldUrl) // Delete old file after new upload succeeds
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
        className={`relative w-full h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${value ? "border-transparent bg-gray-50" : "border-gray-200 bg-gray-50/30 hover:bg-gray-50/80 hover:border-gray-400"}`}
        onClick={() => !isUploading && fileRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-[3px] border-[#1A3C8C] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#1A3C8C]">Uploading...</span>
          </div>
        ) : value ? (
          <>
            <Image src={value} alt="Uploaded" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity backdrop-blur-[2px]">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); !isUploading && fileRef.current?.click() }}
                className="bg-white text-gray-800 px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-[#1A3C8C]" /> Replace
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deleteCloudinaryFile(value); onChangeRef.current("") }}
              className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-lg shadow-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="Remove Image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl text-gray-400 flex items-center justify-center mb-3 transition-transform group-hover:scale-110 group-hover:-translate-y-1">
              <Upload className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-700 text-sm">{title}</span>
            <span className="text-[11px] text-gray-400 mt-1 max-w-[200px] leading-relaxed">{description}</span>
            <span className="text-[10px] text-gray-400 mt-3 bg-gray-100 px-2.5 py-1 rounded-full">JPEG · PNG · WEBP</span>
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
