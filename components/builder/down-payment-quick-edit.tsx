'use client'

import { useState } from 'react'
import { Percent, Check, X, Loader2, Edit2, Coins, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export interface DownPaymentQuickEditProps {
  propertyId: string
  initialPercent?: number
  onUpdate?: (propertyId: string, newPercent: number) => void
}

const PRESET_PERCENTAGES = [10, 15, 20, 25, 30]

export default function DownPaymentQuickEdit({
  propertyId,
  initialPercent = 20,
  onUpdate,
}: DownPaymentQuickEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [percent, setPercent] = useState<number>(initialPercent || 20)
  const [inputVal, setInputVal] = useState<string>(String(initialPercent || 20))

  const handleSelectPreset = (p: number) => {
    setPercent(p)
    setInputVal(String(p))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setInputVal(raw)
    const num = Number(raw)
    if (!isNaN(num) && num >= 1 && num <= 99) {
      setPercent(num)
    }
  }

  const handleSave = async () => {
    const validNum = Math.min(95, Math.max(5, Math.round(Number(inputVal) || percent || 20)))
    setIsSaving(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downPaymentPercent: validNum }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update down payment')
      }

      setPercent(validNum)
      setInputVal(String(validNum))
      onUpdate?.(propertyId, validNum)
      setIsEditing(false)
      toast.success(`Down payment updated to ${validNum}%`)
    } catch (err: any) {
      console.error('[DownPaymentQuickEdit] Save error:', err)
      toast.error(err.message || 'Failed to save down payment percentage.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setInputVal(String(percent))
    setIsEditing(false)
  }

  if (!isEditing) {
    const isCustom = percent !== 20
    const loanPercent = 100 - percent

    return (
      <div className="w-full">
        <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-lg border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/25 transition-all hover:border-emerald-300 dark:hover:border-emerald-700/60 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-emerald-600 text-white shadow-2xs shadow-emerald-600/20">
              <Percent className="h-3 w-3 stroke-[2.5]" />
            </div>

            <div className="flex items-center gap-2 truncate">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 shrink-0">
                Down Payment:
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-black tracking-tight bg-emerald-600 text-white shadow-2xs">
                {percent}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:inline">
                ({loanPercent}% Home Loan)
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shrink-0 cursor-pointer shadow-2xs"
            title="Edit Down Payment Percentage"
          >
            <Edit2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    )
  }

  // Expanded Inline Editor
  return (
    <div className="w-full p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-white dark:bg-slate-900 shadow-md space-y-2 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
            Down Payment Requirement
          </span>
        </div>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Preset Pill Selectors */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          Presets:
        </span>
        {PRESET_PERCENTAGES.map((preset) => {
          const isSelected = percent === preset
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600'
              }`}
            >
              {preset}%
            </button>
          )
        })}
      </div>

      {/* Custom Input & Live Preview */}
      <div className="flex items-center gap-2 pt-0.5">
        <div className="relative flex-1">
          <input
            type="number"
            min={5}
            max={90}
            step={1}
            value={inputVal}
            onChange={handleInputChange}
            placeholder="20"
            className="w-full h-7 pl-2 pr-6 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
            %
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3 stroke-[3]" />
            )}
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Dynamic Explanation */}
      <div className="p-1.5 rounded-md bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 text-[9.5px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
        <span className="font-semibold">Buyer Impact:</span>
        <span>
          Pays <strong>{percent}%</strong> upfront · Remaining <strong>{100 - percent}%</strong> on bank EMI.
        </span>
      </div>
    </div>
  )
}
