"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2, Building, Home, MapPin,
  IndianRupee, CheckCircle2, TreePine,
  Wifi, TrendingUp, Zap, ShieldCheck,
  Layers, Globe, Ruler, Star, Plus,
  ChevronRight, Calendar, Info, FileText
} from "lucide-react"
import type { LegacyWizardState } from "@/lib/builder-types"

interface WizardSummaryProps {
  state: LegacyWizardState
  flowType?: "township" | "project" | "tower"
}

export function WizardSummary({ state, flowType = "township" }: WizardSummaryProps) {
  const { township, generatedUnits = [], unitTemplate } = state
  // Prefer computed generatedTowers (has correct totalFloors & totalUnits) over raw towers
  const towers: any[] = (state as any).generatedTowers?.length > 0
    ? (state as any).generatedTowers
    : (state.towers || [])
  // Prefer generatedProjects over raw projects
  const projects: any[] = (state as any).generatedProjects?.length > 0
    ? (state as any).generatedProjects
    : (state.projects || [])

  // Calculate stats
  const totalValue = generatedUnits.reduce((sum: number, unit: any) => sum + (unit.price || 0), 0)
  const avgPrice = generatedUnits.length > 0 ? totalValue / generatedUnits.length : 0

  const unitsByConfig = generatedUnits.reduce(
    (acc, unit: any) => {
      acc[unit.configuration] = (acc[unit.configuration] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const getFlowSummary = () => {
    switch (flowType) {
      case "township":
        return {
          title: "Township Configured!",
          description: `Everything is set for ${township.name || "your township"}. Review the master details below.`,
          badge: "Mega Township"
        }
      case "project":
        return {
          title: "Project Configured!",
          description: `Project details for ${projects[0]?.name || "your project"} are locked in.`,
          badge: "Standalone Project"
        }
      case "tower":
        return {
          title: "Tower Configured!",
          description: `Tower structure and units for ${towers[0]?.name || "your tower"} are ready.`,
          badge: "Standalone Tower"
        }
      default:
        return {
          title: "Configuration Ready!",
          description: "Review your property details before final creation.",
          badge: "Property Entry"
        }
    }
  }

  const flowSummary = getFlowSummary()

  // Helper for info rows
  const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string | number; icon?: any }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 group/row">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover/row:text-blue-500 transition-colors" />}
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-900 dark:text-white">{value || "-"}</span>
    </div>
  )

    const expectedTotalUnits = towers.reduce((sum, t) => {
      const floors = parseInt(String(t.totalFloorsNum || 0)) || parseInt(String(t.totalFloors || "0").replace(/\\D/g, "")) || 0
      const upf = parseInt(String(t.unitsPerFloor || "0")) || 0
      return sum + (floors * upf)
    }, 0)

    const displayTotalUnits = expectedTotalUnits > generatedUnits.length ? expectedTotalUnits : generatedUnits.length

    return (
      <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* ── 1. HERO CELEBRATION BANNER ──────────────── */}
        <div className="relative overflow-hidden rounded-[24px] border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-900/20 dark:via-slate-900 dark:to-teal-900/20 p-6 md:p-8 shadow-md">
          <div className="absolute top-1/2 -translate-y-1/2 right-0 pr-8 opacity-[0.08] pointer-events-none">
            <CheckCircle2 className="w-40 h-40 text-emerald-500 animate-pulse" />
          </div>

          <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em]">
              {flowSummary.badge}
            </Badge>

            <div className="space-y-1">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {flowSummary.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-xl font-medium leading-relaxed">
                {flowSummary.description}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-[3px] border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 opacity-80" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100/50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
                Verified & Validated
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. QUICK STATS LINE ───────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Building2, label: "Total Assets", value: projects.length + towers.length, color: "blue", suffix: "Entities" },
            { icon: Layers, label: "Total Towers", value: towers.length, color: "indigo", suffix: "Buildings" },
            { icon: Home, label: "Total Units", value: displayTotalUnits.toLocaleString(), color: "emerald", suffix: "Units" },
            { icon: IndianRupee, label: "Inventory Value", value: `₹${(totalValue / 10000000).toFixed(1)}`, color: "amber", suffix: "Cr Value" },
          ].map((stat, i) => (
          <div key={i} className="group p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3
              ${stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                stat.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' :
                  stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                    'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{stat.suffix}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. DETAILED INFRASTRUCTURE REVIEW ─────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">

        {/* Left Column: Property Identity */}
        <div className="xl:col-span-2 space-y-12">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#1A3C8C] dark:bg-blue-600 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Master Identity</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Global & Location Configuration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              <div className="space-y-1">
                <InfoRow label="Property Name" value={township.name} icon={Building2} />
                <InfoRow label="Builder" value={township.builderName} icon={CheckCircle2} />
                <InfoRow label="Total Land Area" value={`${township.totalArea} ${township.areaUnit}`} icon={Ruler} />
                <InfoRow label="Green Cover" value={`${township.greenCoverPercentage}%`} icon={TreePine} />
              </div>
              <div className="space-y-1">
                <InfoRow label="Location" value={township.nearbyLandmark} icon={MapPin} />
                <InfoRow label="Sub City / Area" value={township.subCity} icon={MapPin} />
                <InfoRow label="Pincode" value={township.pincode} icon={MapPin} />
                <InfoRow label="Legal Status" value={township.ccStatus || "CC Received"} icon={ShieldCheck} />
              </div>
            </div>

            {/* Connectivity Summary */}
            <div className="mt-10 p-5 rounded-2xl bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/50">
              <p className="text-[10px] font-black text-[#1A3C8C] dark:text-blue-400 uppercase tracking-[0.2em] mb-4">Core Connectivity Points</p>
              <div className="flex flex-wrap gap-3">
                {township.connectivity.slice(0, 4).map((c: any) => (
                  <div key={c.id} className="bg-white dark:bg-slate-900 border border-blue-100 px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                    <Wifi className="w-3.5 h-3.5 text-blue-500" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none mb-0.5">{c.title}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">{c.distanceKm} • {c.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project & Tower Architecture */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Infrastructure Stack</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Projects, Towers & Phasing</p>
              </div>
            </div>

            <div className="space-y-4">
              {projects.length > 0 ? projects.map((proj: any, idx: number) => (
                <div key={proj.id} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 hover:bg-white dark:bg-slate-900 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-indigo-600 shadow-sm font-black text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{proj.name || "Untitled Project"}</h4>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{proj.tagType}</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-[10px] font-bold uppercase">
                      {towers.filter(t => t.projectId === proj.id).length} Towers
                    </Badge>
                  </div>

                  <div className="ml-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {towers.filter(t => t.projectId === proj.id).map(tower => {
                      const towerUnits = generatedUnits.filter((u: any) => u.towerId === tower.id);
                      const calculatedUnits = towerUnits.length;
                      const displayUnits = calculatedUnits > 0 ? calculatedUnits : tower.totalUnits;
                      let displayFloors = tower.totalFloors;
                      if (calculatedUnits > 0) {
                        const maxFloor = Math.max(...towerUnits.map((u: any) => u.floor));
                        if (maxFloor > 0) {
                          displayFloors = String(tower.totalFloors).replace(/\d+$/, maxFloor.toString());
                          if (!/\d+$/.test(String(tower.totalFloors))) displayFloors = `G+${maxFloor}`;
                        }
                      }
                      const firstUnit = towerUnits[0] || {};
                      // Match towerConfig by tower.id (frontend ID) OR tower._dbId (DB ObjectId)
                      const towerConfig = (state.towerUnitConfigs || []).find((c: any) => c.towerId === tower.id || (tower._dbId && c.towerId === tower._dbId));
                      const baseRate = parseFloat(towerConfig?.ratePerSqft) || parseFloat(towerConfig?.baseRatePerSqft) || parseFloat(tower.baseRatePerSqft) || parseFloat(firstUnit.ratePerSqft) || parseFloat(state.unitTemplate?.baseRatePerSqft) || parseFloat(state.unitTemplate?.ratePerSqft) || 0;
                      return (
                      <div key={tower.id} className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate mb-1.5">{tower.name}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                          <span className="flex items-center gap-1"><Building className="w-3 h-3 text-indigo-500" /> {displayFloors}</span>
                          <span className="text-slate-200 dark:text-slate-700">|</span>
                          <span className="flex items-center gap-1"><Home className="w-3 h-3 text-indigo-500" /> {displayUnits} units</span>
                        </div>
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 uppercase font-black tracking-widest">Base Rate</span>
                            <span className="font-bold text-slate-900 dark:text-white">{baseRate > 0 ? `₹${Number(baseRate).toLocaleString()}/sqft` : "—"}</span>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )) : (
                /* Standalone tower flow — no projects, render towers directly */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {towers.map(tower => {
                    const towerUnits = generatedUnits.filter((u: any) => u.towerId === tower.id);
                    const calculatedUnits = towerUnits.length;
                    const displayUnits = calculatedUnits > 0 ? calculatedUnits : tower.totalUnits;
                    let displayFloors = tower.totalFloors;
                    if (calculatedUnits > 0) {
                      const maxFloor = Math.max(...towerUnits.map((u: any) => u.floor));
                      if (maxFloor > 0) {
                        displayFloors = String(tower.totalFloors).replace(/\d+$/, maxFloor.toString());
                        if (!/\d+$/.test(String(tower.totalFloors))) displayFloors = `G+${maxFloor}`;
                      }
                    }
                    const firstUnit = towerUnits[0] || {};
                    // Match towerConfig by tower.id (frontend ID) OR tower._dbId (DB ObjectId)
                    const towerConfig = (state.towerUnitConfigs || []).find((c: any) => c.towerId === tower.id || (tower._dbId && c.towerId === tower._dbId));
                    const baseRate = parseFloat(towerConfig?.ratePerSqft) || parseFloat(towerConfig?.baseRatePerSqft) || parseFloat(tower.baseRatePerSqft) || parseFloat(firstUnit.ratePerSqft) || parseFloat(state.unitTemplate?.baseRatePerSqft) || parseFloat(state.unitTemplate?.ratePerSqft) || 0;
                    return (
                    <div key={tower.id} className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate mb-1.5">{tower.name}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                        <span className="flex items-center gap-1"><Building className="w-3 h-3 text-indigo-500" /> {displayFloors}</span>
                        <span className="text-slate-200 dark:text-slate-700">|</span>
                        <span className="flex items-center gap-1"><Home className="w-3 h-3 text-indigo-500" /> {displayUnits} units</span>
                      </div>
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 uppercase font-black tracking-widest">Base Rate</span>
                          <span className="font-bold text-slate-900 dark:text-white">{baseRate > 0 ? `₹${Number(baseRate).toLocaleString()}/sqft` : "—"}</span>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financials & Units */}
        <div className="space-y-12">
          {/* Financial Breakdown */}
          <div className="bg-[#1A3C8C] dark:bg-blue-600 rounded-[32px] p-8 text-white shadow-xl shadow-blue-500/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900/10 backdrop-blur-md flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black">Financial Blueprint</h3>
                <p className="text-xs text-blue-300 font-bold uppercase tracking-widest">Pricing & Tax Logic</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/5 border border-white dark:border-slate-900/10">
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Base Calculation</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-black">₹{Number(unitTemplate?.ratePerSqft || 0).toLocaleString()}</p>
                  <p className="text-xs font-bold opacity-60">Avg per sq.ft</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/5 border border-white dark:border-slate-900/10">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">GST Rate</p>
                  <p className="text-xl font-black">{unitTemplate?.gstPercentage}%</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/5 border border-white dark:border-slate-900/10">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Stamp Duty</p>
                  <p className="text-xl font-black">{unitTemplate?.stampDutyPercentage}%</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-400/20 border border-blue-400/30 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Financial Impact</p>
                </div>
                <p className="text-sm font-medium leading-relaxed opacity-90">
                  Total projected revenue for this configuration is estimated at <span className="font-bold text-white">₹{(totalValue / 10000000).toFixed(2)} Cr</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Unit Inventory Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Inventory Split</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">BHK wise configuration</p>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(unitsByConfig).map(([bhk, count], i) => (
                <div key={bhk} className="p-4 rounded-2xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:bg-slate-900 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{bhk}</span>
                    <Badge variant="secondary" className="bg-white dark:bg-slate-900 border text-[10px] font-bold">
                      {count as number} {(count as number) > 1 ? 'Units' : 'Unit'}
                    </Badge>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500'][i % 4]}`}
                      style={{ width: `${((count as number) / generatedUnits.length) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Inventory Coverage</p>
                    <p className="text-[9px] font-black text-slate-900 dark:text-white">{(((count as number) / generatedUnits.length) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Trust Summary */}
          <div className="bg-slate-900 rounded-[32px] p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-black uppercase tracking-widest">Trust & Legal Compliance</h4>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">RERA Validated</p>
                  <p className="text-xs font-medium opacity-80">{township.reraNumber || "Primary RERA Applied"}</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">APF Approved</p>
                  <p className="text-xs font-medium opacity-80">{township.approvedBanks?.length || 0} Leading Banks Linked</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
