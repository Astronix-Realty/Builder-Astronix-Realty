"use client"

import { useState } from "react"
import { ProjectFlowForm } from "./forms/project-flow-form"
import { Button } from "@/components/ui/button"
import { Plus, X, Building2, CheckCircle2, AlertCircle, Copy, Trash2 } from "lucide-react"
import { createInitialProject, type ProjectData, type TownshipData } from "@/lib/builder-types"

interface ProjectsFormProps {
    township: TownshipData
    projects: ProjectData[]
    onChange: (projects: ProjectData[]) => void
    onCloneProject: (projectId: string) => void
    activeIdx: number
    setActiveIdx: (idx: number) => void
    isWizardMode?: boolean
}

export function ProjectsForm({ township, projects, onChange, onCloneProject, activeIdx, setActiveIdx }: ProjectsFormProps) {
    const safeProjects = (projects || []).filter(Boolean)
    const activeProject = safeProjects[activeIdx] ?? null

    const handleAdd = () => {
        const newProject = createInitialProject(township.name, safeProjects.length)
        const next = [...safeProjects, newProject]
        onChange(next)
        setActiveIdx(next.length - 1)
    }

    const handleClone = () => {
        if (activeProject) onCloneProject(activeProject.id)
    }

    const handleRemove = async (idx: number) => {
        const projectToDelete = safeProjects[idx];
        if (!confirm(`Are you sure you want to delete "${projectToDelete?.name || `Project ${idx + 1}`}"? This will also remove all related towers and units.`)) return;
        
        try {
            await fetch(`/api/projects/${projectToDelete.id}`, { method: 'DELETE' });
        } catch (error) {
            console.error("API delete failed (might be a draft):", error);
        }

        const next = safeProjects.filter((_, i) => i !== idx)
        onChange(next)
        setActiveIdx(Math.max(0, idx - 1))
    }

    const isComplete = (p: ProjectData) => !!(p.name && p.reraNumber && p.possessionDate)

    return (
        <div className="space-y-0">
            {/* ── DESKTOP METRIC STATUS STRIP ─────────────────────────── */}
            <div className="flex items-center justify-between px-3.5 py-2 mb-4 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs text-xs">
                <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{township.name || "Your Township"}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">Township Spec</span>
                </div>
                <div className="flex items-center gap-4 shrink-0 font-mono">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{safeProjects.length}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Projects</span>
                    </div>
                    <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {safeProjects.filter(isComplete).length}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Complete</span>
                    </div>
                </div>
            </div>

            {/* Entity Tabs are now handled in the Main Sticky Header in page.tsx */}

            {/* ── ACTIVE PROJECT FORM ───────────────────────── */}
            {activeProject ? (
                <div className="pt-1">
                    {/* Project header */}
                    <div className="flex items-center gap-2.5 mb-3 px-1 py-1 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <div className="w-6 h-6 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                            {activeIdx + 1}
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm leading-none truncate">
                                {activeProject.name || `Project ${activeIdx + 1}`}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                                Index {activeIdx + 1}/{projects.length} · {isComplete(activeProject) ? "Ready / Complete" : "Incomplete — Name, RERA, Possession Date required"}
                            </p>
                        </div>
                        {isComplete(activeProject)
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
                            : <AlertCircle className="w-4 h-4 text-amber-500 ml-auto shrink-0" />
                        }
                    </div>

                    <ProjectFlowForm
                        data={activeProject}
                        onChange={(updaterOrData) => {
                            const next = [...safeProjects]
                            next[activeIdx] = typeof updaterOrData === "function"
                                ? updaterOrData(safeProjects[activeIdx])
                                : updaterOrData
                            onChange(next.filter(Boolean))
                        }}
                        townshipName={township.name}
                    />

                    {/* Navigate prev / next project */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
                            disabled={activeIdx === 0}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            ← Prev
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleClone}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-blue-200 dark:border-blue-800/80 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-mono font-bold hover:bg-blue-100 transition-all"
                                title="Duplicate this project (including all its towers and units)"
                            >
                                <Copy className="w-3.5 h-3.5" /> Clone
                            </button>

                            <button
                                type="button"
                                onClick={() => handleRemove(activeIdx)}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold hover:bg-rose-100 transition-all"
                                title="Delete this project"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>

                            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase mx-1.5 whitespace-nowrap">
                                {activeIdx + 1} / {projects.length}
                            </span>
                        </div>

                        {activeIdx < projects.length - 1 ? (
                            <button
                                type="button"
                                onClick={() => setActiveIdx(Math.min(projects.length - 1, activeIdx + 1))}
                                className="flex items-center gap-1.5 h-8 px-3.5 rounded-md border border-blue-600 bg-blue-600/10 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 transition-all"
                            >
                                Next Project →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleAdd}
                                className="flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-emerald-600 text-white text-xs font-mono font-bold hover:bg-emerald-700 transition-all shadow-2xs"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Project
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 mt-4">
                    <Building2 className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium mb-4">No projects yet</p>
                    <Button onClick={handleAdd} className="bg-[#1A3C8C] text-white hover:bg-[#152f6e]">
                        <Plus className="w-4 h-4 mr-2" /> Add First Project
                    </Button>
                </div>
            )}
        </div>
    )
}
