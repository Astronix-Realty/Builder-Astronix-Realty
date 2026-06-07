"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
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
    Building2, Lock, RefreshCw, Database, Trash2, Home, ArrowRight, ArrowLeft, Split, Merge, Percent, UserMinus
} from "lucide-react"

// --- Types ---
type LeadStatus = "Fresh" | "Token VIP" | "Connected" | "Site Visit" | "Negotiation" | "Final Negotiation" | "Booked" | "Junk"
type Urgency = "Low" | "Medium" | "High"

interface Lead {
    id: string
    _id: string
    name: string
    phone: string
    email?: string | null
    status: LeadStatus
    isTokenPaid: boolean
    requirement?: string
    budget?: string
    source: string
    assignee?: string
    lastActivity?: string
    nextAction?: string
    nextActionTime?: string
    notes: string[]
    timeline: { date: string, title: string, desc: string, type: "call" | "visit" | "system" | "note" | "booking" }[]
    interestedUnit?: string
    builderId?: string
    projectId?: string
    createdAt?: string
    isGroup?: boolean
    groupSize?: number
    groupDiscount?: string
    mergedMembers?: any[]
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


const renderStageExtraFields = (status: string | null, extra: any, setExtra: (val: any) => void) => {
    if (status === "Site Visit") {
        return (
            <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Site Visit Time, Date & Day</label>
                <Input 
                    type="datetime-local" 
                    value={extra.siteVisitDateTime || ""}
                    onChange={(e) => setExtra({ ...extra, siteVisitDateTime: e.target.value })}
                    className="w-full"
                />
            </div>
        )
    }
    if (status === "Negotiation" || status === "Final Negotiation") {
        return (
            <>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Negotiation Amount</label>
                    <Input 
                        placeholder="e.g. ₹50,00,000"
                        value={extra.negotiationAmount || ""}
                        onChange={(e) => setExtra({ ...extra, negotiationAmount: e.target.value })}
                        className="w-full"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Is it all-inclusive? (Parking, etc.)</label>
                    <Input 
                        placeholder="e.g. Yes, all inclusive with parking"
                        value={extra.negotiationInclusive || ""}
                        onChange={(e) => setExtra({ ...extra, negotiationInclusive: e.target.value })}
                        className="w-full"
                    />
                </div>
                {status === "Final Negotiation" && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Any offer given to client?</label>
                        <Input 
                            placeholder="e.g. Yes, modular kitchen free"
                            value={extra.finalOffer || ""}
                            onChange={(e) => setExtra({ ...extra, finalOffer: e.target.value })}
                            className="w-full"
                        />
                    </div>
                )}
            </>
        )
    }
    if (status === "Booked") {
        return (
            <>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Booking Agreement Value</label>
                    <Input 
                        placeholder="e.g. ₹1,20,00,000"
                        value={extra.bookingValue || ""}
                        onChange={(e) => setExtra({ ...extra, bookingValue: e.target.value })}
                        className="w-full"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Tax</label>
                    <Input 
                        placeholder="e.g. 5% GST (₹6,00,000)"
                        value={extra.totalTax || ""}
                        onChange={(e) => setExtra({ ...extra, totalTax: e.target.value })}
                        className="w-full"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount of Astronix Realty</label>
                    <Input 
                        placeholder="e.g. ₹2,40,000"
                        value={extra.brokerageAmount || ""}
                        onChange={(e) => setExtra({ ...extra, brokerageAmount: e.target.value })}
                        className="w-full"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">% of Astronix Realty</label>
                    <Input 
                        placeholder="e.g. 2%"
                        value={extra.astronixPercent || ""}
                        onChange={(e) => setExtra({ ...extra, astronixPercent: e.target.value })}
                        className="w-full"
                    />
                </div>
            </>
        )
    }
    return null;
}

const buildStageExtraNotes = (status: string | null, extra: any) => {
    let notes = "";
    if (status === "Site Visit" && extra.siteVisitDateTime) {
        const d = new Date(extra.siteVisitDateTime);
        notes += `\nSite Visit: ${d.toLocaleString()} (${d.toLocaleDateString('en-US', {weekday: 'long'})})`;
    }
    if ((status === "Negotiation" || status === "Final Negotiation")) {
        if (extra.negotiationAmount) notes += `\nNegotiation Amount: ${extra.negotiationAmount}`;
        if (extra.negotiationInclusive) notes += `\nDetails: ${extra.negotiationInclusive}`;
        if (status === "Final Negotiation" && extra.finalOffer) notes += `\nOffer Given: ${extra.finalOffer}`;
    }
    if (status === "Booked") {
        if (extra.bookingValue) notes += `\nAgreement Value: ${extra.bookingValue}`;
        if (extra.totalTax) notes += `\nTotal Tax: ${extra.totalTax}`;
        if (extra.brokerageAmount) notes += `\nAmount of Astronix Realty: ${extra.brokerageAmount}`;
        if (extra.astronixPercent) notes += `\nAstronix %: ${extra.astronixPercent}`;
    }
    return notes;
}

export function CRMCloneView({ userRole = 'builder' }: { userRole?: 'builder' | 'mandate' }) {
    const storagePrefix = userRole === "mandate" ? "mandate_" : ""
    const [viewMode, setViewMode] = useState<"pipeline" | "list" | "profile" | "analytics">("pipeline")
    
    // Zustand Global State Integration (Role-Isolated)
    const store = useCRMStore()
    const leadsById = store.leadsById[userRole] || {}
    const allLeadIds = store.allLeadIds[userRole] || []

    const setInitialLeads = (leads: any[]) => {
        const sanitizedLeads = leads.map(lead => ({
            ...lead,
            timeline: Array.isArray(lead.timeline) ? lead.timeline.map((t: any) => ({
                ...t,
                desc: t.desc || "No description provided"
            })) : []
        }))
        store.setInitialLeads(userRole, sanitizedLeads)
    }

    const upsertLead = (lead: any) => {
        const sanitizedLead = {
            ...lead,
            timeline: Array.isArray(lead.timeline) ? lead.timeline.map((t: any) => ({
                ...t,
                desc: t.desc || "No description provided"
            })) : []
        }
        store.upsertLead(userRole, sanitizedLead)
    }

    const removeLead = (leadId: string) => store.removeLead(userRole, leadId)
    const optimisticUpdateStatus = (leadId: string, newStatus: LeadStatus, mutationId: string) => store.optimisticUpdateStatus(userRole, leadId, newStatus, mutationId)
    const { resolveTransaction, failTransaction } = store

    const router = useRouter()

    // Map normalized store back to array for UI compatibility, filtering out Website, VIP and Group leads
    const leads = useMemo(() => {
        const rawLeads = allLeadIds.map((id: string) => leadsById[id]).filter(Boolean) as Lead[]
        return rawLeads.filter(lead => {
            if (lead.source?.toLowerCase().includes("website")) return false
            if (lead.status === "Token VIP" || lead.isTokenPaid) return false
            if (lead.isGroup || (lead.groupSize && lead.groupSize > 0)) return false
            return true
        })
    }, [allLeadIds, leadsById])

    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [isLoadingLeads, setIsLoadingLeads] = useState(true)
    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
    const [newLeadForm, setNewLeadForm] = useState({
        name: "", phone: "", email: "", requirement: "2BHK", budget: "50L - 1Cr", source: "Manual Entry", assignee: "",
        isGroup: false, groupSize: 0, groupDiscount: ""
    })
    const [isAddingLead, setIsAddingLead] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [totalLeads, setTotalLeads] = useState(0)
    const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; email: string }[]>([])
    const [assigneeInput, setAssigneeInput] = useState("")
    const [isCustomAssignee, setIsCustomAssignee] = useState(false)
    const [formErrors, setFormErrors] = useState<{ phone?: string; email?: string }>({})
    const [statusFilter, setStatusFilter] = useState<string>("All")
    const [typeFilter, setTypeFilter] = useState<string>("All Types")

    // Timeline states
    const [noteInput, setNoteInput] = useState("")
    const [isSendingNote, setIsSendingNote] = useState(false)
    const timelineRef = useRef<HTMLDivElement>(null)
    const [selectedMemberIdx, setSelectedMemberIdx] = useState<number | null>(null)
    const [memberStatuses, setMemberStatuses] = useState<Record<number, string>>({})

    // Inventory Data State
    const [properties, setProperties] = useState<any[]>([])
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
    const [selectedUnitId, setSelectedUnitId] = useState<string>("")

    // Status Change Dialog State
    const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null)
    const [statusReason, setStatusReason] = useState("")
    const [pendingFollowUp, setPendingFollowUp] = useState("")

    // Kanban Board specific drop state
    const [droppedLead, setDroppedLead] = useState<Lead | null>(null)
    const [pendingBoardStatus, setPendingBoardStatus] = useState<LeadStatus | null>(null)
    const [boardStatusReason, setBoardStatusReason] = useState("")
    const [boardPendingFollowUp, setBoardPendingFollowUp] = useState("")
    const [extraFields, setExtraFields] = useState<any>({})
    const [boardExtraFields, setBoardExtraFields] = useState<any>({})

    // Group Actions Dialog States
    const [isSplitGroupOpen, setIsSplitGroupOpen] = useState(false)
    const [isMergeGroupOpen, setIsMergeGroupOpen] = useState(false)
    const [isReviseOfferOpen, setIsReviseOfferOpen] = useState(false)
    const [reviseOfferForm, setReviseOfferForm] = useState({ currentDiscount: "12", nextDiscount: "15", nextThreshold: "10" })
    const [selectedMergeLeads, setSelectedMergeLeads] = useState<string[]>([])

    // (Mock group lead injections removed from clone view to prevent polluting main CRM store with unwanted leads)

    // Derived Logic — useMemo prevents unnecessary recalculation on unrelated re-renders
    const selectedLead = useMemo(
        () => leads.find(l => l.id === selectedLeadId || toId(l._id) === selectedLeadId),
        [leads, selectedLeadId]
    )

        const filteredLeads = useMemo(() => {
        let allLeads = leads;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            allLeads = allLeads.filter(l => 
                (l.name && l.name.toLowerCase().includes(q)) || 
                (l.phone && l.phone.includes(q)) || 
                (l.email && l.email.toLowerCase().includes(q)) ||
                (l.assignee && l.assignee.toLowerCase().includes(q))
            );
        }

        if (statusFilter !== "All") {
            allLeads = allLeads.filter(l => l.status === statusFilter);
        }
        
        if (typeFilter !== "All Types") {
            if (typeFilter === "Group Buying") {
                allLeads = allLeads.filter(l => l.isGroup);
            } else if (typeFilter === "Token VIP") {
                allLeads = allLeads.filter(l => l.status === "Token VIP" && !l.isGroup);
            } else if (typeFilter === "Normal") {
                allLeads = allLeads.filter(l => !l.isGroup && l.status !== "Token VIP");
            }
        }
        
        return allLeads;
    }, [leads, statusFilter, typeFilter, searchQuery])

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
            isGroup: newLeadForm.isGroup,
            groupSize: newLeadForm.groupSize,
            groupDiscount: newLeadForm.groupDiscount,
            lastActivity: new Date().toISOString(),
            notes: [],
            timeline: [{ title: "Lead Created", desc: "Creating...", type: "system", date: new Date().toISOString() }],
        };
        upsertLead(optimisticLead);
        setTotalLeads(prev => prev + 1);

        // Close modal immediately for snappy UX
        setIsAddLeadOpen(false);
        const formSnapshot = { ...newLeadForm, assignee: newLeadForm.assignee || assigneeInput || "" };
        setNewLeadForm({ name: "", phone: "", email: "", requirement: "2BHK", budget: "50L - 1Cr", source: "Manual Entry", assignee: "", isGroup: false, groupSize: 0, groupDiscount: "" });
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
                        const desyncedIds = useCRMStore.getState().reconcileState(userRole, data.snapshot);
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
        
        if (status === "Token VIP" && !lead.isTokenPaid) {
            alert("Normal and group leads cannot be manually moved to the Token VIP stage.");
            return;
        }

        setDroppedLead(lead);
        setPendingBoardStatus(status);
        setBoardStatusReason("");
        setBoardPendingFollowUp(lead.nextActionTime ? new Date(lead.nextActionTime).toISOString().slice(0,16) : "");
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
        const allColumns: LeadStatus[] = ["Fresh", "Connected", "Site Visit", "Negotiation", "Final Negotiation", "Booked", "Junk"]

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
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="font-semibold text-sm">{col === 'Junk' ? 'Not Interested' : col}</span>
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
                                        draggable={lead.status !== "Booked"}
                                        onDragStart={(e) => {
                                            if (lead.status === "Booked") {
                                                e.preventDefault();
                                                return;
                                            }
                                            handleDragStart(e, toId(lead.id || lead._id));
                                        }}
                                        onClick={() => openProfile(toId(lead.id || lead._id))}
                                        className={`
                                            p-3 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-all relative group
                                            ${lead.isGroup 
                                                ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" 
                                                : lead.isTokenPaid
                                                ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-700"
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-gray-100">{lead.name}</h4>
                                            <div className="flex gap-1">
                                                {lead.isTokenPaid && <Crown className="h-4 w-4 text-amber-600" />}
                                                {lead.isGroup && (
                                                    <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                        <Users className="h-2.5 w-2.5"/> GROUP ({lead.groupSize || 0})
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-xs text-muted-foreground space-y-1 mb-2">
                                            {lead.phone && <p className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">{lead.phone}</p>}
                                            {lead.requirement && <p className="flex items-center gap-1"><User className="h-3 w-3" /> {lead.requirement}</p>}
                                            {lead.isGroup && lead.groupDiscount && (
                                                <p className="text-purple-600 dark:text-purple-400 font-semibold text-[10px] flex items-center gap-1">
                                                    🔥 {lead.groupDiscount}
                                                </p>
                                            )}
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

                <Dialog open={!!pendingBoardStatus} onOpenChange={(open) => { if (!open) { setPendingBoardStatus(null); setBoardExtraFields({}); } }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Update Pipeline Stage</DialogTitle>
                            <DialogDescription>
                                You are moving this lead to <strong className="text-purple-600">{pendingBoardStatus === 'Junk' ? 'Not Interested' : pendingBoardStatus}</strong>. Please provide a reason or log the interaction.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reason / Log</label>
                                <Textarea 
                                    placeholder="E.g., Customer requested site visit on Sunday..."
                                    value={boardStatusReason}
                                    onChange={(e) => setBoardStatusReason(e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-blue-500" /> Schedule Next Follow-up
                                </label>
                                <Input 
                                    type="datetime-local" 
                                    value={boardPendingFollowUp}
                                    onChange={(e) => setBoardPendingFollowUp(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            {renderStageExtraFields(pendingBoardStatus, boardExtraFields, setBoardExtraFields)}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPendingBoardStatus(null)}>Cancel</Button>
                            <Button onClick={async () => {
                                if (!pendingBoardStatus || !droppedLead) return;
                                const leadId = droppedLead.id || droppedLead._id;
                                const oldStatus = droppedLead.status;
                                const status = pendingBoardStatus;
                                const mutationId = uuidv4();

                                const extraNotes = buildStageExtraNotes(pendingBoardStatus, boardExtraFields);
                                let finalReason = boardStatusReason.trim();
                                if (extraNotes) finalReason += (finalReason ? "\n" : "") + extraNotes.trim();

                                const newTimeline = [...(droppedLead.timeline || [])];
                                const updates: any = { status };
                                
                                if (finalReason) {
                                    updates.actionType = "Status Note";
                                    updates.actionDesc = `Changed to ${status === 'Junk' ? 'Not Interested' : status}:\n${finalReason}`;
                                    newTimeline.unshift({
                                        title: "Status Changed",
                                        desc: updates.actionDesc,
                                        type: "system",
                                        date: new Date().toISOString()
                                    });
                                }
                                
                                if (boardPendingFollowUp) {
                                    updates.nextActionTime = new Date(boardPendingFollowUp).toISOString();
                                    const followUpMsg = `Follow-up set for ${new Date(boardPendingFollowUp).toLocaleString()}`;
                                    if (!updates.actionDesc) {
                                        updates.actionType = "Follow-up Scheduled";
                                        updates.actionDesc = followUpMsg;
                                        newTimeline.unshift({
                                            title: "Follow-up Scheduled",
                                            desc: followUpMsg,
                                            type: "system",
                                            date: new Date().toISOString()
                                        });
                                    } else {
                                        updates.actionDesc += ` | ${followUpMsg}`;
                                        if (newTimeline.length > 0) {
                                            newTimeline[0].desc = updates.actionDesc;
                                        }
                                    }
                                }

                                updates.timeline = newTimeline;

                                // Idempotent optimistic update
                                optimisticUpdateStatus(toId(leadId), status, mutationId);
                                upsertLead({ ...droppedLead, ...updates, id: toId(leadId) });

                                setPendingBoardStatus(null);
                                setBoardStatusReason("");
                                setBoardPendingFollowUp("");
                                setBoardExtraFields({});

                                try {
                                    const res: any = await offlineSafeFetch(`/api/leads/${leadId}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ ...updates, clientMutationId: mutationId })
                                    })

                                    if (!res.ok) {
                                        const errData = await res.json().catch(() => ({}))
                                        throw new Error(errData.error || errData.message || `HTTP ${res.status}`)
                                    }

                                    if (res.isOfflineQueued) {
                                        return;
                                    }

                                    const updatedData = await res.json()
                                    if (updatedData.lead) {
                                        const sid = toId(updatedData.lead._id || updatedData.lead.id);
                                        resolveTransaction(mutationId);
                                        upsertLead({ ...updatedData.lead, id: sid, _id: sid, timeline: updatedData.lead.timeline || [] });
                                    }
                                } catch (err: any) {
                                    console.error("Drop error:", err?.message || err)
                                    failTransaction(mutationId);
                                    optimisticUpdateStatus(toId(leadId), oldStatus, `rollback-${mutationId}`);
                                    alert(`Failed to move lead: ${err?.message || "Please try again"}`)
                                }
                            }}>Confirm & Save Log</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                <Card className="w-full md:w-1/4 h-full border-0 shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 flex flex-col overflow-y-auto custom-scrollbar relative">
                    {/* Decorative Top Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 opacity-10"></div>
                    
                    <CardHeader className="text-center pb-4 border-b border-slate-100 dark:border-slate-800 relative pt-8">
                        <div className="relative mx-auto mb-4">
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur opacity-30"></div>
                            <div className="relative w-24 h-24 rounded-full bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto">
                                {selectedLead.name.charAt(0)}
                            </div>
                        </div>
                        <CardTitle className="flex items-center justify-center gap-2 text-xl tracking-tight">
                            {selectedLead.name}
                            {selectedLead.isTokenPaid && <Crown className="h-5 w-5 text-amber-500 fill-amber-500 drop-shadow-sm" />}
                        </CardTitle>
                        <CardDescription className="font-medium mt-1">{selectedLead.phone} <span className="text-green-500 text-[10px] uppercase tracking-wider ml-1 bg-green-50 px-1.5 py-0.5 rounded-full font-bold">Verified</span></CardDescription>
                        <div className="flex justify-center items-center gap-2 mt-4">
                            <Badge className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${selectedLead.isTokenPaid ? "bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 border-0 shadow-sm" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                                {selectedLead.status}
                            </Badge>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-[28px] rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 shadow-sm"
                                onClick={() => router.push(`/builder-dashboard?tab=chat&chatWith=${selectedLead.id || selectedLead._id}`)}
                            >
                                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                Chat
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-5 space-y-5 text-sm overflow-visible pb-10">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Home className="w-3 h-3"/> Req</p>
                                <p className="font-bold text-slate-700 dark:text-slate-200">{selectedLead.requirement}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Budget</p>
                                <p className="font-bold text-slate-700 dark:text-slate-200">{selectedLead.budget}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 col-span-2">
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Search className="w-3 h-3"/> Source</p>
                                <p className="font-bold text-slate-700 dark:text-slate-200">{selectedLead.source}</p>
                            </div>
                        </div>

                        {selectedLead.interestedUnit && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
                                <p className="text-green-800 dark:text-green-300 text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Unit Reserved
                                </p>
                                <p className="font-black text-sm text-green-900 dark:text-green-100">{selectedLead.interestedUnit}</p>
                            </div>
                        )}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2">Assigned Executive</p>
                            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {selectedLead.assignee?.charAt(0) || "?"}
                                </div>
                                <span className="font-semibold text-sm">{selectedLead.assignee || "Unassigned"}</span>
                            </div>
                        </div>

                        {/* DYNAMIC VIP TOKEN SECTION */}
                        {selectedLead.isTokenPaid && (
                            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <h5 className="font-bold text-amber-800 dark:text-amber-400 text-xs mb-2 flex items-center gap-1">
                                    <Crown className="w-3.5 h-3.5"/> VIP Token Receipt
                                </h5>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Amount:</span>
                                        <span className="font-bold text-green-600">₹111.00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Txn ID:</span>
                                        <span className="font-mono text-[10px]">TXN-AST-{selectedLead.id.substring(0,6).toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-amber-200/50">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge className="bg-green-500 text-white text-[9px] px-1 py-0 h-4 border-none">Verified</Badge>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DYNAMIC GROUP SECTION */}
                        {selectedLead.isGroup && (
                            <div className="mt-4 space-y-3">
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                    <h5 className="font-bold text-purple-800 dark:text-purple-400 text-xs mb-2 flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5"/> Group Campaign
                                    </h5>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Members:</span>
                                        <span className="font-bold">{selectedLead.groupSize} Users</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs mt-1">
                                        <span className="text-muted-foreground">Discount:</span>
                                        <span className="font-bold text-purple-600">{selectedLead.groupDiscount}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Group Roster</p>
                                    {Array.from({length: Math.min(3, selectedLead.groupSize || 1)}).map((_, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 border rounded-md text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-[10px]">U{i+1}</div>
                                                <span className="font-medium">User {i+1}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 bg-white">Interested</Badge>
                                        </div>
                                    ))}
                                    {(selectedLead.groupSize || 0) > 3 && (
                                        <p className="text-center text-[10px] text-purple-600 font-semibold mt-1 cursor-pointer hover:underline">
                                            + {(selectedLead.groupSize || 0) - 3} more members
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
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
                                        <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11.5px] py-2 px-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center gap-1 max-w-[85%] text-center">
                                            <div className="flex items-center gap-1.5 font-bold text-slate-400">
                                                <Activity className="h-3 w-3" />
                                                <span>{event.title || 'System Update'}</span>
                                            </div>
                                            <span className="break-words whitespace-pre-wrap leading-relaxed">{event.desc}</span>
                                            <span className="opacity-50 text-[9px] mt-1">
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

                </Card>

                {/* Right: Action Console */}
                <Card className="w-full md:w-1/4 h-full border-0 shadow-xl shadow-slate-200/40 dark:shadow-none bg-gradient-to-b from-blue-50/40 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col overflow-y-auto custom-scrollbar relative">
                    <CardHeader className="pb-4 border-b border-blue-100/50 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-10">
                        <CardTitle className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">Action Console</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 p-5">

                        {/* 2. Pipeline Stage */}
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5"/> Pipeline Stage</label>
                            <Select
                                value={selectedLead.status}
                                disabled={selectedLead.status === "Booked"}
                                onValueChange={(val: LeadStatus) => {
                                    setPendingStatus(val);
                                    setStatusReason("");
                                    setPendingFollowUp(selectedLead.nextActionTime ? new Date(selectedLead.nextActionTime).toISOString().slice(0,16) : "");
                                }}
                            >
                                <SelectTrigger className="h-11 font-bold text-sm bg-white dark:bg-slate-800 rounded-xl shadow-sm border-slate-200 dark:border-slate-700 ring-offset-0 focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Fresh" className="font-semibold cursor-pointer py-2">Fresh (New Inquiry)</SelectItem>
                                    {selectedLead.status === "Token VIP" && <SelectItem value="Token VIP" className="font-semibold cursor-pointer py-2">Token VIP (VIP Booking)</SelectItem>}
                                    <SelectItem value="Connected" className="font-semibold cursor-pointer py-2">Connected (Follow-up)</SelectItem>
                                    <SelectItem value="Site Visit" className="font-semibold cursor-pointer py-2">Site Visit (Property Seen)</SelectItem>
                                    <SelectItem value="Negotiation" className="font-semibold cursor-pointer py-2">Negotiation (Closing)</SelectItem>
                                    <SelectItem value="Final Negotiation" className="font-semibold cursor-pointer py-2">Final Negotiation (Final Deal)</SelectItem>
                                    <SelectItem value="Booked" className="font-semibold cursor-pointer py-2">Booked (Deal Closed)</SelectItem>
                                    <SelectItem value="Junk" className="font-semibold cursor-pointer py-2">Not Interested (Junk)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 3. Unit Blocking (Important for VIP & Group) */}
                        <div className={`space-y-3 p-4 border rounded-2xl shadow-sm transition-all duration-300 ${selectedLead.isTokenPaid ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/10 border-amber-200 shadow-amber-100/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                            <h4 className={`font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${selectedLead.isTokenPaid ? 'text-amber-800 dark:text-amber-400' : 'text-slate-500'}`}>
                                <Building2 className={`h-4 w-4 ${selectedLead.isTokenPaid ? 'text-amber-600' : 'text-slate-400'}`} />
                                {selectedLead.isTokenPaid ? 'Claim VIP Booking' : 'Unit Allocation'}
                            </h4>
                            {properties.length > 0 ? (
                                <div className="space-y-3">
                                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                                        <SelectTrigger className="h-10 text-xs font-semibold bg-white dark:bg-slate-900 rounded-xl border-slate-200">
                                            <SelectValue placeholder="Select Property" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {properties.map(p => (
                                                <SelectItem key={p._id || p.id} value={p._id || p.id} className="text-xs py-2 cursor-pointer">{p.name || p.townshipName || "Property"}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedUnitId} onValueChange={setSelectedUnitId} disabled={!selectedPropertyId}>
                                        <SelectTrigger className="h-10 text-xs font-semibold bg-white dark:bg-slate-900 rounded-xl border-slate-200">
                                            <SelectValue placeholder="Available Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableUnits.map((u: any, idx: number) => (
                                                <SelectItem key={u.id || `unit-${idx}`} value={u.id || `unit-${idx}`} className="text-xs py-2 cursor-pointer">{u.unitNumber} ({u.configuration})</SelectItem>
                                            ))}
                                            {availableUnits.length === 0 && <SelectItem key="none" value="none" disabled>No Units Available</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        className={`w-full h-11 text-xs font-bold text-white shadow-md rounded-xl transition-all active:scale-95 ${selectedLead.isTokenPaid ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
                                        disabled={!selectedUnitId}
                                        onClick={handleBlockUnit}
                                    >
                                        <Lock className="h-4 w-4 mr-1.5" /> {selectedLead.isGroup ? 'Reserve Bulk Units' : 'Lock Unit & Sync'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                                    <p className="text-[11px] font-medium text-slate-500">No inventory found.</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Add properties in Dashboard.</p>
                                </div>
                            )}
                        </div>

                        {/* 4. Contact Actions */}
                        <div className="space-y-2.5 pt-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quick Actions</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    variant="outline" 
                                    className="w-full gap-1.5 h-10 text-xs font-bold rounded-xl shadow-sm text-[#075E54] bg-[#25D366]/10 hover:bg-[#25D366]/20 border-[#25D366]/30 transition-transform active:scale-95"
                                    onClick={async () => {
                                        window.open(`https://wa.me/${selectedLead.phone.replace(/\s+/g, '')}`, '_blank')
                                        await offlineSafeFetch(`/api/leads/${selectedLead.id || selectedLead._id}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ actionType: "WhatsApp Sent", actionDesc: "Initiated WhatsApp conversation" })
                                        })
                                    }}
                                >
                                    <MessageSquare className="h-4 w-4" /> WhatsApp
                                </Button>
                                <Button 
                                    variant="outline" 
                                    disabled={selectedLead.status === "Booked"}
                                    className={`w-full gap-1.5 h-10 text-xs font-bold rounded-xl shadow-sm transition-transform active:scale-95 ${selectedLead.status === "Junk" ? "text-slate-600 bg-slate-100 border-slate-200" : "text-red-600 bg-red-50 hover:text-red-700 hover:bg-red-100 border-red-200"}`}
                                    onClick={() => {
                                        setPendingStatus((selectedLead.status === "Junk" ? "Fresh" : "Junk") as any);
                                        setStatusReason("");
                                        setPendingFollowUp(selectedLead.nextActionTime ? new Date(selectedLead.nextActionTime).toISOString().slice(0,16) : "");
                                    }}
                                >
                                    {selectedLead.status === "Junk" ? <><CheckCircle2 className="h-4 w-4" /> Restore</> : <><XCircle className="h-4 w-4" /> Not Interested</>}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Reason Dialog */}
                <Dialog open={!!pendingStatus} onOpenChange={(open) => { if (!open) { setPendingStatus(null); setExtraFields({}); } }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Change Pipeline Stage</DialogTitle>
                            <DialogDescription>
                                You are moving this lead to <strong className="text-foreground">{pendingStatus}</strong>. Please provide a reason or note for this status change.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reason / Note</label>
                                <Textarea 
                                    placeholder="E.g., Customer requested site visit on Sunday..."
                                    value={statusReason}
                                    onChange={(e) => setStatusReason(e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-blue-500" /> Schedule Next Follow-up
                                </label>
                                <Input 
                                    type="datetime-local" 
                                    value={pendingFollowUp}
                                    onChange={(e) => setPendingFollowUp(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            {renderStageExtraFields(pendingStatus, extraFields, setExtraFields)}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPendingStatus(null)}>Cancel</Button>
                            <Button onClick={async () => {
                                if (!pendingStatus || !selectedLead) return;
                                const id = selectedLead.id || selectedLead._id;
                                
                                const extraNotes = buildStageExtraNotes(pendingStatus, extraFields);
                                let finalReason = statusReason.trim();
                                if (extraNotes) finalReason += (finalReason ? "\n" : "") + extraNotes.trim();

                                // 1. Optimistic Update for immediate UI feedback
                                const newTimeline = [...(selectedLead.timeline || [])];
                                const updates: any = {};
                                
                                if (finalReason) {
                                    updates.actionType = "Status Note";
                                    updates.actionDesc = `Changed to ${pendingStatus}:\n${finalReason}`;
                                    newTimeline.unshift({
                                        title: "Status Changed",
                                        desc: updates.actionDesc,
                                        type: "system",
                                        date: new Date().toISOString()
                                    });
                                }
                                
                                if (pendingFollowUp) {
                                    updates.nextActionTime = new Date(pendingFollowUp).toISOString();
                                    if (!updates.actionDesc) {
                                        updates.actionType = "Follow-up Scheduled";
                                        updates.actionDesc = `Follow-up set for ${new Date(pendingFollowUp).toLocaleString()}`;
                                        newTimeline.unshift({
                                            title: "Follow-up Scheduled",
                                            desc: updates.actionDesc,
                                            type: "system",
                                            date: new Date().toISOString()
                                        });
                                    } else {
                                        updates.actionDesc += ` | Next follow-up: ${new Date(pendingFollowUp).toLocaleString()}`;
                                        if (newTimeline.length > 0) {
                                            newTimeline[0].desc = updates.actionDesc;
                                        }
                                    }
                                }

                                // Apply to local state immediately
                                upsertLead({
                                    ...selectedLead,
                                    status: pendingStatus,
                                    nextActionTime: updates.nextActionTime || selectedLead.nextActionTime,
                                    timeline: newTimeline
                                });

                                // 2. Background API Calls - Single request to avoid MongoDB VersionError
                                updates.status = pendingStatus;
                                
                                offlineSafeFetch(`/api/leads/${id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(updates)
                                }).catch(err => {
                                    console.error("Status update error in background:", err);
                                });
                                
                                setPendingStatus(null);
                                setStatusReason("");
                                setPendingFollowUp("");
                                setExtraFields({});
                            }}>Confirm & Save Log</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    // --- GROUP BUYING PROFILE VIEW ---
    const GroupLeadProfile = () => {
        if (!selectedLead) return null;

        const groupSize = selectedLead.groupSize || 10;
        const indianNames = [
            "Rahul Sharma", "Priya Patel", "Amit Singh", "Neha Gupta", "Vikram Reddy",
            "Anjali Desai", "Suresh Kumar", "Pooja Mishra", "Rohan Mehta", "Sneha Joshi",
            "Karan Malhotra", "Kavita Iyer", "Deepak Verma", "Swati Rao", "Nitin Agarwal"
        ];
        
        // Mock members for the group, but retain merged ones
        const members = Array.from({length: groupSize}).map((_, i) => {
            const standardCount = groupSize - (selectedLead.mergedMembers?.length || 0);
            
            if (i >= standardCount && selectedLead.mergedMembers) {
                const mergedMember = selectedLead.mergedMembers[i - standardCount];
                if (mergedMember) return mergedMember;
            }

            return {
                id: `member-${i}`,
                name: indianNames[i % indianNames.length],
                phone: `+91 98989 ${String(10000 + i).slice(1)}`,
                status: memberStatuses[i] || (i === 0 ? selectedLead.status : (i % 3 === 0 ? "Negotiation" : "Site Visit")),
            };
        });

        const hasNegotiationMember = members.some(m => m.status === "Negotiation" || m.status === "Final Negotiation");
        const membersKeeping = members.filter(m => m.status === 'Booked' || m.status === 'Negotiation' || m.status === 'Final Negotiation');
        const membersSplitting = members.filter(m => m.status !== 'Booked' && m.status !== 'Negotiation' && m.status !== 'Final Negotiation');

        const handleRemoveMember = (memberToRemove: any, idx: number) => {
            if (!selectedLead || !confirm(`Remove ${memberToRemove.name} from this group? They will become a normal individual lead.`)) return;

            // 1. Create the removed member as a new individual lead
            const newIndividualPayload = {
                name: memberToRemove.name,
                phone: memberToRemove.phone,
                email: "",
                status: memberToRemove.status,
                isGroup: false,
                source: "Group Deal (Extracted)",
                requirement: selectedLead.requirement,
                budget: selectedLead.budget
            };

            // Fire POST to create the lead
            offlineSafeFetch(`/api/leads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newIndividualPayload)
            }).catch(console.error);

            // 2. Shrink the current group
            const remainingMembers = members.filter((m, i) => i !== idx).map(m => ({
                id: m.id,
                name: m.name,
                phone: m.phone,
                status: m.status
            }));
            
            const newGroupSize = remainingMembers.length > 0 ? remainingMembers.length : 1;
            
            upsertLead({
                ...selectedLead,
                groupSize: newGroupSize,
                mergedMembers: remainingMembers
            });

            offlineSafeFetch(`/api/leads/${selectedLead.id || selectedLead._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupSize: newGroupSize, mergedMembers: remainingMembers })
            }).catch(console.error);
            
            // Adjust selectedMemberIdx if needed
            if (selectedMemberIdx === idx) {
                setSelectedMemberIdx(null);
            } else if (selectedMemberIdx !== null && selectedMemberIdx > idx) {
                setSelectedMemberIdx(selectedMemberIdx - 1);
            }
        };

        return (
            <div className="h-full flex flex-col h-full overflow-hidden">
                {selectedMemberIdx === null ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
                        {/* Unified Header */}
                        <div className="bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-900 p-4 px-5 text-white relative overflow-hidden shrink-0 flex flex-col md:flex-row justify-between items-center gap-3">
                            <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                                <Users className="w-24 h-24 -mr-4 -mt-4" />
                            </div>
                            <div className="relative z-10 flex flex-col justify-center">
                                <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                                    <Badge className="bg-white/20 hover:bg-white/30 text-purple-50 border border-white/30 px-1.5 py-0 h-5 text-[9px] backdrop-blur-sm">GROUP DEAL</Badge>
                                    {selectedLead.name}
                                </h2>
                                <p className="text-purple-200 flex items-center gap-1.5 font-medium text-xs mt-0.5">
                                    <MapPin className="w-3.5 h-3.5 text-purple-300"/> Exploring: {selectedLead.requirement} ({selectedLead.budget})
                                </p>
                            </div>
                            <div className="relative z-10 flex gap-2">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/20 shadow-sm text-center min-w-[80px]">
                                    <p className="text-[9px] uppercase tracking-widest text-purple-200 font-bold">Size</p>
                                    <p className="text-lg font-black leading-tight">{groupSize} <span className="text-[10px] font-medium opacity-80">Users</span></p>
                                </div>
                                <div 
                                    className="bg-white/10 hover:bg-white/15 cursor-pointer transition-colors backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/20 shadow-sm flex flex-col justify-center min-w-[140px]"
                                    onClick={() => {
                                        const parts = (selectedLead.groupDiscount || "12% Off|15% Off|10").split("|");
                                        setReviseOfferForm({
                                            currentDiscount: (parts[0] || "12% Off").replace(/[^0-9.]/g, ""),
                                            nextDiscount: (parts[1] || "15% Off").replace(/[^0-9.]/g, ""),
                                            nextThreshold: parts[2] || (groupSize + 2).toString()
                                        });
                                        setIsReviseOfferOpen(true);
                                    }}
                                >
                                    <div className="flex justify-between items-center mb-0.5">
                                        <p className="text-[9px] uppercase tracking-widest text-emerald-200 font-bold">Current Discount</p>
                                        <Percent className="w-3 h-3 text-emerald-300" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-lg font-black text-emerald-400 leading-tight">{(selectedLead.groupDiscount || "12%").split("|")[0].replace("Off", "").trim()}</p>
                                        <span className="text-[10px] font-medium text-emerald-200/80">Off</span>
                                    </div>
                                    <div className="mt-1 pt-1 border-t border-white/10">
                                        <p className="text-[8.5px] text-purple-100 leading-tight opacity-90">Next: <strong className="text-white">{(selectedLead.groupDiscount || "12% Off|15% Off|10").split("|")[1] || "15% Off"}</strong> at <strong className="text-white">{(selectedLead.groupDiscount || "12% Off|15% Off|10").split("|")[2] || "10"} members</strong></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Roster Dashboard Sub-header */}
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
                            <div>
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-purple-600"/> Group Roster Dashboard
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">View all {groupSize} members at a glance. Select a member to manage their journey.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setIsSplitGroupOpen(true)} className="h-8 text-[11px] font-bold gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50" disabled={!hasNegotiationMember} title={!hasNegotiationMember ? "At least one member must be in Negotiation stage to split" : ""}>
                                    <Split className="w-3.5 h-3.5"/> Split Group
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setIsMergeGroupOpen(true)} className="h-8 text-[11px] font-bold gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50">
                                    <Merge className="w-3.5 h-3.5"/> Merge Members
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setIsReviseOfferOpen(true)} className="h-8 text-[11px] font-bold gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                    <Percent className="w-3.5 h-3.5"/> Revise Offer
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => router.push(`/builder-dashboard?tab=chat&chatWith=${selectedLead.id || selectedLead._id}`)} className="h-8 text-[11px] font-bold gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50">
                                    <MessageSquare className="w-3.5 h-3.5"/> Chat
                                </Button>
                            </div>
                        </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
                                        <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                                            <th className="p-4 pl-6 w-12 text-center">#</th>
                                            <th className="p-4">Member Name</th>
                                            <th className="p-4">Phone Number</th>
                                            <th className="p-4">Current Stage</th>
                                            <th className="p-4 text-right pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map((m, idx) => (
                                            <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <td className="p-4 pl-6 text-xs text-slate-400 font-bold text-center">{idx + 1}</td>
                                                <td className="p-4 font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-bold text-xs">{m.name.charAt(0)}</div>
                                                    {m.name}
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    {m.phone}
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className={`font-bold px-2.5 py-1 ${m.status === 'Booked' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : m.status === 'Junk' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-600'}`}>
                                                        {m.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right pr-6 flex items-center justify-end gap-2">
                                                    <Button onClick={() => setSelectedMemberIdx(idx)} variant="outline" size="sm" className="h-8 text-xs font-bold text-purple-600 border-purple-200 hover:bg-purple-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        Manage <ArrowRight className="w-3 h-3 ml-1.5"/>
                                                    </Button>
                                                    <Button onClick={(e) => { e.stopPropagation(); router.push(`/builder-dashboard?tab=chat&chatWith=${m.id || m._id}`); }} variant="outline" size="icon" className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" title="Chat with Member">
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button onClick={(e) => { e.stopPropagation(); handleRemoveMember(m, idx); }} variant="outline" size="icon" className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" title="Remove from Group">
                                                        <UserMinus className="w-3.5 h-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <Button variant="ghost" className="h-8 px-3 gap-2 text-slate-600 text-xs font-bold hover:text-purple-700 hover:bg-purple-50 rounded-xl" onClick={() => setSelectedMemberIdx(null)}>
                                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Group Roster
                                </Button>
                                <h3 className="font-black text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    Managing <span className="text-purple-600">{members[selectedMemberIdx].name}</span>
                                </h3>
                            </div>
                            
                            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 h-full">
                                {/* 1. Left: Member Bio (Mimics LeadProfile) */}
                                <Card className="w-full md:w-1/4 shrink-0 h-full border-0 shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 flex flex-col overflow-y-auto custom-scrollbar relative">
                                    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 opacity-10"></div>
                                    <CardHeader className="text-center pb-3 border-b border-slate-100 dark:border-slate-800 relative pt-5">
                                        <div className="relative mx-auto mb-3">
                                            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur opacity-30"></div>
                                            <div className="relative w-16 h-16 rounded-full bg-white dark:bg-slate-800 border-[3px] border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto">
                                                {members[selectedMemberIdx].name.charAt(0)}
                                            </div>
                                        </div>
                                        <CardTitle className="flex items-center justify-center gap-2 text-lg tracking-tight">
                                            {members[selectedMemberIdx].name}
                                        </CardTitle>
                                        <CardDescription className="font-medium text-xs mt-0.5">{members[selectedMemberIdx].phone} <span className="text-green-500 text-[9px] uppercase tracking-wider ml-1 bg-green-50 px-1.5 py-0.5 rounded-full font-bold">Verified</span></CardDescription>
                                        <div className="flex justify-center items-center gap-2 mt-2">
                                            <Badge className="px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200">
                                                {members[selectedMemberIdx].status}
                                            </Badge>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-[22px] px-2 rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                                onClick={() => router.push(`/builder-dashboard?tab=chat&chatWith=${members[selectedMemberIdx].id || members[selectedMemberIdx]._id}`)}
                                            >
                                                <MessageSquare className="w-3 h-3 mr-1" />
                                                <span className="text-[10px]">Chat</span>
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-4 space-y-4 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1"><Home className="w-3 h-3"/> Req</p>
                                                <p className="font-bold text-xs text-slate-700 dark:text-slate-200">{selectedLead.requirement}</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Budget</p>
                                                <p className="font-bold text-xs text-slate-700 dark:text-slate-200">{selectedLead.budget?.split('-')[0]}</p>
                                            </div>
                                        </div>
                                        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                            <h5 className="font-bold text-purple-800 dark:text-purple-400 text-[11px] mb-1.5 flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5"/> Group Campaign
                                            </h5>
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="text-muted-foreground">Main Deal:</span>
                                                <span className="font-bold truncate max-w-[100px]" title={selectedLead.name}>{selectedLead.name}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                {/* 2. Center: Activity Timeline */}
                                <Card className="flex-1 h-full border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                                    <CardHeader className="pb-2 border-b bg-white dark:bg-slate-900">
                                        <CardTitle className="text-base flex justify-between items-center">
                                            Activity Timeline
                                            <span className="text-[10px] font-normal text-muted-foreground flex items-center gap-1">
                                                <span className="relative flex h-2 w-2">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                                Realtime Sync Active
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <div ref={timelineRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                                        {[...(selectedLead.timeline || [])].reverse().map((event, i) => {
                                            const isSystem = event.type === 'system';
                                            const isNote = event.type === 'note';
                                            
                                            if (isSystem) {
                                                return (
                                                    <div key={i} className="flex justify-center w-full my-3">
                                                        <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] py-2 px-3 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center gap-1 max-w-[85%] text-center">
                                                            <div className="flex items-center gap-1.5 font-bold text-slate-400">
                                                                <Activity className="h-3 w-3" />
                                                                <span>{event.title || 'System Update'}</span>
                                                            </div>
                                                            <span className="break-words whitespace-pre-wrap leading-relaxed">{event.desc}</span>
                                                            <span className="opacity-50 text-[9px] mt-0.5">
                                                                {event.date ? new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            if (isNote) {
                                                return (
                                                    <div key={i} className="flex flex-col items-end w-full space-y-1">
                                                        <div className="bg-blue-600 text-white p-2.5 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                                                            <p className="text-xs">{event.desc}</p>
                                                        </div>
                                                        <span className="text-[9px] text-muted-foreground pr-1">
                                                            {event.date ? new Date(event.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                        </span>
                                                    </div>
                                                )
                                            }
                                            return (
                                                <div key={i} className="flex flex-col items-start w-full space-y-1">
                                                    <div className="flex items-end gap-2">
                                                        <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-white shadow-sm ${event.type === 'call' ? 'bg-indigo-500' : event.type === 'visit' ? 'bg-orange-500' : event.type === 'booking' ? 'bg-green-500' : 'bg-slate-500'}`}>
                                                            {event.type === 'call' && <Phone className="h-3.5 w-3.5" />}
                                                            {event.type === 'visit' && <MapPin className="h-3.5 w-3.5" />}
                                                            {event.type === 'booking' && <Lock className="h-3.5 w-3.5" />}
                                                        </div>
                                                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm border border-slate-100 dark:border-slate-700">
                                                            <h4 className="font-semibold text-xs mb-0.5">{event.title}</h4>
                                                            <p className="text-xs text-slate-600 dark:text-slate-300">{event.desc}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] text-muted-foreground pl-9">
                                                        {event.date ? new Date(event.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>

                                </Card>

                                {/* 3. Right: Action Console */}
                                <Card className="w-full md:w-1/4 shrink-0 h-full border-0 shadow-xl shadow-slate-200/40 dark:shadow-none bg-gradient-to-b from-blue-50/40 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col overflow-y-auto custom-scrollbar relative">
                                    <CardHeader className="pb-3 border-b border-blue-100/50 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-10">
                                        <CardTitle className="text-base font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">Action Console</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 p-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-3 h-3"/> Member Stage</label>
                                            <Select value={members[selectedMemberIdx].status} disabled={members[selectedMemberIdx].status === "Booked"} onValueChange={(val: string) => { setPendingStatus(val as LeadStatus); setStatusReason(""); setPendingFollowUp(selectedLead.nextActionTime ? new Date(selectedLead.nextActionTime).toISOString().slice(0,16) : ""); }}>
                                                <SelectTrigger className="h-10 font-bold text-xs bg-white dark:bg-slate-800 rounded-xl shadow-sm border-slate-200 dark:border-slate-700 ring-offset-0 focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors disabled:opacity-50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Fresh" className="font-semibold text-xs cursor-pointer py-1.5">Fresh (New Inquiry)</SelectItem>
                                                    {members[selectedMemberIdx].status === "Token VIP" && <SelectItem value="Token VIP" className="font-semibold text-xs cursor-pointer py-1.5">Token VIP (VIP Booking)</SelectItem>}
                                                    <SelectItem value="Connected" className="font-semibold text-xs cursor-pointer py-1.5">Connected (Follow-up)</SelectItem>
                                                    <SelectItem value="Site Visit" className="font-semibold text-xs cursor-pointer py-1.5">Site Visit (Property Seen)</SelectItem>
                                                    <SelectItem value="Negotiation" className="font-semibold text-xs cursor-pointer py-1.5">Negotiation (Closing)</SelectItem>
                                                    <SelectItem value="Final Negotiation" className="font-semibold text-xs cursor-pointer py-1.5">Final Negotiation (Final Deal)</SelectItem>
                                                    <SelectItem value="Booked" className="font-semibold text-xs cursor-pointer py-1.5">Booked (Deal Closed)</SelectItem>
                                                    <SelectItem value="Junk" className="font-semibold text-xs cursor-pointer py-1.5">Not Interested</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="space-y-2.5 p-3 border rounded-xl shadow-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                            <h4 className="font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 text-slate-500">
                                                <Building2 className="h-3.5 w-3.5 text-slate-400" /> Unit Allocation
                                            </h4>
                                            <Button className="w-full h-10 text-xs font-bold text-white shadow-md rounded-xl bg-blue-600 hover:bg-blue-700 transition-all active:scale-95" onClick={handleBlockUnit}>
                                                <Lock className="h-3.5 w-3.5 mr-1.5" /> Block Member Unit
                                            </Button>
                                        </div>

                                        <div className="space-y-2 pt-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Quick Actions</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button variant="outline" className="w-full gap-1.5 h-9 text-[11px] font-bold rounded-lg shadow-sm text-[#075E54] bg-[#25D366]/10 hover:bg-[#25D366]/20 border-[#25D366]/30 transition-transform active:scale-95" onClick={() => window.open(`https://wa.me/${members[selectedMemberIdx].phone.replace(/\s+/g, '')}`, '_blank')}>
                                                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                                                </Button>
                                                <Button variant="outline" disabled={members[selectedMemberIdx].status === "Booked"} className={`w-full gap-1.5 h-9 text-[11px] font-bold rounded-lg shadow-sm transition-transform active:scale-95 ${members[selectedMemberIdx].status === "Junk" ? "text-slate-600 bg-slate-100 border-slate-200" : "text-red-600 bg-red-50 hover:text-red-700 hover:bg-red-100 border-red-200"}`} onClick={() => {
                                                    setPendingStatus((members[selectedMemberIdx].status === "Junk" ? "Fresh" : "Junk") as any);
                                                    setStatusReason("");
                                                    setPendingFollowUp(selectedLead.nextActionTime ? new Date(selectedLead.nextActionTime).toISOString().slice(0,16) : "");
                                                }}>
                                                    {members[selectedMemberIdx].status === "Junk" ? <><CheckCircle2 className="h-3.5 w-3.5" /> Restore</> : <><XCircle className="h-3.5 w-3.5" /> Not Interested</>}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                {/* Status Reason Dialog for Group Members */}
                <Dialog open={!!pendingStatus} onOpenChange={(open) => { if (!open) { setPendingStatus(null); setExtraFields({}); } }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Update Member Status</DialogTitle>
                            <DialogDescription>
                                You are updating this member's status to <strong className="text-purple-600">{pendingStatus}</strong>. Please provide a reason or log the interaction.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reason / Log</label>
                                <Textarea 
                                    placeholder="E.g., Member is interested, scheduled a site visit..."
                                    value={statusReason}
                                    onChange={(e) => setStatusReason(e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-blue-500" /> Schedule Next Follow-up
                                </label>
                                <Input 
                                    type="datetime-local" 
                                    value={pendingFollowUp}
                                    onChange={(e) => setPendingFollowUp(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            {renderStageExtraFields(pendingStatus, extraFields, setExtraFields)}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPendingStatus(null)}>Cancel</Button>
                            <Button onClick={async () => {
                                if (!pendingStatus || !selectedLead) return;
                                const id = selectedLead.id || selectedLead._id;
                                
                                const newTimeline = [...(selectedLead.timeline || [])];
                                const updates: any = {};
                                
                                if (statusReason.trim()) {
                                    updates.actionType = "Status Note";
                                    updates.actionDesc = `[Member Update] Changed to ${pendingStatus}: ${statusReason}`;
                                    newTimeline.unshift({
                                        title: "Member Status Changed",
                                        desc: updates.actionDesc,
                                        type: "system",
                                        date: new Date().toISOString()
                                    });
                                }
                                
                                if (pendingFollowUp) {
                                    updates.nextActionTime = new Date(pendingFollowUp).toISOString();
                                    const followUpMsg = `Follow-up set for ${new Date(pendingFollowUp).toLocaleString()}`;
                                    if (!updates.actionDesc) {
                                        updates.actionType = "Follow-up Scheduled";
                                        updates.actionDesc = `[Member Update] ${followUpMsg}`;
                                        newTimeline.unshift({
                                            title: "Member Follow-up Scheduled",
                                            desc: updates.actionDesc,
                                            type: "system",
                                            date: new Date().toISOString()
                                        });
                                    } else {
                                        updates.actionDesc += ` | Next follow-up: ${new Date(pendingFollowUp).toLocaleString()}`;
                                        if (newTimeline.length > 0) {
                                            newTimeline[0].desc = updates.actionDesc;
                                        }
                                    }
                                }

                                upsertLead({
                                    ...selectedLead,
                                    nextActionTime: updates.nextActionTime || selectedLead.nextActionTime,
                                    timeline: newTimeline
                                });

                                // Update local member status state so it reflects visually, but don't change the main lead status
                                setMemberStatuses(prev => ({
                                    ...prev,
                                    [selectedMemberIdx as number]: pendingStatus as string
                                }));

                                offlineSafeFetch(`/api/leads/${id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(updates)
                                }).catch(err => console.error("Status update error:", err));
                                
                                setPendingStatus(null);
                                setStatusReason("");
                                setPendingFollowUp("");
                                setExtraFields({});
                            }} className="bg-purple-600 hover:bg-purple-700">Confirm & Save Log</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Split Group Dialog */}
                <Dialog open={isSplitGroupOpen} onOpenChange={setIsSplitGroupOpen}>
                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2"><Split className="w-5 h-5 text-purple-600"/> Split Group Deal</DialogTitle>
                            <DialogDescription>
                                Moving non-ready members into a new Group Phase.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-2">
                            <p className="text-sm text-slate-600 mb-4">
                                This action will keep all members in <strong>Booked</strong>, <strong>Final Negotiation</strong>, and <strong>Negotiation</strong> stages here. Members in <strong>Site Visit</strong> or <strong>Fresh</strong> will be split into a new Group Deal for Phase 2 follow-ups.
                            </p>
                            
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1 bg-emerald-50/50 border border-emerald-100 rounded-lg p-2">
                                    <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex justify-between">
                                        Ready to Close <span>({membersKeeping.length})</span>
                                    </h4>
                                    <ScrollArea className="h-[140px] pr-2">
                                        {membersKeeping.length > 0 ? membersKeeping.map(m => (
                                            <div key={m.id} className="text-xs font-bold text-slate-700 flex justify-between items-center py-1.5 border-b border-emerald-100/50 last:border-0">
                                                <span className="truncate pr-2">{m.name}</span>
                                                <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">{m.status}</span>
                                            </div>
                                        )) : (
                                            <p className="text-xs text-muted-foreground italic text-center mt-4">None</p>
                                        )}
                                    </ScrollArea>
                                </div>
                                <div className="flex-1 bg-purple-50/50 border border-purple-100 rounded-lg p-2">
                                    <h4 className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-2 flex justify-between">
                                        Moving to Phase 2 <span>({membersSplitting.length})</span>
                                    </h4>
                                    <ScrollArea className="h-[140px] pr-2">
                                        {membersSplitting.length > 0 ? membersSplitting.map(m => (
                                            <div key={m.id} className="text-xs font-bold text-slate-700 flex justify-between items-center py-1.5 border-b border-purple-100/50 last:border-0">
                                                <span className="truncate pr-2">{m.name}</span>
                                                <span className="text-[9px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded shrink-0">{m.status}</span>
                                            </div>
                                        )) : (
                                            <p className="text-xs text-muted-foreground italic text-center mt-4">None</p>
                                        )}
                                    </ScrollArea>
                                </div>
                            </div>

                            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-xs text-purple-800">
                                <strong>Tip:</strong> Splitting the group helps you close ready buyers quickly while negotiating new discounts for the remaining members later.
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsSplitGroupOpen(false)}>Cancel</Button>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => {
                                if (selectedLead) {
                                    // 1. Freeze exactly who is keeping and who is splitting
                                    // This prevents the mock generation logic from regenerating random members.
                                    const keptMergedMembers = membersKeeping.map(m => ({
                                        id: m.id,
                                        name: m.name,
                                        phone: m.phone,
                                        status: m.status
                                    }));

                                    const splitMergedMembers = membersSplitting.map(m => ({
                                        id: m.id,
                                        name: m.name,
                                        phone: m.phone,
                                        status: m.status
                                    }));

                                    // 2. Update current group
                                    const updatedGroupSize = membersKeeping.length;
                                    upsertLead({
                                        ...selectedLead,
                                        groupSize: updatedGroupSize > 0 ? updatedGroupSize : 1, // fallback to at least 1
                                        mergedMembers: keptMergedMembers
                                    });

                                    offlineSafeFetch(`/api/leads/${selectedLead.id || selectedLead._id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ groupSize: updatedGroupSize > 0 ? updatedGroupSize : 1, mergedMembers: keptMergedMembers })
                                    }).catch(console.error);

                                    // 3. Create the new Phase 2 group
                                    if (membersSplitting.length > 0) {
                                        const newGroupPayload = {
                                            name: `${selectedLead.name} - Phase 2`,
                                            phone: selectedLead.phone,
                                            email: selectedLead.email,
                                            status: "Site Visit",
                                            isGroup: true,
                                            groupSize: membersSplitting.length,
                                            groupDiscount: selectedLead.groupDiscount,
                                            mergedMembers: splitMergedMembers,
                                            requirement: selectedLead.requirement,
                                            budget: selectedLead.budget
                                        };

                                        // Fire and forget POST
                                        offlineSafeFetch(`/api/leads`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(newGroupPayload)
                                        }).catch(console.error);
                                    }

                                    setIsSplitGroupOpen(false);
                                }
                            }}>Confirm Split</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Merge Group Dialog */}
                <Dialog open={isMergeGroupOpen} onOpenChange={setIsMergeGroupOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2"><Merge className="w-5 h-5 text-purple-600"/> Merge Members</DialogTitle>
                            <DialogDescription>
                                Add existing leads into this Group Deal.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-2 flex flex-col min-h-0 w-full overflow-hidden">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Select Leads to Merge</Label>
                            <ScrollArea className="h-[250px] w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 p-1">
                                {filteredLeads.filter(l => l.id !== selectedLeadId && l._id !== selectedLeadId).map(l => (
                                    <div key={l.id || l._id} className="flex items-center gap-3 p-2.5 pr-4 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedMergeLeads.includes(l.id || l._id)}
                                            onChange={(e) => {
                                                const id = l.id || l._id;
                                                if (e.target.checked) setSelectedMergeLeads([...selectedMergeLeads, id]);
                                                else setSelectedMergeLeads(selectedMergeLeads.filter(i => i !== id));
                                            }}
                                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer shrink-0" 
                                        />
                                        <div className="flex-1 min-w-0 overflow-hidden" onClick={() => {
                                                const id = l.id || l._id;
                                                if (!selectedMergeLeads.includes(id)) setSelectedMergeLeads([...selectedMergeLeads, id]);
                                                else setSelectedMergeLeads(selectedMergeLeads.filter(i => i !== id));
                                        }}>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">{l.name}</span>
                                                {l.isTokenPaid && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                                {l.isGroup && <Badge className="shrink-0 bg-purple-100 text-purple-700 border-purple-200 px-1 py-0 h-4 text-[9px]">GROUP ({l.groupSize})</Badge>}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">{l.phone}</p>
                                        </div>
                                        <Badge variant="outline" className={`shrink-0 text-[10px] font-bold ${l.status === 'Booked' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{l.status}</Badge>
                                    </div>
                                ))}
                                {filteredLeads.filter(l => l.id !== selectedLeadId && l._id !== selectedLeadId).length === 0 && (
                                    <div className="p-8 text-center text-sm text-muted-foreground font-medium flex flex-col items-center gap-2">
                                        <Users className="w-8 h-8 text-slate-300" />
                                        No leads available to merge.
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsMergeGroupOpen(false); setSelectedMergeLeads([]); }}>Cancel</Button>
                            <Button 
                                className="bg-purple-600 hover:bg-purple-700 text-white" 
                                disabled={selectedMergeLeads.length === 0}
                                onClick={() => {
                                    if (selectedLead && selectedMergeLeads.length > 0) {
                                        // Calculate total members being added (individual = 1, group = groupSize)
                                        let addedSize = 0;
                                        const newMergedMembers = [...(selectedLead.mergedMembers || [])];

                                        selectedMergeLeads.forEach(mergeId => {
                                            const l = filteredLeads.find(lead => lead.id === mergeId || lead._id === mergeId);
                                            if (l) {
                                                const increment = l.isGroup ? (l.groupSize || 10) : 1;
                                                addedSize += increment;
                                                
                                                if (l.isGroup) {
                                                    // If we are merging a group, push dummy members so the count aligns
                                                    for (let i = 0; i < increment; i++) {
                                                        newMergedMembers.push({
                                                            id: `merged-g-${l.id}-${i}`,
                                                            name: `${l.name} - Member ${i+1}`,
                                                            phone: l.phone,
                                                            status: l.status
                                                        });
                                                    }
                                                } else {
                                                    newMergedMembers.push({
                                                        id: l.id || l._id,
                                                        name: l.name,
                                                        phone: l.phone,
                                                        status: l.status
                                                    });
                                                }

                                                // Remove the merged lead from the global pipeline
                                                removeLead(l.id || l._id);
                                            }
                                        });

                                        const newGroupSize = (selectedLead.groupSize || 10) + addedSize;
                                        
                                        // Update the lead locally
                                        upsertLead({
                                            ...selectedLead,
                                            groupSize: newGroupSize,
                                            mergedMembers: newMergedMembers
                                        });

                                        // Update in background
                                        offlineSafeFetch(`/api/leads/${selectedLead.id || selectedLead._id}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ groupSize: newGroupSize })
                                        }).catch(console.error);

                                        setIsMergeGroupOpen(false);
                                        setSelectedMergeLeads([]);
                                    }
                                }}
                            >
                                Merge {selectedMergeLeads.length > 0 ? selectedMergeLeads.length : ""} Leads
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Revise Offer Dialog */}
                <Dialog open={isReviseOfferOpen} onOpenChange={setIsReviseOfferOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2"><Percent className="w-5 h-5 text-emerald-600"/> Revise Group Offer</DialogTitle>
                            <DialogDescription>
                                Set the current unlocked discount and the next tier target.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            <div className="relative">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Unlocked Discount</Label>
                                <Input 
                                    type="number"
                                    value={reviseOfferForm.currentDiscount} 
                                    onChange={e => setReviseOfferForm({...reviseOfferForm, currentDiscount: e.target.value})} 
                                    placeholder="e.g. 12"
                                    className="mt-2 pr-16" 
                                />
                                <span className="absolute right-3 top-[38px] text-xs font-bold text-slate-400 select-none pointer-events-none">% Off</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Next Tier Discount</Label>
                                    <Input 
                                        type="number"
                                        value={reviseOfferForm.nextDiscount} 
                                        onChange={e => setReviseOfferForm({...reviseOfferForm, nextDiscount: e.target.value})} 
                                        placeholder="e.g. 15"
                                        className="mt-2 pr-16" 
                                    />
                                    <span className="absolute right-3 top-[38px] text-xs font-bold text-slate-400 select-none pointer-events-none">% Off</span>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Members</Label>
                                    <Input 
                                        type="number"
                                        value={reviseOfferForm.nextThreshold} 
                                        onChange={e => setReviseOfferForm({...reviseOfferForm, nextThreshold: e.target.value})} 
                                        placeholder="e.g. 10"
                                        className="mt-2" 
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsReviseOfferOpen(false)}>Cancel</Button>
                            <Button 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                                onClick={() => {
                                    if (!selectedLead) return;
                                    const newGroupDiscount = `${reviseOfferForm.currentDiscount}% Off|${reviseOfferForm.nextDiscount}% Off|${reviseOfferForm.nextThreshold}`;
                                    
                                    // Update locally
                                    upsertLead({
                                        ...selectedLead,
                                        groupDiscount: newGroupDiscount
                                    });

                                    // Update DB
                                    offlineSafeFetch(`/api/leads/${selectedLead.id || selectedLead._id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ groupDiscount: newGroupDiscount })
                                    }).catch(console.error);

                                    setIsReviseOfferOpen(false);
                                }}
                            >
                                Apply New Offer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // --- LIST VIEW ---
    const LeadList = () => (
        <Card className="flex-1 overflow-hidden flex flex-col min-h-0 border-slate-200/60 dark:border-slate-800/60 shadow-sm">
            <div className="overflow-y-auto flex-1 custom-scrollbar">
                <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-16 text-center">S.No.</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Last Activity</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                <TableBody>
                    {filteredLeads.map((lead, idx) => (
                        <TableRow key={lead.id || lead._id || `lead-row-${idx}`} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => openProfile(lead.id || lead._id)}>
                            <TableCell className="text-center text-slate-500 dark:text-slate-400 font-medium text-xs">
                                {idx + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {lead.name}
                                    {lead.isGroup ? (
                                        <Badge className="bg-purple-600 text-[9px] px-1.5 rounded-sm hover:bg-purple-700 shadow-sm">GROUP</Badge>
                                    ) : lead.status === "Token VIP" ? (
                                        <Badge className="bg-amber-100 text-amber-800 text-[9px] px-1.5 rounded-sm border-amber-200 shadow-sm"><Crown className="h-2.5 w-2.5 mr-1 inline" /> VIP</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[9px] px-1.5 rounded-sm text-slate-500 bg-white dark:bg-slate-900 shadow-sm">NORMAL</Badge>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">{lead.phone}</div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="bg-white dark:bg-slate-900 shadow-sm">{lead.status}</Badge></TableCell>
                            <TableCell className="text-sm">{lead.assignee || "Unassigned"}</TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" className="h-8 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={(e) => { e.stopPropagation(); openProfile(lead.id || lead._id); }}>View</Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
        </Card>
    )

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
                        {/* Top Toolbar */}
            <div className="flex w-full items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm mb-0">
                {/* Left Side: Tabs */}
                <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
                    {viewMode === 'profile' && (
                        <Button variant="ghost" className="h-8 px-2.5 text-xs shadow-none gap-1.5 text-slate-500 hover:text-slate-800 font-semibold border-r border-slate-200/50 dark:border-slate-700/50 rounded-none mr-1" onClick={() => { setViewMode('pipeline'); setSelectedMemberIdx(null); }}>
                            <ArrowUpRight className="h-3.5 w-3.5 rotate-[225deg]" /> <span className="hidden sm:inline">Back</span>
                        </Button>
                    )}
                    <Button
                        variant={viewMode === 'pipeline' ? 'secondary' : 'ghost'}
                        onClick={() => setViewMode('pipeline')}
                        className={`h-8 px-2.5 text-xs shadow-none gap-1.5 rounded-md transition-all ${viewMode === 'pipeline' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                    >
                        <TrendingUp className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Pipeline</span>
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        onClick={() => setViewMode('list')}
                        className={`h-8 px-2.5 text-xs shadow-none gap-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                    >
                        <Users className="h-3.5 w-3.5" /> <span className="hidden sm:inline">List</span>
                    </Button>
                    <Button
                        variant={viewMode === 'analytics' ? 'secondary' : 'ghost'}
                        onClick={() => setViewMode('analytics')}
                        className={`h-8 px-2.5 text-xs shadow-none gap-1.5 rounded-md transition-all ${viewMode === 'analytics' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                    >
                        <Activity className="h-3.5 w-3.5" /> <span className="hidden lg:inline">Analytics</span>
                    </Button>
                </div>

                {/* Right Side: Filters, Search, Actions */}
                <div className="flex items-center justify-end gap-1.5 sm:gap-2 flex-1 min-w-0 pl-2">
                    {/* Search */}
                    <div className="relative hidden sm:block w-28 md:w-36 lg:w-48 transition-all">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value)
                                fetchLeads(e.target.value)
                            }}
                            className="w-full pl-8 pr-3 py-1.5 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Status Filter */}
                    {viewMode === 'list' && (
                        <>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[100px] h-8 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-lg hidden lg:flex">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Types">All</SelectItem>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="Group Buying">Group</SelectItem>
                                    <SelectItem value="Token VIP">VIP</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[100px] h-8 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-lg hidden lg:flex">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All</SelectItem>
                                    <SelectItem value="Fresh">Fresh</SelectItem>
                                    <SelectItem value="Connected">Connected</SelectItem>
                                    <SelectItem value="Site Visit">Site Visit</SelectItem>
                                    <SelectItem value="Negotiation">Neg.</SelectItem>
                                    <SelectItem value="Final Negotiation">Final Neg.</SelectItem>
                                    <SelectItem value="Booked">Booked</SelectItem>
                                    <SelectItem value="Token VIP">VIP</SelectItem>
                                    <SelectItem value="Junk">Junk</SelectItem>
                                </SelectContent>
                            </Select>
                        </>
                    )}

                    {/* Compact Lead Count */}
                    <div className="h-8 flex items-center px-2.5 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/50 rounded-lg text-xs font-semibold whitespace-nowrap hidden md:flex">
                        {filteredLeads.length} <span className="text-blue-500/70 ml-1 font-medium">Leads</span>
                    </div>

                    {/* Vertical Divider */}
                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block"></div>

                    {/* Refresh Button - Minimal */}
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={handleManualSync}
                        disabled={isSyncing}
                        title="Sync Leads"
                        className={`h-8 w-8 rounded-lg transition-all flex-shrink-0 ${isSyncing ? "bg-blue-50 dark:bg-blue-900/20 text-blue-500" : "text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
                    >
                        <div className="relative">
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin text-blue-500" : ""}`} />
                            {!isSyncing && <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse border border-white dark:border-slate-900" />}
                        </div>
                    </Button>

                    <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-8 px-2.5 sm:px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5 shadow-sm transition-all flex-shrink-0">
                                <UserPlus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add Lead</span>
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
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <input 
                                            type="checkbox" 
                                            id="isGroup"
                                            checked={newLeadForm.isGroup} 
                                            onChange={e => setNewLeadForm({...newLeadForm, isGroup: e.target.checked})}
                                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                                        />
                                        <Label htmlFor="isGroup" className="font-bold text-purple-800 dark:text-purple-400 cursor-pointer">Is this a Group Buying Deal?</Label>
                                    </div>
                                    {newLeadForm.isGroup && (
                                        <div className="grid grid-cols-2 gap-4 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800 animate-in slide-in-from-top-2">
                                            <div>
                                                <Label className="text-xs font-bold text-purple-900 dark:text-purple-300">Total Group Size</Label>
                                                <Input 
                                                    type="number" 
                                                    min={2} 
                                                    value={newLeadForm.groupSize || ""} 
                                                    onChange={e => setNewLeadForm({...newLeadForm, groupSize: parseInt(e.target.value) || 0})}
                                                    placeholder="e.g. 10 Members"
                                                    className="h-9 text-sm mt-1.5"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-bold text-purple-900 dark:text-purple-300">Expected Discount</Label>
                                                <Input 
                                                    value={newLeadForm.groupDiscount || ""} 
                                                    onChange={e => setNewLeadForm({...newLeadForm, groupDiscount: e.target.value})}
                                                    placeholder="e.g. 15% Off"
                                                    className="h-9 text-sm mt-1.5"
                                                />
                                            </div>
                                        </div>
                                    )}
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
                        <div className="flex-1 min-h-0">
                            {selectedLead?.isGroup ? GroupLeadProfile() : LeadProfile()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
