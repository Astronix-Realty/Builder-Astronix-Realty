"use client"

import { TowerFlowForm } from "./forms/tower-flow-form"
import { Button } from "@/components/ui/button"
import { Plus, Building, Building2, CheckCircle2, AlertCircle, Copy, Trash2 } from "lucide-react"
import { createInitialTower, type TowerData, type ProjectData } from "@/lib/builder-types"

interface TowersFormProps {
    projects: ProjectData[]
    towers: TowerData[]
    onTowersChange: (towers: TowerData[]) => void
    onCloneTower: (towerId: string) => void
    activeProjectIdx: number
    setActiveProjectIdx: (idx: number) => void
    activeTowerIdx: number
    setActiveTowerIdx: (idx: number) => void
}

export function TowersForm({
    projects, towers, onTowersChange, onCloneTower,
    activeProjectIdx, setActiveProjectIdx,
    activeTowerIdx, setActiveTowerIdx
}: TowersFormProps) {
    const activeProject = projects[activeProjectIdx]
    const projectTowers = activeProject
        ? towers.filter(t => t.projectId === activeProject.id)
        : []

    const activeTower = projectTowers[activeTowerIdx] || projectTowers[0]

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
        !!(t.name && t.totalFloors && t.unitsPerFloor && t.reraNumber)

    const totalTowers = towers.length
    const completedTowers = towers.filter(isComplete).length

    return (
        <div className="space-y-0">
            {/* ── TOP STATS BANNER ─────────────────────────── */}
            <div className="flex items-center gap-4 px-5 py-3 mb-6 bg-gradient-to-r from-[#1A3C8C]/5 via-blue-50 to-transparent rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-[#1A3C8C]" />
                    <span className="font-bold text-[#1A3C8C] text-sm">Towers Overview</span>
                </div>
                <div className="ml-auto flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#1A3C8C]">{totalTowers}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Total Towers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-emerald-600">{completedTowers}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Complete</span>
                    </div>
                </div>
            </div>

            {/* Entity Tabs are now handled in the Main Sticky Header in page.tsx */}

            {/* ── ACTIVE TOWER FORM ─────────────────────────── */}
            {activeProject && activeTower ? (
                <div className="pt-4">
                    {/* Tower header */}
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <div className="w-8 h-8 rounded-xl bg-[#1A3C8C] flex items-center justify-center text-white font-black text-sm shrink-0">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-base leading-none">
                                {activeTower.name || `Tower ${activeTowerIdx + 1}`}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {activeProject.name} → Tower {activeTowerIdx + 1} of {projectTowers.length}
                                {" · "}
                                {isComplete(activeTower) ? "✅ Complete" : "⚠️ Name, Floors, Units/Floor, RERA required"}
                            </p>
                        </div>
                        {isComplete(activeTower)
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                            : <AlertCircle className="w-5 h-5 text-orange-400 ml-auto" />
                        }
                    </div>

                    <TowerFlowForm
                        key={activeTower.id}
                        data={activeTower}
                        onChange={(updaterOrData) => {
                            const next = [...towers]
                            const globalIdx = towers.findIndex(t => t.id === activeTower.id)
                            if (globalIdx >= 0) {
                                next[globalIdx] = typeof updaterOrData === "function"
                                    ? updaterOrData(next[globalIdx])
                                    : updaterOrData
                                onTowersChange(next)
                            }
                        }}
                        projectName={activeProject.name}
                    />

                    {/* Navigate prev / next tower */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setActiveTowerIdx(Math.max(0, activeTowerIdx - 1))}
                            disabled={activeTowerIdx === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            ← Previous
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleClone}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50/50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-all"
                                title="Duplicate this tower and its unit configs"
                            >
                                <Copy className="w-4 h-4" /> Clone Tower
                            </button>

                            <button
                                type="button"
                                onClick={() => handleRemove(activeTowerIdx)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-all"
                                title="Delete this tower"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>

                            <span className="text-[10px] text-gray-400 font-bold uppercase mx-2 whitespace-nowrap">
                                Tower {activeTowerIdx + 1} / {projectTowers.length}
                            </span>
                        </div>

                        {activeTowerIdx < projectTowers.length - 1 ? (
                            <button
                                type="button"
                                onClick={() => setActiveTowerIdx(activeTowerIdx + 1)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1A3C8C] text-sm font-medium text-[#1A3C8C] hover:bg-blue-50 transition-all font-bold"
                            >
                                Next Tower →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleAddTower}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-all font-bold"
                            >
                                <Plus className="w-4 h-4" /> Add Tower
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mt-4">
                    <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium mb-4">
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
