"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  Building2,
  MapPin,
  Layers,
  Home,
  UserPlus,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  Users,
  ChevronRight,
  Shield,
  Trash2,
  Phone,
  Mail,
  BadgeCheck,
  Search,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Property {
  id: string
  townshipName: string
  location: string
  projects: number
  towers: number
  units: number
  status: string
  flowType?: string
  thumbnail?: string
}

interface TeamLeader {
  id: string
  name: string
  email: string
  phone: string
  userId: string
  propertyId: string
  propertyName: string
  status: string
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#"
  let pass = ""
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

export function TeamView() {
  const [properties, setProperties] = useState<Property[]>([])
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [createdLeader, setCreatedLeader] = useState<any>(null)
  const [viewLeader, setViewLeader] = useState<TeamLeader | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  // Desktop View Mode: 'cards' (property allocations) vs 'directory' (leaders table)
  const [teamViewMode, setTeamViewMode] = useState<"cards" | "directory">("cards")
  const [searchQuery, setSearchQuery] = useState("")

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: generatePassword(),
  })

  useEffect(() => {
    fetchProperties()
    fetchTeamLeaders()
  }, [])

  const fetchProperties = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/properties")
      if (res.ok) {
        const data = await res.json()
        if (data.properties) {
          const mapped = data.properties.map((p: any) => ({
            id: p._id || p.id,
            townshipName: p.name || p.townshipName || "Untitled",
            location: p.location || "Location not set",
            projects:
              p.calculatedCounts?.projectsCount || p.details?.projects?.length || 0,
            towers:
              p.calculatedCounts?.towersCount || p.details?.towers?.length || 0,
            units: p.calculatedCounts?.unitsCount || 0,
            status: p.status || "draft",
            flowType: p.flowType || p.type,
            thumbnail:
              p.thumbnail ||
              p.details?.township?.heroImage ||
              p.details?.towers?.[0]?.heroImage,
          }))
          setProperties(mapped)
        }
      }
    } catch (e) {
      toast.error("Failed to load properties")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamLeaders = async () => {
    try {
      const res = await fetch("/api/team-leaders")
      if (res.ok) {
        const data = await res.json()
        if (data.leaders) setTeamLeaders(data.leaders)
      }
    } catch (e) {
      console.error("Failed to fetch team leaders")
    }
  }

  const handleOpenAdd = (property: Property) => {
    const existing = getLeaderForProperty(property)
    if (existing.length > 0) {
      toast.error(
        "This property already has a Team Leader assigned. Only 1 leader is allowed per property."
      )
      return
    }
    setSelectedProperty(property)
    setForm({ name: "", email: "", phone: "", password: generatePassword() })
    setCreatedLeader(null)
    setIsAddDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error("Please fill all fields")
      return
    }
    if (!selectedProperty) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/team-leaders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          propertyId: selectedProperty.id,
          propertyName: selectedProperty.townshipName,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to create team leader")
        return
      }
      setCreatedLeader({ ...data.leader, password: form.password })
      toast.success("Team Leader created successfully!")
      fetchTeamLeaders()
    } catch (e) {
      toast.error("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
    toast.success("Copied to clipboard!")
  }

  const getStatusColor = (status: string) => {
    if (status === "published")
      return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
    if (status === "pending")
      return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60"
    if (status === "draft")
      return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
    return "bg-slate-100 text-slate-600"
  }

  const getLeaderForProperty = (property: Property) =>
    teamLeaders.filter(
      (l) =>
        l.propertyId === property.id ||
        (l.propertyName &&
          property.townshipName &&
          l.propertyName.trim().toLowerCase() ===
            property.townshipName.trim().toLowerCase())
    )

  // Filter properties based on search query
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties
    const q = searchQuery.toLowerCase().trim()
    return properties.filter(
      (p) =>
        p.townshipName.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        getLeaderForProperty(p).some((l) => l.name.toLowerCase().includes(q))
    )
  }, [properties, searchQuery, teamLeaders])

  // Filter team leaders based on search query
  const filteredLeaders = useMemo(() => {
    if (!searchQuery.trim()) return teamLeaders
    const q = searchQuery.toLowerCase().trim()
    return teamLeaders.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.userId.toLowerCase().includes(q) ||
        l.propertyName?.toLowerCase().includes(q)
    )
  }, [teamLeaders, searchQuery])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-mono">Loading team console...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Desktop Software Top Toolbar */}
      <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title & Badge */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Team Leader Operations
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-semibold">
              {teamLeaders.length} Active Leaders
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Allocate property-level authority to team leaders with dedicated access credentials
          </p>
        </div>

        {/* Center Search Input */}
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search property or team leader..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => setTeamViewMode("cards")}
              className={`p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                teamViewMode === "cards"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
              title="Property Allocations Grid"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">Allocations</span>
            </button>
            <button
              onClick={() => setTeamViewMode("directory")}
              className={`p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                teamViewMode === "directory"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
              title="Team Leaders Directory Table"
            >
              <List className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-2xs">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            Total Properties
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
            {properties.length}
          </p>
        </div>

        <div className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-2xs">
          <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">
            Active Leaders
          </p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            {teamLeaders.length}
          </p>
        </div>

        <div className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-2xs">
          <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wider font-semibold">
            Assigned Properties
          </p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">
            {
              [...new Set(teamLeaders.map((l) => l.propertyId || l.propertyName))]
                .length
            }
          </p>
        </div>

        <div className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-2xs">
          <p className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold">
            Unassigned Properties
          </p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
            {properties.filter((p) => getLeaderForProperty(p).length === 0).length}
          </p>
        </div>
      </div>

      {/* DIRECTORY TABLE MODE */}
      {teamViewMode === "directory" && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto software-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/90 dark:border-slate-700/80 text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-semibold">Team Leader</th>
                  <th className="py-2.5 px-3 font-semibold">User ID</th>
                  <th className="py-2.5 px-4 font-semibold">Assigned Property</th>
                  <th className="py-2.5 px-3 font-semibold">Contact Email</th>
                  <th className="py-2.5 px-3 font-semibold">Mobile</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLeaders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center text-slate-400 font-mono text-xs">
                      No team leaders found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredLeaders.map((leader) => (
                    <tr
                      key={leader.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {leader.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {leader.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          {leader.userId}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {leader.propertyName || "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {leader.email}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {leader.phone}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setViewLeader(leader)}
                          className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-semibold transition-colors"
                        >
                          View Credentials
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROPERTY ALLOCATIONS GRID MODE */}
      {teamViewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProperties.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              No properties found matching &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredProperties.map((property) => {
              const leaders = getLeaderForProperty(property)
              const hasLeader = leaders.length > 0

              return (
                <div
                  key={property.id}
                  className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 rounded-xl overflow-hidden shadow-2xs hover:shadow-sm transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Property Thumbnail & Overlay Header */}
                    <div className="relative h-32 bg-slate-800 overflow-hidden">
                      {property.thumbnail ? (
                        <img
                          src={property.thumbnail}
                          alt={property.townshipName}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <Building2 className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                        <div className="min-w-0">
                          <h3 className="text-white font-bold text-xs leading-tight line-clamp-1">
                            {property.townshipName}
                          </h3>
                          <p className="text-white/80 text-[10px] flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            {property.location}
                          </p>
                        </div>
                        <Badge
                          className={`text-[9px] font-mono uppercase font-bold shrink-0 ${getStatusColor(
                            property.status
                          )}`}
                        >
                          {property.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Stats & Allocation */}
                    <div className="p-3.5 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                          <p className="text-xs font-black text-slate-900 dark:text-white font-mono">
                            {property.projects}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono uppercase">Projects</p>
                        </div>
                        <div className="text-center p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                          <p className="text-xs font-black text-slate-900 dark:text-white font-mono">
                            {property.towers}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono uppercase">Towers</p>
                        </div>
                        <div className="text-center p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                          <p className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                            {property.units}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono uppercase">Units</p>
                        </div>
                      </div>

                      {/* Assigned Leader Tile */}
                      {hasLeader ? (
                        <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {leaders[0].name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {leaders[0].name}
                              </p>
                              <p className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 truncate">
                                {leaders[0].userId}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setViewLeader(leaders[0])}
                            className="px-2 py-1 rounded bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 text-[10px] font-bold shadow-2xs hover:bg-emerald-50 shrink-0"
                          >
                            Manage
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
                          <p className="text-[11px] text-slate-400 font-medium">
                            No Leader Assigned
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="px-3.5 pb-3.5 pt-0">
                    {!hasLeader ? (
                      <Button
                        onClick={() => handleOpenAdd(property)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 gap-1.5 rounded-lg shadow-2xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Assign Team Leader
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-md border border-emerald-200/50 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <span className="flex items-center gap-1">
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Allocated (Max 1)
                        </span>
                        <button
                          onClick={() => setViewLeader(leaders[0])}
                          className="hover:underline text-[10px] font-bold"
                        >
                          View Credentials
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* View Team Leader Dialog */}
      <Dialog
        open={!!viewLeader}
        onOpenChange={(open) => {
          if (!open) setViewLeader(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
              Team Leader Credentials &amp; Scope
            </DialogTitle>
          </DialogHeader>
          {viewLeader && (
            <div className="space-y-2.5 py-2">
              <div className="flex items-center gap-3 p-3 bg-emerald-50/70 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/70 dark:border-emerald-800">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-base font-black shrink-0">
                  {viewLeader.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {viewLeader.name}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    {viewLeader.userId}
                  </p>
                </div>
              </div>

              {[
                { icon: Mail, label: "Email", value: viewLeader.email, field: "email" },
                { icon: Phone, label: "Mobile", value: viewLeader.phone, field: "phone" },
                { icon: BadgeCheck, label: "User ID", value: viewLeader.userId, field: "userId" },
                {
                  icon: Building2,
                  label: "Assigned Property",
                  value: viewLeader.propertyName || "—",
                  field: "property",
                },
              ].map((item) => (
                <div
                  key={item.field}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase font-mono">
                        {item.label}
                      </p>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {item.value}
                      </p>
                    </div>
                  </div>
                  {item.field !== "property" && (
                    <button
                      onClick={() => copyToClipboard(item.value, item.field)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600"
                    >
                      {copiedField === item.field ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-between p-2.5 bg-blue-50/70 dark:bg-blue-900/20 rounded-lg border border-blue-200/70 dark:border-blue-800">
                <div>
                  <p className="text-[9px] font-bold text-blue-500 uppercase font-mono">
                    Login URL
                  </p>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 font-mono truncate">
                    {typeof window !== "undefined" ? window.location.origin : ""}/login?type=teamLeader
                  </p>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${typeof window !== "undefined" ? window.location.origin : ""}/login?type=teamLeader`,
                      "loginurl"
                    )
                  }
                  className="p-1 text-blue-500 hover:text-blue-700"
                >
                  {copiedField === "loginurl" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 text-xs"
              disabled={isRemoving}
              onClick={async () => {
                if (!viewLeader) return
                if (!confirm(`Remove ${viewLeader.name} as Team Leader?`)) return
                setIsRemoving(true)
                try {
                  const res = await fetch(`/api/team-leaders/${viewLeader.id}`, {
                    method: "DELETE",
                  })
                  if (res.ok) {
                    toast.success("Team Leader removed")
                    setViewLeader(null)
                    fetchTeamLeaders()
                  } else {
                    toast.error("Failed to remove")
                  }
                } catch {
                  toast.error("Network error")
                } finally {
                  setIsRemoving(false)
                }
              }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {isRemoving ? "Removing..." : "Remove Access"}
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs"
              onClick={() => setViewLeader(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Team Leader Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsAddDialogOpen(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              Allocate Team Leader
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedProperty && (
                <span className="inline-flex items-center gap-1 mt-0.5 font-medium text-slate-700 dark:text-slate-300">
                  <Building2 className="w-3.5 h-3.5" />
                  <strong>{selectedProperty.townshipName}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {!createdLeader ? (
            <div className="space-y-3 py-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name *
                </label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Enter leader full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mobile Number *
                </label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address *
                </label>
                <Input
                  className="h-8 text-xs"
                  type="email"
                  placeholder="e.g. rahul@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password *
                </label>
                <div className="relative">
                  <Input
                    className="h-8 text-xs pr-8 font-mono"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Auto-generated secure password.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-2.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                <p className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                  Team Leader Created Successfully!
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Save or copy the credentials below.
                </p>
              </div>

              {[
                { label: "Name", value: createdLeader.name, field: "name" },
                { label: "User ID", value: createdLeader.userId, field: "userId" },
                { label: "Email", value: createdLeader.email, field: "email" },
                { label: "Password", value: createdLeader.password, field: "password" },
                {
                  label: "Login URL",
                  value: `${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/login?type=teamLeader`,
                  field: "url",
                },
              ].map((item) => (
                <div
                  key={item.field}
                  className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase font-mono">
                      {item.label}
                    </p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
                      {item.value}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.value, item.field)}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                  >
                    {copiedField === item.field ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2">
            {!createdLeader ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !form.name ||
                    !form.email ||
                    !form.phone
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  {isSubmitting ? "Creating..." : "Create Leader"}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
