"use client"

import { useState } from "react"
import { Play, X, Film, Info } from "lucide-react"

interface VideoGalleryItem {
  id: string
  title?: string
  landscapeUrl?: string
  shortUrl?: string
  type?: string
}

interface VideoGalleryProps {
  videos: VideoGalleryItem[]
}

export function VideoGallery({ videos }: VideoGalleryProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null)
  const [currentVideoType, setCurrentVideoType] = useState<'uploaded' | 'youtube' | 'other_url' | null>(null)
  const [currentVideoRatio, setCurrentVideoRatio] = useState<'landscape' | 'short'>('landscape')

  if (!videos || videos.length === 0) return null

  const getVideoPlaybackInfo = (videoItem: VideoGalleryItem) => {
    const url = videoItem.landscapeUrl || videoItem.shortUrl
    if (!url) return null

    if (url.startsWith("/uploads") || url.includes("cloudinary.com")) {
      return { url, type: 'uploaded' as const }
    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = ''
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|shorts\/|)([\w-]{11})(?:\S+)?/
      const match = url.match(youtubeRegex)
      if (match && match[1]) {
        videoId = match[1]
      }
      return { url: `https://www.youtube.com/embed/${videoId}?autoplay=1`, type: 'youtube' as const }
    } else if (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg")) {
      return { url, type: 'other_url' as const }
    }
    return null
  }

  const openVideoModal = (videoItem: VideoGalleryItem) => {
    const info = getVideoPlaybackInfo(videoItem)
    if (info) {
      setCurrentVideoUrl(info.url)
      setCurrentVideoType(info.type)
      setCurrentVideoRatio(videoItem.type === 'short' ? 'short' : 'landscape')
      setModalOpen(true)
    }
  }

  const closeVideoModal = () => {
    setModalOpen(false)
    setCurrentVideoUrl(null)
    setCurrentVideoType(null)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Film className="w-6 h-6 text-blue-600" /> Media & Walkthroughs
        </h3>
        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
          {videos.length} Videos Available
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((vid, i) => {
          const src = vid.landscapeUrl || vid.shortUrl || ""
          const isYT = src.includes("youtube.com") || src.includes("youtu.be")
          const ytMatch = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/)
          const ytThumb = isYT && ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg` : null
          const isLocal = src.startsWith("/uploads") || src.includes("cloudinary.com")

          return (
            <div
              key={vid.id || i}
              className="group relative aspect-video rounded-3xl overflow-hidden bg-slate-900 shadow-lg cursor-pointer ring-offset-4 hover:ring-2 hover:ring-blue-500 transition-all duration-500"
              onClick={() => openVideoModal(vid)}
            >
              {/* Thumbnail */}
              {isYT ? (
                <img
                  src={ytThumb || `https://img.youtube.com/vi/${ytMatch?.[1]}/mqdefault.jpg`}
                  alt={vid.title || "Video thumbnail"}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://img.youtube.com/vi/${ytMatch?.[1]}/mqdefault.jpg`
                  }}
                />
              ) : isLocal ? (
                <div className="relative w-full h-full">
                  <video
                    src={src}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-3">
                  <Film className="w-12 h-12 text-slate-600 group-hover:scale-110 transition-transform duration-500" />
                  <span className="text-[10px] text-slate-500 font-medium max-w-[200px] truncate">{src}</span>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className={`backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/20 shadow-xl ${vid.type === 'short' ? 'bg-orange-500/80' : 'bg-blue-600/80'}`}>
                  {vid.type === 'short' ? 'Vertical' : 'Walkthrough'}
                </span>
                {isYT && (
                  <span className="bg-red-600/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/20 shadow-xl">
                    YouTube
                  </span>
                )}
              </div>

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-500">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl transition-all duration-500 scale-90 group-hover:scale-110 group-hover:bg-white/20">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg group-hover:bg-blue-500 transition-colors">
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </div>
                </div>
              </div>

              {/* Title & Info */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent pt-12 pb-5 px-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <h4 className="text-white font-bold text-lg leading-tight mb-1 drop-shadow-lg">{vid.title || "Property Walkthrough"}</h4>
                <div className="flex items-center gap-2 text-white/60 text-xs font-medium">
                  <Info className="w-3.5 h-3.5" />
                  <span>Click to play video</span>
                </div>
              </div>
            </div>
          )})}
        </div>

      {/* ── FULLSCREEN PLAYER MODAL ── */}
      {modalOpen && currentVideoUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/95 flex items-center justify-center p-4 sm:p-8 md:p-12 backdrop-blur-2xl animate-in fade-in duration-500"
          onClick={closeVideoModal}
        >
          {/* Header */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between px-6 md:px-12 z-[10000]">
             <div className="flex flex-col">
                <div className="text-white font-black text-xl tracking-tight drop-shadow-xl">Property Walkthrough</div>
                <div className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Astronix Realty Experience</div>
             </div>
             <button
              type="button"
              onClick={closeVideoModal}
              className="text-white bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all hover:scale-110 active:scale-95 border border-white/10"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          {/* Player Container */}
          <div
            className={`w-full rounded-3xl overflow-hidden shadow-[0_0_150px_rgba(30,58,138,0.3)] bg-black ring-1 ring-white/10 transition-all duration-700 animate-in zoom-in-95 ${
                currentVideoRatio === 'short'
                  ? 'max-w-md aspect-[9/16]'
                  : 'max-w-6xl aspect-video'
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
          
          {/* Footer Branding */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-40 pointer-events-none group">
            <div className="h-px w-8 bg-white/30" />
            <div className="text-white text-[10px] font-black tracking-[0.3em] uppercase">Premium Property Experience</div>
            <div className="h-px w-8 bg-white/30" />
          </div>
        </div>
      )}
    </div>
  )
}
