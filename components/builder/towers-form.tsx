"use client"

import { TowerFlowForm } from "./forms/tower-flow-form"
import { Button } from "@/components/ui/button"
import { Plus, Building, Building2, CheckCircle2, AlertCircle, Copy, Trash2 } from "lucide-react"
import { createInitialTower, type TowerData, type ProjectData } from "@/lib/builder-types"

interface TowersFormProps {
    projects: ProjectData[]
    towers: TowerData[]
    towerUnitConfigs: any[]
    unitTemplate: any
    onTowersChange: (towers: TowerData[]) => void
    onCloneTower: (towerId: string) => void
    activeProjectIdx: number
    setActiveProjectIdx: (idx: number) => void
    activeTowerIdx: number
    setActiveTowerIdx: (idx: number) => void
}

export function TowersForm({
    projects, towers, towerUnitConfigs, unitTemplate, onTowersChange, onCloneTower,
    activeProjectIdx, setActiveProjectIdx,
    activeTowerIdx, setActiveTowerIdx
}: TowersFormProps) {
    const activeProject = projects[activeProjectIdx]
    const projectTowers = activeProject
        ? towers.filter(t => t.projectId === activeProject.id)
        : []

    const activeTower = projectTowers[activeTowerIdx] || projectTowers[0]
    const activeTowerConfig = towerUnitConfigs?.find(c => c.towerId === activeTower?.id)

    const handleAddTower = () => {
        if (!activeProject) return
        const newTower = createInitialTower(projectTowers.length, activeProject.id)
        const next = [...towers, newTower]
        onTowersChange(next)
        setActiveTowerIdx(next.filter(t => t.projectId === activeProject.id).length - 1)
    }
    const handleClone = () => {
        if (activeTower) onCloneTower(activeTower.id)
    }

    const handleRemove = async (idx: number) => {
        const towerToDelete = projectTowers[idx];
        if (!confirm(`Are you sure you want to delete "${towerToDelete?.name || `Tower ${idx + 1}`}"? This will also remove all related units.`)) return;
        
        try {
            await fetch(`/api/towers/${towerToDelete.id}`, { method: 'DELETE' });
        } catch (error) {
            console.error("API delete failed (might be a draft):", error);
        }

        const next = towers.filter(t => t.id !== towerToDelete.id);
        onTowersChange(next);
        setActiveTowerIdx(Math.max(0, idx - 1));
    }

    const isComplete = (t: TowerData) =>
        !!(t.name && t.totalFloors && t.unitsPerFloor && (activeProject?.hasSingleRera || t.reraNumber))

    const totalTowers = towers.length
    const completedTowers = towers.filter(isComplete).length

    return (
        <div className="space-y-0">
            {/* ── DESKTOP METRIC STATUS STRIP ─────────────────────────── */}
            <div className="flex items-center justify-between px-3.5 py-2 mb-4 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs text-xs">
                <div className="flex items-center gap-2 min-w-0">
                    <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">Towers Overview</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">Structural Spec</span>
                </div>
                <div className="flex items-center gap-4 shrink-0 font-mono">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{totalTowers}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Total Towers</span>
                    </div>
                    <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{completedTowers}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Complete</span>
                    </div>
                </div>
            </div>

            {/* Entity Tabs are now handled in the Main Sticky Header in page.tsx */}

            {/* ── ACTIVE TOWER FORM ─────────────────────────── */}
            {activeProject && activeTower ? (
                <div className="pt-1">
                    {/* Tower header */}
                    <div className="flex items-center gap-2.5 mb-3 px-1 py-1 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <div className="w-6 h-6 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                            <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm leading-none truncate">
                                {activeTower.name || `Tower ${activeTowerIdx + 1}`}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                                {activeProject.name} → Tower {activeTowerIdx + 1}/{projectTowers.length}
                                {" · "}
                                {isComplete(activeTower) ? "Ready / Complete" : "Incomplete — Name, Floors, Units/Floor, RERA required"}
                            </p>
                        </div>
                        {isComplete(activeTower)
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
                            : <AlertCircle className="w-4 h-4 text-amber-500 ml-auto shrink-0" />
                        }
                    </div>

                    <TowerFlowForm
                        key={activeTower.id}
                        data={activeTower}
                        unitConfig={activeTowerConfig}
                        unitTemplate={unitTemplate}
                        onChange={(updaterOrData) => {
                            const next = [...towers]
                            const globalIdx = towers.findIndex(t => t.id === activeTower.id)
                            if (globalIdx >= 0) {
                                next[globalIdx] = typeof updaterOrData === "function"
                                    ? updaterOrData(next[globalIdx])
                                    : { ...next[globalIdx], ...updaterOrData } as TowerData
                                onTowersChange(next)
                            }
                        }}
                        projectName={activeProject.name}
                        parentProjectHasSingleRera={activeProject.hasSingleRera}
                    />

                    {/* Navigate prev / next tower */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setActiveTowerIdx(Math.max(0, activeTowerIdx - 1))}
                            disabled={activeTowerIdx === 0}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            ← Prev
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleClone}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-blue-200 dark:border-blue-800/80 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-mono font-bold hover:bg-blue-100 transition-all"
                                title="Duplicate this tower and its unit configs"
                            >
                                <Copy className="w-3.5 h-3.5" /> Clone
                            </button>

                            <button
                                type="button"
                                onClick={() => handleRemove(activeTowerIdx)}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold hover:bg-rose-100 transition-all"
                                title="Delete this tower"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>

                            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase mx-1.5 whitespace-nowrap">
                                {activeTowerIdx + 1} / {projectTowers.length}
                            </span>
                        </div>

                        {activeTowerIdx < projectTowers.length - 1 ? (
                            <button
                                type="button"
                                onClick={() => setActiveTowerIdx(activeTowerIdx + 1)}
                                className="flex items-center gap-1.5 h-8 px-3.5 rounded-md border border-blue-600 bg-blue-600/10 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 transition-all"
                            >
                                Next Tower →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleAddTower}
                                className="flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-emerald-600 text-white text-xs font-mono font-bold hover:bg-emerald-700 transition-all shadow-2xs"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Tower
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 mt-4">
                    <Building2 className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium mb-4">
                        {projects.length === 0
                            ? "Pehle Step 2 mein koi project add karo"
                            : `${activeProject?.name} mein abhi koi tower nahi hai`}
                    </p>
                    {activeProject && (
                        <Button onClick={handleAddTower} className="bg-[#1A3C8C] text-white hover:bg-[#152f6e]">
                            <Plus className="w-4 h-4 mr-2" /> Add First Tower
                        </Button>
                    )}
                </div>
            )}

        </div>
    )
}
