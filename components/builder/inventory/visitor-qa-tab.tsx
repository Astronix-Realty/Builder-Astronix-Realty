"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  HelpCircle, Clock, CheckCircle2, Search, Send, RefreshCw,
  Building2, MessageSquare, AlertCircle, Sparkles, User, Phone, Trash2, Edit3, ShieldAlert
} from "lucide-react"

export interface VisitorFaqItem {
  id: string
  question: string
  answer: string
  askedBy: string
  askedByPhone: string
  hierarchyLevel: string
  propertyId: string
  propertyName: string
  propertyType: string
  status: "unanswered" | "pending" | "answered"
  isPublished: boolean
  createdAt: string
  answeredAt?: string | null
  editStatus?: "none" | "pending" | "approved" | "rejected" | string
  pendingAnswer?: string
  editReason?: string
  isDefaultQuestion?: boolean
}

interface VisitorQaTabProps {
  userRole?: "builder" | "mandate"
}

export function VisitorQaTab({ userRole = "builder" }: VisitorQaTabProps) {
  const [faqs, setFaqs] = useState<VisitorFaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filters
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Answer draft inputs per FAQ ID
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  // Edit Request Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<VisitorFaqItem | null>(null)
  const [newAnswerText, setNewAnswerText] = useState("")
  const [editReasonText, setEditReasonText] = useState("")
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  const fetchFaqs = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    else setIsRefreshing(true)

    try {
      const res = await fetch("/api/inventory/faqs", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch Q&A list")
      const data = await res.json()

      if (data.success && Array.isArray(data.faqs)) {
        setFaqs(data.faqs)
        
        // Initialize answer drafts
        const initialDrafts: Record<string, string> = {}
        data.faqs.forEach((item: VisitorFaqItem) => {
          if (item.answer) {
            initialDrafts[item.id] = item.answer
          }
        })
        setAnswerDrafts((prev) => ({ ...initialDrafts, ...prev }))
      }
    } catch (err: any) {
      console.error("[VisitorQaTab] fetch error:", err)
      toast.error("Could not load visitor questions. Please try again.")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchFaqs(true)
  }, [fetchFaqs])

  // Get unique properties list for dropdown filter
  const uniqueProperties = Array.from(
    new Map(faqs.map((f) => [f.propertyId, { id: f.propertyId, name: f.propertyName, type: f.hierarchyLevel }])).values()
  )

  // Filter logic
  const filteredFaqs = faqs.filter((faq) => {
    if (selectedPropertyId !== "all" && faq.propertyId !== selectedPropertyId) return false

    if (selectedStatus === "edit_pending" && faq.editStatus !== "pending") return false
    if (selectedStatus === "unanswered" && (faq.status === "answered" || faq.isPublished)) return false
    if (selectedStatus === "answered" && !(faq.status === "answered" || faq.isPublished)) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchQ = faq.question.toLowerCase().includes(q)
      const matchAns = faq.answer.toLowerCase().includes(q)
      const matchUser = faq.askedBy.toLowerCase().includes(q)
      const matchProp = faq.propertyName.toLowerCase().includes(q)
      return matchQ || matchAns || matchUser || matchProp
    }
    return true
  })

  // Stats
  const totalQuestions = faqs.length
  const unansweredCount = faqs.filter((f) => !f.isPublished && f.status !== "answered").length
  const publishedCount = faqs.filter((f) => f.isPublished || f.status === "answered").length
  const editPendingCount = faqs.filter((f) => f.editStatus === "pending").length

  // Initial Answer / Publish
  const handlePublishAnswer = async (faq: VisitorFaqItem, action: "publish" | "delete" = "publish") => {
    const draftText = (answerDrafts[faq.id] || "").trim()

    if (action === "publish" && !draftText) {
      toast.error("Please enter an answer before publishing.")
      return
    }

    setSubmittingId(faq.id)

    try {
      const res = await fetch("/api/inventory/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: faq.propertyId,
          faqId: faq.id,
          answer: draftText,
          action,
          questionText: faq.question,
          askedBy: faq.askedBy,
          hierarchyLevel: faq.hierarchyLevel,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update answer")
      }

      toast.success(data.message || "Answer published live successfully!")
      await fetchFaqs(false)
    } catch (err: any) {
      console.error("[VisitorQaTab] submit error:", err)
      toast.error(err.message || "Something went wrong while publishing answer.")
    } finally {
      setSubmittingId(null)
    }
  }

  // Open Edit Modal for already-answered FAQ
  const handleOpenEditModal = (faq: VisitorFaqItem) => {
    setEditingFaq(faq)
    setNewAnswerText(faq.pendingAnswer || faq.answer || "")
    setEditReasonText(faq.editReason || "")
    setEditModalOpen(true)
  }

  // Submit Edit Request (Requires Reason for Admin Approval)
  const handleSubmitEditRequest = async () => {
    if (!editingFaq) return

    const cleanAnswer = newAnswerText.trim()
    const cleanReason = editReasonText.trim()

    if (!cleanAnswer) {
      toast.error("Please enter the updated answer text.")
      return
    }
    if (!cleanReason) {
      toast.error("Please enter the reason for editing this answer (Mandatory for Admin Approval).")
      return
    }

    setIsSubmittingEdit(true)

    try {
      const res = await fetch("/api/inventory/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: editingFaq.propertyId,
          faqId: editingFaq.id,
          answer: cleanAnswer,
          editReason: cleanReason,
          action: "request_edit",
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit edit request")
      }

      toast.success(data.message || "Edit request submitted for Admin Approval!")
      setEditModalOpen(false)
      setEditingFaq(null)
      await fetchFaqs(false)
    } catch (err: any) {
      console.error("[VisitorQaTab] edit submit error:", err)
      toast.error(err.message || "Something went wrong while submitting edit request.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header & Stats Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-gradient-to-br from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total FAQs</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalQuestions}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 dark:border-amber-900/40 shadow-sm bg-gradient-to-br from-amber-50/50 to-white dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Unanswered</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <h3 className="text-xl font-black text-amber-900 dark:text-amber-300">{unansweredCount}</h3>
                {unansweredCount > 0 && (
                  <Badge className="bg-amber-500 text-white text-[9px] px-1.5">Action Needed</Badge>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 dark:border-emerald-900/40 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Live on Visitor FAQ</p>
              <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-300 mt-0.5">{publishedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/80 dark:border-purple-900/40 shadow-sm bg-gradient-to-br from-purple-50/50 to-white dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Edit Pending Approval</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <h3 className="text-xl font-black text-purple-900 dark:text-purple-300">{editPendingCount}</h3>
                {editPendingCount > 0 && (
                  <Badge className="bg-purple-600 text-white text-[9px] px-1.5">In Admin Queue</Badge>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters & Search Control Bar ── */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search questions or buyers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            {/* Property Select Dropdown */}
            {uniqueProperties.length > 0 && (
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="w-full sm:w-56 text-xs h-9 bg-slate-50 dark:bg-slate-900 border-slate-200 rounded-xl">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties ({faqs.length})</SelectItem>
                  {uniqueProperties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto justify-center">
            <button
              onClick={() => setSelectedStatus("unanswered")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === "unanswered"
                  ? "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Unanswered ({unansweredCount})
            </button>

            <button
              onClick={() => setSelectedStatus("answered")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === "answered"
                  ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Published ({publishedCount})
            </button>

            <button
              onClick={() => setSelectedStatus("edit_pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === "edit_pending"
                  ? "bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Edit Pending ({editPendingCount})
            </button>

            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === "all"
                  ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All ({totalQuestions})
            </button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchFaqs(false)}
              disabled={isRefreshing}
              className="h-8 w-8 text-slate-500 hover:text-slate-900 ml-1"
              title="Refresh questions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Q&A Cards List ── */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading FAQs & Questions...</p>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <Card className="border-slate-200/80 dark:border-slate-800 text-center p-12">
          <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">No questions match filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or status filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFaqs.map((faq) => {
            const isSubmitting = submittingId === faq.id
            const isAlreadyAnswered = faq.isPublished || faq.status === "answered"
            const isEditPending = faq.editStatus === "pending"
            const currentDraft = answerDrafts[faq.id] ?? faq.answer ?? ""

            return (
              <Card
                key={faq.id}
                className={`border transition-all duration-200 ${
                  isEditPending
                    ? "border-purple-300 dark:border-purple-800 bg-purple-50/20 dark:bg-purple-950/10 shadow-sm"
                    : isAlreadyAnswered
                    ? "border-emerald-200/80 dark:border-emerald-900/40 bg-white dark:bg-slate-950 shadow-xs"
                    : "border-amber-200/90 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm"
                }`}
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Card Header Tag & Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-bold text-[10px] flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        <span>{faq.hierarchyLevel}: {faq.propertyName}</span>
                      </Badge>

                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-0.5 rounded-full">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {faq.isDefaultQuestion || faq.askedBy === 'Verified Visitor' || faq.askedBy === 'Aarav Patel'
                            ? 'Standard Real Estate Question'
                            : `Asked by ${faq.askedBy}`}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditPending ? (
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold text-[10px] border border-purple-300 flex items-center gap-1 animate-pulse">
                          <ShieldAlert className="w-3 h-3 text-purple-600" /> Edit Pending Admin Approval
                        </Badge>
                      ) : isAlreadyAnswered ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Live on Visitor FAQ
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px] border border-amber-300 flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" /> Unanswered
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Question
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      &quot;{faq.question}&quot;
                    </h4>
                  </div>

                  {/* Pending Edit Notice Box (if builder requested an edit) */}
                  {isEditPending && (
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-2">
                      <div className="flex items-center justify-between text-purple-900 dark:text-purple-200 font-bold">
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-purple-600" />
                          Requested New Answer (Under Admin Review)
                        </span>
                        <span className="text-[10px] bg-purple-200/80 dark:bg-purple-900 px-2 py-0.5 rounded-full">
                          Pending Approval
                        </span>
                      </div>
                      <p className="text-purple-950 dark:text-purple-100 font-medium italic">
                        &quot;{faq.pendingAnswer}&quot;
                      </p>
                      {faq.editReason && (
                        <div className="text-[11px] text-purple-800 dark:text-purple-300 pt-1 border-t border-purple-200/60 dark:border-purple-800">
                          <strong>Reason provided for edit:</strong> {faq.editReason}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Answer Input or Displays */}
                  <div className="space-y-2.5 pt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {isAlreadyAnswered ? "Current Live Answer" : "Provide Official Builder Answer"}
                    </span>

                    {isAlreadyAnswered ? (
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                        {faq.answer}
                      </div>
                    ) : (
                      <Textarea
                        rows={2}
                        placeholder="Type your official answer here (e.g. RERA details, possession timeline, price inclusions)..."
                        value={currentDraft}
                        onChange={(e) =>
                          setAnswerDrafts((prev) => ({
                            ...prev,
                            [faq.id]: e.target.value,
                          }))
                        }
                        className="text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 leading-relaxed"
                      />
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <p className="text-[10px] text-slate-400">
                        {isAlreadyAnswered
                          ? "Answered FAQ answers are locked. Any edits require a mandatory reason and Admin Approval."
                          : "Publishing this answer will make it live on the Visitor Portal."}
                      </p>

                      <div className="flex items-center gap-2">
                        {isAlreadyAnswered ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isEditPending}
                            onClick={() => handleOpenEditModal(faq)}
                            className="h-8.5 px-4 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm hover:shadow gap-1.5 cursor-pointer disabled:opacity-60"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {isEditPending ? "Edit Requested" : "Request Edit (Requires Reason)"}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => handlePublishAnswer(faq, "publish")}
                            className="h-8.5 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow gap-1.5 cursor-pointer"
                          >
                            {isSubmitting ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Publishing...
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                Publish Answer to Visitor FAQ
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Edit Request Dialog Modal ── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-600" />
              Request Answer Edit (Admin Approval Required)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Live answers cannot be directly modified. Submit your updated answer along with a mandatory reason for Admin review.
            </DialogDescription>
          </DialogHeader>

          {editingFaq && (
            <div className="space-y-4 py-2">
              {/* Question Preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Question
                </span>
                <p className="font-bold text-slate-900 dark:text-white">&quot;{editingFaq.question}&quot;</p>
              </div>

              {/* Current Live Answer */}
              <div className="p-3 bg-slate-100/60 dark:bg-slate-900/60 rounded-xl text-xs space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Live Answer
                </span>
                <p className="text-slate-700 dark:text-slate-300">{editingFaq.answer}</p>
              </div>

              {/* Proposed New Answer */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Proposed New Answer <span className="text-red-500">*</span>
                </label>
                <Textarea
                  rows={3}
                  value={newAnswerText}
                  onChange={(e) => setNewAnswerText(e.target.value)}
                  placeholder="Type the updated answer text..."
                  className="text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              {/* Mandatory Reason for Edit */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block flex items-center justify-between">
                  <span>Reason for Edit (Mandatory for Admin Approval)</span>
                  <span className="text-red-500 text-[10px] font-semibold">Required</span>
                </label>
                <Textarea
                  rows={2}
                  value={editReasonText}
                  onChange={(e) => setEditReasonText(e.target.value)}
                  placeholder="Explain why you are modifying this answer (e.g. Bank pre-approval list updated, possession schedule extended)..."
                  className="text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={isSubmittingEdit}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitEditRequest}
              disabled={isSubmittingEdit}
              className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1.5 cursor-pointer"
            >
              {isSubmittingEdit ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit for Admin Approval
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

