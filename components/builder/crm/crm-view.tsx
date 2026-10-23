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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
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
    Building2, Lock, RefreshCw, Database, Trash2, Home, ArrowRight, ArrowLeft, Split, Merge, Percent, UserMinus,
    Sparkles, Bookmark, ChevronsUpDown, Check
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
    leadType?: string
    loginStatus?: 'authenticated' | 'guest'
    visitorId?: string
    isTokenPaid: boolean
    tokenAmount?: number
    paymentId?: string
    orderId?: string
    paymentStatus?: string
    holdId?: string
    holdExpiresAt?: string
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
    isUnitHeld?: boolean
    isUnitSold?: boolean
    propertyId?: string
    unitId?: string
    towerId?: string
    builderId?: string
    projectId?: string
    createdAt?: string
    isGroup?: boolean
    groupSize?: number
    groupDiscount?: string
    mergedMembers?: any[]
    groupPoolKey?: string
    poolRootLevel?: string
    poolRootPropertyId?: string
    poolRootPropertyName?: string
    topPropertyName?: string
    clickedLevel?: string
    clickedPropertyName?: string
    sourceUrl?: string
    userId?: string
    avatar?: string
    photo?: string
    profilePhoto?: string
    username?: string
    claimedOffer?: any
    offerDetails?: string
    attemptsCount?: number
    hasRepeatedEnquiry?: boolean
    lastEnquiryAt?: string
    leadTypes?: string[]
    interactions?: {
        id?: string
        type?: string
        title?: string
        desc?: string
        date?: string
        details?: string
        source?: string
        propertyTitle?: string
        unitNumber?: string
    }[]
    unitNumber?: string
    holdDuration?: string
    holdDurationDays?: number
    paymentVerifiedAt?: string
    hierarchyContext?: any
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

export function calculateRemainingHoldTime(expiresAt?: string | Date, fallbackCreatedAt?: string | Date): {
    isExpired: boolean;
    remainingText: string;
    expiresText: string;
    lockedOnText: string;
    durationText: string;
} {
    let expDate: Date;
    const createDate: Date = fallbackCreatedAt ? new Date(fallbackCreatedAt) : new Date();

    if (expiresAt) {
        expDate = new Date(expiresAt);
    } else {
        expDate = new Date(createDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();

    const lockedOnText = !isNaN(createDate.getTime()) 
        ? createDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        : 'Recently';

    const expiresText = !isNaN(expDate.getTime())
        ? expDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        : 'In 7 Days';

    if (diffMs <= 0) {
        return {
            isExpired: true,
            remainingText: "Hold Expired",
            expiresText,
            lockedOnText,
            durationText: "7 Days (Expired)"
        };
    }

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let remainingText = "";
    if (days > 0) {
        remainingText = `${days} Days, ${hours} Hours Remaining`;
    } else if (hours > 0) {
        remainingText = `${hours} Hours, ${minutes} Mins Remaining`;
    } else {
        remainingText = `${minutes} Mins Remaining`;
    }

    return {
        isExpired: false,
        remainingText,
        expiresText,
        lockedOnText,
        durationText: "7 Days (168 Hours)"
    };
}

function sanitizeLeadRecord(lead: any): Lead {
    const isHold = Boolean(
        lead.isUnitHeld ||
        lead.status === "Token VIP" ||
        lead.status === "Hold Expired" ||
        lead.leadType === "token-hold" ||
        lead.leadType === "vip-lead" ||
        lead.source === "visitor-unit-hold" ||
        lead.isTokenPaid ||
        lead.holdExpiresAt ||
        lead.holdId
    );
    const resolvedUnit = String(
        lead.interestedUnit ||
        lead.unitNumber ||
        lead.hierarchyContext?.unitNumber ||
        ""
    ).trim();

    const validStatuses: LeadStatus[] = ["Fresh", "Token VIP", "Connected", "Site Visit", "Negotiation", "Final Negotiation", "Booked", "Junk"];
    let normalizedStatus: LeadStatus = lead.status;
    if (!validStatuses.includes(normalizedStatus)) {
        if (lead.status === "Hold Expired" || lead.leadType === "token-hold" || lead.isTokenPaid || lead.source === "visitor-unit-hold") {
            normalizedStatus = "Token VIP";
        } else {
            normalizedStatus = "Fresh";
        }
    }

    return {
        ...lead,
        status: normalizedStatus,
        id: toId(lead._id || lead.id),
        _id: toId(lead._id || lead.id),
        isUnitHeld: isHold ? true : Boolean(lead.isUnitHeld),
        interestedUnit: resolvedUnit,
        unitNumber: resolvedUnit,
        holdId: lead.holdId || lead.hierarchyContext?.holdId || "",
        holdExpiresAt: lead.holdExpiresAt || lead.hierarchyContext?.holdExpiresAt || "",
        holdDuration: lead.holdDuration || "7 Days (168 Hours)",
        holdDurationDays: lead.holdDurationDays || 7,
        paymentVerifiedAt: lead.paymentVerifiedAt || lead.createdAt || "",
        topPropertyName: lead.topPropertyName || lead.clickedPropertyName || lead.hierarchyContext?.propertyName || lead.hierarchyContext?.propertyTitle || "",
        timeline: Array.isArray(lead.timeline) ? lead.timeline.map((t: any) => ({
            ...t,
            desc: t.desc || "No description provided"
        })) : []
    };
}

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
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount of Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ</label>
                    <Input 
                        placeholder="e.g. ₹2,40,000"
                        value={extra.brokerageAmount || ""}
                        onChange={(e) => setExtra({ ...extra, brokerageAmount: e.target.value })}
                        className="w-full"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">% of Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ</label>
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
        if (extra.brokerageAmount) notes += `\nAmount of Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ: ${extra.brokerageAmount}`;
        if (extra.astronixPercent) notes += `\nΛꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ %: ${extra.astronixPercent}`;
    }
    return notes;
}

export function CRMView({ userRole = "builder" }: CRMViewProps) {
    const storagePrefix = userRole === "mandate" ? "mandate_" : ""
    const [viewMode, setViewMode] = useState<"pipeline" | "list" | "profile" | "analytics">("pipeline")
    
    // Zustand Global State Integration (Role-Isolated)
    const store = useCRMStore()
    const crmRole = userRole + "_astronix"
    const leadsById = store.leadsById[crmRole] || {}
    const allLeadIds = store.allLeadIds[crmRole] || []

    const setInitialLeads = (leads: any[]) => {
        const sanitizedLeads = leads.map(lead => sanitizeLeadRecord(lead))
        store.setInitialLeads(crmRole, sanitizedLeads)
    }

    const upsertLead = (lead: any) => {
        const sanitizedLead = sanitizeLeadRecord(lead)
        store.upsertLead(crmRole, sanitizedLead)
    }

    const removeLead = (leadId: string) => store.removeLead(crmRole, leadId)
    const optimisticUpdateStatus = (leadId: string, newStatus: LeadStatus, mutationId: string) => store.optimisticUpdateStatus(crmRole, leadId, newStatus, mutationId)
    const { resolveTransaction, failTransaction } = store

    const router = useRouter()

    // Map normalized store back to array for UI compatibility
    const leads = useMemo(() => allLeadIds.map((id: string) => leadsById[id]).filter(Boolean) as Lead[], [allLeadIds, leadsById])

    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [isLoadingLeads, setIsLoadingLeads] = useState(true)
    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
    const [newLeadForm, setNewLeadForm] = useState({
        name: "", phone: "", email: "", requirement: "2BHK", budget: "50L - 1Cr", source: "Website", assignee: "",
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
    const [selectedTowerId, setSelectedTowerId] = useState<string>("")
    const [selectedUnitId, setSelectedUnitId] = useState<string>("")
    const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false)
    const [isHoldUnitEnabled, setIsHoldUnitEnabled] = useState(false)
    const [isBlockingUnit, setIsBlockingUnit] = useState(false)
    const [inventoryTowers, setInventoryTowers] = useState<any[]>([])
    const [inventoryUnits, setInventoryUnits] = useState<any[]>([])
    const [isFetchingInventory, setIsFetchingInventory] = useState(false)

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
    const [mobileActiveStage, setMobileActiveStage] = useState<LeadStatus>("Fresh")
    const [mobileStagePickerLead, setMobileStagePickerLead] = useState<Lead | null>(null)

    // Group Actions Dialog States
    const [isSplitGroupOpen, setIsSplitGroupOpen] = useState(false)
    const [isMergeGroupOpen, setIsMergeGroupOpen] = useState(false)
    const [isReviseOfferOpen, setIsReviseOfferOpen] = useState(false)
    const [reviseOfferForm, setReviseOfferForm] = useState({ currentDiscount: "12", nextDiscount: "15", nextThreshold: "10" })
    const [selectedMergeLeads, setSelectedMergeLeads] = useState<string[]>([])

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
        setNewLeadForm({ name: "", phone: "", email: "", requirement: "2BHK", budget: "50L - 1Cr", source: "Website", assignee: "", isGroup: false, groupSize: 0, groupDiscount: "" });
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
            params.set("leadType", "astronix")
            if (search) params.set("search", search)
            const res = await fetch(`/api/leads?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                if (data.leads) {
                    const mappedLeads = data.leads.map((l: any) => sanitizeLeadRecord(l))
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
                const res = await fetch("/api/leads/sync?leadType=astronix");
                if (res.ok) {
                    const data = await res.json();
                    if (data.snapshot) {
                        const desyncedIds = useCRMStore.getState().reconcileState(crmRole, data.snapshot);
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
            console.log("[CRM DEBUG] /api/properties status:", res.status)
            if (res.ok) {
                const data = await res.json()
                console.log("[CRM DEBUG] properties count:", data.properties?.length, data.properties?.map((p: any) => p.name || p._id))
                if (data.properties) {
                    setProperties(data.properties)
                }
            } else {
                const err = await res.json().catch(() => ({}))
                console.error("[CRM DEBUG] /api/properties error:", res.status, err)
            }
        } catch (error) {
            console.error("Error fetching properties:", error)
        }
    }

    useEffect(() => {
        fetchLeads(undefined, true)  // isInitial=true → show skeleton only on first load
        fetchProperties()
        fetchTeam()

        // Helper to check if a lead belongs to Astronix Leads domain
        const isAstronixLeadData = (leadData: any) => {
            if (!leadData) return false;
            const src = (leadData.source || '').toString();
            const lType = (leadData.leadType || '').toString();
            return (
                /website|astronix|doubt|visitor|offer|discovery|enquiry|portal/i.test(src) ||
                lType === "specific-doubt" ||
                lType === "group-buying" ||
                lType === "token-hold" ||
                lType === "vip-lead" ||
                lType === "offer-enquiry" ||
                lType === "enquiry-form" ||
                leadData.status === "Token VIP" ||
                Boolean(leadData.isTokenPaid) ||
                Boolean(leadData.isGroup) ||
                Boolean(leadData.claimedOffer) ||
                (typeof leadData.groupSize === 'number' && leadData.groupSize > 0)
            );
        };

        // Establish SSE Connection
        const eventSource = new EventSource("/api/leads/stream");
        
        eventSource.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === "CONNECTED" || payload.type === "HEARTBEAT") {
                    // keep-alive, do nothing
                } else if (payload.type === "LEAD_CREATED") {
                    // Strict domain boundary: only process if lead belongs to Astronix Leads
                    if (!isAstronixLeadData(payload.data)) {
                        return;
                    }
                    console.log("[SSE] New Astronix Lead Created:", payload.leadId);
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
                    if (payload.data) {
                        if (!isAstronixLeadData(payload.data)) {
                            // If a lead was updated such that it no longer belongs to Astronix, remove it from view
                            removeLead(payload.leadId);
                            return;
                        }
                        console.log("[SSE] Astronix Lead Updated:", payload.leadId);
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

    const resolvePropertyIdForLead = (lead: any, propsList: any[]) => {
        if (!lead || !propsList || propsList.length === 0) return "";
        // 1. Direct match with propertyId
        if (lead.propertyId && propsList.some(p => (p._id || p.id) === lead.propertyId)) {
            return lead.propertyId;
        }
        // 2. Check candidate IDs: poolRootPropertyId, projectId, towerId, clickedPropertyId
        const candidateIds = [
            lead.propertyId,
            lead.poolRootPropertyId,
            lead.projectId,
            lead.towerId,
            lead.hierarchyContext?.poolRootPropertyId,
            lead.hierarchyContext?.towerId,
            lead.hierarchyContext?.projectId
        ].filter(Boolean);
        const matchById = propsList.find(p => candidateIds.includes(p._id || p.id));
        if (matchById) return matchById._id || matchById.id;

        // 3. Match by name: clickedPropertyName, topPropertyName, poolRootPropertyName, lead name
        const leadNames = [
            lead.clickedPropertyName,
            lead.topPropertyName,
            lead.poolRootPropertyName,
            lead.hierarchyContext?.clickedPropertyName,
            lead.hierarchyContext?.topPropertyName,
            lead.name?.replace(/\s*—\s*Group Buying Pool/i, '')
        ].filter(Boolean).map((n: string) => n.toLowerCase().trim());

        const matchByName = propsList.find(p => {
            const pName = (p.name || p.townshipName || p.title || "").toLowerCase().trim();
            return pName && leadNames.some((ln: string) => ln.includes(pName) || pName.includes(ln));
        });
        if (matchByName) return matchByName._id || matchByName.id;

        // 4. Fallback: if only 1 property exists for this builder, default to it
        if (propsList.length === 1) {
            return propsList[0]._id || propsList[0].id;
        }

        return "";
    };

    useEffect(() => {
        if (selectedLead) {
            setIsHoldUnitEnabled(Boolean(selectedLead.isUnitHeld || selectedLead.isUnitSold || selectedLead.status === "Booked"));
        }
    }, [selectedLead?.id, selectedLead?.status, selectedLead?.isUnitSold, selectedLead?.isUnitHeld])

    // Auto-select property when properties finish loading or when a lead is open without a resolved propertyId
    useEffect(() => {
        if (selectedLead && properties.length > 0) {
            if (!selectedPropertyId || !properties.some(p => (p._id || p.id) === selectedPropertyId)) {
                const matched = resolvePropertyIdForLead(selectedLead, properties);
                if (matched) {
                    setSelectedPropertyId(matched);
                }
            }
        }
    }, [properties, selectedLead, selectedPropertyId]);

    const openProfile = (id: string) => {
        const cleanId = toId(id)
        setSelectedLeadId(cleanId)
        setViewMode("profile")
        const l = leads.find(lead => (lead.id || toId(lead._id)) === cleanId)
        const isHoldOrBooked = Boolean(
            l?.isUnitHeld ||
            l?.isUnitSold ||
            l?.status === "Booked" ||
            l?.status === "Token VIP" ||
            l?.leadType === "token-hold" ||
            l?.source === "visitor-unit-hold" ||
            l?.isTokenPaid
        );
        setIsHoldUnitEnabled(isHoldOrBooked)
        const matchedProp = resolvePropertyIdForLead(l, properties)
        setSelectedPropertyId(matchedProp)
        setSelectedTowerId(l?.hierarchyContext?.towerId || l?.towerId || "")
        setSelectedUnitId(l?.unitId || "")
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

    const getCleanUnitLabel = (unitNumber: string, propertyName?: string) => {
        if (!unitNumber) return "";
        let clean = String(unitNumber).trim();
        if (propertyName && clean.toLowerCase().startsWith(propertyName.toLowerCase())) {
            clean = clean.slice(propertyName.length).replace(/^[\s\-_]+/, '');
        }
        clean = clean.replace(/^Unit\s+/i, '').replace(/^Flat\s+/i, '');
        return clean || unitNumber;
    };

    const handleSavePreferredUnit = async () => {
        if (!selectedLead || !selectedPropertyId || !selectedUnitId || isBlockingUnit) return;

        setIsBlockingUnit(true);
        try {
            const activeProp = properties.find(p => (p._id || p.id) === selectedPropertyId);
            const propName = activeProp?.name || activeProp?.townshipName || activeProp?.title || "Property";
            // Use live inventory units (works for both published + draft properties)
            const unitObj = allPropertyUnits.find((u: any, idx: number) => (u.id || u._id || u._id?.toString() || `unit-${idx}`) === selectedUnitId
                || (u._id?.toString() === selectedUnitId));

            const cleanUnit = unitObj ? getCleanUnitLabel(unitObj.unitNumber, propName) : selectedUnitId;
            const configStr = unitObj?.configuration ? ` (${unitObj.configuration})` : '';
            const unitLabel = `${propName} - Flat ${cleanUnit}${configStr}`;

            const isLeadBooked = selectedLead.status === "Booked" || Boolean(selectedLead.isUnitSold);
            const targetUnitStatus = isLeadBooked ? "sold" : (isHoldUnitEnabled ? "reserved" : null);

            // Release previous unit if changing to a new unit
            const oldUnitId = selectedLead.unitId;
            const oldPropertyId = selectedLead.propertyId;
            if (oldUnitId && oldUnitId !== selectedUnitId && oldPropertyId) {
                try {
                    await fetch(`/api/units/${oldUnitId}?propertyId=${oldPropertyId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            status: "available",
                            customerName: "",
                            customerPhone: "",
                            bookingDate: null
                        })
                    });
                } catch (uErr) {
                    console.error("[CRM] Error reverting previous unit status:", uErr);
                }

                // Update local state for old unit
                setProperties(prev => prev.map(p => {
                    if ((p._id || p.id) === oldPropertyId && p.details?.generatedUnits) {
                        const updatedUnits = p.details.generatedUnits.map((u: any, idx: number) => {
                            const uKey = u.id || u._id || `unit-${idx}`;
                            if (uKey === oldUnitId) {
                                return { ...u, status: "available", customerName: "", customerPhone: "" };
                            }
                            return u;
                        });
                        return { ...p, details: { ...p.details, generatedUnits: updatedUnits } };
                    }
                    return p;
                }));
            }

            if (targetUnitStatus) {
                // Update Unit status in Inventory & Property DB
                try {
                    const unitRes = await fetch(`/api/units/${selectedUnitId}?propertyId=${selectedPropertyId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            status: targetUnitStatus,
                            customerName: selectedLead.name,
                            customerPhone: selectedLead.phone,
                            bookingDate: new Date().toISOString()
                        })
                    });
                    if (!unitRes.ok) {
                        console.warn("[CRM] Direct unit update failed, proceeding with lead record update");
                    }
                } catch (uErr) {
                    console.error("[CRM] Error updating unit status:", uErr);
                }

                // Update unit in local properties state so dropdown & inventory immediately reflect status
                setProperties(prev => prev.map(p => {
                    if ((p._id || p.id) === selectedPropertyId && p.details?.generatedUnits) {
                        const updatedUnits = p.details.generatedUnits.map((u: any, idx: number) => {
                            const uKey = u.id || u._id || `unit-${idx}`;
                            if (uKey === selectedUnitId) {
                                return { ...u, status: targetUnitStatus, customerName: selectedLead.name, customerPhone: selectedLead.phone };
                            }
                            return u;
                        });
                        return { ...p, details: { ...p.details, generatedUnits: updatedUnits } };
                    }
                    return p;
                }));
            }

            // Update Lead Interest
            const leadRes = await fetch(`/api/leads/${selectedLead.id || selectedLead._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    interestedUnit: unitLabel,
                    unitId: selectedUnitId,
                    propertyId: selectedPropertyId,
                    isUnitHeld: isLeadBooked ? false : isHoldUnitEnabled,
                    isUnitSold: isLeadBooked,
                    actionType: isLeadBooked ? "Unit Marked as Sold" : (isHoldUnitEnabled ? "Unit Reserved (Hold)" : "Preferred Unit Marked"),
                    actionDesc: isLeadBooked
                        ? `Marked Flat ${cleanUnit} (${propName}) as SOLD OUT for ${selectedLead.name}`
                        : isHoldUnitEnabled 
                            ? `Reserved Flat ${cleanUnit} (${propName}) in Inventory & Visitor Panel for ${selectedLead.name}` 
                            : `Marked ${unitLabel} as preferred unit`
                })
            });

            if (!leadRes.ok) {
                const errData = await leadRes.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || "Failed to update lead record");
            }

            const updatedLeadData = await leadRes.json();
            if (updatedLeadData.lead) {
                upsertLead({ 
                    ...updatedLeadData.lead, 
                    id: toId(updatedLeadData.lead._id),
                    interestedUnit: unitLabel,
                    unitId: selectedUnitId,
                    propertyId: selectedPropertyId,
                    isUnitHeld: isLeadBooked ? false : isHoldUnitEnabled,
                    isUnitSold: isLeadBooked
                });
            }

            alert(isLeadBooked 
                ? `🏷️ Unit Marked as SOLD!\n${unitLabel} is now marked as SOLD OUT in Inventory and Visitor Panel for ${selectedLead.name}.`
                : isHoldUnitEnabled 
                    ? `🔒 Unit Reserved & Held!\n${unitLabel} is now marked as RESERVED in Inventory and Visitor Panel for ${selectedLead.name}.`
                    : `Preferred unit marked for ${selectedLead.name}: ${unitLabel}`
            );
        } catch (err: any) {
            console.error("Unit selection error:", err);
            alert(err.message || "Failed to mark preferred unit");
        } finally {
            setIsBlockingUnit(false);
        }
    };

    const handleClearPreferredUnit = async () => {
        if (!selectedLead || isBlockingUnit) return;

        setIsBlockingUnit(true);
        try {
            const targetUnitId = selectedLead.unitId || selectedUnitId;
            const targetPropertyId = selectedLead.propertyId || selectedPropertyId;

            // If unit was held or sold, restore unit status to 'available' in inventory
            if (targetUnitId && targetPropertyId) {
                try {
                    await fetch(`/api/units/${targetUnitId}?propertyId=${targetPropertyId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            status: "available",
                            customerName: "",
                            customerPhone: "",
                            bookingDate: null
                        })
                    });
                } catch (uErr) {
                    console.error("[CRM] Error reverting unit status:", uErr);
                }

                // Update local properties state
                setProperties(prev => prev.map(p => {
                    if ((p._id || p.id) === targetPropertyId && p.details?.generatedUnits) {
                        const updatedUnits = p.details.generatedUnits.map((u: any, idx: number) => {
                            const uKey = u.id || u._id || `unit-${idx}`;
                            if (uKey === targetUnitId) {
                                return { ...u, status: "available", customerName: "", customerPhone: "" };
                            }
                            return u;
                        });
                        return { ...p, details: { ...p.details, generatedUnits: updatedUnits } };
                    }
                    return p;
                }));
            }

            const leadRes = await fetch(`/api/leads/${selectedLead.id || selectedLead._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    interestedUnit: "",
                    unitId: "",
                    propertyId: "",
                    isUnitHeld: false,
                    isUnitSold: false,
                    actionType: "Unit Status Released",
                    actionDesc: `Removed preferred unit tag & released inventory status back to available`
                })
            });

            if (!leadRes.ok) {
                const errData = await leadRes.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || "Failed to clear preferred unit");
            }

            const updatedLeadData = await leadRes.json();
            if (updatedLeadData.lead) {
                upsertLead({ 
                    ...updatedLeadData.lead, 
                    id: toId(updatedLeadData.lead._id),
                    interestedUnit: "",
                    unitId: "",
                    propertyId: "",
                    isUnitHeld: false,
                    isUnitSold: false
                });
            }

            setIsHoldUnitEnabled(false);
            setSelectedUnitId("");
        } catch (err: any) {
            console.error("Clear error:", err);
            alert(err.message || "Failed to clear preferred unit");
        } finally {
            setIsBlockingUnit(false);
        }
    };

    const handleBlockUnit = handleSavePreferredUnit;

    // --- PIPELINE VIEW ---
    const PipelineBoard = () => {
        const allColumns: LeadStatus[] = ["Fresh", "Token VIP", "Connected", "Site Visit", "Negotiation", "Final Negotiation", "Booked", "Junk"]
        const activeStageLeads = filteredLeads.filter(l => l.status === mobileActiveStage)

        return (
            <div className="h-full flex flex-col">
                {/* MOBILE VIEW (<lg): Horizontal swipeable stage pills + Stacked native cards */}
                <div className="lg:hidden flex flex-col h-full overflow-hidden">
                    {/* Horizontal Swipeable Stage Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 px-1 shrink-0 border-b border-slate-200/80 dark:border-slate-800">
                        {allColumns.map(col => {
                            const count = filteredLeads.filter(l => l.status === col).length
                            const isSelected = mobileActiveStage === col
                            const isTokenVip = col === "Token VIP"
                            return (
                                <button
                                    key={col}
                                    type="button"
                                    onClick={() => setMobileActiveStage(col)}
                                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all min-h-[36px] ${
                                        isSelected
                                            ? isTokenVip 
                                                ? "bg-amber-500 text-white shadow-sm"
                                                : "bg-blue-600 text-white shadow-sm"
                                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                    }`}
                                >
                                    {isTokenVip && <Crown className="h-3.5 w-3.5 text-amber-200 fill-amber-200" />}
                                    <span>{col === 'Junk' ? 'Not Interested' : col}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                        isSelected 
                                            ? "bg-white/20 text-white" 
                                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Scrollable list of mobile lead cards for selected stage */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2.5 custom-scrollbar pb-24">
                        {activeStageLeads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No leads in {mobileActiveStage === 'Junk' ? 'Not Interested' : mobileActiveStage}</h4>
                                <p className="text-xs text-slate-500 mt-1">Leads moved or registered in this stage will appear here.</p>
                            </div>
                        ) : (
                            activeStageLeads.map((lead, idx) => {
                                const hasRepeated = Boolean(lead.hasRepeatedEnquiry || (lead.attemptsCount && lead.attemptsCount > 1));
                                const isSpecificDoubt = lead.source?.includes('doubt') || lead.leadType === 'specific-doubt' || lead.requirement?.includes('Specific Doubt') || (Array.isArray(lead.leadTypes) && lead.leadTypes.some(t => t.includes('doubt')));
                                const isTokenHold = lead.status === 'Token VIP' || lead.isTokenPaid || lead.leadType === 'token-hold' || lead.leadType === 'vip-lead' || (Array.isArray(lead.leadTypes) && lead.leadTypes.some(t => t.includes('token') || t.includes('vip')));
                                const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');

                                return (
                                    <div
                                        key={lead.id || `m-lead-${idx}`}
                                        className={`p-3.5 rounded-xl border shadow-sm transition-all ${
                                            lead.isGroup 
                                                ? "bg-purple-50/70 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" 
                                                : isTokenHold
                                                ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-700"
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{lead.name}</h4>
                                                    {hasRepeated && (
                                                        <span className="bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                                            🔁 Re-Enquiry ({lead.attemptsCount || 2}x)
                                                        </span>
                                                    )}
                                                    {isTokenHold && (
                                                        <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                                                            <Crown className="h-2.5 w-2.5" /> ₹111 VIP
                                                        </span>
                                                    )}
                                                    {lead.isGroup && (
                                                        <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                            <Users className="h-2.5 w-2.5"/> GROUP ({lead.groupSize || 1})
                                                        </span>
                                                    )}
                                                    {isSpecificDoubt && (
                                                        <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                            Specific Doubt
                                                        </span>
                                                    )}
                                                </div>
                                                {lead.phone && (
                                                    <p className="font-mono text-xs text-slate-600 dark:text-slate-300 mt-0.5">{lead.phone}</p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <Badge variant="outline" className="text-[10px] font-semibold">
                                                    {lead.budget || lead.requirement || "Inquiry"}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Requirement & Source Details */}
                                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-3 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg">
                                            {lead.requirement && (
                                                <p className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                                                    <Home className="h-3 w-3 shrink-0 text-slate-400" />
                                                    <span className="truncate">{lead.requirement}</span>
                                                </p>
                                            )}
                                            {(Boolean(lead.interestedUnit || lead.unitNumber || lead.isUnitHeld || lead.status === 'Token VIP')) && (
                                                <div className="flex items-center justify-between text-[10.5px] font-bold px-2 py-1 rounded bg-amber-100/90 dark:bg-amber-900/40 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs">
                                                    <span className="flex items-center gap-1 truncate">
                                                        <Lock className="h-3 w-3 text-amber-600 shrink-0" />
                                                        <span className="font-extrabold">{lead.interestedUnit || lead.unitNumber || "VIP Held"}</span>
                                                    </span>
                                                    <span className="text-[9px] font-mono text-amber-800 dark:text-amber-300 shrink-0">
                                                        ⏳ {calculateRemainingHoldTime(lead.holdExpiresAt, lead.createdAt).remainingText.split(',')[0]}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                                {lead.source && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                                                        {lead.source}
                                                    </span>
                                                )}
                                                {lead.assignee && (
                                                    <span className="text-[9px] text-slate-500">
                                                        👤 {lead.assignee}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mobile Direct Action Buttons - 44-48px Touch Targets */}
                                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                                            {lead.phone ? (
                                                <a
                                                    href={`tel:${cleanPhone}`}
                                                    className="flex flex-col items-center justify-center gap-1 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-[10px] font-bold min-h-[44px] active:scale-95 transition-all"
                                                >
                                                    <Phone className="h-3.5 w-3.5" />
                                                    <span>Call</span>
                                                </a>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-2 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-semibold min-h-[44px] opacity-50">
                                                    <Phone className="h-3.5 w-3.5" />
                                                    <span>Call</span>
                                                </div>
                                            )}

                                            {lead.phone ? (
                                                <a
                                                    href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=Hello%20${encodeURIComponent(lead.name)},%20thank%20you%20for%20your%20interest.`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex flex-col items-center justify-center gap-1 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/60 rounded-lg text-[10px] font-bold min-h-[44px] active:scale-95 transition-all"
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    <span>WhatsApp</span>
                                                </a>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-2 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-semibold min-h-[44px] opacity-50">
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    <span>Chat</span>
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setMobileStagePickerLead(lead)}
                                                className="flex flex-col items-center justify-center gap-1 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 rounded-lg text-[10px] font-bold min-h-[44px] active:scale-95 transition-all"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" />
                                                <span>Stage</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openProfile(toId(lead.id || lead._id))}
                                                className="flex flex-col items-center justify-center gap-1 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 rounded-lg text-[10px] font-bold min-h-[44px] active:scale-95 transition-all"
                                            >
                                                <User className="h-3.5 w-3.5" />
                                                <span>Profile</span>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* DESKTOP VIEW (lg+): Full 8-column Drag-and-drop Kanban Board (100% UNCHANGED) */}
                <div className="hidden lg:block h-full overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-[1200px] h-full">
                        {allColumns.map(col => (
                            <div
                                key={col}
                                className="w-72 flex-shrink-0 flex flex-col bg-slate-100/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs overflow-hidden"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, col)}
                            >
                                {/* Column Header (Desktop Software Header) */}
                                <div className={`px-3 py-2 border-b flex justify-between items-center
                                    ${col === "Token VIP" ? "bg-amber-100/90 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/50" : "bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80"}
                                `}>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                                            {col === 'Junk' ? 'Not Interested' : col}
                                        </span>
                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                                            {filteredLeads.filter(l => l.status === col).length}
                                        </span>
                                    </div>
                                    {col === "Token VIP" && <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />}
                                </div>

                                {/* Cards Area */}
                                <div className="p-2 flex-1 overflow-y-auto space-y-1.5 min-h-[120px] software-scrollbar">
                                    {filteredLeads.filter(l => l.status === col).map((lead, idx) => {
                                        const hasRepeated = Boolean(lead.hasRepeatedEnquiry || (lead.attemptsCount && lead.attemptsCount > 1));
                                        const isSpecificDoubt = lead.source?.includes('doubt') || lead.leadType === 'specific-doubt' || lead.requirement?.includes('Specific Doubt') || (Array.isArray(lead.leadTypes) && lead.leadTypes.some(t => t.includes('doubt')));
                                        const isTokenHold = lead.status === 'Token VIP' || lead.isTokenPaid || lead.leadType === 'token-hold' || lead.leadType === 'vip-lead' || (Array.isArray(lead.leadTypes) && lead.leadTypes.some(t => t.includes('token') || t.includes('vip')));
                                        const isOfferLead = lead.leadType === 'offer-enquiry' || Boolean(lead.claimedOffer) || (Array.isArray(lead.leadTypes) && lead.leadTypes.some(t => t.includes('offer')));

                                        return (
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
                                                    p-2.5 rounded-lg shadow-2xs border cursor-pointer hover:shadow-xs transition-all relative group
                                                    ${lead.isGroup 
                                                        ? "bg-purple-50/80 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-800/60" 
                                                        : isTokenHold
                                                        ? "bg-gradient-to-r from-amber-50 to-yellow-50/80 border-amber-300 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800/60"
                                                        : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800/90 hover:border-blue-400 dark:hover:border-blue-600"}
                                                `}
                                            >
                                                <div className="flex justify-between items-start gap-1 mb-1.5">
                                                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate flex-1 leading-snug">
                                                        {lead.name}
                                                    </h4>
                                                    <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
                                                        {hasRepeated && (
                                                            <span className="bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 text-[8px] font-black px-1 py-0.2 rounded-full flex items-center gap-0.5 animate-pulse">
                                                                🔁 2x
                                                            </span>
                                                        )}
                                                        {isTokenHold && (
                                                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[8.5px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                                                <Crown className="h-2.5 w-2.5 text-amber-600" /> ₹111
                                                            </span>
                                                        )}
                                                        {lead.isGroup && (
                                                            <span className="bg-purple-600 text-white text-[8.5px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1">
                                                                <Users className="h-2 w-2"/> G({lead.groupSize || 1})
                                                            </span>
                                                        )}
                                                        {isSpecificDoubt && (
                                                            <span className="bg-blue-100 text-blue-800 text-[8.5px] font-bold px-1 py-0.2 rounded">
                                                                Doubt
                                                            </span>
                                                        )}
                                                        {isOfferLead && (
                                                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[8.5px] font-black px-1 py-0.2 rounded flex items-center gap-0.5">
                                                                🎁 Offer
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-[11px] text-muted-foreground space-y-1 mb-1.5">
                                                    {lead.isGroup ? (
                                                        <p className="flex items-center gap-1 font-medium text-purple-700 dark:text-purple-300 text-[10.5px]">
                                                            <Users className="h-2.5 w-2.5 shrink-0" />
                                                            <span>{lead.groupSize || lead.mergedMembers?.length || 1} Buyers Pool</span>
                                                        </p>
                                                    ) : (
                                                        lead.phone && <p className="font-mono text-[10.5px] text-slate-500 dark:text-slate-400">{lead.phone}</p>
                                                    )}
                                                    {lead.requirement && (
                                                        <div className="flex items-center justify-between text-[10.5px] font-medium bg-slate-50 dark:bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                                                            <span className="truncate">{lead.requirement}</span>
                                                            {lead.budget && <span className="font-mono text-slate-400 font-bold shrink-0">{lead.budget}</span>}
                                                        </div>
                                                    )}
                                                    {(Boolean(lead.interestedUnit || lead.unitNumber || lead.isUnitHeld || lead.status === 'Token VIP')) && (
                                                        <div className="flex items-center justify-between text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100/90 dark:bg-amber-900/40 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                                            <span className="flex items-center gap-1 truncate font-mono">
                                                                <Lock className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                                                                <span>Flat {lead.interestedUnit || lead.unitNumber || "VIP"}</span>
                                                            </span>
                                                            <span className="text-[9px] font-mono text-amber-800 dark:text-amber-300 shrink-0">
                                                                ⏳ {calculateRemainingHoldTime(lead.holdExpiresAt, lead.createdAt).remainingText.split(',')[0]}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[9.5px]">
                                                    <span className="text-slate-400 truncate">
                                                        👤 {lead.assignee || 'Unassigned'}
                                                    </span>
                                                    <span className="font-mono text-slate-400">
                                                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : ""}
                                                    </span>
                                                </div>

                                                {/* Hover Grip Handle */}
                                                <div className="absolute top-2 right-1 opacity-0 group-hover:opacity-100 flex flex-col items-center gap-1 z-10 pointer-events-none">
                                                    <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                                                </div>
                                            </div>
                                        );
                                    })}
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

                {/* Mobile Stage Picker Dialog */}
                {mobileStagePickerLead && (
                    <Dialog open={!!mobileStagePickerLead} onOpenChange={(open) => { if (!open) setMobileStagePickerLead(null); }}>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Move Lead Stage</DialogTitle>
                                <DialogDescription>
                                    Select new pipeline stage for <strong>{mobileStagePickerLead.name}</strong>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-2 py-3">
                                {allColumns.map(stage => (
                                    <Button
                                        key={stage}
                                        variant={mobileStagePickerLead.status === stage ? "default" : "outline"}
                                        className="justify-start text-xs font-semibold h-11"
                                        onClick={() => {
                                            const targetLead = mobileStagePickerLead;
                                            setMobileStagePickerLead(null);
                                            setDroppedLead(targetLead);
                                            setPendingBoardStatus(stage);
                                        }}
                                    >
                                        {stage === 'Junk' ? 'Not Interested' : stage}
                                    </Button>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

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

                                if (droppedLead.isGroup && Array.isArray(droppedLead.mergedMembers) && droppedLead.mergedMembers.length > 0) {
                                    updates.mergedMembers = droppedLead.mergedMembers.map((m: any) => ({
                                        ...m,
                                        status: status
                                    }));
                                }

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

                {/* Mobile Stage Picker Dialog */}
                <Dialog open={!!mobileStagePickerLead} onOpenChange={(open) => { if (!open) setMobileStagePickerLead(null); }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Move Lead Stage</DialogTitle>
                            <DialogDescription>
                                Select a new pipeline stage for <strong>{mobileStagePickerLead?.name}</strong>:
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-2 py-3">
                            {allColumns.map(stage => {
                                const isCurrent = mobileStagePickerLead?.status === stage;
                                return (
                                    <Button
                                        key={stage}
                                        type="button"
                                        variant={isCurrent ? "secondary" : "outline"}
                                        disabled={isCurrent}
                                        onClick={() => {
                                            if (!mobileStagePickerLead) return;
                                            setDroppedLead(mobileStagePickerLead);
                                            setPendingBoardStatus(stage);
                                            setBoardStatusReason("");
                                            setBoardPendingFollowUp("");
                                            setBoardExtraFields({});
                                            setMobileStagePickerLead(null);
                                        }}
                                        className={`justify-start text-xs font-semibold h-11 ${
                                            isCurrent ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : ""
                                        }`}
                                    >
                                        {stage === "Token VIP" && <Crown className="h-3 w-3 text-amber-500 mr-1.5" />}
                                        <span className="truncate">{stage === 'Junk' ? 'Not Interested' : stage}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    // Fetch inventory (towers + units) from /api/inventory whenever selectedPropertyId changes
    useEffect(() => {
        console.log("[CRM DEBUG] selectedPropertyId changed:", selectedPropertyId)
        if (!selectedPropertyId) {
            setInventoryTowers([]);
            setInventoryUnits([]);
            return;
        }
        let cancelled = false;
        setIsFetchingInventory(true);
        console.log("[CRM DEBUG] fetching /api/inventory/", selectedPropertyId)
        fetch(`/api/inventory/${selectedPropertyId}`)
            .then(r => { console.log("[CRM DEBUG] inventory status:", r.status); return r.ok ? r.json() : null; })
            .then(data => {
                if (cancelled || !data) { console.log("[CRM DEBUG] inventory data null or cancelled"); return; }
                console.log("[CRM DEBUG] inventory towers:", data.towers?.length, "units:", data.units?.length)
                const towers = data.towers || [];
                const units = data.units || [];
                setInventoryTowers(towers);
                setInventoryUnits(units);

                // Auto-match tower and unit for selectedLead
                const leadUnitName = (selectedLead?.interestedUnit || selectedLead?.unitNumber || selectedLead?.hierarchyContext?.unitNumber || "").trim().toLowerCase();
                const leadTowerName = (selectedLead?.hierarchyContext?.towerName || "").trim().toLowerCase();
                const leadTowerId = selectedLead?.hierarchyContext?.towerId || selectedLead?.towerId;

                let matchedTowerId = "";
                if (leadTowerId && towers.some((t: any) => (t.id || t._id) === leadTowerId)) {
                    matchedTowerId = leadTowerId;
                } else if (leadTowerName) {
                    const t = towers.find((t: any) => (t.name || "").toLowerCase().includes(leadTowerName) || leadTowerName.includes((t.name || "").toLowerCase()));
                    if (t) matchedTowerId = t.id || t._id;
                } else if (leadUnitName) {
                    const t = towers.find((t: any) => leadUnitName.startsWith((t.name || "").toLowerCase()) || (t.name && leadUnitName.includes((t.name || "").toLowerCase())));
                    if (t) matchedTowerId = t.id || t._id;
                } else if (towers.length === 1) {
                    matchedTowerId = towers[0].id || towers[0]._id || "";
                }
                if (matchedTowerId) {
                    setSelectedTowerId(matchedTowerId);
                }

                if (leadUnitName) {
                    const u = units.find((u: any) => {
                        const uNum = (u.unitNumber || "").toLowerCase();
                        return uNum === leadUnitName || uNum.includes(leadUnitName) || leadUnitName.includes(uNum);
                    });
                    if (u) {
                        setSelectedUnitId(u.id || u._id);
                        if (!matchedTowerId && (u.towerId || u.parentId)) {
                            setSelectedTowerId(u.towerId || u.parentId);
                        }
                    }
                }
            })
            .catch((e) => { console.error("[CRM DEBUG] inventory fetch error:", e); })
            .finally(() => { if (!cancelled) setIsFetchingInventory(false); });
        return () => { cancelled = true; };
    }, [selectedPropertyId, selectedLead?.id]);

    // Derived unit/tower data — shared by both LeadProfile and GroupLeadProfile
    const activeProperty = properties.find(p => (p._id || p.id) === selectedPropertyId);
    const propertyTowers = inventoryTowers.length > 0 ? inventoryTowers : (activeProperty?.details?.towers || []);
    const allPropertyUnits = inventoryUnits.length > 0 ? inventoryUnits : (activeProperty?.details?.generatedUnits || []);
    const propertyUnits = selectedTowerId && selectedTowerId !== "all"
        ? allPropertyUnits.filter((u: any) => (u.towerId || u.parentId)?.toString() === selectedTowerId)
        : allPropertyUnits;

    // --- PROFILE VIEW (KUNDALI) ---
    const LeadProfile = () => {
        if (!selectedLead) return null


        return (
            <div className="h-full flex flex-col lg:flex-row gap-4 min-h-0 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0">
                {/* Left: Customer Bio (Kundali) */}
                <Card className="w-full lg:w-[320px] xl:w-[340px] shrink-0 h-auto lg:h-full border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 flex flex-col overflow-hidden relative">
                    {/* Top Decorative Banner */}
                    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 opacity-15"></div>
                    
                    <CardHeader className="text-center pb-2 border-b border-slate-100 dark:border-slate-800 relative pt-3.5 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                        <div className="relative mx-auto mb-1.5">
                            <div className="relative w-14 h-14 rounded-full bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto overflow-hidden">
                                {(selectedLead.avatar || selectedLead.profilePhoto || selectedLead.photo) ? (
                                    <img src={selectedLead.avatar || selectedLead.profilePhoto || selectedLead.photo} alt={selectedLead.name} className="w-full h-full object-cover" />
                                ) : (
                                    selectedLead.name.charAt(0)
                                )}
                            </div>
                        </div>
                        <CardTitle className="flex items-center justify-center gap-1 text-base tracking-tight font-black">
                            <span>{selectedLead.name}</span>
                            {selectedLead.username && (
                                <span className="text-[9px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.2 rounded-full">
                                    @{selectedLead.username}
                                </span>
                            )}
                            {selectedLead.isTokenPaid && <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500 drop-shadow-sm" />}
                        </CardTitle>
                        <CardDescription className="font-semibold text-[11px] mt-0.5 flex items-center justify-center gap-1">
                            <span className="font-mono text-slate-600 dark:text-slate-300">{selectedLead.phone}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 text-[8.5px] uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded-full font-bold border border-emerald-200/50">Verified</span>
                        </CardDescription>
                        <div className="flex justify-center items-center gap-1.5 mt-2">
                            <Badge className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${selectedLead.isTokenPaid ? "bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 border-0 shadow-sm" : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"}`}>
                                {selectedLead.status}
                            </Badge>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-6 px-2.5 rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 text-[10px] font-bold shadow-sm flex items-center gap-1"
                                onClick={() => router.push(`${userRole === 'mandate' ? '/mandate-dashboard' : '/builder-dashboard'}?tab=chat&chatWith=${selectedLead.id || selectedLead._id}${selectedLead.isGroup ? '&type=group' : ''}`)}
                            >
                                <MessageSquare className="w-3 h-3" />
                                <span>{selectedLead.isGroup ? 'Group Chat' : 'Chat'}</span>
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1"><Home className="w-2.5 h-2.5"/> Req</p>
                                <p className="font-bold text-xs text-slate-700 dark:text-slate-200 truncate">{selectedLead.requirement}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1"><DollarSign className="w-2.5 h-2.5"/> Budget</p>
                                <p className="font-bold text-xs text-slate-700 dark:text-slate-200 truncate">{selectedLead.budget || "On Request"}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 col-span-2">
                                <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1"><Search className="w-2.5 h-2.5"/> Source</p>
                                <p className="font-bold text-xs text-slate-700 dark:text-slate-200 truncate">{selectedLead.source}</p>
                            </div>
                        </div>

                        {/* 👑 VIP UNIT HOLD CONFIRMED & TIMING CARD */}
                        {(() => {
                            const effectiveUnit = selectedLead.interestedUnit || selectedLead.unitNumber || selectedLead.hierarchyContext?.unitNumber || "";
                            const isVipHold = Boolean(
                                selectedLead.isUnitHeld || 
                                selectedLead.status === "Token VIP" || 
                                selectedLead.leadType === "token-hold" || 
                                selectedLead.source === "visitor-unit-hold" || 
                                selectedLead.isTokenPaid || 
                                selectedLead.holdId || 
                                selectedLead.holdExpiresAt
                            );
                            const isSoldLead = Boolean(selectedLead.isUnitSold || (selectedLead.status === "Booked" && effectiveUnit));

                            if (!effectiveUnit && !isVipHold) return null;

                            const timing = calculateRemainingHoldTime(selectedLead.holdExpiresAt, selectedLead.createdAt);
                            const propertyTitle = selectedLead.topPropertyName || selectedLead.clickedPropertyName || selectedLead.hierarchyContext?.propertyName || activeProperty?.name || "Green Valley";
                            const towerTitle = selectedLead.hierarchyContext?.towerName || (effectiveUnit.includes("-") ? effectiveUnit.split("-")[0] : "");

                            if (isVipHold) {
                                return (
                                    <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-gradient-to-br from-amber-50 via-orange-50/60 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/20 shadow-sm space-y-2.5">
                                        {/* Header */}
                                        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-amber-200/80 dark:border-amber-800/60">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                                <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                                VIP Unit Hold Confirmed
                                            </span>
                                            <span className="text-[8.5px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs animate-pulse">
                                                🔒 LOCKED 7 DAYS
                                            </span>
                                        </div>

                                        {/* Unit & Tower Highlight */}
                                        <div className="bg-white/90 dark:bg-slate-900/80 p-2 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                                                Reserved Unit & Tower
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-black text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                                                        <span>{effectiveUnit ? `Flat ${effectiveUnit}` : "Unit Reserved"}</span>
                                                    </p>
                                                    <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                                        {towerTitle ? `Tower ${towerTitle} • ` : ""}{propertyTitle}
                                                    </p>
                                                </div>
                                                {selectedLead.holdId && (
                                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-200">
                                                        {selectedLead.holdId}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Hold Timing & Countdown */}
                                        <div className="space-y-1.5 bg-amber-100/60 dark:bg-amber-900/30 p-2 rounded-lg border border-amber-200/70 dark:border-amber-800/50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1">
                                                    <Clock className="h-3 w-3 text-amber-700 dark:text-amber-400" />
                                                    Hold Expiry Countdown
                                                </span>
                                                <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-full ${timing.isExpired ? "bg-red-200 text-red-900" : "bg-amber-200 text-amber-950 dark:bg-amber-800 dark:text-amber-100 shadow-xs"}`}>
                                                    ⏳ {timing.remainingText}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[9.5px]">
                                                <div>
                                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-[8.5px]">Locked On:</p>
                                                    <p className="font-bold text-slate-800 dark:text-slate-200">{timing.lockedOnText}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-[8.5px]">Hold Expires On:</p>
                                                    <p className="font-bold text-amber-900 dark:text-amber-300">{timing.expiresText}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment & Verification status */}
                                        <div className="flex items-center justify-between text-[9.5px] px-2 py-1 rounded bg-white/70 dark:bg-slate-900/60 border border-amber-100 dark:border-slate-800">
                                            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                ₹{selectedLead.tokenAmount || 111} Token Verified
                                            </span>
                                            {selectedLead.paymentId && (
                                                <span className="font-mono text-[8.5px] text-slate-500">
                                                    {selectedLead.paymentId}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div className={`p-2 rounded-lg border shadow-sm ${
                                    isSoldLead
                                        ? "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-300 dark:border-red-700"
                                        : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800"
                                }`}>
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                        <p className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                            isSoldLead ? "text-red-800 dark:text-red-300" : "text-blue-800 dark:text-blue-300"
                                        }`}>
                                            {isSoldLead ? <CheckCircle2 className="h-3 w-3 text-red-600" /> : <Bookmark className="h-3 w-3 text-blue-600 dark:text-blue-400" />}
                                            {isSoldLead ? "Sold / Booked Unit" : "Preferred Unit"}
                                        </p>
                                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                                            isSoldLead
                                                ? "bg-red-200 dark:bg-red-900 text-red-950 dark:text-red-200 font-black animate-pulse"
                                                : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                                        }`}>
                                            {isSoldLead ? "SOLD OUT" : "Marked"}
                                        </span>
                                    </div>
                                    <p className="font-black text-xs text-slate-900 dark:text-slate-100 truncate">{effectiveUnit}</p>
                                </div>
                            );
                        })()}

                        {/* CLAIMED / APPLIED BUILDER OFFER INFO */}
                        {((selectedLead as any).claimedOffer || (selectedLead as any).offerDetails) && (
                            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-500/10 dark:from-amber-950/40 dark:to-orange-950/40 p-2 rounded-lg border border-amber-400/60 shadow-sm">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <p className="text-amber-800 dark:text-amber-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <Sparkles className="h-3 w-3 text-amber-500" /> Applied Offer
                                    </p>
                                    {(selectedLead as any).claimedOffer?.tag && (
                                        <Badge className="bg-orange-500 text-white font-black text-[8.5px] px-1.5 py-0 border-none">
                                            {(selectedLead as any).claimedOffer.tag}
                                        </Badge>
                                    )}
                                </div>
                                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {(selectedLead as any).claimedOffer?.type || (selectedLead as any).claimedOffer?.offerName || (selectedLead as any).offerDetails || 'Special Offer'}
                                </p>
                            </div>
                        )}

                        {/* REPEATED ENQUIRY & MULTI-TOUCH TRACKING */}
                        {(selectedLead.hasRepeatedEnquiry || (selectedLead.attemptsCount && selectedLead.attemptsCount > 1) || (Array.isArray(selectedLead.interactions) && selectedLead.interactions.length > 1)) && (
                            <div className="p-2.5 bg-orange-50/80 dark:bg-orange-950/30 border border-orange-300/80 dark:border-orange-800 rounded-xl space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-orange-900 dark:text-orange-300 flex items-center gap-1">
                                        🔁 Repeated Inquiries
                                    </span>
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-orange-200 dark:bg-orange-900 text-orange-950 dark:text-orange-200">
                                        {selectedLead.attemptsCount || selectedLead.interactions?.length || 2} Attempts
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                                    Customer submitted repeated inquiries for this property without creating duplicate CRM cards.
                                </p>
                                {Array.isArray(selectedLead.leadTypes) && selectedLead.leadTypes.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1 border-t border-orange-200/60 dark:border-orange-800/60">
                                        {selectedLead.leadTypes.map((t, idx) => (
                                            <span key={idx} className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700">
                                                {t === 'token-hold' ? '₹111 Token VIP' : t === 'specific-doubt' ? 'Specific Doubt' : t === 'offer-enquiry' ? 'Offer Enquiry' : t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider mb-1">Assigned Executive</p>
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 px-2 rounded-lg border border-slate-200/70 shadow-none">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0">
                                    {selectedLead.assignee?.charAt(0) || "?"}
                                </div>
                                <span className="font-semibold text-xs truncate">{selectedLead.assignee || "Unassigned"}</span>
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

                        {/* ─── PENDING PAYMENT VERIFICATION — ADMIN APPROVE/REJECT ─── */}
                        {(selectedLead as any).payment_status === 'PendingVerification' && !selectedLead.isTokenPaid && (
                            <div className="mt-4 p-3.5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 border-2 border-orange-300 dark:border-orange-700 rounded-xl shadow-md animate-pulse-slow">
                                <h5 className="font-black text-orange-800 dark:text-orange-300 text-xs mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                                    <Clock className="w-4 h-4 text-orange-600 animate-spin" style={{ animationDuration: '3s' }} /> Payment Pending Verification
                                </h5>
                                <div className="space-y-1.5 text-xs mb-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">UTR Submitted:</span>
                                        <span className="font-mono font-bold text-orange-900 dark:text-orange-200">{(selectedLead as any).bank_utr_number || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Amount:</span>
                                        <span className="font-bold text-green-600">₹{(selectedLead as any).amount || (selectedLead as any).tokenAmount || 111}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Submitted At:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{(selectedLead as any).utrSubmittedAt ? new Date((selectedLead as any).utrSubmittedAt).toLocaleString('en-IN') : 'N/A'}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-orange-700 dark:text-orange-400 mb-3 leading-relaxed">
                                    ⚠️ User ne UTR submit kiya hai. Paytm Business / Bank Statement me check karo aur approve ya reject karo.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            if (!confirm(`Approve payment of ₹${(selectedLead as any).amount || 111} for ${selectedLead.name}? UTR: ${(selectedLead as any).bank_utr_number}`)) return;
                                            try {
                                                const res = await fetch(`/api/leads/${selectedLead.id}/approve-payment`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ action: 'approve' }),
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    alert(`✅ Payment Approved! Receipt: ${data.receiptNo}`);
                                                    window.location.reload();
                                                } else {
                                                    alert(`Error: ${data.error}`);
                                                }
                                            } catch (err: any) {
                                                alert(`Error: ${err.message}`);
                                            }
                                        }}
                                        className="flex-1 py-2 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve Payment
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const reason = prompt('Rejection reason (optional):');
                                            try {
                                                const res = await fetch(`/api/leads/${selectedLead.id}/approve-payment`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ action: 'reject', adminNote: reason || '' }),
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    alert('❌ Payment Rejected.');
                                                    window.location.reload();
                                                } else {
                                                    alert(`Error: ${data.error}`);
                                                }
                                            } catch (err: any) {
                                                alert(`Error: ${err.message}`);
                                            }
                                        }}
                                        className="py-2 px-3 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                                    >
                                        <XCircle className="w-3.5 h-3.5" /> Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* DYNAMIC GROUP SECTION */}
                        {selectedLead.isGroup && (
                            <div className="mt-4 space-y-3">
                                <div className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/10 border border-purple-200 dark:border-purple-800/60 rounded-xl shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-black text-purple-900 dark:text-purple-300 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                                            <Users className="w-4 h-4 text-purple-600"/> Group Buying Campaign
                                        </h5>
                                        <Badge className="bg-purple-600 text-white font-bold text-[10px] px-2 py-0.5 border-none">
                                            {selectedLead.groupSize || selectedLead.mergedMembers?.length || 1} Buyers Pool
                                        </Badge>
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground text-[11px]">Active Discount:</span>
                                            <span className="font-bold text-purple-700 dark:text-purple-300">{selectedLead.groupDiscount || 'Dynamic Group Discount'}</span>
                                        </div>
                                        {selectedLead.topPropertyName && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground text-[11px]">Property Deal:</span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">{selectedLead.topPropertyName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                            <span>Joined Buyers Roster</span>
                                            <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded-full text-[9px]">
                                                {selectedLead.mergedMembers?.length || selectedLead.groupSize || 1}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                        {(Array.isArray(selectedLead.mergedMembers) && selectedLead.mergedMembers.length > 0) ? (
                                             selectedLead.mergedMembers.map((member: any, i: number) => (
                                                <div key={i} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden border border-purple-200">
                                                                {(member.avatar || member.photo || member.profilePhoto) ? (
                                                                    <img src={member.avatar || member.photo || member.profilePhoto} alt={member.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    (member.name || `U${i+1}`).charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1">
                                                                    <span>{member.name || `Buyer ${i+1}`}</span>
                                                                    {member.username && (
                                                                        <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400">@{member.username}</span>
                                                                    )}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground font-mono">{member.phone}</p>
                                                            </div>
                                                        </div>
                                                        {member.clickedLevel && (
                                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 font-semibold bg-purple-50 text-purple-700 border-purple-200">
                                                                {member.clickedLevel}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                                                        <span className="line-clamp-1">{member.clickedPropertyName || member.email || 'Group Buyer'}</span>
                                                        <div className="flex items-center gap-1.5">
                                                            {member.phone && (
                                                                <a 
                                                                    href={`tel:${member.phone}`} 
                                                                    className="text-blue-600 hover:text-blue-700 font-bold px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-[9px] transition-colors"
                                                                >
                                                                    Call
                                                                </a>
                                                            )}
                                                            <button 
                                                                type="button"
                                                                onClick={() => router.push(`${userRole === 'mandate' ? '/mandate-dashboard' : '/builder-dashboard'}?tab=chat&chatWith=${selectedLead.id || selectedLead._id}&memberId=${member.userId || member.visitorId || member.phone || ''}&type=direct`)}
                                                                className="text-purple-600 hover:text-purple-700 font-bold px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-[9px] flex items-center gap-1 transition-colors cursor-pointer"
                                                                title="Chat directly with this member"
                                                            >
                                                                <MessageSquare className="w-2.5 h-2.5" />
                                                                Chat
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl text-center text-xs text-slate-500">
                                                <p className="font-medium">{selectedLead.name}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{selectedLead.phone}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Center: Activity Timeline */}
                <Card className="w-full lg:flex-1 min-h-[460px] lg:h-full min-w-0 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="shrink-0 px-5 py-3 border-b bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-sm">
                        <CardTitle className="text-base font-bold flex justify-between items-center text-slate-800 dark:text-slate-100">
                            <span>Activity Timeline</span>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Realtime Sync
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <div ref={timelineRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-50/40 dark:bg-slate-950/30">
                        {/* We reverse the array so newest is at the bottom for a chat feel */}
                        {[...(selectedLead.timeline || [])].reverse().map((event, i) => {
                            const isSystem = event.type === 'system';
                            const isNote = event.type === 'note';
                            
                            if (isSystem) {
                                return (
                                    <div key={i} className="flex justify-center w-full my-3">
                                        <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11.5px] py-2 px-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1 max-w-[85%] text-center">
                                            <div className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                                                <Activity className="h-3 w-3" />
                                                <span>{event.title || 'System Update'}</span>
                                            </div>
                                            <span className="break-words whitespace-pre-wrap leading-relaxed">{event.desc}</span>
                                            <span className="opacity-60 text-[9px] mt-0.5">
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
                                            <p className="text-xs leading-relaxed">{event.desc}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground pr-1 font-mono">
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
                                            <h4 className="font-semibold text-xs mb-1 text-slate-800 dark:text-slate-100">{event.title}</h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{event.desc}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground pl-10 font-mono">
                                        {event.date ? new Date(event.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Quick Note Input Bar at Bottom */}
                    <div className="shrink-0 p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                        <Input
                            placeholder="Write an internal follow-up note (press Enter to post)..."
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddNote();
                                }
                            }}
                            className="h-9 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border-slate-200 dark:border-slate-700"
                        />
                        <Button 
                            size="sm"
                            onClick={handleAddNote}
                            disabled={!noteInput.trim() || isSendingNote}
                            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shrink-0 flex items-center gap-1.5 transition-transform active:scale-95"
                        >
                            {isSendingNote ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            <span>Add Note</span>
                        </Button>
                    </div>
                </Card>

                {/* Right: Action Console */}
                <Card className="w-full lg:w-[320px] xl:w-[340px] shrink-0 h-auto lg:h-full border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
                    <CardHeader className="shrink-0 px-3.5 py-2 border-b bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-sm">
                        <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                            <span>Action Console</span>
                            <Badge variant="outline" className="text-[9px] font-mono font-semibold px-1.5 py-0 border-slate-200">
                                Controls
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">

                        {/* 1. Pipeline Stage */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><TrendingUp className="w-3 h-3 text-blue-600"/> Pipeline Stage</label>
                            <Select
                                value={selectedLead.status}
                                disabled={selectedLead.status === "Booked"}
                                onValueChange={(val: LeadStatus) => {
                                    setPendingStatus(val);
                                    setStatusReason("");
                                    setPendingFollowUp(selectedLead.nextActionTime ? new Date(selectedLead.nextActionTime).toISOString().slice(0,16) : "");
                                }}
                            >
                                <SelectTrigger className="h-8 font-bold text-xs bg-slate-50/60 dark:bg-slate-800 rounded-lg shadow-none border-slate-200 dark:border-slate-700 ring-offset-0 focus:ring-1 focus:ring-blue-500 hover:border-blue-300 transition-colors">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Fresh" className="font-semibold cursor-pointer py-1 text-xs">Fresh (New Inquiry)</SelectItem>
                                    {selectedLead.status === "Token VIP" && <SelectItem value="Token VIP" className="font-semibold cursor-pointer py-1 text-xs">Token VIP (VIP Booking)</SelectItem>}
                                    <SelectItem value="Connected" className="font-semibold cursor-pointer py-1 text-xs">Connected (Follow-up)</SelectItem>
                                    <SelectItem value="Site Visit" className="font-semibold cursor-pointer py-1 text-xs">Site Visit (Property Seen)</SelectItem>
                                    <SelectItem value="Negotiation" className="font-semibold cursor-pointer py-1 text-xs">Negotiation (Closing)</SelectItem>
                                    <SelectItem value="Final Negotiation" className="font-semibold cursor-pointer py-1 text-xs">Final Negotiation (Final Deal)</SelectItem>
                                    <SelectItem value="Booked" className="font-semibold cursor-pointer py-1 text-xs">Booked (Deal Closed)</SelectItem>
                                    <SelectItem value="Junk" className="font-semibold cursor-pointer py-1 text-xs">Not Interested (Junk)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 1.5 Assign Executive / RM / Team Leader */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                <span className="flex items-center gap-1"><User className="w-3 h-3 text-indigo-600"/> Assign Executive / RM</span>
                                <span className="text-[8px] text-slate-400 font-bold">{selectedLead.assignee ? "Assigned" : "Developer Desk"}</span>
                            </label>
                            <Select
                                value={selectedLead.assignee || "unassigned"}
                                onValueChange={async (val) => {
                                    const newAssignee = val === "unassigned" ? "" : val;
                                    const id = selectedLead.id || selectedLead._id;
                                    
                                    // Optimistic update
                                    upsertLead({
                                        ...selectedLead,
                                        assignee: newAssignee
                                    });

                                    offlineSafeFetch(`/api/leads/${id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ 
                                            assignee: newAssignee,
                                            actionType: "Executive Assigned",
                                            actionDesc: newAssignee ? `Assigned to ${newAssignee}` : "Reverted to Developer Sales Desk"
                                        })
                                    }).catch(err => console.error("Error updating assignee:", err));
                                }}
                            >
                                <SelectTrigger className="h-8 font-bold text-xs bg-slate-50/60 dark:bg-slate-800 rounded-lg shadow-none border-slate-200 dark:border-slate-700 ring-offset-0 focus:ring-1 focus:ring-indigo-500 hover:border-indigo-300 transition-colors">
                                    <SelectValue placeholder="Assign to..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned" className="font-semibold text-emerald-700 py-1 text-xs">
                                        🏢 Unassigned (Developer Sales Desk)
                                    </SelectItem>
                                    {teamMembers.map((m) => (
                                        <SelectItem key={m.id} value={m.name} className="font-semibold cursor-pointer py-1 text-xs">
                                            👤 {m.name}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="Vikram Malhotra (Relationship Manager)" className="font-semibold cursor-pointer py-1 text-xs">
                                        👤 Vikram Malhotra (Relationship Manager)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 2. Preferred Unit Selection with Hold / Reserve / Sold Option */}
                        {(() => {
                            const isLeadBooked = selectedLead.status === "Booked" || Boolean(selectedLead.isUnitSold);
                            const isSold = Boolean(selectedLead.isUnitSold || (selectedLead.status === "Booked" && selectedLead.interestedUnit));

                            return (
                                <div className="space-y-2 p-2.5 border rounded-xl shadow-none bg-slate-50/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                                        <h4 className="font-bold text-[11px] flex items-center gap-1 text-slate-800 dark:text-slate-200">
                                            {isSold ? (
                                                <CheckCircle2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                                            ) : selectedLead.isUnitHeld ? (
                                                <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                            ) : (
                                                <Bookmark className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                            )}
                                            Preferred Unit
                                        </h4>
                                        <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full border ${
                                            isSold
                                                ? "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-800 animate-pulse"
                                                : selectedLead.isUnitHeld 
                                                    ? "text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 border-amber-300 dark:border-amber-700" 
                                                    : "text-slate-500 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                        }`}>
                                            {isSold ? "SOLD OUT" : selectedLead.isUnitHeld ? "RESERVED" : "Reference"}
                                        </span>
                                    </div>

                                    {Boolean(selectedLead.interestedUnit || selectedLead.unitNumber || selectedLead.hierarchyContext?.unitNumber) && (() => {
                                        const effectiveUnit = selectedLead.interestedUnit || selectedLead.unitNumber || selectedLead.hierarchyContext?.unitNumber || "";
                                        return (
                                            <div className={`p-1.5 px-2 rounded-lg border flex items-center justify-between gap-1.5 ${
                                                isSold
                                                    ? "bg-red-50/90 dark:bg-red-950/40 border-red-300 dark:border-red-800/70"
                                                    : selectedLead.isUnitHeld 
                                                        ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/70"
                                                        : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60"
                                            }`}>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1">
                                                        <p className={`text-[8.5px] font-bold uppercase tracking-wider ${
                                                            isSold ? "text-red-700 dark:text-red-400" : selectedLead.isUnitHeld ? "text-amber-700 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                                                        }`}>
                                                            {isSold ? "Sold Unit" : selectedLead.isUnitHeld ? "Reserved Unit" : "Current Tag"}
                                                        </p>
                                                        {isSold ? (
                                                            <span className="text-[7.5px] font-black uppercase px-1 py-0 rounded bg-red-600 text-white animate-pulse">
                                                                Sold
                                                            </span>
                                                        ) : selectedLead.isUnitHeld ? (
                                                            <span className="text-[7.5px] font-black uppercase px-1 py-0 rounded bg-amber-500 text-white animate-pulse">
                                                                Held
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <p className="text-[11px] font-bold truncate text-slate-900 dark:text-slate-100">{effectiveUnit}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-5 px-1.5 text-[9px] font-bold text-red-600 hover:text-red-700 hover:bg-red-100/50 rounded shrink-0"
                                                    disabled={isBlockingUnit}
                                                    onClick={handleClearPreferredUnit}
                                                    title={isSold ? "Release sold unit back to available" : selectedLead.isUnitHeld ? "Release unit hold in inventory" : "Clear unit preference"}
                                                >
                                                    {isSold || selectedLead.isUnitHeld ? "Release" : "Clear"}
                                                </Button>
                                            </div>
                                        );
                                    })()}

                                    {properties.length > 0 ? (
                                        <div className="space-y-1.5">
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 block">Property</label>
                                                <Select value={selectedPropertyId} onValueChange={(val) => { setSelectedPropertyId(val); setSelectedTowerId(""); setSelectedUnitId(""); }}>
                                                    <SelectTrigger className="h-8 text-xs font-medium bg-white dark:bg-slate-900 rounded-lg border-slate-200">
                                                        <SelectValue placeholder="Choose Property" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {properties.map(p => (
                                                            <SelectItem key={p._id || p.id} value={p._id || p.id} className="text-xs py-1 cursor-pointer">{p.name || p.townshipName || p.title || "Property"}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {propertyTowers.length > 0 && (
                                                <div>
                                                    <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 block">Tower / Phase</label>
                                                    <Select value={selectedTowerId} onValueChange={(val) => { setSelectedTowerId(val === "all" ? "" : val); setSelectedUnitId(""); }} disabled={!selectedPropertyId}>
                                                        <SelectTrigger className="h-8 text-xs font-medium bg-white dark:bg-slate-900 rounded-lg border-slate-200">
                                                            <SelectValue placeholder="Choose Tower" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all" className="text-xs py-1 cursor-pointer font-bold">All Towers</SelectItem>
                                                            {propertyTowers.map((t: any) => (
                                                                <SelectItem key={t.id || t._id} value={t.id || t._id} className="text-xs py-1 cursor-pointer">{t.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 block flex items-center gap-1">
                                                    Unit / Flat
                                                    {isFetchingInventory && <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin ml-1" />}
                                                </label>
                                                <Popover open={isUnitDropdownOpen} onOpenChange={setIsUnitDropdownOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={isUnitDropdownOpen}
                                                            disabled={!selectedPropertyId}
                                                            className="w-full h-8 text-xs font-medium bg-white dark:bg-slate-900 rounded-lg border-slate-200 justify-between px-3"
                                                        >
                                                            <span className="truncate">
                                                                {selectedUnitId
                                                                    ? (() => {
                                                                        const u = propertyUnits.find((u: any) => (u.id || u._id) === selectedUnitId);
                                                                        if (!u) return "Choose Unit";
                                                                        const cleanNum = getCleanUnitLabel(u.unitNumber, activeProperty?.name || activeProperty?.title);
                                                                        return `Flat ${cleanNum} ${u.configuration ? `(${u.configuration})` : ''}`;
                                                                    })()
                                                                    : !selectedPropertyId ? "Select property first" : "Choose Unit"}
                                                            </span>
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search unit number..." className="h-9 text-xs" />
                                                            <CommandList>
                                                                <CommandEmpty>No unit found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {propertyUnits.map((u: any, idx: number) => {
                                                                        const unitKey = u.id || u._id || `unit-${idx}`;
                                                                        const statusSuffix = u.status && u.status !== 'available' ? ` (${u.status})` : '';
                                                                        const cleanNum = getCleanUnitLabel(u.unitNumber, activeProperty?.name || activeProperty?.title);
                                                                        const label = `Flat ${cleanNum} ${u.configuration ? `(${u.configuration})` : ''}${statusSuffix}`;
                                                                        return (
                                                                            <CommandItem
                                                                                key={unitKey}
                                                                                value={label} // used for filtering internally by Command
                                                                                onSelect={() => {
                                                                                    setSelectedUnitId(unitKey === selectedUnitId ? "" : unitKey);
                                                                                    setIsUnitDropdownOpen(false);
                                                                                }}
                                                                                className="text-xs py-1.5 cursor-pointer"
                                                                            >
                                                                                <Check
                                                                                    className={`mr-2 h-3.5 w-3.5 ${
                                                                                        selectedUnitId === unitKey ? "opacity-100" : "opacity-0"
                                                                                    }`}
                                                                                />
                                                                                {label}
                                                                            </CommandItem>
                                                                        );
                                                                    })}
                                                                    {propertyUnits.length === 0 && (
                                                                        <div className="p-2 text-xs text-center text-slate-500">No Units in this Property</div>
                                                                    )}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* Hold / Reserve or Sold Toggle (Updates Inventory & Visitor Panel) */}
                                            <div className={`flex items-center justify-between p-1.5 px-2 rounded-lg border shadow-xs ${
                                                isLeadBooked
                                                    ? "bg-red-50/90 dark:bg-red-950/40 border-red-200/80 dark:border-red-800/60"
                                                    : "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60"
                                            }`}>
                                                <label htmlFor="hold-unit-toggle" className="flex items-center gap-1.5 cursor-pointer select-none">
                                                    <input 
                                                        id="hold-unit-toggle"
                                                        type="checkbox"
                                                        checked={Boolean(isHoldUnitEnabled || selectedLead.isUnitHeld || selectedLead.status === "Token VIP")}
                                                        onChange={(e) => setIsHoldUnitEnabled(e.target.checked)}
                                                        className={`w-3.5 h-3.5 rounded cursor-pointer ${
                                                            isLeadBooked
                                                                ? "text-red-600 border-red-300 focus:ring-red-500 accent-red-600"
                                                                : "text-amber-600 border-amber-300 focus:ring-amber-500 accent-amber-600"
                                                        }`}
                                                    />
                                                    <span className={`text-[10px] font-black ${
                                                        isLeadBooked ? "text-red-900 dark:text-red-200" : "text-amber-900 dark:text-amber-200"
                                                    }`}>
                                                        {isLeadBooked ? "Mark Unit as Sold" : "Hold / Reserve Unit"}
                                                    </span>
                                                </label>
                                                <span className={`text-[8px] font-bold px-1 py-0.2 rounded border uppercase tracking-tight ${
                                                    isLeadBooked
                                                        ? "text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-900/60 border-red-300/50"
                                                        : "text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/60 border-amber-300/50"
                                                }`}>
                                                    {isLeadBooked ? "Sold Out • Inventory & Visitor" : "Inventory & Visitor"}
                                                </span>
                                            </div>

                                            <Button
                                                className={`w-full h-8 text-xs font-bold text-white shadow-none rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                                                    isLeadBooked && isHoldUnitEnabled
                                                        ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                                                        : isHoldUnitEnabled 
                                                            ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700" 
                                                            : "bg-blue-600 hover:bg-blue-700"
                                                }`}
                                                disabled={!selectedUnitId || isBlockingUnit}
                                                onClick={handleSavePreferredUnit}
                                            >
                                                {isBlockingUnit ? (
                                                    <>
                                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        <span>{isLeadBooked ? "Marking as Sold..." : isHoldUnitEnabled ? "Reserving Unit..." : "Saving..."}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        {isLeadBooked && isHoldUnitEnabled ? (
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        ) : isHoldUnitEnabled ? (
                                                            <Lock className="h-3 w-3" />
                                                        ) : (
                                                            <Bookmark className="h-3 w-3" />
                                                        )}
                                                        <span>
                                                            {isLeadBooked && isHoldUnitEnabled 
                                                                ? "Confirm & Mark Unit as Sold" 
                                                                : isHoldUnitEnabled 
                                                                    ? "Reserve & Tag Unit" 
                                                                    : "Save Preferred Unit"}
                                                        </span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-center">
                                            <p className="text-[9px] font-medium text-slate-500">No inventory found</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* 3. Quick Actions */}
                        <div className="space-y-1 pt-0.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Quick Actions</label>
                            <Button 
                                variant="outline" 
                                disabled={selectedLead.status === "Booked"}
                                className={`w-full gap-1.5 h-8 text-xs font-bold rounded-lg shadow-none transition-transform active:scale-95 ${selectedLead.status === "Junk" ? "text-slate-600 bg-slate-100 border-slate-200" : "text-red-600 bg-red-50 hover:text-red-700 hover:bg-red-100 border-red-200"}`}
                                onClick={() => {
                                    setPendingStatus((selectedLead.status === "Junk" ? "Fresh" : "Junk") as any);
                                    setStatusReason("");
                                    setPendingFollowUp(selectedLead.nextActionTime ? new Date(selectedLead.nextActionTime).toISOString().slice(0,16) : "");
                                }}
                            >
                                {selectedLead.status === "Junk" ? <><CheckCircle2 className="h-3.5 w-3.5" /> Restore Lead</> : <><XCircle className="h-3.5 w-3.5" /> Mark Not Interested</>}
                            </Button>
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

                                if (pendingStatus === "Site Visit") {
                                    const svTime = extraFields.siteVisitDateTime || pendingFollowUp;
                                    if (svTime) {
                                        updates.siteVisitDateTime = new Date(svTime).toISOString();
                                        updates.siteVisitStatus = "Scheduled";
                                        updates.nextActionTime = new Date(svTime).toISOString();
                                    }
                                }

                                const isBookedStage = pendingStatus === "Booked";
                                const targetUnitId = selectedLead.unitId || selectedUnitId;
                                const targetPropertyId = selectedLead.propertyId || selectedPropertyId;

                                if (isBookedStage) {
                                    updates.isUnitSold = true;
                                    updates.isUnitHeld = false;
                                    setIsHoldUnitEnabled(true);

                                    if (targetUnitId && targetPropertyId) {
                                        offlineSafeFetch(`/api/units/${targetUnitId}?propertyId=${targetPropertyId}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                status: "sold",
                                                customerName: selectedLead.name,
                                                customerPhone: selectedLead.phone,
                                                bookingDate: new Date().toISOString()
                                            })
                                        }).catch(err => console.error("Error auto-marking unit as sold:", err));

                                        setProperties(prev => prev.map(p => {
                                            if ((p._id || p.id) === targetPropertyId && p.details?.generatedUnits) {
                                                const updatedUnits = p.details.generatedUnits.map((u: any, idx: number) => {
                                                    const uKey = u.id || u._id || `unit-${idx}`;
                                                    if (uKey === targetUnitId) {
                                                        return { ...u, status: "sold", customerName: selectedLead.name, customerPhone: selectedLead.phone };
                                                    }
                                                    return u;
                                                });
                                                return { ...p, details: { ...p.details, generatedUnits: updatedUnits } };
                                            }
                                            return p;
                                        }));
                                    }
                                }

                                // Apply to local state immediately
                                upsertLead({
                                    ...selectedLead,
                                    status: pendingStatus,
                                    isUnitSold: isBookedStage ? true : selectedLead.isUnitSold,
                                    isUnitHeld: isBookedStage ? false : selectedLead.isUnitHeld,
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

                                if (isBookedStage) {
                                    router.push(`/builder-dashboard?tab=documents&customer=${id}&doc=booking-form&unit=${targetUnitId || ''}&property=${targetPropertyId || ''}`);
                                }

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

        // Extract real members from mergedMembers array or fallback to primary lead info
        const realMembers = (Array.isArray(selectedLead.mergedMembers) && selectedLead.mergedMembers.length > 0)
            ? selectedLead.mergedMembers
            : [{
                id: selectedLead.id || selectedLead._id,
                _id: selectedLead.id || selectedLead._id,
                userId: selectedLead.userId || selectedLead.visitorId || selectedLead.id || selectedLead._id,
                visitorId: selectedLead.visitorId || selectedLead.userId || '',
                name: selectedLead.name?.replace(/\s*—\s*Group Buying Pool/i, '') || selectedLead.name,
                phone: selectedLead.phone,
                email: selectedLead.email || '',
                avatar: selectedLead.avatar || selectedLead.photo || selectedLead.profilePhoto || '',
                photo: selectedLead.photo || selectedLead.avatar || selectedLead.profilePhoto || '',
                profilePhoto: selectedLead.profilePhoto || selectedLead.avatar || selectedLead.photo || '',
                username: selectedLead.username || (selectedLead.email ? selectedLead.email.split('@')[0] : '') || '',
                status: selectedLead.status || 'Fresh',
                clickedLevel: selectedLead.clickedLevel || 'Township',
                clickedPropertyName: selectedLead.clickedPropertyName || selectedLead.topPropertyName || selectedLead.name,
                sourceUrl: selectedLead.sourceUrl || '',
                joinedAt: selectedLead.createdAt || new Date().toISOString()
            }];

        const groupSize = selectedLead.groupSize || realMembers.length;

        const members = realMembers.map((m: any, i: number) => ({
            id: m.id || m._id || m.visitorId || `member-${i}`,
            _id: m.id || m._id || m.visitorId || `member-${i}`,
            userId: m.userId || m.visitorId || m.id || m._id || '',
            visitorId: m.visitorId || m.userId || '',
            name: m.name || `Buyer ${i + 1}`,
            phone: m.phone || selectedLead.phone || '',
            email: m.email || '',
            avatar: m.avatar || m.photo || m.profilePhoto || selectedLead.avatar || selectedLead.photo || selectedLead.profilePhoto || '',
            photo: m.photo || m.avatar || m.profilePhoto || selectedLead.avatar || selectedLead.photo || '',
            profilePhoto: m.profilePhoto || m.avatar || m.photo || selectedLead.avatar || selectedLead.profilePhoto || '',
            username: m.username || selectedLead.username || (m.email ? m.email.split('@')[0] : (selectedLead.email ? selectedLead.email.split('@')[0] : '')) || '',
            status: memberStatuses[i] || m.status || selectedLead.status || 'Fresh',
            clickedLevel: m.clickedLevel || selectedLead.clickedLevel || 'Property',
            clickedPropertyName: m.clickedPropertyName || selectedLead.clickedPropertyName || selectedLead.topPropertyName || '',
            sourceUrl: m.sourceUrl || selectedLead.sourceUrl || '',
            joinedAt: m.joinedAt ? new Date(m.joinedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'
        }));

        const hasNegotiationMember = members.some(m => m.status === "Negotiation" || m.status === "Final Negotiation");
        const membersKeeping = members.filter(m => m.status === 'Booked' || m.status === 'Negotiation' || m.status === 'Final Negotiation');
        const membersSplitting = members.filter(m => m.status !== 'Booked' && m.status !== 'Negotiation' && m.status !== 'Final Negotiation');

        const handleRemoveMember = (memberToRemove: any, idx: number) => {
            if (!selectedLead || !confirm(`Remove ${memberToRemove.name} from this group? They will become a normal individual lead.`)) return;

            // 1. Create the removed member as a new individual lead
            const newIndividualPayload = {
                name: memberToRemove.name,
                phone: memberToRemove.phone,
                email: memberToRemove.email || "",
                status: memberToRemove.status || "Fresh",
                isGroup: false,
                source: "Group Deal (Extracted)",
                requirement: selectedLead.requirement,
                budget: selectedLead.budget
            };

            // Fire POST to create the lead and update local store
            offlineSafeFetch(`/api/leads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newIndividualPayload)
            })
            .then(async (res) => {
                if (res && typeof res.json === 'function') {
                    const data = await res.json();
                    if (data?.lead) {
                        upsertLead(data.lead);
                    }
                }
            })
            .catch(console.error);

            // 2. Shrink the current group
            const remainingMembers = members.filter((m, i) => i !== idx).map(m => ({
                id: m.id,
                name: m.name,
                phone: m.phone,
                email: m.email,
                status: m.status,
                clickedLevel: m.clickedLevel,
                clickedPropertyName: m.clickedPropertyName,
                sourceUrl: m.sourceUrl,
                joinedAt: m.joinedAt
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
                                        const rawDiscount = selectedLead.groupDiscount || "12% Off|15% Off|10";
                                        const parts = rawDiscount.includes("|") ? rawDiscount.split("|") : [rawDiscount, "15% Off", (groupSize + 2).toString()];
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
                                        <p className="text-base font-black text-emerald-400 leading-tight line-clamp-1">
                                            {(() => {
                                                const raw = selectedLead.groupDiscount || "12% Off";
                                                return raw.includes("|") ? raw.split("|")[0].trim() : raw;
                                            })()}
                                        </p>
                                    </div>
                                    <div className="mt-1 pt-1 border-t border-white/10">
                                        <p className="text-[8.5px] text-purple-100 leading-tight opacity-90">
                                            {(() => {
                                                const raw = selectedLead.groupDiscount || "12% Off|15% Off|10";
                                                if (raw.includes("|")) {
                                                    const parts = raw.split("|");
                                                    return (
                                                        <>Next: <strong className="text-white">{parts[1] || "15% Off"}</strong> at <strong className="text-white">{parts[2] || (groupSize + 2)} members</strong></>
                                                    );
                                                }
                                                return <span>Tier goal active</span>;
                                            })()}
                                        </p>
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
                                <Button variant="outline" size="sm" onClick={() => router.push(`${userRole === 'mandate' ? '/mandate-dashboard' : '/builder-dashboard'}?tab=chat&chatWith=${selectedLead.id || selectedLead._id}&type=group`)} className="h-8 text-[11px] font-bold gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50">
                                    <MessageSquare className="w-3.5 h-3.5"/> Group Chat
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
                                            <th className="p-4">Clicked Level & Property</th>
                                            <th className="p-4">Joined Time</th>
                                            <th className="p-4">Current Stage</th>
                                            <th className="p-4 text-right pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map((m, idx) => (
                                            <tr key={m.id || idx} onClick={() => setSelectedMemberIdx(idx)} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                                <td className="p-4 pl-6 text-xs text-slate-400 font-bold text-center">{idx + 1}</td>
                                                <td className="p-4 font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-purple-200 dark:border-purple-800">
                                                        {(m.avatar || m.photo || m.profilePhoto) ? (
                                                            <img src={m.avatar || m.photo || m.profilePhoto} alt={m.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            m.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="leading-tight flex items-center gap-1.5">
                                                            <span>{m.name}</span>
                                                            {m.username && (
                                                                <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded-md">
                                                                    @{m.username}
                                                                </span>
                                                            )}
                                                        </p>
                                                        {m.email && <p className="text-[11px] font-normal text-slate-400">{m.email}</p>}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    {m.phone}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        <Badge variant="outline" className="w-fit font-bold text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200">
                                                            {m.clickedLevel}
                                                        </Badge>
                                                        {m.clickedPropertyName && (
                                                            <span className="text-[11px] text-slate-500 line-clamp-1">{m.clickedPropertyName}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-xs text-slate-500 font-medium">
                                                    {m.joinedAt}
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
                                                    <Button onClick={(e) => { e.stopPropagation(); router.push(`${userRole === 'mandate' ? '/mandate-dashboard' : '/builder-dashboard'}?tab=chat&chatWith=${selectedLead.id || selectedLead._id}&memberId=${m.userId || m.visitorId || m.phone}&type=direct`); }} variant="outline" size="icon" className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" title="Chat with Member">
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
                            
                            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 h-full overflow-y-auto md:overflow-hidden pb-20 md:pb-0 custom-scrollbar">
                                {/* 1. Left: Member Bio (Mimics LeadProfile) */}
                                <Card className="w-full md:w-1/4 shrink-0 h-auto md:h-full border-0 shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 flex flex-col relative">
                                    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 opacity-10 rounded-t-xl"></div>
                                    <CardHeader className="text-center pb-3 border-b border-slate-100 dark:border-slate-800 relative pt-5">
                                        <div className="relative mx-auto mb-3">
                                            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur opacity-30"></div>
                                            <div className="relative w-16 h-16 rounded-full bg-white dark:bg-slate-800 border-[3px] border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto overflow-hidden">
                                                {(members[selectedMemberIdx].avatar || members[selectedMemberIdx].photo || members[selectedMemberIdx].profilePhoto) ? (
                                                    <img src={members[selectedMemberIdx].avatar || members[selectedMemberIdx].photo || members[selectedMemberIdx].profilePhoto} alt={members[selectedMemberIdx].name} className="w-full h-full object-cover" />
                                                ) : (
                                                    members[selectedMemberIdx].name.charAt(0)
                                                )}
                                            </div>
                                        </div>
                                        <CardTitle className="flex items-center justify-center gap-1.5 text-lg tracking-tight">
                                            <span>{members[selectedMemberIdx].name}</span>
                                            {members[selectedMemberIdx].username && (
                                                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full">
                                                    @{members[selectedMemberIdx].username}
                                                </span>
                                            )}
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
                                                onClick={() => router.push(`${userRole === 'mandate' ? '/mandate-dashboard' : '/builder-dashboard'}?tab=chat&chatWith=${selectedLead.id || selectedLead._id}&memberId=${members[selectedMemberIdx].userId || members[selectedMemberIdx].visitorId || members[selectedMemberIdx].phone}&type=direct`)}
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

                                        {((selectedLead as any).claimedOffer || (selectedLead as any).offerDetails) && (
                                            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg mt-2">
                                                <h5 className="font-bold text-amber-800 dark:text-amber-300 text-[11px] mb-1 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3 text-amber-500" /> Applied Offer
                                                </h5>
                                                <p className="font-black text-xs text-slate-800 dark:text-slate-100">
                                                    {(selectedLead as any).claimedOffer?.type || (selectedLead as any).claimedOffer?.offerName || (selectedLead as any).offerDetails}
                                                </p>
                                                {((selectedLead as any).claimedOffer?.benefit || (selectedLead as any).claimedOffer?.condition) && (
                                                    <p className="text-[10.5px] font-semibold text-amber-700 dark:text-amber-300 mt-0.5">
                                                        🎁 {(selectedLead as any).claimedOffer?.benefit || (selectedLead as any).claimedOffer?.condition}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                                
                                {/* 2. Center: Activity Timeline */}
                                <Card className="flex-1 h-[400px] md:h-full shrink-0 border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
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
                                <Card className="w-full md:w-1/4 shrink-0 h-auto md:h-full border-0 shadow-xl shadow-slate-200/40 dark:shadow-none bg-gradient-to-b from-blue-50/40 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col relative">
                                    <CardHeader className="pb-3 border-b border-blue-100/50 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-10 rounded-t-xl">
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
                                        
                                        {(() => {
                                            const isLeadBooked = selectedLead.status === "Booked" || Boolean(selectedLead.isUnitSold);
                                            const isSold = Boolean(selectedLead.isUnitSold || (selectedLead.status === "Booked" && selectedLead.interestedUnit));

                                            return (
                                                <div className="space-y-2.5 p-3 border rounded-xl shadow-sm bg-slate-50/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                                                        <h4 className="font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                                                            {isSold ? (
                                                                <CheckCircle2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                                                            ) : selectedLead.isUnitHeld ? (
                                                                <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                                            ) : (
                                                                <Bookmark className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                            )}
                                                            Preferred Member Unit
                                                        </h4>
                                                        <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full border ${
                                                            isSold
                                                                ? "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-800 animate-pulse"
                                                                : selectedLead.isUnitHeld 
                                                                    ? "text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 border-amber-300 dark:border-amber-700" 
                                                                    : "text-slate-500 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                                        }`}>
                                                            {isSold ? "SOLD OUT" : selectedLead.isUnitHeld ? "RESERVED" : "Reference"}
                                                        </span>
                                                    </div>

                                                    {Boolean(selectedLead.interestedUnit || selectedLead.unitNumber || selectedLead.hierarchyContext?.unitNumber) && (() => {
                                                        const effectiveUnit = selectedLead.interestedUnit || selectedLead.unitNumber || selectedLead.hierarchyContext?.unitNumber || "";
                                                        return (
                                                            <div className={`p-1.5 px-2 rounded-lg border flex items-center justify-between gap-1.5 ${
                                                                isSold
                                                                    ? "bg-red-50/90 dark:bg-red-950/40 border-red-300 dark:border-red-800/70"
                                                                    : selectedLead.isUnitHeld 
                                                                        ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/70"
                                                                        : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60"
                                                            }`}>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-1">
                                                                        <p className={`text-[8.5px] font-bold uppercase tracking-wider ${
                                                                            isSold ? "text-red-700 dark:text-red-400" : selectedLead.isUnitHeld ? "text-amber-700 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                                                                        }`}>
                                                                            {isSold ? "Sold Unit" : selectedLead.isUnitHeld ? "Reserved Unit" : "Current Tag"}
                                                                        </p>
                                                                        {isSold ? (
                                                                            <span className="text-[7.5px] font-black uppercase px-1 py-0 rounded bg-red-600 text-white animate-pulse">
                                                                                Sold
                                                                            </span>
                                                                        ) : selectedLead.isUnitHeld ? (
                                                                            <span className="text-[7.5px] font-black uppercase px-1 py-0 rounded bg-amber-500 text-white animate-pulse">
                                                                                Held
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                    <p className="text-[11px] font-bold truncate text-slate-900 dark:text-slate-100">{effectiveUnit}</p>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-5 px-1.5 text-[9px] font-bold text-red-600 hover:text-red-700 hover:bg-red-100/50 rounded shrink-0"
                                                                    disabled={isBlockingUnit}
                                                                    onClick={handleClearPreferredUnit}
                                                                    title={isSold ? "Release sold unit back to available" : selectedLead.isUnitHeld ? "Release unit hold in inventory" : "Clear unit preference"}
                                                                >
                                                                    {isSold || selectedLead.isUnitHeld ? "Release" : "Clear"}
                                                                </Button>
                                                            </div>
                                                        );
                                                    })()}

                                                    {properties.length > 0 ? (
                                                        <div className="space-y-1.5">
                                                            <div>
                                                                <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 block">Property</label>
                                                                <Select value={selectedPropertyId} onValueChange={(val) => { setSelectedPropertyId(val); setSelectedTowerId(""); setSelectedUnitId(""); }}>
                                                                    <SelectTrigger className="h-8 text-xs font-medium bg-white dark:bg-slate-900 rounded-lg border-slate-200">
                                                                        <SelectValue placeholder="Choose Property" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {properties.map(p => (
                                                                            <SelectItem key={p._id || p.id} value={p._id || p.id} className="text-xs py-1 cursor-pointer">{p.name || p.townshipName || p.title || "Property"}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            {propertyTowers.length > 0 && (
                                                                <div>
                                                                    <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 block">Tower / Phase</label>
                                                                    <Select value={selectedTowerId} onValueChange={(val) => { setSelectedTowerId(val === "all" ? "" : val); setSelectedUnitId(""); }} disabled={!selectedPropertyId}>
                                                                        <SelectTrigger className="h-8 text-xs font-medium bg-white dark:bg-slate-900 rounded-lg border-slate-200">
                                                                            <SelectValue placeholder="Choose Tower" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="all" className="text-xs py-1 cursor-pointer font-bold">All Towers</SelectItem>
                                                                            {propertyTowers.map((t: any) => (
                                                                                <SelectItem key={t.id || t._id} value={t.id || t._id} className="text-xs py-1 cursor-pointer">{t.name}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            )}

                                                            <div>
                                                                <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 block flex items-center gap-1">
                                                                    Unit / Flat
                                                                    {isFetchingInventory && <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin ml-1" />}
                                                                </label>
                                                                <Popover open={isUnitDropdownOpen} onOpenChange={setIsUnitDropdownOpen}>
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            role="combobox"
                                                                            aria-expanded={isUnitDropdownOpen}
                                                                            disabled={!selectedPropertyId}
                                                                            className="w-full h-8 text-xs font-medium bg-white dark:bg-slate-900 rounded-lg border-slate-200 justify-between px-3"
                                                                        >
                                                                            <span className="truncate">
                                                                                {selectedUnitId
                                                                                    ? (() => {
                                                                                        const u = propertyUnits.find((u: any) => (u.id || u._id) === selectedUnitId);
                                                                                        if (!u) return "Choose Unit";
                                                                                        const cleanNum = getCleanUnitLabel(u.unitNumber, activeProperty?.name || activeProperty?.title);
                                                                                        return `Flat ${cleanNum} ${u.configuration ? `(${u.configuration})` : ''}`;
                                                                                    })()
                                                                                    : !selectedPropertyId ? "Select property first" : "Choose Unit"}
                                                                            </span>
                                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-[300px] p-0" align="start">
                                                                        <Command>
                                                                            <CommandInput placeholder="Search unit number..." className="h-9 text-xs" />
                                                                            <CommandList>
                                                                                <CommandEmpty>No unit found.</CommandEmpty>
                                                                                <CommandGroup>
                                                                                    {propertyUnits.map((u: any, idx: number) => {
                                                                                        const unitKey = u.id || u._id || `unit-${idx}`;
                                                                                        const statusSuffix = u.status && u.status !== 'available' ? ` (${u.status})` : '';
                                                                                        const cleanNum = getCleanUnitLabel(u.unitNumber, activeProperty?.name || activeProperty?.title);
                                                                                        const label = `Flat ${cleanNum} ${u.configuration ? `(${u.configuration})` : ''}${statusSuffix}`;
                                                                                        return (
                                                                                            <CommandItem
                                                                                                key={unitKey}
                                                                                                value={label} // used for filtering internally by Command
                                                                                                onSelect={() => {
                                                                                                    setSelectedUnitId(unitKey === selectedUnitId ? "" : unitKey);
                                                                                                    setIsUnitDropdownOpen(false);
                                                                                                }}
                                                                                                className="text-xs py-1.5 cursor-pointer"
                                                                                            >
                                                                                                <Check
                                                                                                    className={`mr-2 h-3.5 w-3.5 ${
                                                                                                        selectedUnitId === unitKey ? "opacity-100" : "opacity-0"
                                                                                                    }`}
                                                                                                />
                                                                                                {label}
                                                                                            </CommandItem>
                                                                                        );
                                                                                    })}
                                                                                    {propertyUnits.length === 0 && (
                                                                                        <div className="p-2 text-xs text-center text-slate-500">No Units in this Property</div>
                                                                                    )}
                                                                                </CommandGroup>
                                                                            </CommandList>
                                                                        </Command>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>

                                                            {/* Hold / Reserve or Sold Toggle (Updates Inventory & Visitor Panel) */}
                                                            <div className={`flex items-center justify-between p-1.5 px-2 rounded-lg border shadow-xs ${
                                                                isLeadBooked
                                                                    ? "bg-red-50/90 dark:bg-red-950/40 border-red-200/80 dark:border-red-800/60"
                                                                    : "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60"
                                                            }`}>
                                                                <label htmlFor="group-hold-unit-toggle" className="flex items-center gap-1.5 cursor-pointer select-none">
                                                                    <input 
                                                                        id="group-hold-unit-toggle"
                                                                        type="checkbox"
                                                                        checked={Boolean(isHoldUnitEnabled || selectedLead.isUnitHeld || selectedLead.status === "Token VIP")}
                                                                        onChange={(e) => setIsHoldUnitEnabled(e.target.checked)}
                                                                        className={`w-3.5 h-3.5 rounded cursor-pointer ${
                                                                            isLeadBooked
                                                                                ? "text-red-600 border-red-300 focus:ring-red-500 accent-red-600"
                                                                                : "text-amber-600 border-amber-300 focus:ring-amber-500 accent-amber-600"
                                                                        }`}
                                                                    />
                                                                    <span className={`text-[10px] font-black ${
                                                                        isLeadBooked ? "text-red-900 dark:text-red-200" : "text-amber-900 dark:text-amber-200"
                                                                    }`}>
                                                                        {isLeadBooked ? "Mark Unit as Sold" : "Hold / Reserve Unit"}
                                                                    </span>
                                                                </label>
                                                                <span className={`text-[8px] font-bold px-1 py-0.2 rounded border uppercase tracking-tight ${
                                                                    isLeadBooked
                                                                        ? "text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-900/60 border-red-300/50"
                                                                        : "text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/60 border-amber-300/50"
                                                                }`}>
                                                                    {isLeadBooked ? "Sold Out • Inventory & Visitor" : "Inventory & Visitor"}
                                                                </span>
                                                            </div>

                                                            <Button
                                                                className={`w-full h-8 text-xs font-bold text-white shadow-none rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                                                                    isLeadBooked && isHoldUnitEnabled
                                                                        ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                                                                        : isHoldUnitEnabled 
                                                                            ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700" 
                                                                            : "bg-blue-600 hover:bg-blue-700"
                                                                }`}
                                                                disabled={!selectedUnitId || isBlockingUnit}
                                                                onClick={handleSavePreferredUnit}
                                                            >
                                                                {isBlockingUnit ? (
                                                                    <>
                                                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                        <span>{isLeadBooked ? "Marking as Sold..." : isHoldUnitEnabled ? "Reserving Unit..." : "Saving..."}</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {isLeadBooked && isHoldUnitEnabled ? (
                                                                            <CheckCircle2 className="h-3 w-3" />
                                                                        ) : isHoldUnitEnabled ? (
                                                                            <Lock className="h-3 w-3" />
                                                                        ) : (
                                                                            <Bookmark className="h-3 w-3" />
                                                                        )}
                                                                        <span>
                                                                            {isLeadBooked && isHoldUnitEnabled 
                                                                                ? "Confirm & Mark Unit as Sold" 
                                                                                : isHoldUnitEnabled 
                                                                                    ? "Reserve & Tag Unit" 
                                                                                    : "Save Preferred Unit"}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-center">
                                                            <p className="text-[9px] font-medium text-slate-500">No inventory found</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        <div className="space-y-2 pt-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Quick Actions</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button variant="outline" className="w-full gap-1.5 h-9 text-[11px] font-bold rounded-lg shadow-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 transition-transform active:scale-95 cursor-pointer" onClick={() => router.push(`${userRole === 'mandate' ? '/mandate-dashboard' : '/builder-dashboard'}?tab=chat&chatWith=${selectedLead.id || selectedLead._id}&memberId=${members[selectedMemberIdx].userId || members[selectedMemberIdx].visitorId || members[selectedMemberIdx].phone}&type=direct`)}>
                                                    <MessageSquare className="h-3.5 w-3.5 text-blue-600" /> Direct Chat
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
                                
                                const extraNotes = buildStageExtraNotes(pendingStatus, extraFields);
                                let finalReason = statusReason.trim();
                                if (extraNotes) finalReason += (finalReason ? "\n" : "") + extraNotes.trim();

                                const newTimeline = [...(selectedLead.timeline || [])];
                                const updates: any = {};
                                
                                if (finalReason) {
                                    updates.actionType = "Status Note";
                                    updates.actionDesc = `[Member Update] Changed to ${pendingStatus}:\n${finalReason}`;
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

                                // Prepare updated merged members array
                                const currentMembers = (Array.isArray(selectedLead.mergedMembers) && selectedLead.mergedMembers.length > 0)
                                    ? selectedLead.mergedMembers
                                    : [{
                                        id: selectedLead.id || selectedLead._id,
                                        _id: selectedLead.id || selectedLead._id,
                                        userId: selectedLead.userId || selectedLead.visitorId || selectedLead.id || selectedLead._id,
                                        visitorId: selectedLead.visitorId || selectedLead.userId || '',
                                        name: selectedLead.name?.replace(/\s*—\s*Group Buying Pool/i, '') || selectedLead.name,
                                        phone: selectedLead.phone,
                                        email: selectedLead.email || '',
                                        avatar: selectedLead.avatar || selectedLead.photo || selectedLead.profilePhoto || '',
                                        photo: selectedLead.photo || selectedLead.avatar || selectedLead.profilePhoto || '',
                                        profilePhoto: selectedLead.profilePhoto || selectedLead.avatar || selectedLead.photo || '',
                                        username: selectedLead.username || '',
                                        status: selectedLead.status || 'Fresh',
                                        clickedLevel: selectedLead.clickedLevel || 'Township',
                                        clickedPropertyName: selectedLead.clickedPropertyName || selectedLead.topPropertyName || selectedLead.name,
                                        sourceUrl: selectedLead.sourceUrl || '',
                                        joinedAt: selectedLead.createdAt || new Date().toISOString()
                                    }];

                                const updatedMergedMembers = currentMembers.map((m: any, idx: number) => {
                                    if (idx === selectedMemberIdx) {
                                        return { ...m, status: pendingStatus };
                                    }
                                    return m;
                                });

                                // Update main lead status and mergedMembers so the lead drops into the correct follow-up stage column on the pipeline board
                                updates.status = pendingStatus;
                                updates.mergedMembers = updatedMergedMembers;

                                upsertLead({
                                    ...selectedLead,
                                    status: pendingStatus,
                                    mergedMembers: updatedMergedMembers,
                                    nextActionTime: updates.nextActionTime || selectedLead.nextActionTime,
                                    timeline: newTimeline
                                });

                                // Update local member status state so it reflects visually
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

                                if (pendingStatus === "Booked") {
                                    const tUnitId = selectedLead.unitId || selectedUnitId;
                                    const tPropId = selectedLead.propertyId || selectedPropertyId;
                                    router.push(`/builder-dashboard?tab=documents&customer=${id}&doc=booking-form&unit=${tUnitId || ''}&property=${tPropId || ''}`);
                                }

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
        <div className="h-full overflow-y-auto pb-24 lg:pb-4 pr-1 custom-scrollbar">
            {/* MOBILE (<lg) STACKED CARDS */}
            <div className="lg:hidden space-y-2.5">
                {filteredLeads.map((lead, idx) => {
                    const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
                    return (
                        <Card key={lead.id || lead._id || `lead-m-row-${idx}`} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl">
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 
                                            className="font-bold text-sm text-slate-900 dark:text-white truncate cursor-pointer"
                                            onClick={() => openProfile(lead.id || lead._id)}
                                        >
                                            {lead.name}
                                        </h4>
                                        {lead.isGroup ? (
                                            <Badge className="bg-purple-600 text-[9px] px-1.5 rounded-sm">GROUP</Badge>
                                        ) : lead.status === "Token VIP" ? (
                                            <Badge className="bg-amber-100 text-amber-800 text-[9px] px-1.5 rounded-sm border-amber-200"><Crown className="h-2.5 w-2.5 mr-1 inline" /> VIP</Badge>
                                        ) : null}
                                    </div>
                                    {lead.phone && <p className="font-mono text-xs text-slate-500 mt-0.5">{lead.phone}</p>}
                                </div>
                                <Badge variant="outline" className="text-[10px] font-bold shrink-0">
                                    {lead.status === 'Junk' ? 'Not Interested' : lead.status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-[11px] truncate">👤 {lead.assignee || 'Unassigned'}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {lead.phone && (
                                        <a
                                            href={`tel:${cleanPhone}`}
                                            className="p-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95 transition-all"
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    {lead.phone && (
                                        <a
                                            href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95 transition-all"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-9 text-xs px-3 font-semibold"
                                        onClick={() => openProfile(lead.id || lead._id)}
                                    >
                                        View
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* DESKTOP (lg+) TABLE VIEW - ENTERPRISE SOFTWARE DATAGRID */}
            <div className="hidden lg:block">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto software-scrollbar max-h-[640px]">
                        <table className="w-full text-left text-xs border-collapse font-sans">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-sm border-b border-slate-200/90 dark:border-slate-700/80 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    <th className="py-2 px-3.5 font-bold">Lead Contact</th>
                                    <th className="py-2 px-3 font-bold">Pipeline Stage</th>
                                    <th className="py-2 px-3 font-bold">Preferred Unit / Project</th>
                                    <th className="py-2 px-3 font-bold">Requirement &amp; Budget</th>
                                    <th className="py-2 px-3 font-bold">Assigned Executive</th>
                                    <th className="py-2 px-3 font-bold font-mono">Registered</th>
                                    <th className="py-2 px-3.5 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                                {filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 px-4 text-center text-slate-400 font-mono text-xs">
                                            No leads found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map((lead, idx) => {
                                        const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
                                        const isTokenHold = lead.status === 'Token VIP' || lead.isTokenPaid || lead.leadType === 'token-hold';
                                        const hasRepeated = Boolean(lead.hasRepeatedEnquiry || (lead.attemptsCount && lead.attemptsCount > 1));

                                        return (
                                            <tr
                                                key={lead.id || lead._id || `lead-row-${idx}`}
                                                className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer text-xs"
                                                onClick={() => openProfile(lead.id || lead._id)}
                                            >
                                                {/* Lead Contact */}
                                                <td className="py-2 px-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-2xs">
                                                            {lead.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                                                    {lead.name}
                                                                </span>
                                                                {lead.isGroup ? (
                                                                    <Badge className="bg-purple-600 text-white text-[8.5px] px-1 py-0 rounded-xs">GROUP ({lead.groupSize || 1})</Badge>
                                                                ) : isTokenHold ? (
                                                                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[8.5px] font-black px-1 py-0 rounded-xs"><Crown className="h-2 w-2 mr-0.5 inline" /> VIP</Badge>
                                                                ) : null}
                                                                {hasRepeated && (
                                                                    <span className="bg-orange-100 text-orange-800 text-[8px] font-black px-1 py-0 rounded-xs animate-pulse">2x</span>
                                                                )}
                                                            </div>
                                                            {lead.phone && (
                                                                <p className="font-mono text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                                    {lead.phone}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Pipeline Stage */}
                                                <td className="py-2 px-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold uppercase tracking-wider ${
                                                            lead.status === "Booked"
                                                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                                                                : lead.status === "Token VIP"
                                                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60"
                                                                : lead.status === "Site Visit"
                                                                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60"
                                                                : lead.status === "Junk"
                                                                ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
                                                                : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                lead.status === "Booked"
                                                                    ? "bg-emerald-500 shadow-2xs shadow-emerald-500/50"
                                                                    : lead.status === "Token VIP"
                                                                    ? "bg-amber-500"
                                                                    : lead.status === "Site Visit"
                                                                    ? "bg-blue-500"
                                                                    : "bg-indigo-400"
                                                            }`}
                                                        />
                                                        {lead.status === "Junk" ? "Not Interested" : lead.status}
                                                    </span>
                                                </td>

                                                {/* Preferred Unit / Project */}
                                                <td className="py-2 px-3">
                                                    {lead.interestedUnit || lead.unitNumber ? (
                                                        <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                                                            <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                                                            <span>Flat {lead.interestedUnit || lead.unitNumber}</span>
                                                        </div>
                                                    ) : lead.topPropertyName ? (
                                                        <span className="text-slate-600 dark:text-slate-300 font-medium truncate block max-w-[140px]" title={lead.topPropertyName}>
                                                            {lead.topPropertyName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px] italic">Not selected</span>
                                                    )}
                                                </td>

                                                {/* Requirement & Budget */}
                                                <td className="py-2 px-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                                            {lead.requirement || "2BHK / 3BHK"}
                                                        </span>
                                                        <span className="font-mono text-[10.5px] text-slate-500 dark:text-slate-400">
                                                            {lead.budget || "Budget TBD"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Assigned Executive */}
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                            {lead.assignee ? lead.assignee.charAt(0).toUpperCase() : "?"}
                                                        </div>
                                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                                                            {lead.assignee || "Unassigned"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Registered Date */}
                                                <td className="py-2 px-3 font-mono text-[10.5px] text-slate-500 dark:text-slate-400">
                                                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short"
                                                    }) : "—"}
                                                </td>

                                                {/* Quick Actions */}
                                                <td className="py-2 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {lead.phone && (
                                                            <a
                                                                href={`tel:${cleanPhone}`}
                                                                className="h-7 w-7 flex items-center justify-center rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors shadow-2xs"
                                                                title={`Call ${lead.name}`}
                                                            >
                                                                <Phone className="h-3 w-3" />
                                                            </a>
                                                        )}
                                                        {lead.phone && (
                                                            <a
                                                                href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=Hello%20${encodeURIComponent(lead.name)},%20thank%20you%20for%20your%20interest.`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="h-7 w-7 flex items-center justify-center rounded border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 hover:bg-green-100 transition-colors shadow-2xs"
                                                                title={`WhatsApp ${lead.name}`}
                                                            >
                                                                <MessageSquare className="h-3 w-3" />
                                                            </a>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 px-2 text-[11px] font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs"
                                                            onClick={() => openProfile(lead.id || lead._id)}
                                                        >
                                                            Profile
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="h-full flex flex-col space-y-3 min-h-0">
            {/* Top Toolbar */}
            <div className="flex w-full items-center justify-between bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm shrink-0">
                {/* Left Side: Tabs / Back button */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {viewMode === 'profile' ? (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-3 text-xs gap-1.5 text-blue-700 dark:text-blue-400 font-bold hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm"
                            onClick={() => { setViewMode('pipeline'); setSelectedMemberIdx(null); }}
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> <span>Back to Pipeline</span>
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant={viewMode === 'pipeline' ? 'secondary' : 'ghost'}
                                onClick={() => setViewMode('pipeline')}
                                className={`h-8 px-3 text-xs shadow-none gap-1.5 rounded-md font-semibold transition-all ${viewMode === 'pipeline' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                            >
                                <TrendingUp className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Pipeline</span>
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                onClick={() => setViewMode('list')}
                                className={`h-8 px-3 text-xs shadow-none gap-1.5 rounded-md font-semibold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                            >
                                <Users className="h-3.5 w-3.5" /> <span className="hidden sm:inline">List</span>
                            </Button>
                            <Button
                                variant={viewMode === 'analytics' ? 'secondary' : 'ghost'}
                                onClick={() => setViewMode('analytics')}
                                className={`h-8 px-3 text-xs shadow-none gap-1.5 rounded-md font-semibold transition-all ${viewMode === 'analytics' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                            >
                                <Activity className="h-3.5 w-3.5" /> <span className="hidden lg:inline">Analytics</span>
                            </Button>
                        </>
                    )}
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
