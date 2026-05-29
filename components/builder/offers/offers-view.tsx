"use client"

import React, { useState, useEffect } from "react"
import { Plus, Gift, Loader2, Search, TrendingUp, Users, Eye } from "lucide-react"
import { toast } from "sonner"
import { OfferCard } from "./offer-card"
import { OfferEditor } from "./offer-editor"

export function OffersView({ userRole }: { userRole: string }) {
  const [offers, setOffers] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingOffer, setEditingOffer] = useState<any>(null)

  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchOffers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/offers")
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Failed to fetch offers")
        return
      }
      const data = await res.json()
      setOffers(data.offers || [])
    } catch (error) {
      console.error("Failed to fetch offers", error)
      toast.error("Network error: Could not load offers")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/properties")
      if (!res.ok) {
        toast.error("Could not load properties for offer targeting")
        return
      }
      const data = await res.json()
      setProperties(data.properties || [])
    } catch (error) {
      console.error("Failed to fetch properties", error)
      toast.error("Network error: Could not load properties")
    }
  }

  useEffect(() => {
    fetchOffers()
    fetchProperties()
  }, [])

  // onSave receives the full formData with status already set by OfferEditor
  const handleSaveOffer = async (offerData: any) => {
    const isEditing = !!offerData._id
    const method = isEditing ? "PUT" : "POST"
    const url = isEditing ? `/api/offers/${offerData._id}` : "/api/offers"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offerData),
      })

      if (res.ok) {
        toast.success(`Offer ${isEditing ? "updated" : "created"} successfully!`)
        setShowEditor(false)
        setEditingOffer(null)
        fetchOffers()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || `Failed to ${isEditing ? "update" : "create"} offer`)
        // Re-throw so OfferEditor can reset its isSaving state
        throw new Error(err.error || "Save failed")
      }
    } catch (error: any) {
      // Only show toast if it's not already shown above
      if (!error.message?.includes("Save failed") && !error.message?.includes("offer")) {
        toast.error("Network error: Could not save offer")
      }
      throw error
    }
  }

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return

    try {
      const res = await fetch(`/api/offers/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Offer deleted")
        setOffers(prev => prev.filter(o => o._id !== id))
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Failed to delete offer")
      }
    } catch (error) {
      toast.error("Network error: Could not delete offer")
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active"
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        toast.success(`Offer ${newStatus === "active" ? "published" : "paused"}`)
        setOffers(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o))
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Failed to update offer status")
      }
    } catch (error) {
      toast.error("Network error: Could not update status")
    }
  }

  const handleDuplicate = (offer: any) => {
    // Strip _id so editor treats it as a new offer; copy name with "(Copy)" suffix
    const { _id, ...rest } = offer
    setEditingOffer({ ...rest, offerName: `${offer.offerName} (Copy)`, status: "draft" })
    setShowEditor(true)
  }

  const filteredOffers = offers.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false
    if (searchQuery) {
      const term = searchQuery.toLowerCase()
      return (
        o.offerName?.toLowerCase().includes(term) ||
        o.benefitText?.toLowerCase().includes(term)
      )
    }
    return true
  })

  // KPI calculations
  const totalActive = offers.filter(o => o.status === "active").length
  const totalViews = offers.reduce((sum, o) => sum + (o.totalViews || 0), 0)
  const totalLeads = offers.reduce((sum, o) => sum + (o.leadsGenerated || 0), 0)
  const totalClaimed = offers.reduce((sum, o) => sum + (o.claimedOffers || 0), 0)

  return (
    <div className="space-y-8">
      {/* KPI Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active Offers</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalActive}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600">
            <Gift className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Views</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalViews.toLocaleString("en-IN")}</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Leads Generated</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalLeads.toLocaleString("en-IN")}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Claimed Offers</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalClaimed.toLocaleString("en-IN")}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status filter tabs */}
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex-wrap gap-1">
          {["all", "active", "paused", "draft", "expired"].map(status => (
            <button
              key={`filter-${status}`}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                statusFilter === status
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Create button */}
          <button
            onClick={() => { setEditingOffer(null); setShowEditor(true); }}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Offer
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Gift className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No offers found</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            {statusFilter !== "all"
              ? `No ${statusFilter} offers. Try a different filter.`
              : "You haven't created any offers yet. Create a campaign to boost your sales!"}
          </p>
          <button
            onClick={() => { setEditingOffer(null); setShowEditor(true); }}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium inline-flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOffers.map(offer => (
            <OfferCard
              key={`offer-${offer._id}`}
              offer={offer}
              onEdit={o => { setEditingOffer(o); setShowEditor(true); }}
              onDuplicate={handleDuplicate}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteOffer}
            />
          ))}
        </div>
      )}

      {/* Editor Side-panel */}
      {showEditor && (
        <OfferEditor
          offer={editingOffer}
          properties={properties}
          onSave={handleSaveOffer}
          onClose={() => { setShowEditor(false); setEditingOffer(null); }}
        />
      )}
    </div>
  )
}
