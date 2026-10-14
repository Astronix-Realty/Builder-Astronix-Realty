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
            const towerGroups = config.floorGroups !== undefined ? config.floorGroups : (data.floorGroups || []);
            const globalGroups = data.floorGroups || [];

            // Update specs from global for groups that exist in this tower without resurrecting deleted groups
            const mergedGroups = towerGroups.map((tg: any) => {
                const matchingGlobal = globalGroups.find((gg: any) => gg.id === tg.id);
                if (matchingGlobal) {
                    return {
                        ...matchingGlobal,
                        ...tg, // Tower overrides take precedence
                    };
                }
                return tg;
            });

            const towerConfigsList = config.configurations !== undefined ? config.configurations : (data.configurations || []);
            const globalConfigs = data.configurations || [];

            // Update configs from global for unit configs that exist in this tower without resurrecting deleted ones
            const mergedConfigs = towerConfigsList.map((tc: any) => {
                const matchingGlobal = globalConfigs.find((gc: any) => gc.id === tc.id);
                if (matchingGlobal) {
                    return {
                        ...matchingGlobal,
                        ...tc, // Tower overrides take precedence
                    };
                }
                return tc;
            });

            return {
                ...data, // Include any missing global inherited fields like posessionDate, GST, etc.
                ...config, // Override with specific tower config settings
                towerId: config.towerId,
                baseRatePerSqft: config.ratePerSqft ?? config.baseRatePerSqft ?? data.baseRatePerSqft,
                facingPremiums: config.facingPremiums ?? data.facingPremiums,
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
            {/* ── DESKTOP METRIC STATUS STRIP ─────────────────────────── */}
            <div className="flex items-center justify-between px-3.5 py-2 mb-4 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs text-xs">
                <div className="flex items-center gap-2 min-w-0">
                    <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">Unit Engine Configuration</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">Pricing & Inventory</span>
                </div>
                <div className="flex items-center gap-4 shrink-0 font-mono">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{towers.length}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Towers</span>
                    </div>
                    <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{totalConfigured}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Configured</span>
                    </div>
                </div>
            </div>

            {/* Entity Tabs are now handled in the Main Sticky Header in page.tsx */}

            {/* ── FORM CONTENT ─────────────────────────────── */}
            <div className="pt-1">
                {activeTowerId === "global" ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-2.5 mb-3 px-1 py-1 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                            <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0">
                                <Layers className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white text-sm leading-none">Global Unit Blueprint Defaults</p>
                                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                                    Base rates, pricing formulas, and specifications inherited across all project towers unless overridden.
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
                                <div className="flex items-center gap-2.5 mb-3 px-1 py-1 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                    <div className="w-6 h-6 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                                        <Building2 className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm leading-none truncate">
                                            {tower.name}
                                        </p>
                                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                                            {getProjectLabel(tower.projectId || "")} · {tower.totalFloors} Flrs · {tower.unitsPerFloor} Units/Flr · Total {tower.totalUnits} Units
                                            {" · "}{configured ? "Tower-Specific Overrides Active" : "Inheriting Global Specifications"}
                                        </p>
                                    </div>
                                    {configured
                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
                                        : <AlertCircle className="w-4 h-4 text-amber-500 ml-auto shrink-0" />
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
