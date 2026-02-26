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
  const { township, projects = [], towers = [], generatedUnits = [], unitTemplate } = state

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
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 group/row">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 group-hover/row:text-blue-500 transition-colors" />}
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-900">{value || "-"}</span>
    </div>
  )

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── 1. HERO CELEBRATION BANNER ──────────────── */}
      <div className="relative overflow-hidden rounded-[32px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 md:p-12 shadow-xl shadow-emerald-500/5">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <CheckCircle2 className="w-64 h-64 text-emerald-500 animate-pulse" />
        </div>

        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left gap-6">
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            {flowSummary.badge}
          </Badge>

          <div className="space-y-3">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {flowSummary.title}
            </h2>
            <p className="text-slate-500 text-base md:text-lg max-w-xl font-medium leading-relaxed">
              {flowSummary.description}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 opacity-80" />
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/50 px-3 py-1.5 rounded-lg border border-emerald-200/50">
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
          { icon: Home, label: "Total Units", value: generatedUnits.length.toLocaleString(), color: "emerald", suffix: "Units" },
          { icon: IndianRupee, label: "Inventory Value", value: `₹${(totalValue / 10000000).toFixed(1)}`, color: "amber", suffix: "Cr Value" },
        ].map((stat, i) => (
          <div key={i} className="group p-6 rounded-[24px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3
              ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                  stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-amber-50 text-amber-600'}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 leading-none">{stat.value}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{stat.suffix}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. DETAILED INFRASTRUCTURE REVIEW ─────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">

        {/* Left Column: Property Identity */}
        <div className="xl:col-span-2 space-y-12">
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#1A3C8C] flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Master Identity</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Global & Location Configuration</p>
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
            <div className="mt-10 p-5 rounded-2xl bg-blue-50/30 border border-blue-100/50">
              <p className="text-[10px] font-black text-[#1A3C8C] uppercase tracking-[0.2em] mb-4">Core Connectivity Points</p>
              <div className="flex flex-wrap gap-3">
                {township.connectivity.slice(0, 4).map((c: any) => (
                  <div key={c.id} className="bg-white border border-blue-100 px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                    <Wifi className="w-3.5 h-3.5 text-blue-500" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-900 leading-none mb-0.5">{c.title}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{c.distanceKm} • {c.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project & Tower Architecture */}
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Infrastructure Stack</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Projects, Towers & Phasing</p>
              </div>
            </div>

            <div className="space-y-4">
              {projects.map((proj: any, idx: number) => (
                <div key={proj.id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm font-black text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{proj.name || "Untitled Project"}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{proj.tagType}</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-[10px] font-bold uppercase">
                      {towers.filter(t => t.projectId === proj.id).length} Towers
                    </Badge>
                  </div>

                  <div className="ml-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {towers.filter(t => t.projectId === proj.id).map(tower => (
                      <div key={tower.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-900 truncate mb-1">{tower.name}</p>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
                          <Building className="w-3 h-3" /> {tower.totalFloors}
                          <span className="text-slate-200">|</span>
                          <Home className="w-3 h-3" /> {tower.totalUnits}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Financials & Units */}
        <div className="space-y-12">
          {/* Financial Breakdown */}
          <div className="bg-[#1A3C8C] rounded-[32px] p-8 text-white shadow-xl shadow-blue-500/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black">Financial Blueprint</h3>
                <p className="text-xs text-blue-300 font-bold uppercase tracking-widest">Pricing & Tax Logic</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Base Calculation</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-black">₹{Number(unitTemplate?.ratePerSqft || 0).toLocaleString()}</p>
                  <p className="text-xs font-bold opacity-60">Avg per sq.ft</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">GST Rate</p>
                  <p className="text-xl font-black">{unitTemplate?.gstPercentage}%</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
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
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Inventory Split</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">BHK wise configuration</p>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(unitsByConfig).map(([bhk, count], i) => (
                <div key={bhk} className="p-4 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-slate-900">{bhk}</span>
                    <Badge variant="secondary" className="bg-white border text-[10px] font-bold">
                      {count as number} {(count as number) > 1 ? 'Units' : 'Unit'}
                    </Badge>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500'][i % 4]}`}
                      style={{ width: `${((count as number) / generatedUnits.length) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Inventory Coverage</p>
                    <p className="text-[9px] font-black text-slate-900">{(((count as number) / generatedUnits.length) * 100).toFixed(1)}%</p>
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
              <div className="flex gap-4 p-4 rounded-2xl bg-white/5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">RERA Validated</p>
                  <p className="text-xs font-medium opacity-80">{township.reraNumber || "Primary RERA Applied"}</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-2xl bg-white/5">
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
