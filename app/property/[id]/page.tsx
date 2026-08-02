"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Building2, MapPin, Layers, ChevronRight, CheckCircle2, DollarSign, LayoutGrid, Film } from "lucide-react"
import { VideoGallery } from "@/components/ui/video-gallery"

export default function PropertyView() {
  const params = useParams()
  const router = useRouter()
  const id  = params?.id as string
  
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/properties/${id}`)
        if (!res.ok) {
           const err = await res.json()
           throw new Error(err.error || "Failed to load property")
        }
        const data = await res.json()
        setProperty(data.property)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading Property Details...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Property Unavailable</h2>
          <p className="text-slate-600 mb-6">{error || "The requested property could not be found."}</p>
          <button onClick={() => router.push('/builder-dashboard')} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors w-full">
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const { details, type, flowType, status } = property
  const rootType = flowType || type

  // Extract Hero Image heuristically
  const heroImage = 
    details?.township?.heroImage || 
    details?.projects?.[0]?.heroImage || 
    details?.towers?.[0]?.heroImage || 
    details?.heroImage || 
    null

  const rootName = property.name || details?.township?.name || "Untitled Property"
  const locationStr = property.location?.city ? `${property.location.city}, ${property.location.state}` : "Location not set"
  
  // Stats
  const projectsCount = details?.projects?.length || (rootType === 'project' ? 1 : 0)
  const towersCount = details?.towers?.length || (rootType === 'tower' ? 1 : 0)
  const unitsCount = details?.generatedUnits?.length || 0

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
  const totalValue = details?.generatedUnits?.reduce((sum: any, u: any) => sum + (u.price || 0), 0) || 0

  // Extract all videos from hierarchy
  const allVideos: any[] = []
  
  // 1. Township videos
  if (details?.township?.videoGallery?.length) {
    allVideos.push(...details.township.videoGallery)
  }
  
  // 2. Project videos
  details?.projects?.forEach((proj: any) => {
    if (proj.videoGallery?.length) {
      allVideos.push(...proj.videoGallery.map((v: any) => ({ ...v, title: `${proj.name} - ${v.title || 'Video'}` })))
    }
  })
  
  // 3. Tower videos
  details?.towers?.forEach((tower: any) => {
    if (tower.videoGallery?.length) {
      allVideos.push(...tower.videoGallery.map((v: any) => ({ ...v, title: `${tower.name} - ${v.title || 'Video'}` })))
    }
  })
  
  // 4. Fallback root videos
  if (details?.videoGallery?.length) {
    allVideos.push(...details.videoGallery)
  }

  // Remove duplicates by ID (if any)
  const uniqueVideos = Array.from(new Map(allVideos.map(v => [v.id, v])).values())

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="relative h-[40vh] min-h-[350px] w-full bg-slate-900">
        {heroImage ? (
          <Image src={heroImage} alt={rootName} fill className="object-cover opacity-60" priority unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Building2 className="w-32 h-32 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 lg:px-24">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest border border-white/20">
              {rootType}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm border ${
                status === "active" ? "bg-emerald-500 text-white border-emerald-400" : "bg-amber-500 text-white border-amber-400"
              }`}>
              {status === "active" ? "Active" : "Draft"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">{rootName}</h1>
          <div className="flex items-center gap-2 text-white/80 text-lg">
            <MapPin className="w-5 h-5" />
            {locationStr}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
              <Layers className="w-8 h-8 text-blue-500 mb-3" />
              <div className="text-3xl font-black text-slate-800">{projectsCount}</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Projects</div>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
              <Building2 className="w-8 h-8 text-indigo-500 mb-3" />
              <div className="text-3xl font-black text-slate-800">{towersCount}</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Towers</div>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
              <LayoutGrid className="w-8 h-8 text-orange-500 mb-3" />
              <div className="text-3xl font-black text-slate-800">{unitsCount}</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Units</div>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
              <DollarSign className="w-8 h-8 text-emerald-500 mb-3" />
              <div className="text-2xl lg:text-3xl font-black text-slate-800">{totalValue > 0 ? formatCurrency(totalValue) : "TBD"}</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Estimated Value</div>
           </div>
        </div>

        {/* Video Gallery Section */}
        {uniqueVideos.length > 0 && (
          <div className="mb-12 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <VideoGallery videos={uniqueVideos} />
          </div>
        )}

        {/* Tree Render */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
             <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
               <Layers className="w-6 h-6 text-slate-400" /> Structure & Inventory
             </h3>
           </div>
           
           <div className="p-6 md:p-8">
             {(!details?.projects?.length && !details?.towers?.length) ? (
               <div className="text-center py-12 text-slate-500">No projects or towers defined yet.</div>
             ) : (
               <div className="space-y-12">
                 {details.projects?.map((proj: any, pIdx: number) => {
                   const matchedTowers = details.towers?.filter((t: any) => t.projectId === proj.id) || [];
                   
                   return (
                     <div key={proj.id || pIdx} className="border border-slate-200 rounded-2xl p-6 bg-slate-50 relative">
                       <div className="flex items-center gap-4 mb-6">
                         <div className="w-12 h-12 bg-white shadow-sm border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 font-bold text-lg">P{pIdx+1}</div>
                         <div>
                           <h4 className="text-xl font-bold text-slate-800">{proj.name}</h4>
                           <span className="text-sm font-medium text-slate-500">{matchedTowers.length} Towers</span>
                         </div>
                       </div>
                       
                       {matchedTowers.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative">
                            {matchedTowers.map((tower: any, tIdx: number) => {
                               const matchedUnits = details.generatedUnits?.filter((u: any) => u.towerId === tower.id) || [];
                               return (
                                 <div key={tower.id || tIdx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                   <div className="flex justify-between items-start mb-4">
                                     <h5 className="font-bold text-slate-800 flex items-center gap-2">
                                       <Building2 className="w-4 h-4 text-indigo-500" />
                                       {tower.name}
                                     </h5>
                                     <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{tower.totalFloors} Floors</span>
                                   </div>
                                   <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100 mb-4">
                                     <div className="flex justify-between mb-1"><span>Units Generated:</span> <span className="font-semibold text-slate-900">{matchedUnits.length}</span></div>
                                     <div className="flex justify-between"><span>RERA:</span> <span className="font-semibold text-slate-900">{tower.reraNumber || "N/A"}</span></div>
                                   </div>
                                 </div>
                               )
                            })}
                         </div>
                       ) : (
                         <div className="text-sm text-slate-500 italic pl-[4.5rem]">No towers added to this project yet.</div>
                       )}
                     </div>
                   )
                 })}

                 {/* Standalone Towers (for tower flow or unparented towers) */}
                 {details.towers?.filter((t: any) => !t.projectId || !details.projects?.find((p:any) => p.id === t.projectId)).length > 0 && (
                   <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50">
                       <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                         <Building2 className="w-6 h-6 text-indigo-500" />Standalone Towers
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative">
                       {details.towers.filter((t: any) => !t.projectId || !details.projects?.find((p:any) => p.id === t.projectId)).map((tower: any, tIdx: number) => {
                          const matchedUnits = details.generatedUnits?.filter((u: any) => u.towerId === tower.id) || [];
                          return (
                            <div key={tower.id || tIdx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                <h5 className="font-bold text-slate-800 flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-indigo-500" />
                                  {tower.name}
                                </h5>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{tower.totalFloors} Floors</span>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100 mb-4">
                                <div className="flex justify-between mb-1"><span>Units Generated:</span> <span className="font-semibold text-slate-900">{matchedUnits.length}</span></div>
                                <div className="flex justify-between"><span>RERA:</span> <span className="font-semibold text-slate-900">{tower.reraNumber || "N/A"}</span></div>
                              </div>
                            </div>
                          )
                       })}
                       </div>
                   </div>
                 )}
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  )
}
