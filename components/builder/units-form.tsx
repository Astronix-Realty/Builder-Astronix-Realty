"use client"

import { useState } from "react"
import { UnitFlowForm } from "./forms/unit-flow-form"
import { Layers, Building, Building2, CheckCircle2, AlertCircle } from "lucide-react"
import { type GeneratedTower, type UnitTemplate, type TowerUnitConfig } from "@/lib/builder-types"

interface UnitsFormProps {
    towers: GeneratedTower[]
    data: UnitTemplate
    onChange: (data: UnitTemplate) => void
    towerConfigs: TowerUnitConfig[]
    onTowerConfigsChange: (configs: TowerUnitConfig[]) => void
    activeTowerId: string
    setActiveTowerId: (id: string) => void
    activeProjectId: string
    setActiveProjectId: (id: string) => void
}

export function UnitsForm({
    towers, data, onChange, towerConfigs, onTowerConfigsChange,
    activeTowerId, setActiveTowerId, activeProjectId, setActiveProjectId
}: UnitsFormProps) {
    // ── Derive unique projects from towers ──────────────────────────────────
    const projectIds = Array.from(new Set(towers.map(t => t.projectId).filter(Boolean)))

    // Towers filtered by active project
    const visibleTowers = activeProjectId === "all"
        ? towers
        : towers.filter(t => t.projectId === activeProjectId)

    const getTowerConfig = (towerId: string): UnitTemplate => {
        const config = (towerConfigs || []).find(c => c.towerId === towerId)
        const tower = towers.find(t => t.id === towerId)
        const reraNumber = tower?.reraNumber || data.reraNumber || ""

        if (config) {
            // MERGE floorGroups (Global defines skeleton structure, Tower can override floor ranges)
            let mergedGroups = [...(config.floorGroups || [])];
            const towerGroupIds = new Set(mergedGroups.map(g => g.id));
            const globalGroups = data.floorGroups || [];
            
            globalGroups.forEach(gg => {
                if (!towerGroupIds.has(gg.id)) {
                    mergedGroups.push({ ...gg });
                } else {
                    const existingIdx = mergedGroups.findIndex(g => g.id === gg.id);
                    if (existingIdx >= 0) {
                        const existing = mergedGroups[existingIdx];
                        mergedGroups[existingIdx] = {
                            ...gg,
                            ...existing,
                        };
                    }
                }
            });
            // Keep ONLY the groups that are defined in Global (Global is the master skeleton)
            const globalGroupIds = new Set(globalGroups.map(g => g.id));
            mergedGroups = mergedGroups.filter(g => globalGroupIds.has(g.id));

            // MERGE configurations (Units)
            let mergedConfigs = [...(config.configurations || [])];
            const towerConfigIds = new Set(mergedConfigs.map(c => c.id));
            const globalConfigs = data.configurations || [];
            
            globalConfigs.forEach(gc => {
                if (!towerConfigIds.has(gc.id)) {
                    mergedConfigs.push({ ...gc });
                } else {
                    const existingIdx = mergedConfigs.findIndex(c => c.id === gc.id);
                    if (existingIdx >= 0) {
                        const existing = mergedConfigs[existingIdx];
                        mergedConfigs[existingIdx] = {
                            ...gc,
                            ...existing,
                        };
                    }
                }
            });
            mergedConfigs = mergedConfigs.filter(c => new Set(globalConfigs.map(g => g.id)).has(c.id));

            return {
                ...data, // Include any missing global inherited fields like posessionDate, GST, etc.
                ...config, // Override with specific tower config settings
                towerId: config.towerId,
                baseRatePerSqft: config.ratePerSqft || config.baseRatePerSqft || data.baseRatePerSqft,
                facingPremiums: config.facingPremiums || data.facingPremiums,
                configurations: mergedConfigs,
                floorGroups: mergedGroups,
                reraNumber
            }
        }
        return { 
            ...data, 
            towerId, 
            reraNumber, 
            floorGroups: data.floorGroups || [],
            configurations: data.configurations || []
        }
    }

    const isTowerConfigured = (towerId: string) => {
        const config = towerConfigs.find(c => c.towerId === towerId)
        return !!(config && (config.configurations || []).length > 0)
    }

    const totalConfigured = towers.filter(t => isTowerConfigured(t.id)).length

    // Project name lookup (e.g. "Project 1") — generatedTowers only have projectId
    const getProjectLabel = (pid: string) => {
        const idx = projectIds.indexOf(pid)
        return idx >= 0 ? `Project ${idx + 1}` : "Project"
    }

    return (
        <div className="space-y-0">
            {/* ── TOP STATS BANNER ─────────────────────────── */}
            <div className="flex items-center gap-4 px-5 py-3 mb-6 bg-gradient-to-r from-amber-50 via-orange-50 to-transparent dark:from-amber-900/30 dark:via-orange-900/20 dark:to-transparent rounded-2xl border border-amber-100 dark:border-amber-900/50">
                <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                    <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">Units Configuration</span>
                </div>
                <div className="ml-auto flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-amber-700 dark:text-amber-400">{towers.length}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tight">Towers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-500 font-black">{totalConfigured}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tight">Configured</span>
                    </div>
                </div>
            </div>

            {/* Entity Tabs are now handled in the Main Sticky Header in page.tsx */}

            {/* ── FORM CONTENT ─────────────────────────────── */}
            <div className="pt-16">
                {activeTowerId === "global" ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4 px-1">
                            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0">
                                <Layers className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-base leading-none">Global Configuration</p>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                    Yeh settings sabhi towers pe apply hongi jab tak override na karo
                                </p>
                            </div>
                        </div>
                        <UnitFlowForm data={data} onChange={(updated) => {
                            onChange(updated)
                            if (towerConfigs && towerConfigs.length > 0) {
                                const newTowerConfigs = towerConfigs.map(tc => {
                                    let tcConfigs = [...(tc.configurations || [])]
                                    let tcGroups = [...(tc.floorGroups || [])]
                                    
                                    const updatedConfigs = updated.configurations || []
                                    const updatedGroups = updated.floorGroups || []
                                    
                                    // 1. Sync configurations (units)
                                    updatedConfigs.forEach(globalUnit => {
                                        const existingIdx = tcConfigs.findIndex(u => u.id === globalUnit.id)
                                        if (existingIdx >= 0) {
                                            const existing = tcConfigs[existingIdx]
                                            tcConfigs[existingIdx] = {
                                                ...globalUnit,
                                                isRateOverridden: existing.isRateOverridden,
                                                ratePerSqft: existing.isRateOverridden ? existing.ratePerSqft : globalUnit.ratePerSqft,
                                                basePrice: existing.isRateOverridden ? existing.basePrice : globalUnit.basePrice,
                                                allInclusivePrice: existing.isRateOverridden ? existing.allInclusivePrice : globalUnit.allInclusivePrice,
                                                totalTaxes: existing.isRateOverridden ? existing.totalTaxes : globalUnit.totalTaxes,
                                            }
                                        } else {
                                            tcConfigs.push({ ...globalUnit })
                                        }
                                    })
                                    const globalUnitIds = new Set(updatedConfigs.map(u => u.id))
                                    tcConfigs = tcConfigs.filter(u => globalUnitIds.has(u.id))

                                    // 2. Sync floorGroups (Tower Skeleton & Live Map Layouts)
                                    updatedGroups.forEach(globalGroup => {
                                        const existingIdx = tcGroups.findIndex(g => g.id === globalGroup.id)
                                        if (existingIdx >= 0) {
                                            const existing = tcGroups[existingIdx]
                                            const hasCustomFloors = existing.floors && existing.floors.length > 0;
                                            tcGroups[existingIdx] = {
                                                ...globalGroup,
                                                // Preserve tower-specific assigned floors so we don't accidentally shrink/expand a tower's height
                                                // when global is updated, BUT inherit global if the tower hasn't customized it yet.
                                                floors: hasCustomFloors ? existing.floors : globalGroup.floors,
                                                floorRange: hasCustomFloors ? existing.floorRange : globalGroup.floorRange,
                                            }
                                        } else {
                                            tcGroups.push({ ...globalGroup })
                                        }
                                    })
                                    const globalGroupIds = new Set(updatedGroups.map(g => g.id))
                                    tcGroups = tcGroups.filter(g => globalGroupIds.has(g.id))

                                    return { ...tc, configurations: tcConfigs, floorGroups: tcGroups }
                                })
                                onTowerConfigsChange(newTowerConfigs)
                            }
                        }} />
                    </>
                ) : (
                    (() => {
                        const tower = towers.find(t => t.id === activeTowerId)
                        const configured = isTowerConfigured(activeTowerId)
                        if (!tower) return null
                        return (
                            <>
                                {/* Tower header */}
                                <div className="flex items-center gap-3 mb-4 px-1">
                                    <div className="w-8 h-8 rounded-xl bg-[#1A3C8C] flex items-center justify-center text-white shrink-0">
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-base leading-none">
                                            {tower.name}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                            {getProjectLabel(tower.projectId || "")} ·{" "}
                                            {tower.totalFloors} Floors · {tower.unitsPerFloor} Units/Floor ·{" "}
                                            Total {tower.totalUnits} units
                                            {" · "}{configured ? "✅ Configured" : "⚠️ Using Global Configuration"}
                                        </p>
                                    </div>
                                    {configured
                                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                                        : <AlertCircle className="w-5 h-5 text-orange-400 ml-auto" />
                                    }
                                </div>

                                <UnitFlowForm
                                    data={getTowerConfig(activeTowerId)}
                                    towerName={tower.name}
                                    totalFloors={Number(tower.totalFloors || 0)}
                                    unitsPerFloor={Number(tower.unitsPerFloor || 0)}
                                    onChange={(updated) => {
                                        const next = [...(towerConfigs || [])]
                                        const idx = next.findIndex(c => c.towerId === activeTowerId)
                                        const newTowerConfig: TowerUnitConfig = {
                                            ...updated,
                                            towerId: activeTowerId,
                                            configurations: updated.configurations,
                                            floorGroups: updated.floorGroups || [],
                                            basePrice: (updated.configurations[0]?.basePrice || 0).toString(),
                                            ratePerSqft: updated.baseRatePerSqft,
                                            facingPremiums: updated.facingPremiums
                                        }
                                        if (idx >= 0) next[idx] = newTowerConfig
                                        else next.push(newTowerConfig)
                                        onTowerConfigsChange(next)
                                    }}
                                />


                                {/* Navigate prev / next tower */}
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const idx = visibleTowers.findIndex(t => t.id === activeTowerId)
                                            if (idx > 0) setActiveTowerId(visibleTowers[idx - 1].id)
                                            else setActiveTowerId("global")
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                                    >
                                        ← Previous
                                    </button>
                                    <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                                        Tower {visibleTowers.findIndex(t => t.id === activeTowerId) + 1} / {visibleTowers.length}
                                    </span>
                                    {visibleTowers.findIndex(t => t.id === activeTowerId) < visibleTowers.length - 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const idx = visibleTowers.findIndex(t => t.id === activeTowerId)
                                                if (idx < visibleTowers.length - 1) setActiveTowerId(visibleTowers[idx + 1].id)
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1A3C8C] dark:border-blue-500 text-sm font-medium text-[#1A3C8C] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                                        >
                                            Next Tower →
                                        </button>
                                    ) : (
                                        <span className="text-xs text-emerald-600 dark:text-emerald-500 font-medium px-4 py-2">
                                            ✅ Saare towers configured!
                                        </span>
                                    )}
                                </div>
                            </>
                        )
                    })()
                )}
            </div>

            {/* Info box */}
            <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/50 rounded-3xl flex items-start gap-4 mt-32 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 shadow-sm ring-4 ring-blue-50 dark:ring-blue-900/20">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-[13px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                    <p className="font-black text-blue-900 dark:text-blue-200 mb-1.5 uppercase tracking-wider text-[11px]">Pricing kaise kaam karta hai:</p>
                    <p className="mb-1">1. <span className="font-black text-[#1A3C8C] dark:text-blue-400">Global Configuration</span> → Sabhi towers ke liye default pricing/configs inherit honge.</p>
                    <p className="mb-1">2. <span className="font-black text-[#1A3C8C] dark:text-blue-400">Tower Override</span> → Specific tower ki alag pricing ya unit types override kar sakte hain.</p>
                    <p>3. <span className="font-black text-[#1A3C8C] dark:text-blue-400">Floor rise (0.5% after 5th floor) + Facing premiums</span> → Final summary mein auto-calculate honge.</p>
                </div>
            </div>
        </div>
    )
}
