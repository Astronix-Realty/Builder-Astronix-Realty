"use client"

import { useState, useEffect } from "react"
import { Building2, Layers, Home, IndianRupee, Hash } from "lucide-react"

interface Tower {
  _id: string
  name: string
  floorCount: number
  unitCount: number
  baseRate: number
}

interface PropertyDetailsProps {
  propertyId: string
  propertyName: string
}

export function AssignedPropertyDetails({ propertyId, propertyName }: PropertyDetailsProps) {
  const [towers, setTowers] = useState<Tower[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch(`/api/inventory/${propertyId}`)
        if (res.ok) {
          const data = await res.json()
          setTowers(data.towers || [])
        }
      } catch (e) {
        console.error("Failed to load property details")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (propertyId) {
      fetchInventory()
    }
  }, [propertyId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="mt-6">
      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <Layers className="w-4 h-4 text-emerald-600" />
        Tower Configurations ({towers.length})
      </h4>
      
      {towers.length === 0 ? (
        <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">No towers configured by the builder yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {towers.map(tower => (
            <div key={tower._id} className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 relative overflow-hidden group hover:border-emerald-300 transition-colors">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Building2 className="w-12 h-12 text-slate-900 dark:text-white" />
              </div>
              
              <h5 className="font-bold text-slate-900 dark:text-white text-lg mb-4">{tower.name}</h5>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                    <IndianRupee className="w-3 h-3" /> Base Rate
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {tower.baseRate > 0 ? `₹${tower.baseRate.toLocaleString()}/sqft` : "Not Set"}
                  </p>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                    <Home className="w-3 h-3" /> Total Units
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {tower.unitCount} Units
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                    <Hash className="w-3 h-3" /> Floors
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {tower.floorCount} Floors
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
