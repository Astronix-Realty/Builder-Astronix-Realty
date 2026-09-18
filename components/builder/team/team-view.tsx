"use client"

import { useState, useEffect } from "react"
import { Building2, MapPin, Layers, Home, UserPlus, Eye, EyeOff, Copy, Check, X, Users, ChevronRight, Shield, MoreHorizontal, Trash2, Phone, Mail, BadgeCheck } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
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
            projects: p.calculatedCounts?.projectsCount || p.details?.projects?.length || 0,
            towers: p.calculatedCounts?.towersCount || p.details?.towers?.length || 0,
            units: p.calculatedCounts?.unitsCount || 0,
            status: p.status || "draft",
            flowType: p.flowType || p.type,
            thumbnail: p.thumbnail || p.details?.township?.heroImage || p.details?.towers?.[0]?.heroImage,
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
    toast.success("Copied!")
  }

  const getStatusColor = (status: string) => {
    if (status === "published") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    if (status === "pending") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    if (status === "draft") return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
    return "bg-slate-100 text-slate-600"
  }

  const getLeaderForProperty = (propertyId: string) =>
    teamLeaders.filter((l) => l.propertyId === propertyId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading properties...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-emerald-600" />
            Team Management
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Assign Team Leaders to properties. They can manage everything except adding new properties.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <Users className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {teamLeaders.length} Team Leaders
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Properties", value: properties.length, color: "blue" },
          { label: "Published", value: properties.filter(p => p.status === "published").length, color: "emerald" },
          { label: "Team Leaders", value: teamLeaders.length, color: "purple" },
          { label: "Assigned Properties", value: [...new Set(teamLeaders.map(l => l.propertyId))].length, color: "amber" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/10 border border-${stat.color}-200 dark:border-${stat.color}-800 rounded-xl p-4`}>
            <p className={`text-2xl font-black text-${stat.color}-700 dark:text-${stat.color}-400`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">No Properties Found</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Add properties first to assign team leaders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {properties.map((property) => {
            const leaders = getLeaderForProperty(property.id)
            const hasLeader = leaders.length > 0

            return (
              <div
                key={property.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
              >
                {/* Property Thumbnail */}
                <div className="relative h-36 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
                  {property.thumbnail ? (
                    <img
                      src={property.thumbnail}
                      alt={property.townshipName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-slate-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="text-white font-bold text-sm leading-tight line-clamp-1">
                        {property.townshipName}
                      </h3>
                      <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {property.location}
                      </p>
                    </div>
                    <Badge className={`text-[10px] font-bold capitalize ${getStatusColor(property.status)}`}>
                      {property.status}
                    </Badge>
                  </div>
                </div>

                {/* Property Stats */}
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { icon: ChevronRight, label: "Projects", value: property.projects },
                      { icon: Layers, label: "Towers", value: property.towers },
                      { icon: Home, label: "Units", value: property.units },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-base font-black text-slate-900 dark:text-white">{stat.value}</p>
                        <p className="text-[10px] text-slate-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Assigned Team Leaders */}
                  {hasLeader ? (
                    <div className="mb-3 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Team Leaders</p>
                      {leaders.map((leader) => (
                        <div key={leader.id} className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {leader.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{leader.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{leader.userId} • {leader.email}</p>
                          </div>
                          <button
                            onClick={() => setViewLeader(leader)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all text-[10px] font-bold shrink-0"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                      <p className="text-[11px] text-slate-400 text-center">No Team Leader Assigned</p>
                    </div>
                  )}

                  {/* Add Team Leader Button */}
                  <Button
                    onClick={() => handleOpenAdd(property)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold h-9 gap-2 rounded-xl"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Team Leader for this Property
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View Team Leader Dialog */}
      <Dialog open={!!viewLeader} onOpenChange={(open) => { if (!open) setViewLeader(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-emerald-600" />
              Team Leader Details
            </DialogTitle>
          </DialogHeader>
          {viewLeader && (
            <div className="space-y-3 py-2">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl font-black shrink-0">
                  {viewLeader.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-base">{viewLeader.name}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">{viewLeader.userId}</p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                    ● Active Team Leader
                  </span>
                </div>
              </div>

              {/* Details */}
              {[
                { icon: Mail, label: "Email", value: viewLeader.email, field: "email" },
                { icon: Phone, label: "Mobile", value: viewLeader.phone, field: "phone" },
                { icon: BadgeCheck, label: "User ID", value: viewLeader.userId, field: "userId" },
                { icon: Building2, label: "Assigned Property", value: viewLeader.propertyName || "—", field: "property" },
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                  {item.field !== "property" && (
                    <button
                      onClick={() => copyToClipboard(item.value, item.field)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {copiedField === item.field ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              ))}

              {/* Login URL */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Login URL</p>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">{typeof window !== 'undefined' ? window.location.origin : ''}/login?type=teamLeader</p>
                </div>
                <button
                  onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/login?type=teamLeader`, "loginurl")}
                  className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-400 transition-colors"
                >
                  {copiedField === "loginurl" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              disabled={isRemoving}
              onClick={async () => {
                if (!viewLeader) return
                if (!confirm(`Remove ${viewLeader.name} as Team Leader?`)) return
                setIsRemoving(true)
                try {
                  const res = await fetch(`/api/team-leaders/${viewLeader.id}`, { method: 'DELETE' })
                  if (res.ok) {
                    toast.success('Team Leader removed')
                    setViewLeader(null)
                    fetchTeamLeaders()
                  } else {
                    toast.error('Failed to remove')
                  }
                } catch { toast.error('Network error') }
                finally { setIsRemoving(false) }
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setViewLeader(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Team Leader Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) setIsAddDialogOpen(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Add Team Leader
            </DialogTitle>
            <DialogDescription>
              {selectedProperty && (
                <span className="inline-flex items-center gap-1 mt-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <strong>{selectedProperty.townshipName}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {!createdLeader ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                <Input
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mobile Number *</label>
                <Input
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address *</label>
                <Input
                  type="email"
                  placeholder="e.g. rahul@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password *</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Auto-generated. Share this with the team leader securely.
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                ⚠️ User ID will be auto-generated. Team leader can manage all features of this property except adding new properties.
              </div>
            </div>
          ) : (
            /* Success State — Show Credentials */
            <div className="py-2 space-y-3">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-emerald-700 dark:text-emerald-400">Team Leader Created!</p>
                <p className="text-xs text-slate-500 mt-1">Share these credentials securely with the team leader.</p>
              </div>

              {[
                { label: "Name", value: createdLeader.name, field: "name" },
                { label: "User ID", value: createdLeader.userId, field: "userId" },
                { label: "Email", value: createdLeader.email, field: "email" },
                { label: "Password", value: createdLeader.password, field: "password" },
                { label: "Login URL", value: `${typeof window !== 'undefined' ? window.location.origin : ''}/login?type=teamLeader`, field: "url" },
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">{item.value}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.value, item.field)}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {copiedField === item.field ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2">
            {!createdLeader ? (
              <>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !form.name || !form.email || !form.phone}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  {isSubmitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Create Team Leader</>
                  )}
                </Button>
              </>
            ) : (
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
