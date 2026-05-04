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
            {/* ── TOP STATS BANNER ─────────────────────────── */}
            <div className="flex items-center gap-4 px-5 py-3 mb-6 bg-gradient-to-r from-[#1A3C8C]/5 via-blue-50 to-transparent dark:from-slate-800 dark:via-slate-800/50 dark:to-transparent rounded-2xl border border-blue-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#1A3C8C] dark:text-blue-400" />
                    <span className="font-bold text-[#1A3C8C] dark:text-blue-400 text-sm">{township.name || "Your Township"}</span>
                </div>
                <div className="ml-auto flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#1A3C8C] dark:text-blue-400">{safeProjects.length}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tight">Projects</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-emerald-600">
                            {safeProjects.filter(isComplete).length}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tight">Complete</span>
                    </div>
                </div>
            </div>

            {/* Entity Tabs are now handled in the Main Sticky Header in page.tsx */}

            {/* ── ACTIVE PROJECT FORM ───────────────────────── */}
            {activeProject ? (
                <div className="pt-4">
                    {/* Project header */}
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <div className="w-8 h-8 rounded-xl bg-[#1A3C8C] flex items-center justify-center text-white font-black text-sm shrink-0">
                            {activeIdx + 1}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white text-base leading-none">
                                {activeProject.name || `Project ${activeIdx + 1}`}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                {activeIdx + 1} of {projects.length} projects · {isComplete(activeProject) ? "✅ Complete" : "⚠️ Incomplete — Name, RERA, Possession Date required"}
                            </p>
                        </div>
                        {isComplete(activeProject)
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                            : <AlertCircle className="w-5 h-5 text-orange-400 ml-auto" />
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
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
                            disabled={activeIdx === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            ← Previous
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleClone}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                                title="Duplicate this project (including all its towers and units)"
                            >
                                <Copy className="w-4 h-4" /> Clone Project
                            </button>

                            <button
                                type="button"
                                onClick={() => handleRemove(activeIdx)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                                title="Delete this project"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>

                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mx-2 whitespace-nowrap">
                                Project {activeIdx + 1} / {projects.length}
                            </span>
                        </div>

                        {activeIdx < projects.length - 1 ? (
                            <button
                                type="button"
                                onClick={() => setActiveIdx(Math.min(projects.length - 1, activeIdx + 1))}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1A3C8C] text-sm font-medium text-[#1A3C8C] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-bold"
                            >
                                Next Project →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleAdd}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-all font-bold"
                            >
                                <Plus className="w-4 h-4" /> Add Project
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
