'use client'

import { useState } from 'react'
import { Users, Check, X, Loader2, Edit2 } from 'lucide-react'

export interface GroupBuyingQuickEditProps {
  propertyId: string
  initialData: any
  onUpdate: (propertyId: string, newGroupBuyingData: any) => void
}

export default function GroupBuyingQuickEdit({ propertyId, initialData, onUpdate }: GroupBuyingQuickEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [enabled, setEnabled] = useState(initialData?.enabled || false)
  const [discountLabel, setDiscountLabel] = useState(initialData?.discountLabel || '')
  const [minTarget, setMinTarget] = useState(initialData?.minTarget || initialData?.targetCount || '')
  const [maxTarget, setMaxTarget] = useState(initialData?.maxTarget || initialData?.targetCount || '')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        groupBuying: {
          ...initialData,
          enabled,
          discountLabel,
          minTarget: Number(minTarget) || 0,
          maxTarget: Number(maxTarget) || 0,
          targetCount: Number(maxTarget) || 0 // Kept for backwards compatibility
        }
      }
      
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) throw new Error('Failed to update')
      
      onUpdate(propertyId, payload.groupBuying)
      setIsEditing(false)
    } catch (err) {
      console.error(err)
      alert("Failed to update Group Buying settings.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="px-5 pb-1">
        <div className={`flex items-center gap-2 p-2.5 rounded-lg border relative ${enabled ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200/60 dark:border-purple-800/40' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${enabled ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
            <Users className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${enabled ? 'text-purple-700 dark:text-purple-400' : 'text-slate-500'}`}>Group Buying</span>
              {enabled && <span className="px-1.5 py-0.5 rounded bg-purple-500 text-white text-[8px] font-black uppercase tracking-wider animate-pulse">Active</span>}
              {!enabled && <span className="px-1.5 py-0.5 rounded bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[8px] font-black uppercase tracking-wider">Off</span>}
            </div>
            {enabled && (
              <p className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold truncate mt-0.5">
                {discountLabel || 'Group discount available'}
                <br />
                <span className="opacity-80">
                  {Number(minTarget) > 0 ? `Min: ${minTarget} ` : 'No Min '}
                  · 
                  {Number(maxTarget) > 0 ? ` Max: ${maxTarget}` : ' No Max Limit'}
                </span>
              </p>
            )}
          </div>
          
          {/* Edit Button (Always visible) */}
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-700 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Edit Group Buying"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 pb-1">
      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border-2 border-purple-200 dark:border-purple-800 shadow-lg relative z-30">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
          <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Quick Edit Group Buying</h4>
          <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={enabled} 
              onChange={(e) => setEnabled(e.target.checked)} 
              className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enable Group Buying</span>
          </label>
          
          <div className={enabled ? 'block' : 'hidden'}>
            <div className="mb-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Offer Text</label>
              <input 
                type="text" 
                value={discountLabel} 
                onChange={(e) => setDiscountLabel(e.target.value)} 
                placeholder="e.g. Extra 2% off" 
                className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Minimum (To Activate)</label>
                <input 
                  type="number" 
                  value={minTarget} 
                  onChange={(e) => setMinTarget(e.target.value)} 
                  placeholder="0 for No Min" 
                  className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Maximum (Pool Limit)</label>
                <input 
                  type="number" 
                  value={maxTarget} 
                  onChange={(e) => setMaxTarget(e.target.value)} 
                  placeholder="0 for No Max" 
                  className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {isSaving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
