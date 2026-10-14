'use client'

import { useState } from 'react'
import { Users, Check, X, Loader2, Edit2, Sparkles, ShieldCheck } from 'lucide-react'

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
        <div className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
          enabled 
            ? 'bg-purple-50/70 dark:bg-purple-950/25 border-purple-200/80 dark:border-purple-800/40 shadow-sm' 
            : 'bg-slate-50/80 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-700/60'
        }`}>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
            enabled 
              ? 'bg-purple-600 text-white shadow-purple-500/20' 
              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
          }`}>
            <Users className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                enabled ? 'text-purple-700 dark:text-purple-300' : 'text-slate-500'
              }`}>
                Group Buying
              </span>
              {enabled ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] font-mono font-black uppercase tracking-wider bg-purple-500 text-white shadow-sm">
                  <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                  Active
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[8px] font-mono font-black uppercase tracking-wider">
                  Off
                </span>
              )}
            </div>
            {enabled && (
              <p className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold truncate mt-0.5">
                {discountLabel || 'Group discount available'}
                <span className="text-slate-400 font-mono text-[9px] ml-1.5">
                  ({Number(minTarget) > 0 ? `Min ${minTarget}` : 'No Min'} · {Number(maxTarget) > 0 ? `Max ${maxTarget}` : 'No Cap'})
                </span>
              </p>
            )}
          </div>
          
          {/* Edit Button */}
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-700 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-all shrink-0"
            title="Edit Group Buying Parameters"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 pb-1">
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60 shadow-xl relative z-30 ring-1 ring-purple-500/10">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            <h4 className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              Group Buying Inspector
            </h4>
          </div>
          <button 
            onClick={() => setIsEditing(false)} 
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={enabled} 
              onChange={(e) => setEnabled(e.target.checked)} 
              className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 accent-purple-600"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Enable Group Buying Campaign
            </span>
          </label>
          
          <div className={enabled ? 'space-y-2.5' : 'hidden'}>
            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                Promotional Offer Label
              </label>
              <input 
                type="text" 
                value={discountLabel} 
                onChange={(e) => setDiscountLabel(e.target.value)} 
                placeholder="e.g. Extra 2% off for 5+ buyers" 
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Min Buyers (Pool Activation)
                </label>
                <input 
                  type="number" 
                  value={minTarget} 
                  onChange={(e) => setMinTarget(e.target.value)} 
                  placeholder="0 (No Min)" 
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-semibold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Max Buyers (Pool Cap)
                </label>
                <input 
                  type="number" 
                  value={maxTarget} 
                  onChange={(e) => setMaxTarget(e.target.value)} 
                  placeholder="0 (Unlimited)" 
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-semibold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-purple-500/20 disabled:opacity-50 transition-all"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {isSaving ? 'Saving...' : 'Apply Config'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
