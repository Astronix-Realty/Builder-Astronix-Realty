"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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
    Building2, Lock
} from "lucide-react"

// --- Types ---
type LeadStatus = "Fresh" | "Token VIP" | "Connected" | "Site Visit" | "Negotiation" | "Booked"
type Urgency = "Low" | "Medium" | "High"

interface Lead {
    id: string
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
    nextAction: string
    nextActionTime?: string
    notes: string[]
    timeline: { date: string, title: string, desc: string, type: "call" | "visit" | "system" | "note" | "booking" }[]
    interestedUnit?: string // e.g., "Tower A - 402"
}

// --- Mock Data ---
const INITIAL_LEADS: Lead[] = [
    {
        id: "L001",
        name: "Rahul Kumar",
        phone: "+91 98765 43210",
        email: "rahul.k@gmail.com",
        status: "Fresh",
        isTokenPaid: false,
        requirement: "3BHK | High Rise",
        budget: "1.5 Cr",
        source: "Facebook Ad",
        assignee: "Suresh",
        lastActivity: "2 hours ago",
        nextAction: "Call for introduction",
        nextActionTime: "Today 4 PM",
        notes: [],
        timeline: [
            { date: "10 Feb, 10:00 AM", title: "Lead Created", desc: "Via Facebook Ad Campaign", type: "system" }
        ]
    },
    {
        id: "L002",
        name: "Amit Singh",
        phone: "+91 99887 76655",
        email: "amit.singh@yahoo.com",
        status: "Token VIP",
        isTokenPaid: true,
        requirement: "2BHK | Garden Facing",
        budget: "85 Lac",
        source: "Direct App Token",
        assignee: "Ramesh",
        lastActivity: "10 mins ago",
        nextAction: "Confirm Unit Allocation",
        nextActionTime: "Urgent",
        notes: ["Customer is very keen on Floor 12."],
        timeline: [
            { date: "12 Feb, 09:30 AM", title: "Token Paid", desc: "Paid ₹1000 via UPI", type: "system" },
            { date: "11 Feb, 04:00 PM", title: "Site Visit Scheduled", desc: "Requested for weekend", type: "system" }
        ]
    },
    {
        id: "L003",
        name: "Sneha Gupta",
        phone: "+91 88776 65544",
        email: "sneha.g@design.co",
        status: "Site Visit",
        isTokenPaid: false,
        requirement: "4BHK Penthouse",
        budget: "3.2 Cr",
        source: "Referral",
        assignee: "Mahesh",
        lastActivity: "Yesterday",
        nextAction: "Follow up on feedback",
        notes: ["Liked the layout but found price high."],
        timeline: [
            { date: "05 Feb, 11:00 AM", title: "Site Visit Done", desc: "Visited with family", type: "visit" },
            { date: "01 Feb, 02:00 PM", title: "Call Connected", desc: "Spoke for 15 mins", type: "call" }
        ]
    },
    {
        id: "L004",
        name: "Vikram Malhotra",
        phone: "+91 77665 54433",
        email: "vikram.m@biz.com",
        status: "Negotiation",
        isTokenPaid: false,
        requirement: "3BHK",
        budget: "1.1 Cr",
        source: "Website",
        assignee: "Suresh",
        lastActivity: "3 days ago",
        nextAction: "Final Price Discussion",
        notes: ["Asking for 5% discount."],
        timeline: [
            { date: "08 Feb, 05:00 PM", title: "Negotiation Call", desc: "Offered 2% discount", type: "call" },
            { date: "02 Feb, 10:00 AM", title: "Site Visit", desc: "Impressed with amenities", type: "visit" }
        ]
    },
    {
        id: "L005",
        name: "Priya Patel",
        phone: "+91 98765 12345",
        email: "priya.p@outlook.com",
        status: "Connected",
        isTokenPaid: false,
        requirement: "2BHK",
        budget: "75 Lac",
        source: "Walk-in",
        assignee: "Ramesh",
        lastActivity: "1 day ago",
        nextAction: "Schedule Site Visit",
        notes: [],
        timeline: [
            { date: "09 Feb, 12:00 PM", title: "Walk-in Enquiry", desc: "Visited sales office", type: "visit" }
        ]
    }
]

// --- Components ---
interface CRMViewProps {
    userRole?: "builder" | "mandate"
}

export function CRMView({ userRole = "builder" }: CRMViewProps) {
    const storagePrefix = userRole === "mandate" ? "mandate_" : ""
    const [viewMode, setViewMode] = useState<"pipeline" | "list" | "profile">("pipeline")
    const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS)
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
    const [filterStaff, setFilterStaff] = useState("all")

    // Inventory Data State
    const [properties, setProperties] = useState<any[]>([])
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
    const [selectedUnitId, setSelectedUnitId] = useState<string>("")

    // Derived Logic
    const selectedLead = leads.find(l => l.id === selectedLeadId)

    // Load Inventory
    useEffect(() => {
        const savedProps = JSON.parse(localStorage.getItem(`${storagePrefix}properties`) || "[]")
        setProperties(savedProps)
    }, [])

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        e.dataTransfer.setData("leadId", leadId)
    }

    const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
        const leadId = e.dataTransfer.getData("leadId")
        if (leadId) {
            setLeads(leads.map(l => l.id === leadId ? { ...l, status } : l))
        }
    }

    const openProfile = (id: string) => {
        setSelectedLeadId(id)
        setViewMode("profile")
        // Reset inventory selection when opening new profile
        setSelectedPropertyId("")
        setSelectedUnitId("")
    }

    const updateLeadStatus = (id: string, status: LeadStatus) => {
        setLeads(leads.map(l => l.id === id ? { ...l, status } : l))
    }

    const handleBlockUnit = () => {
        if (!selectedLead || !selectedPropertyId || !selectedUnitId) return

        // 1. Find Property and Unit
        const propertyIndex = properties.findIndex(p => p.id === selectedPropertyId)
        if (propertyIndex === -1) return

        const property = properties[propertyIndex]
        const unit = property.data.generatedUnits.find((u: any) => u.id === selectedUnitId)

        if (!unit) return

        // 2. Update LocalStorage (Inventory)
        const updatedUnits = property.data.generatedUnits.map((u: any) =>
            u.id === selectedUnitId ? {
                ...u,
                status: "reserved", // Mark as Reserved for this lead
                customerName: selectedLead.name,
                customerPhone: selectedLead.phone,
                bookingDate: new Date().toISOString()
            } : u
        )

        const updatedProperties = [...properties]
        updatedProperties[propertyIndex] = {
            ...property,
            data: { ...property.data, generatedUnits: updatedUnits }
        }

        setProperties(updatedProperties)
        localStorage.setItem(`${storagePrefix}properties`, JSON.stringify(updatedProperties))

        // 3. Update Lead Timeline & Status
        const newEvent = {
            date: new Date().toLocaleString(),
            title: "Unit Reserved",
            desc: `Reserved Unit ${unit.unitNumber} (${unit.configuration})`,
            type: "booking" as const
        }

        setLeads(leads.map(l => l.id === selectedLead.id ? {
            ...l,
            status: "Negotiation", // Move to Negotiation or Booked? Let's say Negotiation until payment.
            interestedUnit: `${unit.unitNumber} (${property.townshipName || property.data.projects?.[0]?.name || "Property"})`,
            timeline: [newEvent, ...l.timeline] // Add to start
        } : l))

        alert(`Unit ${unit.unitNumber} has been reserved for ${selectedLead.name}!`)
        setSelectedUnitId("") // Reset selection
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
                                        {leads.filter(l => l.status === col).length}
                                    </Badge>
                                </div>
                                {col === "Token VIP" && <Crown className="h-4 w-4 text-amber-600 animate-pulse" />}
                            </div>

                            {/* Cards Area */}
                            <div className="p-2 flex-1 overflow-y-auto space-y-2 min-h-[100px]">
                                {leads.filter(l => l.status === col).map(lead => (
                                    <div
                                        key={lead.id}
                                        draggable="true"
                                        onDragStart={(e) => handleDragStart(e, lead.id)}
                                        onClick={() => openProfile(lead.id)}
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
                                            <p className="flex items-center gap-1"><User className="h-3 w-3" /> {lead.requirement}</p>
                                            <p className="flex items-center gap-1 text-slate-500"><User className="h-3 w-3 opacity-0" /> {lead.assignee}</p>
                                        </div>

                                        {lead.nextAction && (
                                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                                <p className="text-[10px] font-medium text-red-500 truncate max-w-[120px]">
                                                    {lead.nextAction}
                                                </p>
                                                <span className="text-[10px] text-slate-400">{lead.nextActionTime}</span>
                                            </div>
                                        )}

                                        {/* Hover Grab Handle hint */}
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-400">
                                            <GripVertical className="h-4 w-4" />
                                        </div>
                                    </div>
                                ))}
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
        const activeProperty = properties.find(p => p.id === selectedPropertyId);
        const availableUnits = activeProperty
            ? activeProperty.data.generatedUnits.filter((u: any) => u.status === "available" || !u.status)
            : [];

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
                <Card className="flex-1 h-full border-slate-200 dark:border-slate-800 flex flex-col">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg">Activity Timeline</CardTitle>
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {selectedLead.timeline.map((event, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white dark:bg-slate-900 z-10 
                                         ${event.type === 'call' ? 'border-blue-500 text-blue-500' :
                                            event.type === 'visit' ? 'border-orange-500 text-orange-500' :
                                                event.type === 'booking' ? 'border-green-500 text-green-500' :
                                                    'border-slate-300 text-slate-500'}
                                     `}>
                                        {event.type === 'call' && <Phone className="h-4 w-4" />}
                                        {event.type === 'visit' && <MapPin className="h-4 w-4" />}
                                        {event.type === 'booking' && <Lock className="h-4 w-4" />}
                                        {event.type === 'system' && <Activity className="h-4 w-4" />}
                                    </div>
                                    {i !== selectedLead.timeline.length - 1 && (
                                        <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 my-1"></div>
                                    )}
                                </div>
                                <div className="flex-1 pb-4">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-medium text-sm">{event.title}</h4>
                                        <span className="text-xs text-muted-foreground">{event.date}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Activity Input */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t flex gap-2">
                        <Input placeholder="Add a note or log activity..." className="bg-white dark:bg-slate-800" />
                        <Button size="icon" className="shrink-0"><Send className="h-4 w-4" /></Button>
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
                                onValueChange={(val: LeadStatus) => updateLeadStatus(selectedLead.id, val)}
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
                                                <SelectItem key={p.id} value={p.id}>{p.townshipName || p.data.township?.name || "Property"}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={selectedUnitId} onValueChange={setSelectedUnitId} disabled={!selectedPropertyId}>
                                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                                            <SelectValue placeholder="Available Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableUnits.map((u: any) => (
                                                <SelectItem key={u.id} value={u.id}>{u.unitNumber} ({u.configuration})</SelectItem>
                                            ))}
                                            {availableUnits.length === 0 && <SelectItem value="none" disabled>No Units Available</SelectItem>}
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
                            <Button variant="outline" className="w-full justify-start gap-2 h-9 text-sm">
                                <Phone className="h-4 w-4 text-green-600" /> Call Customer
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2 h-9 text-sm">
                                <MessageSquare className="h-4 w-4 text-blue-600" /> Send WhatsApp
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2 h-9 text-sm">
                                <Calendar className="h-4 w-4 text-purple-600" /> Schedule Visit
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2 h-9 text-sm text-red-600 hover:text-red-700 hover:bg-red-50">
                                <XCircle className="h-4 w-4" /> Mark as Junk
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
                    {leads.map(lead => (
                        <TableRow key={lead.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900" onClick={() => openProfile(lead.id)}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {lead.name}
                                    {lead.isTokenPaid && <Crown className="h-3 w-3 text-amber-500" />}
                                </div>
                                <div className="text-xs text-muted-foreground">{lead.phone}</div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{lead.status}</Badge></TableCell>
                            <TableCell>{lead.assignee}</TableCell>
                            <TableCell>{lead.lastActivity}</TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="ghost">View</Button>
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
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Assignee:</span>
                        <Select value={filterStaff} onValueChange={setFilterStaff}>
                            <SelectTrigger className="w-[150px] h-8">
                                <SelectValue placeholder="All Staff" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Staff</SelectItem>
                                <SelectItem value="suresh">Suresh</SelectItem>
                                <SelectItem value="ramesh">Ramesh</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="bg-blue-600 text-white h-9">
                        <UserPlus className="h-4 w-4 mr-2" /> Add Lead
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'pipeline' && <PipelineBoard />}
                {viewMode === 'list' && <LeadList />}
                {viewMode === 'profile' && (
                    <div className="h-full flex flex-col">
                        <Button variant="ghost" className="self-start mb-2 gap-2" onClick={() => setViewMode('pipeline')}>
                            ← Back to Board
                        </Button>
                        <div className="flex-1 min-h-0">
                            <LeadProfile />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
