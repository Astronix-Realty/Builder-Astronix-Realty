"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { offlineSafeFetch } from "@/lib/offline-queue"
import { useCRMStore } from "@/lib/store/crm-store"
import { v4 as uuidv4 } from "uuid"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Users, Search, Filter, Phone, Mail, MoreHorizontal, Calendar, MessageSquare,
    UserPlus, ArrowUpRight, GripVertical, Clock, MapPin, DollarSign,
    CheckCircle2, XCircle, AlertCircle, TrendingUp, User, Activity, FileText, Send, Crown,
    Building2, Lock, RefreshCw, Database, Trash2
} from "lucide-react"

// --- Types ---
type LeadStatus = "Fresh" | "Token VIP" | "Connected" | "Site Visit" | "Negotiation" | "Booked" | "Junk"
type Urgency = "Low" | "Medium" | "High"

interface Lead {
    id: string
    _id: string
    name: string
    phone: string
    email: string
    status: LeadStatus
    isTokenPaid: boolean
    requirement: string
    budget: string
    source: string
    assignee: string
    lastActivity: string
    nextAction?: string
    nextActionTime?: string
    notes: string[]
    timeline: { date: string, title: string, desc: string, type: "call" | "visit" | "system" | "note" | "booking" }[]
    interestedUnit?: string
    builderId?: string
    projectId?: string
    createdAt?: string
}

// --- Mock Sentry Logger ---
const logger = {
    error: (err: any, context?: any) => {
        console.error("[Sentry Mock] Error:", err, context);
    },
    info: (msg: string, context?: any) => {
        console.info("[Sentry Mock] Info:", msg, context);
    }
}

// --- Mock Data ---
const INITIAL_LEADS: Lead[] = []

// --- Utility: always get a clean string ID from any lead/ObjectId ---
function toId(val: any): string {
    if (!val) return "";
    // Handle MongoDB extended JSON format if it leaks through
    if (typeof val === "object" && val.$oid) return String(val.$oid).trim();
    if (typeof val === "string") return val.trim();
    if (typeof val.toString === "function") {
        const s = val.toString();
        return s === "[object Object]" ? "" : s.trim();
    }
    return String(val).trim();
}

// --- Components ---
interface CRMViewProps {
    userRole?: "builder" | "mandate"
}

export function CRMView({ userRole = "builder" }: CRMViewProps) {
    const storagePrefix = userRole === "mandate" ? "mandate_" : ""
    const [viewMode, setViewMode] = useState<"pipeline" | "list" | "profile" | "analytics">("pipeline")
    
    // Zustand Global State Integration
    const {
        leadsById,
        allLeadIds,
        setInitialLeads,
        upsertLead,
        removeLead,
        optimisticUpdateStatus,
        resolveTransaction,
        failTransaction
    } = useCRMStore()

    // Map normalized store back to array for UI compatibility
    const leads = useMemo(() => allLeadIds.map(id => leadsById[id]).filter(Boolean) as Lead[], [allLeadIds, leadsById])

    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [isLoadingLeads, setIsLoadingLeads] = useState(true)
    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
    const [newLeadForm, setNewLeadForm] = useState({
        name: "", phone: "", email: "", requirement: "2BHK", budget: "50L - 1Cr", source: "Manual Entry", assignee: ""
    })
    const [isAddingLead, setIsAddingLead] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [totalLeads, setTotalLeads] = useState(0)
    const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; email: string }[]>([])
    const [assigneeInput, setAssigneeInput] = useState("")
    const [isCustomAssignee, setIsCustomAssignee] = useState(false)
    const [formErrors, setFormErrors] = useState<{ phone?: string; email?: string }>({})

    // Timeline states
    const [noteInput, setNoteInput] = useState("")
    const [isSendingNote, setIsSendingNote] = useState(false)
    const timelineRef = useRef<HTMLDivElement>(null)

    // Inventory Data State
    const [properties, setProperties] = useState<any[]>([])
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
    const [selectedUnitId, setSelectedUnitId] = useState<string>("")

    // Derived Logic — useMemo prevents unnecessary recalculation on unrelated re-renders
    const selectedLead = useMemo(
        () => leads.find(l => l.id === selectedLeadId || toId(l._id) === selectedLeadId),
        [leads, selectedLeadId]
    )

    const filteredLeads = useMemo(() => leads, [leads])

    const handleManualSync = async () => {
        setIsSyncing(true)
        try {
            await fetchLeads(searchQuery, false)
            console.log("[System] Lead synchronization initiated...")
            // Small artificial delay for visual feedback of "work being done"
            await new Promise(r => setTimeout(r, 800))
        } finally {
            setIsSyncing(false)
        }
    }

    const handleAddLead = async () => {
        const name = newLeadForm.name.trim()
        const phone = newLeadForm.phone.trim()
        const email = newLeadForm.email.trim()

        // Comprehensive Validation
        const errors: { phone?: string; email?: string } = {}
        
        // Phone validation (Basic: check if it's 10 digits or matches standard patterns)
        const phoneRegex = /^[0-9\s+()-]{10,15}$/
        if (!phone) {
            errors.phone = "Phone number is required"
        } else if (!phoneRegex.test(phone)) {
            errors.phone = "Invalid phone number format"
        }

        // Email validation (optional but must be valid if provided)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (email && !emailRegex.test(email)) {
            errors.email = "Invalid email address format"
        }

        if (Object.keys(errors).length > 0 || !name) {
            setFormErrors(errors)
            if (!name) alert("Name is required")
            return
        }

        setIsAddingLead(true)
        setFormErrors({})

        // Optimistic insert — add a temporary card instantly
        const tempId = `temp-${Date.now()}`;
        const optimisticLead: any = {
            id: tempId, _id: tempId,
            name, phone,
            email: newLeadForm.email,
            status: "Fresh",
            isTokenPaid: false,
            requirement: newLeadForm.requirement,
            budget: newLeadForm.budget,
            source: newLeadForm.source,
            assignee: newLeadForm.assignee || assigneeInput || "Unassigned",
            lastActivity: new Date().toISOString(),
            notes: [],
            timeline: [{ title: "Lead Created", desc: "Creating...", type: "system", date: new Date().toISOString() }],
        };
        upsertLead(optimisticLead);
        setTotalLeads(prev => prev + 1);

        // Close modal immediately for snappy UX
        setIsAddLeadOpen(false);
        const formSnapshot = { ...newLeadForm, assignee: newLeadForm.assignee || assigneeInput || "" };
        setNewLeadForm({ name: "", phone: "", email: "", requirement: "2BHK", budget: "50L - 1Cr", source: "Manual Entry", assignee: "" });
        setAssigneeInput("");
        setIsCustomAssignee(false);

        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formSnapshot)
            });

            if (res.ok) {
                const data = await res.json();
                if (data.lead) {
                    const sid = toId(data.lead._id || data.lead.id);
                    const realLead = { ...data.lead, id: sid, _id: sid, timeline: data.lead.timeline || [] };
                    removeLead(tempId);
                    upsertLead(realLead);
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                removeLead(tempId);
                setTotalLeads(prev => Math.max(0, prev - 1));
                alert(errData.message || "Failed to save lead. Please try again.");
            }
        } catch (error) {
            console.error("Error adding lead:", error);
            removeLead(tempId);
            setTotalLeads(prev => Math.max(0, prev - 1));
            alert("Network error — lead could not be saved.");
        } finally {
            setIsAddingLead(false);
        }
    }

    // Load Leads — isInitial flag prevents skeleton flash on search/filter calls
    const fetchLeads = async (search?: string, isInitial = false) => {
        if (isInitial) setIsLoadingLeads(true)
        try {
            const params = new URLSearchParams()
            if (search) params.set("search", search)
            const res = await fetch(`/api/leads?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                if (data.leads) {
                    const mappedLeads = data.leads.map((l: any) => ({
                        ...l,
                        id: toId(l._id || l.id),
                        _id: toId(l._id || l.id),
                        timeline: l.timeline || []
                    }))
                    setInitialLeads(mappedLeads)
                    setTotalLeads(data.total || mappedLeads.length)
                }
            }
        } catch (error) {
            console.error("Error fetching leads:", error)
        } finally {
            setIsLoadingLeads(false)
        }
    }

    // --- Enterprise Background Reconciliation Worker ---
    useEffect(() => {
        const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

        const syncWorker = async () => {
            try {
                const res = await fetch("/api/leads/sync");
                if (res.ok) {
                    const data = await res.json();
                    if (data.snapshot) {
                        const desyncedIds = useCRMStore.getState().reconcileState(data.snapshot);
                        if (desyncedIds.length > 0) {
                            console.warn(`[Reconciler] Detected ${desyncedIds.length} missing/stale leads. Triggering hard refetch...`);
                            fetchLeads("", false);
                        } else {
                            console.log("[Reconciler] Zustand state perfectly synchronized with MongoDB Atlas.");
                        }
                    }
                }
            } catch (err) {
                console.error("[Reconciler] Failed to reach sync endpoint:", err);
            }
        };

        const intervalId = setInterval(syncWorker, SYNC_INTERVAL);
        return () => clearInterval(intervalId);
    }, []);

    const fetchTeam = async () => {
        try {
            const res = await fetch("/api/team")
            if (res.ok) {
                const data = await res.json()
                if (data.members && data.members.length > 0) {
                    setTeamMembers(data.members)
                }
            }
        } catch (err) {
            console.error("Failed to fetch team", err)
        }
    }

    const fetchProperties = async () => {
        try {
            const res = await fetch("/api/properties")
            if (res.ok) {
                const data = await res.json()
                if (data.properties) {
                    setProperties(data.properties)
                }
            }
        } catch (error) {
            console.error("Error fetching properties:", error)
        }
    }

    useEffect(() => {
        fetchLeads(undefined, true)  // isInitial=true → show skeleton only on first load
        fetchProperties()
        fetchTeam()

        // Establish SSE Connection
        const eventSource = new EventSource("/api/leads/stream");
        
        eventSource.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === "CONNECTED" || payload.type === "HEARTBEAT") {
                    // keep-alive, do nothing
                } else if (payload.type === "LEAD_CREATED") {
                    console.log("[SSE] New Lead Created:", payload.leadId);
                    const sid = toId(payload.data?._id || payload.leadId);
                    const realLead = { ...payload.data, id: sid, _id: sid, timeline: payload.data?.timeline || [] };
                    
                    // Logic to handle potential optimistic temp card
                    const tempCard = leads.find(l => l.id?.startsWith("temp-") && l.phone === realLead.phone);
                    if (tempCard) {
                        removeLead(tempCard.id);
                    }
                    
                    upsertLead(realLead);
                    setTotalLeads(c => c + 1);
                } else if (payload.type === "LEAD_UPDATED") {
                    console.log("[SSE] Lead Updated:", payload.leadId);
                    if (payload.data) {
                        const sid = toId(payload.data._id || payload.leadId);
                        upsertLead({ ...payload.data, id: sid, _id: sid, timeline: payload.data.timeline || [] });
                    }
                } else if (payload.type === "LEAD_DELETED") {
                    removeLead(payload.leadId);
                    setTotalLeads(prev => Math.max(0, prev - 1));
                }
            } catch (err) {
                logger.error("Failed to parse SSE payload", err);
            }
        };

        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        eventSource.onerror = (err) => {
            logger.error("SSE Connection Error — will auto-reconnect in 5s", err);
            eventSource.close();
            // Auto-reconnect: refresh leads and re-establish SSE by remounting effect
            reconnectTimer = setTimeout(() => {
                fetchLeads();
            }, 5000);
        };

        return () => {
            eventSource.close();
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, [])

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        e.dataTransfer.setData("leadId", toId(leadId))
    }

    const handleDrop = async (e: React.DragEvent, status: LeadStatus) => {
        const leadId = e.dataTransfer.getData("leadId")
        if (!leadId) return;

        const lead = leadsById[leadId];
        if (!lead || lead.status === status) return;
        
        const oldStatus = lead.status;
        const mutationId = uuidv4();

        // Idempotent optimistic update
        optimisticUpdateStatus(leadId, status, mutationId);

        try {
            const res = await offlineSafeFetch(`/api/leads/${leadId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, clientMutationId: mutationId })
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || errData.message || `HTTP ${res.status}`)
            }

            if ((res as any).isOfflineQueued) {
                logger.info("Lead status update queued offline");
                return;
            }

            const updatedData = await res.json()
            if (updatedData.lead) {
                console.log("[DB] Lead updated successfully in MongoDB:", leadId);
                const sid = toId(updatedData.lead._id || updatedData.lead.id);
                resolveTransaction(mutationId);
                upsertLead({ ...updatedData.lead, id: sid, _id: sid, timeline: updatedData.lead.timeline || [] });
            }
        } catch (err: any) {
            console.error("Drop error:", err?.message || err)
            failTransaction(mutationId);
            // Rollback optimistic update
            optimisticUpdateStatus(leadId, oldStatus, `rollback-${mutationId}`);
            alert(`Failed to move lead: ${err?.message || "Please try again"}`)
        }
    }

    const handleDeleteLead = async (leadId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation(); 
        
        if (!confirm("Are you sure you want to permanently delete this lead? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`/api/leads/${leadId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                removeLead(leadId);
                setTotalLeads(prev => Math.max(0, prev - 1));
                console.log("[System] Lead deleted successfully:", leadId);
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.error || "Failed to delete lead");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("An error occurred while deleting the lead.");
        }
    }

    useEffect(() => {
        if (viewMode === 'profile' && timelineRef.current) {
            timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
        }
    }, [selectedLead?.timeline, viewMode])

    const openProfile = (id: string) => {
        setSelectedLeadId(toId(id))
        setViewMode("profile")
        // Reset inventory selection when opening new profile
        setSelectedPropertyId("")
        setSelectedUnitId("")
    }

    const handleAddNote = async () => {
        if (!noteInput.trim() || !selectedLead) return;
        const currentLeadId = toId(selectedLead.id || selectedLead._id);

        // Guard: don't send note to a temp lead not yet in DB
        if (!currentLeadId || currentLeadId.startsWith("temp-")) {
            alert("Please wait — lead is still being saved to the database.");
            return;
        }

        setIsSendingNote(true);
        const noteText = noteInput.trim();
        setNoteInput("");

        // Optimistic timeline update
        const optimisticEntry = {
            title: "Note Added",
            desc: noteText,
            type: "note",
            date: new Date().toISOString()
        };
        upsertLead({ ...selectedLead, timeline: [optimisticEntry, ...(selectedLead.timeline || [])] });

        try {
            const res = await offlineSafeFetch(`/api/leads/${currentLeadId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ actionType: "Note Added", actionDesc: noteText })
            });
            if (res.ok && !(res as any).isOfflineQueued) {
                const data = await res.json().catch(() => ({}));
                if (data.lead) {
                    upsertLead({ ...data.lead, id: toId(data.lead._id), timeline: data.lead.timeline || [] });
                }
            }
        } catch (error) {
            console.error("Failed to send note", error);
            // Rollback optimistic note on failure
            upsertLead({ ...selectedLead, timeline: (selectedLead.timeline || []).filter(e => e !== optimisticEntry) });
            setNoteInput(noteText); // restore text
        } finally {
            setIsSendingNote(false);
        }
    }

    const updateLeadStatus = async (rawId: string | any, status: LeadStatus) => {
        const id = toId(rawId); // normalize to clean string first
        if (!id || id.startsWith("temp-")) {
            console.warn("updateLeadStatus: skipped — invalid or temp ID:", id);
            return;
        }

        const lead = leadsById[id];
        if (!lead) return;
        
        const oldStatus = lead.status;
        upsertLead({ ...lead, status });

        try {
            const res = await fetch(`/api/leads/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || errData.message || `HTTP ${res.status}`)
            }

            const updatedData = await res.json()
            if (updatedData.lead) {
                const sid = toId(updatedData.lead._id || updatedData.lead.id);
                upsertLead({ ...updatedData.lead, id: sid, _id: sid, timeline: updatedData.lead.timeline || [] });
            }
        } catch (err: any) {
            console.error("Status update error:", err?.message || err)
            upsertLead({ ...lead, status: oldStatus }); // rollback
            alert(`Status update failed: ${err?.message || "Please try again"}`)
        }
    }

    const handleBlockUnit = async () => {
        if (!selectedLead || !selectedPropertyId || !selectedUnitId) return

        try {
            // 1. Update Unit Status in DB
            const unitRes = await fetch(`/api/units/${selectedUnitId}?propertyId=${selectedPropertyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "reserved",
                    customerName: selectedLead.name,
                    customerPhone: selectedLead.phone,
                    bookingDate: new Date().toISOString()
                })
            })

            if (!unitRes.ok) throw new Error("Failed to reserve unit in inventory")

            // 2. Update Lead Status and Interest in DB
            const leadRes = await fetch(`/api/leads/${selectedLead.id || selectedLead._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "Negotiation",
                    interestedUnit: selectedUnitId, // Storing ID for link
                    actionType: "Unit Reserved",
                    actionDesc: `Reserved Unit via CRM Console`
                })
            })

            if (!leadRes.ok) throw new Error("Failed to update lead record")

            const updatedLeadData = await leadRes.json()
            if (updatedLeadData.lead) {
                upsertLead({ ...updatedLeadData.lead, id: toId(updatedLeadData.lead._id) });
            }

            alert(`Unit has been reserved for ${selectedLead.name}!`)
            setSelectedUnitId("")
            fetchProperties() // Refresh inventory state
        } catch (err: any) {
            console.error("Blocking error:", err)
            alert(err.message || "Failed to reserve unit")
        }
    }

    // --- PIPELINE VIEW ---
    const PipelineBoard = () => {
        const allColumns: LeadStatus[] = ["Fresh", "Token VIP", "Connected", "Site Visit", "Negotiation", "Booked"]

        return (
            <div className="h-full overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-[1200px] h-full">
                    {allColumns.map(col => (
                        <div
                            key={col}
                            className="w-72 flex-shrink-0 flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, col)}
                        >
                            {/* Column Header */}
                            <div className={`p-3 border-b flex justify-between items-center rounded-t-xl
                                ${col === "Token VIP" ? "bg-amber-100 dark:bg-amber-900/40 border-amber-200" : "bg-white dark:bg-slate-900"}
                            `}>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{col}</span>
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                        {filteredLeads.filter(l => l.status === col).length}
                                    </Badge>
                                </div>
                                {col === "Token VIP" && <Crown className="h-4 w-4 text-amber-600 animate-pulse" />}
                            </div>

                            {/* Cards Area */}
                            <div className="p-2 flex-1 overflow-y-auto space-y-2 min-h-[100px]">
                                {filteredLeads.filter(l => l.status === col).map((lead, idx) => (
                                    <div
                                        key={lead.id || `lead-${idx}`}
                                        draggable="true"
                                        onDragStart={(e) => handleDragStart(e, toId(lead.id || lead._id))}
                                        onClick={() => openProfile(toId(lead.id || lead._id))}
                                        className={`
                                            p-3 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-all relative group
                                            ${lead.isTokenPaid
                                                ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-700"
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-gray-100">{lead.name}</h4>
                                            {lead.isTokenPaid && <Crown className="h-3 w-3 text-amber-600" />}
                                        </div>

                                        <div className="text-xs text-muted-foreground space-y-1 mb-2">
                                            {lead.phone && <p className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">{lead.phone}</p>}
                                            {lead.requirement && <p className="flex items-center gap-1"><User className="h-3 w-3" /> {lead.requirement}</p>}
                                            {lead.source && (
                                                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100">
                                                    {lead.source}
                                                </span>
                                            )}
                                            {lead.assignee && <p className="text-slate-400 text-[10px]">👤 {lead.assignee}</p>}
                                        </div>

                                        {/* Hover Actions */}
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex flex-col items-center gap-1 z-10">
                                            <GripVertical className="h-4 w-4 text-slate-400" />
                                            <button 
                                                onClick={(e) => handleDeleteLead(lead.id || lead._id, e)}
                                                className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {/* Empty State */}
                                {filteredLeads.filter(l => l.status === col).length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 px-3 text-center">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-2">
                                            <Users className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <p className="text-[11px] text-slate-400">Drop leads here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // --- PROFILE VIEW (KUNDALI) ---
    const LeadProfile = () => {
        if (!selectedLead) return null

        // Filter available units for selected property
        const activeProperty = properties.find(p => (p._id || p.id) === selectedPropertyId);
        const availableUnits = activeProperty?.details?.generatedUnits?.filter((u: any) => u.status === "available" || !u.status) || [];

        return (
            <div className="h-full flex flex-col md:flex-row gap-6">
                {/* Left: Customer Bio */}
                <Card className="w-full md:w-1/4 h-full border-slate-200 dark:border-slate-800 flex flex-col">
                    <CardHeader className="text-center pb-2 border-b bg-slate-50 dark:bg-slate-900">
                        <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                            {selectedLead.name.charAt(0)}
                        </div>
                        <CardTitle className="flex items-center justify-center gap-2">
                            {selectedLead.name}
                            {selectedLead.isTokenPaid && <Crown className="h-5 w-5 text-amber-500 fill-amber-500" />}
                        </CardTitle>
                        <CardDescription>{selectedLead.phone} (Verified)</CardDescription>
                        <Badge className={`mx-auto mt-2 ${selectedLead.isTokenPaid ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`} variant="outline">
                            {selectedLead.status}
                        </Badge>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 space-y-4 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Requirement</p>
                            <p className="font-medium">{selectedLead.requirement}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Budget</p>
                            <p className="font-medium">{selectedLead.budget}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Source</p>
                            <p className="font-medium">{selectedLead.source}</p>
                        </div>
                        {selectedLead.interestedUnit && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
                                <p className="text-green-800 dark:text-green-300 text-xs font-bold mb-1 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Unit Reserved
                                </p>
                                <p className="font-medium text-sm">{selectedLead.interestedUnit}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Assignee</p>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                                    {selectedLead.assignee.charAt(0)}
                                </div>
                                <span>{selectedLead.assignee}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Center: Activity Timeline */}
                <Card className="flex-1 h-full border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                    <CardHeader className="pb-3 border-b bg-white dark:bg-slate-900">
                        <CardTitle className="text-lg flex justify-between items-center">
                            Activity Timeline
                            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Realtime Sync Active
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <div ref={timelineRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* We reverse the array so newest is at the bottom for a chat feel */}
                        {[...(selectedLead.timeline || [])].reverse().map((event, i) => {
                            const isSystem = event.type === 'system';
                            const isNote = event.type === 'note';
                            
                            if (isSystem) {
                                return (
                                    <div key={i} className="flex justify-center w-full my-4">
                                        <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] py-1 px-3 rounded-full shadow-sm border border-slate-200 flex items-center gap-1.5">
                                            <Activity className="h-3 w-3" />
                                            <span>{event.desc}</span>
                                            <span className="opacity-50 ml-1">
                                                {event.date ? new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    </div>
                                )
                            }

                            if (isNote) {
                                return (
                                    <div key={i} className="flex flex-col items-end w-full space-y-1">
                                        <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                                            <p className="text-sm">{event.desc}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground pr-1">
                                            {event.date ? new Date(event.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                        </span>
                                    </div>
                                )
                            }

                            // Standard Event (Call, Visit, Booking)
                            return (
                                <div key={i} className="flex flex-col items-start w-full space-y-1">
                                    <div className="flex items-end gap-2">
                                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white shadow-sm
                                            ${event.type === 'call' ? 'bg-indigo-500' :
                                              event.type === 'visit' ? 'bg-orange-500' :
                                              event.type === 'booking' ? 'bg-green-500' : 'bg-slate-500'}
                                        `}>
                                            {event.type === 'call' && <Phone className="h-4 w-4" />}
                                            {event.type === 'visit' && <MapPin className="h-4 w-4" />}
                                            {event.type === 'booking' && <Lock className="h-4 w-4" />}
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm border border-slate-100 dark:border-slate-700">
                                            <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">{event.desc}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground pl-10">
                                        {event.date ? new Date(event.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    {/* Activity Input */}
                    <div className="p-4 bg-white dark:bg-slate-900 border-t flex gap-2">
                        <Input 
                            placeholder="Type a note..." 
                            className="bg-slate-50 dark:bg-slate-800 rounded-full px-4" 
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                            disabled={isSendingNote}
                        />
                        <Button 
                            size="icon" 
                            className="shrink-0 rounded-full h-10 w-10 bg-blue-600 hover:bg-blue-700"
                            onClick={handleAddNote}
                            disabled={isSendingNote || !noteInput.trim()}
                        >
                            {isSendingNote ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send className="h-4 w-4 ml-1" />}
                        </Button>
                    </div>
                </Card>

                {/* Right: Action Console */}
                <Card className="w-full md:w-1/4 h-full border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto">
                    <CardHeader className="pb-3 border-b bg-slate-50 dark:bg-slate-900">
                        <CardTitle className="text-lg">Action Console</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 p-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Change Status</label>
                            <Select
                                value={selectedLead.status}
                                onValueChange={(val: LeadStatus) => updateLeadStatus(selectedLead.id || selectedLead._id, val)}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Fresh">Fresh</SelectItem>
                                    <SelectItem value="Connected">Connected</SelectItem>
                                    <SelectItem value="Site Visit">Site Visit</SelectItem>
                                    <SelectItem value="Negotiation">Negotiation</SelectItem>
                                    <SelectItem value="Booked">Booked</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Unit Allocation Section */}
                        <div className="space-y-3 p-3 border rounded-lg bg-orange-50 dark:bg-orange-900/10 border-orange-200">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-orange-600" />
                                Unit Interest
                            </h4>
                            {properties.length > 0 ? (
                                <div className="space-y-2">
                                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                                            <SelectValue placeholder="Select Property" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {properties.map(p => (
                                                <SelectItem key={p._id || p.id} value={p._id || p.id}>{p.name || p.townshipName || "Property"}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={selectedUnitId} onValueChange={setSelectedUnitId} disabled={!selectedPropertyId}>
                                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                                            <SelectValue placeholder="Available Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableUnits.map((u: any, idx: number) => (
                                                <SelectItem key={u.id || `unit-${idx}`} value={u.id || `unit-${idx}`}>{u.unitNumber} ({u.configuration})</SelectItem>
                                            ))}
                                            {availableUnits.length === 0 && <SelectItem key="none" value="none" disabled>No Units Available</SelectItem>}
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        className="w-full h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white"
                                        disabled={!selectedUnitId}
                                        onClick={handleBlockUnit}
                                    >
                                        <Lock className="h-3 w-3 mr-1" /> Reserve Unit
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">No inventory data found.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Quick Actions</label>
                            <Button 
                                variant="outline" 
                                className="w-full justify-start gap-2 h-9 text-sm"
                                onClick={async () => {
                                    window.open(`https://wa.me/${selectedLead.phone.replace(/\s+/g, '')}`, '_blank')
                                    await fetch(`/api/leads/${selectedLead.id || selectedLead._id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ actionType: "WhatsApp Sent", actionDesc: "Opened WhatsApp chat" })
                                    })
                                    fetchLeads()
                                }}
                            >
                                <MessageSquare className="h-4 w-4 text-blue-600" /> Send WhatsApp
                            </Button>
                            <Button 
                                variant="outline" 
                                className={`w-full justify-start gap-2 h-9 text-sm ${selectedLead.status === "Junk" ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-red-600 hover:text-red-700 hover:bg-red-50"}`}
                                onClick={() => updateLeadStatus(selectedLead.id || selectedLead._id, (selectedLead.status === "Junk" ? "Fresh" : "Junk") as any)}
                            >
                                {selectedLead.status === "Junk" ? (
                                    <><CheckCircle2 className="h-4 w-4" /> Unmark as Junk</>
                                ) : (
                                    <><XCircle className="h-4 w-4" /> Mark as Junk</>
                                )}
                            </Button>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                            <h4 className="font-medium text-sm mb-3">Documents</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                    <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" /> Cost Sheet</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6"><ArrowUpRight className="h-3 w-3" /></Button>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        )
    }

    // --- LIST VIEW ---
    const LeadList = () => (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredLeads.map((lead, idx) => (
                        <TableRow key={lead.id || lead._id || `lead-row-${idx}`} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900" onClick={() => openProfile(lead.id || lead._id)}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {lead.name}
                                    {lead.isTokenPaid && <Crown className="h-3 w-3 text-amber-500" />}
                                </div>
                                <div className="text-xs text-muted-foreground">{lead.phone}</div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{lead.status}</Badge></TableCell>
                            <TableCell>{lead.assignee || "Unassigned"}</TableCell>
                            <TableCell>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => openProfile(lead.id || lead._id)}>View</Button>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={(e) => handleDeleteLead(lead.id || lead._id, e)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
            {/* Top Toolbar */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'pipeline' ? 'secondary' : 'ghost'}
                        onClick={() => setViewMode('pipeline')}
                        className="gap-2"
                    >
                        <TrendingUp className="h-4 w-4" /> Pipeline
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        onClick={() => setViewMode('list')}
                        className="gap-2"
                    >
                        <Users className="h-4 w-4" /> Master List
                    </Button>
                    <Button
                        variant={viewMode === 'analytics' ? 'secondary' : 'ghost'}
                        onClick={() => setViewMode('analytics')}
                        className="gap-2"
                    >
                        <Activity className="h-4 w-4" /> Analytics
                    </Button>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value)
                                fetchLeads(e.target.value)
                            }}
                            className="pl-9 pr-3 py-1.5 h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Lead Count */}
                    <span className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {totalLeads} Lead{totalLeads !== 1 ? "s" : ""}
                    </span>
                    {/* Lead Fetch System UI */}
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col items-end mr-1">
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter leading-none">System Status</span>
                            <span className="text-[9px] text-muted-foreground leading-none">Ready to Sync</span>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className={`
                                h-8 px-3 gap-2 transition-all duration-300 border-blue-200 dark:border-blue-900/50 hover:border-blue-500 
                                ${isSyncing ? "bg-blue-50 dark:bg-blue-900/20" : "bg-white dark:bg-slate-900"}
                            `}
                        >
                            <div className="relative">
                                <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isSyncing ? "animate-spin" : ""}`} />
                                {!isSyncing && <div className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse border border-white dark:border-slate-900" />}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {isSyncing ? "Fetching..." : "Fetch Leads"}
                            </span>
                        </Button>
                    </div>
                    <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 text-white h-9">
                                <UserPlus className="h-4 w-4 mr-2" /> Add Lead
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Lead</DialogTitle>
                                <DialogDescription>Manually enter a new lead into the CRM.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input id="name" value={newLeadForm.name} onChange={e => setNewLeadForm({...newLeadForm, name: e.target.value})} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="phone" className="text-right mt-2">Phone</Label>
                                    <div className="col-span-3 space-y-1">
                                        <Input 
                                            id="phone" 
                                            value={newLeadForm.phone} 
                                            onChange={e => {
                                                setNewLeadForm({...newLeadForm, phone: e.target.value})
                                                if (formErrors.phone) setFormErrors({...formErrors, phone: undefined})
                                            }} 
                                            className={formErrors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        />
                                        {formErrors.phone && <p className="text-[10px] text-red-500 font-medium">{formErrors.phone}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="email" className="text-right mt-2">Email</Label>
                                    <div className="col-span-3 space-y-1">
                                        <Input 
                                            id="email" 
                                            type="email" 
                                            value={newLeadForm.email} 
                                            onChange={e => {
                                                setNewLeadForm({...newLeadForm, email: e.target.value})
                                                if (formErrors.email) setFormErrors({...formErrors, email: undefined})
                                            }} 
                                            className={formErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        />
                                        {formErrors.email && <p className="text-[10px] text-red-500 font-medium">{formErrors.email}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="source" className="text-right">Source</Label>
                                    <Select value={newLeadForm.source} onValueChange={v => setNewLeadForm({...newLeadForm, source: v})}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select Source" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["Manual Entry","Website","WhatsApp","Facebook Ad","Instagram Ad","Walk-in","Referral"].map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="requirement" className="text-right">Requirement</Label>
                                    <Select value={newLeadForm.requirement} onValueChange={v => setNewLeadForm({...newLeadForm, requirement: v})}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select Requirement" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["1BHK","2BHK","3BHK","3BHK + Study","4BHK","Duplex","Penthouse","Plot","Commercial"].map(r => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="budget" className="text-right">Budget</Label>
                                    <Select value={newLeadForm.budget} onValueChange={v => setNewLeadForm({...newLeadForm, budget: v})}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select Budget" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["Under 30L","30L - 50L","50L - 1Cr","1Cr - 1.5Cr","1.5Cr - 2Cr","2Cr - 3Cr","3Cr+"].map(b => (
                                                <SelectItem key={b} value={b}>{b}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="assignee" className="text-right mt-2">Assignee</Label>
                                    <div className="col-span-3 space-y-2">
                                        {!isCustomAssignee ? (
                                            <Select
                                                value={newLeadForm.assignee}
                                                onValueChange={v => {
                                                    if (v === "__custom__") {
                                                        setIsCustomAssignee(true)
                                                        setNewLeadForm({...newLeadForm, assignee: ""})
                                                        setAssigneeInput("")
                                                    } else {
                                                        setNewLeadForm({...newLeadForm, assignee: v})
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="w-full h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                                    <SelectValue placeholder="Select or type assignee" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__custom__" className="text-blue-600 font-medium cursor-pointer">
                                                        ✏️ Type Custom Name
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="relative group">
                                                <Input
                                                    type="text"
                                                    placeholder="Enter assignee name..."
                                                    value={assigneeInput}
                                                    onChange={e => {
                                                        const val = e.target.value
                                                        setAssigneeInput(val)
                                                        setNewLeadForm({...newLeadForm, assignee: val})
                                                    }}
                                                    className="w-full h-9 pr-8 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                                <button 
                                                    onClick={() => {
                                                        setIsCustomAssignee(false)
                                                        setNewLeadForm({...newLeadForm, assignee: ""})
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                    title="Back to list"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-muted-foreground px-1">
                                            {isCustomAssignee ? "Manually typing custom assignee" : "Select from team or type a new name"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleAddLead}
                                    disabled={isAddingLead || !newLeadForm.name.trim() || !newLeadForm.phone.trim()}
                                    className="bg-blue-600 text-white min-w-[130px]"
                                >
                                    {isAddingLead ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Creating Lead...
                                        </div>
                                    ) : "Save Lead"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
                {isLoadingLeads && viewMode !== 'profile' ? (
                    <div className="h-full flex gap-4 overflow-hidden pt-4 pb-4 px-2">
                        {[1, 2, 3, 4, 5].map((col) => (
                            <div key={col} className="w-72 flex-shrink-0 space-y-4">
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-32 w-full rounded-lg" />
                                <Skeleton className="h-32 w-full rounded-lg" />
                                <Skeleton className="h-32 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                    {/* ⚠️ IMPORTANT: Call as render-functions (not JSX components) to prevent
                        React from unmounting/remounting the board on every state update */}
                    {viewMode === 'pipeline' && PipelineBoard()}
                    {viewMode === 'list' && LeadList()}
                        {viewMode === 'analytics' && (() => {
                            const statuses = ["Fresh","Token VIP","Connected","Site Visit","Negotiation","Booked"]
                            const sources = ["Website","WhatsApp","Facebook Ad","Instagram Ad","Walk-in","Referral","Manual Entry"]
                            return (
                                <div className="h-full overflow-y-auto p-4 space-y-4">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: "Total Leads", value: leads.length, color: "blue" },
                                            { label: "Fresh", value: leads.filter(l=>l.status==="Fresh").length, color: "slate" },
                                            { label: "Booked", value: leads.filter(l=>l.status==="Booked").length, color: "green" },
                                            { label: "Junk", value: leads.filter(l=>(l.status as any)==="Junk").length, color: "red" },
                                        ].map(s => (
                                            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                                                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                                                <p className="text-2xl font-bold">{s.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Pipeline Breakdown */}
                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                                        <h3 className="font-semibold mb-3 text-sm">Pipeline Breakdown</h3>
                                        <div className="space-y-2">
                                            {statuses.map(s => {
                                                const count = leads.filter(l=>l.status===s).length
                                                const pct = leads.length > 0 ? Math.round((count/leads.length)*100) : 0
                                                return (
                                                    <div key={s} className="flex items-center gap-3">
                                                        <span className="w-24 text-xs text-right text-muted-foreground">{s}</span>
                                                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                                            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{width:`${pct}%`}} />
                                                        </div>
                                                        <span className="text-xs font-medium w-8 text-right">{count}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    {/* Source Breakdown */}
                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                                        <h3 className="font-semibold mb-3 text-sm">Lead Sources</h3>
                                        <div className="space-y-2">
                                            {sources.map(s => {
                                                const count = leads.filter(l=>l.source===s).length
                                                if (count === 0) return null
                                                const pct = leads.length > 0 ? Math.round((count/leads.length)*100) : 0
                                                return (
                                                    <div key={s} className="flex items-center gap-3">
                                                        <span className="w-24 text-xs text-right text-muted-foreground">{s}</span>
                                                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                                            <div className="bg-violet-500 h-2 rounded-full transition-all" style={{width:`${pct}%`}} />
                                                        </div>
                                                        <span className="text-xs font-medium w-8 text-right">{count}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}
                    </>
                )}
                {viewMode === 'profile' && (
                    <div className="h-full flex flex-col">
                        <Button variant="ghost" className="self-start mb-2 gap-2" onClick={() => setViewMode('pipeline')}>
                            ← Back to Board
                        </Button>
                        <div className="flex-1 min-h-0">
                            {LeadProfile()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
