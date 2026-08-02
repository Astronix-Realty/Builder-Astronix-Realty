"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    FileText, Download, Share2, Folder, Search, Plus, Calculator,
    CreditCard, PenTool, Receipt, Send, CheckCircle2, User, Printer, Eye,
    Building2, Calendar, FileCheck, Trash2, Edit3, Settings, HelpCircle,
    Info, RefreshCw
} from "lucide-react"
import { toast } from "sonner"

// --- Types ---
type DocType = "cost-sheet" | "payment-plan" | "booking-form" | "receipt" | "demand-letter" | "repository"

interface Customer {
    id: string
    name: string
    phone: string
    email: string
    pan?: string
    aadhar?: string
    address?: string
}

interface Unit {
    id: string
    name: string
    area: number
    rate: number
    floorRise: number
    plc: number
    parking: number
    clubhouse: number
    propertyId?: string
}

export function DocumentsView() {
    const [activeDoc, setActiveDoc] = useState<DocType>("cost-sheet")
    const [loadingData, setLoadingData] = useState(false)

    // Current logged-in user & repository states
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [repositoryFiles, setRepositoryFiles] = useState<{ name: string; url: string; size: string; uploadedAt: string }[]>([])
    const [fileSearchQuery, setFileSearchQuery] = useState("")

    // Data lists fetched from API
    const [customers, setCustomers] = useState<Customer[]>([
        { id: "C001", name: "Rahul Kumar", phone: "+91 98765 43210", email: "rahul@gmail.com", pan: "ABCDE1234F", aadhar: "1234-5678-9012", address: "Flat 401, Sun City, Mumbai" },
        { id: "C002", name: "Amit Singh", phone: "+91 99887 76655", email: "amit@yahoo.com", pan: "XYZWR5678G", aadhar: "9876-5432-1098", address: "Sector 15, Vashi, Navi Mumbai" },
    ])
    const [units, setUnits] = useState<Unit[]>([
        { id: "A-502", name: "Tower A - 502 (3BHK)", area: 1200, rate: 6500, floorRise: 200, plc: 150000, parking: 300000, clubhouse: 100000 },
        { id: "B-201", name: "Tower B - 201 (2BHK)", area: 950, rate: 6000, floorRise: 0, plc: 0, parking: 250000, clubhouse: 100000 },
    ])

    // Selected values
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("C001")
    const [selectedUnitId, setSelectedUnitId] = useState<string>("A-502")

    // Find active selections
    const selectedCustomer = useMemo(() => 
        customers.find(c => c.id === selectedCustomerId) || customers[0] || { name: "", phone: "", email: "", pan: "", aadhar: "", address: "" }
    , [customers, selectedCustomerId])

    const selectedUnit = useMemo(() => 
        units.find(u => u.id === selectedUnitId) || units[0] || { name: "", area: 1000, rate: 5000, floorRise: 0, plc: 0, parking: 0, clubhouse: 0 }
    , [units, selectedUnitId])

    // ─── Document Global Header Settings ──────────────────────────────────────
    const [headerInfo, setHeaderInfo] = useState({
        companyName: "Astronix Realty Pvt Ltd",
        reraNo: "P52100012345",
        logoText: "ASTRONIX",
        address: "12th Floor, Trade Tower, Bandra Kurla Complex, Mumbai - 400051",
        email: "sales@astronixrealty.com",
        phone: "+91 22 6677 8899"
    })

    // ─── 1. Cost Sheet Custom States ──────────────────────────────────────────
    const [discount, setDiscount] = useState<number>(0)
    const [customCosts, setCustomCosts] = useState<{ id: string; label: string; amount: number }[]>([])
    const [newCostLabel, setNewCostLabel] = useState("")
    const [newCostAmount, setNewCostAmount] = useState("")

    const [taxRates, setTaxRates] = useState({
        gstPercent: 5,
        stampDutyPercent: 7,
        registrationFee: 30000,
        otherLegalCharges: 150000
    })

    // Calculations
    const costSheetCalculations = useMemo(() => {
        const baseCost = selectedUnit.area * selectedUnit.rate
        const floorRiseCost = selectedUnit.area * selectedUnit.floorRise
        const plc = selectedUnit.plc || 0
        const parking = selectedUnit.parking || 0
        const clubhouse = selectedUnit.clubhouse || 0
        
        const customSum = customCosts.reduce((acc, curr) => acc + curr.amount, 0)
        const agreementValue = baseCost + floorRiseCost + plc + parking + clubhouse + customSum - discount
        
        const gst = Math.round(agreementValue * (taxRates.gstPercent / 100))
        const stampDuty = Math.round(agreementValue * (taxRates.stampDutyPercent / 100))
        const registration = taxRates.registrationFee
        const otherCharges = taxRates.otherLegalCharges
        const total = agreementValue + gst + stampDuty + registration + otherCharges

        return {
            baseCost,
            floorRiseCost,
            plc,
            parking,
            clubhouse,
            customSum,
            agreementValue,
            gst,
            stampDuty,
            registration,
            otherCharges,
            total
        }
    }, [selectedUnit, customCosts, discount, taxRates])

    // ─── 2. Payment Plan Custom States ────────────────────────────────────────
    const [milestones, setMilestones] = useState<{ id: string; stage: string; percent: number }[]>([
        { id: "m1", stage: "Booking Amount / Token", percent: 10 },
        { id: "m2", stage: "On Execution of Agreement", percent: 20 },
        { id: "m3", stage: "On Completion of Plinth", percent: 15 },
        { id: "m4", stage: "On Completion of 1st Slab", percent: 10 },
        { id: "m5", stage: "On Completion of 3rd Slab", percent: 10 },
        { id: "m6", stage: "On Completion of 5th Slab", percent: 10 },
        { id: "m7", stage: "On Completion of Brickwork", percent: 10 },
        { id: "m8", stage: "On Possession", percent: 15 },
    ])
    const [newStageName, setNewStageName] = useState("")
    const [newStagePercent, setNewStagePercent] = useState("")
    const milestoneSum = useMemo(() => milestones.reduce((acc, cur) => acc + cur.percent, 0), [milestones])

    // Prepopulate payment templates
    const handleTemplateChange = (template: string) => {
        if (template === "clp") {
            setMilestones([
                { id: "m1", stage: "Booking Amount / Token", percent: 10 },
                { id: "m2", stage: "On Execution of Agreement", percent: 20 },
                { id: "m3", stage: "On Completion of Plinth", percent: 15 },
                { id: "m4", stage: "On Completion of 1st Slab", percent: 10 },
                { id: "m5", stage: "On Completion of 3rd Slab", percent: 10 },
                { id: "m6", stage: "On Completion of 5th Slab", percent: 10 },
                { id: "m7", stage: "On Completion of Brickwork", percent: 10 },
                { id: "m8", stage: "On Possession", percent: 15 },
            ])
        } else if (template === "dp") {
            setMilestones([
                { id: "m1", stage: "Token Booking Amount", percent: 10 },
                { id: "m2", stage: "On Registration (Within 30 Days)", percent: 80 },
                { id: "m3", stage: "On Possession / Handover", percent: 10 },
            ])
            setDiscount(Math.round(costSheetCalculations.agreementValue * 0.05)) // 5% discount
        } else if (template === "flexi") {
            setMilestones([
                { id: "m1", stage: "Booking Amount", percent: 10 },
                { id: "m2", stage: "Within 45 Days of Booking", percent: 30 },
                { id: "m3", stage: "On Structure Slab Stage", percent: 30 },
                { id: "m4", stage: "On Finishing & Plaster", percent: 20 },
                { id: "m5", stage: "On Possession", percent: 10 },
            ])
        }
    }

    // ─── 3. Booking Form Custom States ────────────────────────────────────────
    const [applicantDetails, setApplicantDetails] = useState({
        coApplicantName: "Riya Kumar",
        coApplicantPan: "DEFGH5678I",
        coApplicantRelation: "Spouse",
        parkingAssigned: "1 Covered Parking Space",
        declarations: "I/We hereby declare that all details provided in this form are correct and complete to the best of my/our knowledge. I/We understand that this is only an application for booking, and final allotment is subject to payment of the full agreement value and registration of standard documents."
    })
    const [bookingPayment, setBookingPayment] = useState({
        bookingAmount: 100000,
        paymentMode: "Cheque",
        instrumentNo: "CHQ998271",
        bankName: "HDFC Bank Ltd",
        branch: "BKC Mumbai Branch",
        date: new Date().toISOString().split("T")[0]
    })

    // ─── 4. Money Receipt Custom States ───────────────────────────────────────
    const [receiptDetails, setReceiptDetails] = useState({
        receiptNo: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toISOString().split("T")[0],
        receivedAmount: 100000,
        paymentMode: "NEFT/Bank Transfer",
        instrumentNo: "TXN88271928",
        bankName: "State Bank of India",
        towards: "Towards booking advance for residential unit",
        signatoryName: "Rajesh Shrivastava",
        signatoryTitle: "Senior Account Manager"
    })

    // ─── 5. Demand Letter Custom States ───────────────────────────────────────
    const [demandDetails, setDemandDetails] = useState({
        refNo: `DEM-${Math.floor(1000 + Math.random() * 9000)}/2026`,
        date: new Date().toISOString().split("T")[0],
        stageTrigger: "Completion of 5th Floor Roof Slab",
        duePercent: 10,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        accName: "Astronix Realty ESCROW Account",
        accNo: "5020008892182",
        bankName: "ICICI Bank Ltd",
        ifscCode: "ICIC0000104",
        upiId: "astronix@icici",
        qrText: "upi://pay?pa=astronix@icici&pn=AstronixRealty&am=100000&cu=INR"
    })

    // Fetch dynamic database context
    useEffect(() => {
        let isMounted = true
        async function fetchContextData() {
            setLoadingData(true)
            try {
                // Fetch Leads
                const leadsRes = await fetch("/api/leads?limit=100")
                if (leadsRes.ok && isMounted) {
                    const data = await leadsRes.json()
                    if (data.success && data.leads && data.leads.length > 0) {
                        const mappedLeads: Customer[] = data.leads.map((l: any) => ({
                            id: l._id || l.id,
                            name: l.name,
                            phone: l.phone || "+91 N/A",
                            email: l.email || "N/A",
                            pan: l.pan || "______________",
                            aadhar: l.aadhar || "______________",
                            address: l.address || "________________________________"
                        }))
                        setCustomers(mappedLeads)
                        setSelectedCustomerId(mappedLeads[0].id)
                    }
                }

                // Fetch Properties & Units
                const propRes = await fetch("/api/properties")
                if (propRes.ok && isMounted) {
                    const data = await propRes.json()
                    const allUnits: Unit[] = []
                    
                    if (data.properties && data.properties.length > 0) {
                        for (const p of data.properties) {
                            const detailRes = await fetch(`/api/properties/${p._id}`)
                            if (detailRes.ok && isMounted) {
                                const detailData = await detailRes.json()
                                const genUnits = detailData.property?.details?.generatedUnits || []
                                genUnits.forEach((u: any) => {
                                    const area = u.area || u.carpetArea || 1000
                                    const price = u.price || 5000000
                                    const rate = Math.round(price / area)
                                    allUnits.push({
                                        id: u._dbId || u.id || Math.random().toString(),
                                        name: `${p.name} - ${u.unitNumber} (${u.configuration})`,
                                        area,
                                        rate,
                                        floorRise: 150,
                                        plc: 100000,
                                        parking: 250000,
                                        clubhouse: 100000,
                                        propertyId: p._id
                                    })
                                })
                            }
                        }
                    }
                    if (allUnits.length > 0 && isMounted) {
                        setUnits(allUnits)
                        setSelectedUnitId(allUnits[0].id)
                    }
                }

                // Fetch current user details & repository
                const userRes = await fetch("/api/auth/me")
                if (userRes.ok && isMounted) {
                    const userData = await userRes.json()
                    if (userData.success && userData.user) {
                        setCurrentUser(userData.user)
                        if (userData.user.profile?.repository) {
                            setRepositoryFiles(userData.user.profile.repository)
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load documents context dynamically:", err)
            } finally {
                if (isMounted) setLoadingData(false)
            }
        }
        fetchContextData()
        return () => { isMounted = false }
    }, [])

    // Print functionality
    const handlePrint = () => {
        window.print()
    }

    // Share whatsapp text simulation
    const handleShare = () => {
        let text = `*Astronix Realty Documents*\n\n`
        if (activeDoc === "cost-sheet") {
            text += `*Cost Sheet Details*\nCustomer: ${selectedCustomer.name}\nUnit: ${selectedUnit.name}\nCarpet Area: ${selectedUnit.area} sqft\nTotal Landing Cost: ₹ ${costSheetCalculations.total.toLocaleString()}`
        } else if (activeDoc === "payment-plan") {
            text += `*Payment Plan Schedule*\nCustomer: ${selectedCustomer.name}\nUnit: ${selectedUnit.name}\nTotal Milestones Sum: ${milestoneSum}%`
        } else if (activeDoc === "booking-form") {
            text += `*Allotment Details*\nApplicant: ${selectedCustomer.name}\nUnit: ${selectedUnit.name}\nBooking amount paid: ₹ ${bookingPayment.bookingAmount.toLocaleString()}`
        } else if (activeDoc === "receipt") {
            text += `*Money Receipt Confirmation*\nReceipt No: ${receiptDetails.receiptNo}\nReceived: ₹ ${receiptDetails.receivedAmount.toLocaleString()} from ${selectedCustomer.name}`
        } else if (activeDoc === "demand-letter") {
            text += `*Payment Demand Letter*\nRef: ${demandDetails.refNo}\nStage: ${demandDetails.stageTrigger}\nDue Date: ${demandDetails.dueDate}`
        }
        
        navigator.clipboard.writeText(text)
        toast.success("Document summary copied to clipboard! Paste it to share.")
    }

    // File Repository Upload
    const handleUploadFile = async () => {
        const fileInput = document.createElement("input")
        fileInput.type = "file"
        fileInput.accept = "application/pdf,image/*"
        fileInput.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            
            const toastId = toast.loading(`Uploading ${file.name}...`)
            try {
                const formData = new FormData()
                formData.append("file", file)
                
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                })
                
                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.error || "Upload failed")
                }
                
                const data = await res.json()
                
                const newFile = {
                    name: file.name,
                    url: data.url,
                    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                    uploadedAt: new Date().toLocaleDateString("en-IN")
                }
                
                const updatedRepository = [...repositoryFiles, newFile]
                
                const updateRes = await fetch("/api/auth/profile", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        repository: updatedRepository
                    })
                })
                
                if (!updateRes.ok) {
                    throw new Error("Failed to save file in profile repository")
                }
                
                setRepositoryFiles(updatedRepository)
                toast.success(`${file.name} uploaded and saved successfully!`, { id: toastId })
            } catch (err: any) {
                console.error(err)
                toast.error(err.message || "Failed to upload file", { id: toastId })
            }
        }
        fileInput.click()
    }

    // File Repository Delete
    const handleDeleteFile = async (fileToDelete: any) => {
        if (!confirm(`Are you sure you want to delete ${fileToDelete.name}?`)) return
        
        const toastId = toast.loading(`Deleting ${fileToDelete.name}...`)
        try {
            const cloudRes = await fetch("/api/upload", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: fileToDelete.url })
            })
            
            if (!cloudRes.ok) {
                console.warn("Could not delete file from Cloudinary:", await cloudRes.json())
            }
            
            const updatedRepository = repositoryFiles.filter(f => f.url !== fileToDelete.url)
            
            const updateRes = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repository: updatedRepository })
            })
            
            if (!updateRes.ok) {
                throw new Error("Failed to update profile repository")
            }
            
            setRepositoryFiles(updatedRepository)
            toast.success(`${fileToDelete.name} deleted successfully!`, { id: toastId })
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || "Failed to delete file", { id: toastId })
        }
    }

    // Attach current document to Lead CRM timeline
    const handleAttachToCRM = async () => {
        if (!selectedCustomerId) {
            toast.error("Please select a customer lead first.")
            return
        }
        const customer = customers.find(c => c.id === selectedCustomerId)
        if (!customer) return

        let docTypeName = ""
        let detailsSummary = ""
        let notesText = ""

        if (activeDoc === "cost-sheet") {
            docTypeName = "Cost Sheet"
            detailsSummary = `Generated a Cost Sheet for unit ${selectedUnit.name}. Total landing cost: ₹ ${costSheetCalculations.total.toLocaleString()}`
            notesText = `Cost Sheet Details:\n- Carpet Area: ${selectedUnit.area} sqft\n- Base Rate: ₹ ${selectedUnit.rate}/sqft\n- Agreement Value: ₹ ${costSheetCalculations.agreementValue.toLocaleString()}\n- Taxes (GST & Stamp Duty): ₹ ${(costSheetCalculations.gst + costSheetCalculations.stampDuty).toLocaleString()}\n- Total Cost: ₹ ${costSheetCalculations.total.toLocaleString()}`
        } else if (activeDoc === "payment-plan") {
            docTypeName = "Payment Schedule"
            detailsSummary = `Generated a Payment Plan for unit ${selectedUnit.name} with total ${milestones.length} milestones.`
            notesText = `Milestones Breakdowns:\n` + milestones.map(m => `- ${m.stage}: ${m.percent}% (₹ ${Math.round(costSheetCalculations.agreementValue * (m.percent / 100)).toLocaleString()})`).join("\n")
        } else if (activeDoc === "booking-form") {
            docTypeName = "Booking Application"
            detailsSummary = `Generated a Booking Application Form for ${customer.name} for unit ${selectedUnit.name}.`
            notesText = `Applicant: ${customer.name}\nCo-applicant: ${applicantDetails.coApplicantName} (${applicantDetails.coApplicantRelation})\nToken Paid: ₹ ${bookingPayment.bookingAmount.toLocaleString()} (${bookingPayment.paymentMode})`
        } else if (activeDoc === "receipt") {
            docTypeName = "Money Receipt"
            detailsSummary = `Generated Money Receipt ${receiptDetails.receiptNo} for ₹ ${receiptDetails.receivedAmount.toLocaleString()} towards unit ${selectedUnit.name}.`
            notesText = `Receipt Details:\n- Amount: ₹ ${receiptDetails.receivedAmount.toLocaleString()}\n- Reference: ${receiptDetails.instrumentNo} (${receiptDetails.bankName})\n- Date: ${receiptDetails.date}`
        } else if (activeDoc === "demand-letter") {
            docTypeName = "Payment Demand Note"
            detailsSummary = `Generated a Payment Demand Note for stage "${demandDetails.stageTrigger}" due percentage: ${demandDetails.duePercent}%.`
            notesText = `Demand Details:\n- Stage: ${demandDetails.stageTrigger}\n- Demand Amount (including GST): ₹ ${(Math.round(costSheetCalculations.agreementValue * (demandDetails.duePercent / 100) * 1.05)).toLocaleString()}\n- Due Date: ${demandDetails.dueDate}`
        }

        const toastId = toast.loading("Saving document log to CRM Lead timeline...")
        try {
            const res = await fetch(`/api/leads/${customer.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    actionType: "Document Generated",
                    actionDesc: `${docTypeName} created: ${detailsSummary}`,
                    notes: `[DOCUMENT LOG] ${notesText}`
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to update lead timeline")
            }

            toast.success(`Attached to ${customer.name}'s CRM Timeline successfully!`, { id: toastId })
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || "Failed to attach document to CRM", { id: toastId })
        }
    }

    // Mark unit status as booked
    const handleMarkAsBooked = async () => {
        if (!selectedUnitId) {
            toast.error("Please select a unit first.")
            return
        }
        const unit = units.find(u => u.id === selectedUnitId)
        if (!unit) return

        const customer = customers.find(c => c.id === selectedCustomerId)

        const toastId = toast.loading("Marking unit as Booked...")
        try {
            const res = await fetch(`/api/units/${unit.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "booked",
                    customerName: customer?.name || "Anonymous",
                    customerPhone: customer?.phone || "",
                    bookingAmount: activeDoc === "booking-form" ? bookingPayment.bookingAmount : 
                                   activeDoc === "receipt" ? receiptDetails.receivedAmount : 50000,
                    bookingDate: new Date(),
                    propertyId: unit.propertyId
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to update unit status")
            }

            // Also update lead status to Booked
            if (customer && customer.id) {
                await fetch(`/api/leads/${customer.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: "Booked",
                        actionType: "Unit Booked",
                        actionDesc: `Unit ${unit.name} marked as Booked via Document Center`
                    })
                })
            }

            toast.success(`Unit ${unit.name} marked as Booked successfully!`, { id: toastId })
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || "Failed to mark unit as booked", { id: toastId })
        }
    }

    const filteredFiles = useMemo(() => {
        return repositoryFiles.filter(file => 
            file.name.toLowerCase().includes(fileSearchQuery.toLowerCase())
        )
    }, [repositoryFiles, fileSearchQuery])

    return (
        <div className="h-full max-h-full flex flex-col lg:flex-row gap-6 p-1 max-w-[1600px] w-full mx-auto print:p-0 overflow-hidden">
            {/* Left Control Panel / Editor (Hidden on Print) */}
            <div className="w-full lg:w-[420px] flex flex-col gap-4 pr-1 shrink-0 h-full max-h-full print:hidden overflow-hidden">
                
                {/* Selector Header */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Document Center</CardTitle>
                            {loadingData && <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />}
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Active Template</label>
                            <Select value={activeDoc} onValueChange={(val) => setActiveDoc(val as DocType)}>
                                <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cost-sheet">📄 Cost Sheet Generator</SelectItem>
                                    <SelectItem value="payment-plan">💳 Payment Plan Builder</SelectItem>
                                    <SelectItem value="booking-form">✍️ Application / Booking Form</SelectItem>
                                    <SelectItem value="receipt">🧾 Money Receipt Generator</SelectItem>
                                    <SelectItem value="demand-letter">✉️ Demand Letter Generator</SelectItem>
                                    <SelectItem value="repository">📁 File Repository</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {activeDoc !== "repository" && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Select Customer</label>
                                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                        <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Select Unit</label>
                                    <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                                        <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Left Editor Controls */}
                <div className="flex-1 overflow-y-auto pr-1">
                    {activeDoc === "cost-sheet" && (
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm space-y-4 p-4">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
                                <Settings className="h-4 w-4 text-emerald-500" /> Cost Sheet Adjustments
                            </h3>
                            
                            {/* Base Pricing Adjustments */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase text-slate-500">Base Calculations</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-500">Area (Sqft)</label>
                                        <Input type="number" value={selectedUnit.area} 
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setUnits(units.map(u => u.id === selectedUnit.id ? { ...u, area: val } : u))
                                            }} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">Base Rate (₹/sqft)</label>
                                        <Input type="number" value={selectedUnit.rate} 
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setUnits(units.map(u => u.id === selectedUnit.id ? { ...u, rate: val } : u))
                                            }} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-500">Floor Rise (₹/sqft)</label>
                                        <Input type="number" value={selectedUnit.floorRise} 
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setUnits(units.map(u => u.id === selectedUnit.id ? { ...u, floorRise: val } : u))
                                            }} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">PLC Charges (₹)</label>
                                        <Input type="number" value={selectedUnit.plc} 
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setUnits(units.map(u => u.id === selectedUnit.id ? { ...u, plc: val } : u))
                                            }} 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-500">Car Parking (₹)</label>
                                        <Input type="number" value={selectedUnit.parking} 
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setUnits(units.map(u => u.id === selectedUnit.id ? { ...u, parking: val } : u))
                                            }} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">Clubhouse (₹)</label>
                                        <Input type="number" value={selectedUnit.clubhouse} 
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setUnits(units.map(u => u.id === selectedUnit.id ? { ...u, clubhouse: val } : u))
                                            }} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Taxes & Levies Adjustments */}
                            <div className="space-y-3 pt-2 border-t">
                                <h4 className="text-xs font-bold uppercase text-slate-500">Taxes & Admin Fees</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-500">GST Rate (%)</label>
                                        <Input type="number" value={taxRates.gstPercent} 
                                            onChange={(e) => setTaxRates({ ...taxRates, gstPercent: parseFloat(e.target.value) || 0 })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">Stamp Duty (%)</label>
                                        <Input type="number" value={taxRates.stampDutyPercent} 
                                            onChange={(e) => setTaxRates({ ...taxRates, stampDutyPercent: parseFloat(e.target.value) || 0 })} 
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-500">Registration Fee (₹)</label>
                                        <Input type="number" value={taxRates.registrationFee} 
                                            onChange={(e) => setTaxRates({ ...taxRates, registrationFee: parseFloat(e.target.value) || 0 })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">Legal/Other (₹)</label>
                                        <Input type="number" value={taxRates.otherLegalCharges} 
                                            onChange={(e) => setTaxRates({ ...taxRates, otherLegalCharges: parseFloat(e.target.value) || 0 })} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Custom Items Builder */}
                            <div className="space-y-3 pt-2 border-t">
                                <h4 className="text-xs font-bold uppercase text-slate-500">Custom Line Charges</h4>
                                <div className="flex gap-2">
                                    <Input placeholder="E.g., Solar/Gas Pipe" value={newCostLabel} onChange={(e) => setNewCostLabel(e.target.value)} className="text-xs" />
                                    <Input type="number" placeholder="Amount" value={newCostAmount} onChange={(e) => setNewCostAmount(e.target.value)} className="w-[100px] text-xs" />
                                    <Button size="icon" className="bg-emerald-600 hover:bg-emerald-700 shrink-0" 
                                        onClick={() => {
                                            if (!newCostLabel || !newCostAmount) return;
                                            setCustomCosts([...customCosts, { id: Math.random().toString(), label: newCostLabel, amount: parseFloat(newCostAmount) || 0 }]);
                                            setNewCostLabel("");
                                            setNewCostAmount("");
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {customCosts.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                        {customCosts.map(cc => (
                                            <div key={cc.id} className="flex justify-between items-center text-xs p-1.5 bg-slate-50 dark:bg-slate-900 rounded border">
                                                <span className="truncate">{cc.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono">₹ {cc.amount.toLocaleString()}</span>
                                                    <Button size="icon" variant="ghost" className="h-5 w-5 text-red-500 hover:text-red-700 p-0" 
                                                        onClick={() => setCustomCosts(customCosts.filter(c => c.id !== cc.id))}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Lumpsum Discount */}
                            <div className="pt-2 border-t space-y-2">
                                <label className="text-xs font-semibold text-green-600 block">Lumpsum Special Discount (₹)</label>
                                <Input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                    className="border-green-200 dark:border-green-800 focus:border-green-500 text-green-600 font-bold"
                                />
                            </div>
                        </Card>
                    )}

                    {activeDoc === "payment-plan" && (
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm space-y-4 p-4">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
                                <CreditCard className="h-4 w-4 text-indigo-500" /> Milestone & Schedule Builder
                            </h3>

                            {/* Quick Presets */}
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">Apply Template Plan</label>
                                <Select onValueChange={handleTemplateChange}>
                                    <SelectTrigger className="text-xs">
                                        <SelectValue placeholder="Choose Preset" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="clp">Construction Linked Plan (CLP)</SelectItem>
                                        <SelectItem value="dp">Down Payment Plan (DP)</SelectItem>
                                        <SelectItem value="flexi">Flexi Payment Plan (40-60)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Add Milestone Form */}
                            <div className="space-y-3 pt-2 border-t">
                                <h4 className="text-xs font-bold uppercase text-slate-500">Add New Milestone</h4>
                                <div className="flex gap-2">
                                    <Input placeholder="Milestone / Slab Name" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} className="text-xs" />
                                    <Input type="number" placeholder="%" value={newStagePercent} onChange={(e) => setNewStagePercent(e.target.value)} className="w-[70px] text-xs" />
                                    <Button size="icon" className="bg-indigo-600 hover:bg-indigo-700 shrink-0" 
                                        onClick={() => {
                                            if (!newStageName || !newStagePercent) return;
                                            const pct = parseFloat(newStagePercent) || 0;
                                            setMilestones([...milestones, { id: Math.random().toString(), stage: newStageName, percent: pct }]);
                                            setNewStageName("");
                                            setNewStagePercent("");
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* List Milestones */}
                            <div className="space-y-2 pt-2 border-t">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-xs font-bold uppercase text-slate-500">Milestone Breakdowns</h4>
                                    <Badge className={milestoneSum === 100 ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"}>
                                        Total: {milestoneSum}%
                                    </Badge>
                                </div>

                                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                                    {milestones.map((ms, idx) => (
                                        <div key={ms.id} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 p-1.5 rounded border">
                                            <Input 
                                                value={ms.stage} 
                                                className="h-7 text-xs flex-1 bg-transparent border-none p-0 focus-visible:ring-0" 
                                                onChange={(e) => {
                                                    const updated = [...milestones];
                                                    updated[idx].stage = e.target.value;
                                                    setMilestones(updated);
                                                }}
                                            />
                                            <div className="flex items-center gap-1">
                                                <Input 
                                                    type="number" 
                                                    value={ms.percent} 
                                                    className="h-7 w-12 text-xs text-right bg-transparent border-none p-0 focus-visible:ring-0 font-mono" 
                                                    onChange={(e) => {
                                                        const updated = [...milestones];
                                                        updated[idx].percent = parseFloat(e.target.value) || 0;
                                                        setMilestones(updated);
                                                    }}
                                                />
                                                <span className="text-xs text-slate-400 mr-2">%</span>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700 p-0" 
                                                    onClick={() => setMilestones(milestones.filter(m => m.id !== ms.id))}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {milestoneSum !== 100 && (
                                    <p className="text-[10px] text-red-500 italic mt-1 flex items-center gap-1">
                                        <Info className="h-3 w-3 shrink-0" /> Schedule percentages must sum up to exactly 100%.
                                    </p>
                                )}
                            </div>
                        </Card>
                    )}

                    {activeDoc === "booking-form" && (
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm space-y-4 p-4">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
                                <FileCheck className="h-4 w-4 text-teal-500" /> Booking Details & Terms
                            </h3>

                            {/* Client Personal Info Overrides */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase text-slate-500">Applicant Details</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-400">Applicant Name</label>
                                        <Input value={selectedCustomer.name} 
                                            onChange={(e) => setCustomers(customers.map(c => c.id === selectedCustomer.id ? { ...c, name: e.target.value } : c))} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">Co-Applicant Name</label>
                                        <Input value={applicantDetails.coApplicantName} 
                                            onChange={(e) => setApplicantDetails({ ...applicantDetails, coApplicantName: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-400">PAN Number</label>
                                        <Input value={selectedCustomer.pan || ""} 
                                            onChange={(e) => setCustomers(customers.map(c => c.id === selectedCustomer.id ? { ...c, pan: e.target.value } : c))} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">Co-App Relation</label>
                                        <Input value={applicantDetails.coApplicantRelation} 
                                            onChange={(e) => setApplicantDetails({ ...applicantDetails, coApplicantRelation: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Full Address</label>
                                    <Input value={selectedCustomer.address || ""} 
                                        onChange={(e) => setCustomers(customers.map(c => c.id === selectedCustomer.id ? { ...c, address: e.target.value } : c))} 
                                    />
                                </div>
                            </div>

                            {/* Token Details */}
                            <div className="space-y-3 pt-2 border-t">
                                <h4 className="text-xs font-bold uppercase text-slate-500">Booking Token Remittance</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-400">Token Amount (₹)</label>
                                        <Input type="number" value={bookingPayment.bookingAmount} 
                                            onChange={(e) => setBookingPayment({ ...bookingPayment, bookingAmount: parseFloat(e.target.value) || 0 })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">Payment Mode</label>
                                        <Select value={bookingPayment.paymentMode} onValueChange={(val) => setBookingPayment({ ...bookingPayment, paymentMode: val })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Cheque">Cheque</SelectItem>
                                                <SelectItem value="NEFT/RTGS">NEFT / RTGS</SelectItem>
                                                <SelectItem value="UPI Transfer">UPI Transfer</SelectItem>
                                                <SelectItem value="Cash">Cash Receipt</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-400">Instrument / Ref No</label>
                                        <Input value={bookingPayment.instrumentNo} 
                                            onChange={(e) => setBookingPayment({ ...bookingPayment, instrumentNo: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">Bank Name</label>
                                        <Input value={bookingPayment.bankName} 
                                            onChange={(e) => setBookingPayment({ ...bookingPayment, bankName: e.target.value })} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Terms & Conditions Declarations */}
                            <div className="space-y-2 pt-2 border-t">
                                <label className="text-xs font-semibold text-slate-500">Legal Declaration / Terms</label>
                                <Textarea 
                                    className="text-xs h-24"
                                    value={applicantDetails.declarations} 
                                    onChange={(e) => setApplicantDetails({ ...applicantDetails, declarations: e.target.value })}
                                />
                            </div>
                        </Card>
                    )}

                    {activeDoc === "receipt" && (
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm space-y-4 p-4">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
                                <Receipt className="h-4 w-4 text-purple-500" /> Receipt Customizer
                            </h3>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-400">Receipt No</label>
                                        <Input value={receiptDetails.receiptNo} 
                                            onChange={(e) => setReceiptDetails({ ...receiptDetails, receiptNo: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">Receipt Date</label>
                                        <Input type="date" value={receiptDetails.date} 
                                            onChange={(e) => setReceiptDetails({ ...receiptDetails, date: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-400">Amount Received (₹)</label>
                                        <Input type="number" value={receiptDetails.receivedAmount} 
                                            onChange={(e) => setReceiptDetails({ ...receiptDetails, receivedAmount: parseFloat(e.target.value) || 0 })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">Payment Method</label>
                                        <Input value={receiptDetails.paymentMode} 
                                            onChange={(e) => setReceiptDetails({ ...receiptDetails, paymentMode: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-400">Reference/UTR No</label>
                                        <Input value={receiptDetails.instrumentNo} 
                                            onChange={(e) => setReceiptDetails({ ...receiptDetails, instrumentNo: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">Bank Name</label>
                                        <Input value={receiptDetails.bankName} 
                                            onChange={(e) => setReceiptDetails({ ...receiptDetails, bankName: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400">Payment Purpose</label>
                                    <Input value={receiptDetails.towards} 
                                        onChange={(e) => setReceiptDetails({ ...receiptDetails, towards: e.target.value })} 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                    <div>
                                        <label className="text-xs text-slate-400">Signatory Person</label>
                                        <Input value={receiptDetails.signatoryName} 
                                            onChange={(e) => setReceiptDetails({ ...receiptDetails, signatoryName: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">Signatory Title</label>
                                        <Input value={receiptDetails.signatoryTitle} 
                                            onChange={(e) => setReceiptDetails({ ...receiptDetails, signatoryTitle: e.target.value })} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeDoc === "demand-letter" && (
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm space-y-4 p-4">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
                                <Send className="h-4 w-4 text-red-500" /> Payment Demand Setup
                            </h3>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-400">Letter Reference No</label>
                                        <Input value={demandDetails.refNo} 
                                            onChange={(e) => setDemandDetails({ ...demandDetails, refNo: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">Letter Date</label>
                                        <Input type="date" value={demandDetails.date} 
                                            onChange={(e) => setDemandDetails({ ...demandDetails, date: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-400">Trigger Stage / Milestone</label>
                                        <Input value={demandDetails.stageTrigger} 
                                            onChange={(e) => setDemandDetails({ ...demandDetails, stageTrigger: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">Payment % Due</label>
                                        <Input type="number" value={demandDetails.duePercent} 
                                            onChange={(e) => setDemandDetails({ ...demandDetails, duePercent: parseFloat(e.target.value) || 0 })} 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-400">Payment Due Date</label>
                                        <Input type="date" value={demandDetails.dueDate} 
                                            onChange={(e) => setDemandDetails({ ...demandDetails, dueDate: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">UPI ID for payments</label>
                                        <Input value={demandDetails.upiId} 
                                            onChange={(e) => setDemandDetails({ ...demandDetails, upiId: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t">
                                    <h4 className="text-xs font-bold uppercase text-slate-500">Escrow Bank Details</h4>
                                    <div>
                                        <label className="text-xs text-slate-400">Account Beneficiary Name</label>
                                        <Input value={demandDetails.accName} 
                                            onChange={(e) => setDemandDetails({ ...demandDetails, accName: e.target.value })} 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-400">Account Number</label>
                                            <Input value={demandDetails.accNo} 
                                                onChange={(e) => setDemandDetails({ ...demandDetails, accNo: e.target.value })} 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400">IFSC Code</label>
                                            <Input value={demandDetails.ifscCode} 
                                                onChange={(e) => setDemandDetails({ ...demandDetails, ifscCode: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">Bank & Branch Name</label>
                                        <Input value={demandDetails.bankName} 
                                            onChange={(e) => setDemandDetails({ ...demandDetails, bankName: e.target.value })} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Company Global Header Customizer */}
                {activeDoc !== "repository" && (
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm p-4 pt-3">
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b pb-1">
                            <Building2 className="h-3.5 w-3.5 text-slate-500" /> Letterhead Settings
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-slate-400">Company Legal Name</label>
                                <Input value={headerInfo.companyName} className="h-7 text-xs" 
                                    onChange={(e) => setHeaderInfo({ ...headerInfo, companyName: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400">RERA License Number</label>
                                <Input value={headerInfo.reraNo} className="h-7 text-xs" 
                                    onChange={(e) => setHeaderInfo({ ...headerInfo, reraNo: e.target.value })} 
                                />
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Right Live Document Preview Container */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950/60 rounded-2xl p-6 overflow-y-auto shadow-inner flex justify-center items-start print:bg-white print:p-0 print:shadow-none h-full max-h-full border dark:border-slate-900">
                {activeDoc === "repository" ? (
                    <div className="h-full w-full flex flex-col p-6 overflow-hidden">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Folder className="h-5 w-5 text-blue-500" /> File Repository
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Upload and manage project brochures, layout maps, and agreement forms.</p>
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-semibold" onClick={handleUploadFile}>
                                <Plus className="h-4 w-4" /> Upload Custom PDF/Image
                            </Button>
                        </div>
                        
                        {/* Search Filter for Files */}
                        <div className="mb-4 relative shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search files in repository..." 
                                className="pl-9 bg-white dark:bg-slate-900"
                                value={fileSearchQuery}
                                onChange={(e) => setFileSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Files Grid / List */}
                        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                            {filteredFiles.length === 0 ? (
                                <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                    <Folder className="h-16 w-16 mb-2 text-slate-300 dark:text-slate-800" />
                                    <p className="text-sm font-semibold">No files found</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Upload a new PDF or Image brochure to get started.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredFiles.map((file, idx) => (
                                        <Card key={idx} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                            <CardContent className="p-4 flex items-start gap-3">
                                                <div className="h-12 w-12 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                                                    <FileText className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate" title={file.name}>
                                                        {file.name}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">Size: {file.size}</p>
                                                    <p className="text-[9px] text-slate-500 mt-1">Uploaded: {file.uploadedAt}</p>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="p-2 bg-slate-50 dark:bg-slate-900/60 border-t flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-slate-600 dark:text-slate-350 hover:bg-slate-100" onClick={() => window.open(file.url, "_blank")}>
                                                    <Download className="h-3 w-3" /> View
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-red-650 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleDeleteFile(file)}>
                                                    <Trash2 className="h-3 w-3" /> Delete
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-12 flex flex-col text-sm relative print:shadow-none print:p-4 print:w-full print:min-h-0 print:bg-transparent">
                        
                        {/* Printable CSS wrapper */}
                        <style dangerouslySetInnerHTML={{__html: `
                            @media print {
                                body * {
                                    visibility: hidden;
                                }
                                .print-content, .print-content * {
                                    visibility: visible;
                                }
                                .print-content {
                                    position: absolute;
                                    left: 0;
                                    top: 0;
                                    width: 100%;
                                    padding: 0;
                                    box-shadow: none;
                                }
                            }
                        `}} />

                        <div className="print-content flex-1 flex flex-col h-full">
                            
                            {/* Standard Letterhead */}
                            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 bg-slate-900 text-white rounded flex items-center justify-center font-bold tracking-tighter text-xs">
                                            {headerInfo.logoText.slice(0,2)}
                                        </div>
                                        <h1 className="text-xl font-bold uppercase tracking-wider">{headerInfo.companyName}</h1>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">{headerInfo.address}</p>
                                    <p className="text-[10px] text-slate-500">{headerInfo.phone} | {headerInfo.email}</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-sm font-bold text-slate-400 tracking-widest uppercase">
                                        {activeDoc === "cost-sheet" && "Cost Sheet"}
                                        {activeDoc === "payment-plan" && "Payment Schedule"}
                                        {activeDoc === "booking-form" && "Allotment App"}
                                        {activeDoc === "receipt" && "Money Receipt"}
                                        {activeDoc === "demand-letter" && "Demand Note"}
                                    </h2>
                                    <p className="text-xs font-semibold text-slate-500 mt-1">RERA: {headerInfo.reraNo}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Date: {
                                        activeDoc === "receipt" ? receiptDetails.date : 
                                        activeDoc === "demand-letter" ? demandDetails.date : 
                                        new Date().toLocaleDateString()
                                    }</p>
                                </div>
                            </div>

                            {/* Document Content Renders */}
                            {activeDoc === "cost-sheet" && (
                                <div className="flex-1 flex flex-col">
                                    {/* Client & Unit Panel */}
                                    <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Customer Details</p>
                                            <p className="font-bold text-base mt-0.5">{selectedCustomer.name}</p>
                                            <p className="text-xs text-slate-600 mt-0.5">{selectedCustomer.phone} | {selectedCustomer.email}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">PAN: {selectedCustomer.pan || "N/A"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Unit Details</p>
                                            <p className="font-bold text-base mt-0.5">{selectedUnit.name}</p>
                                            <p className="text-xs text-slate-600 mt-0.5">{selectedUnit.area} sq.ft Carpet Area</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Base Rate: ₹ {selectedUnit.rate.toLocaleString()}/sqft</p>
                                        </div>
                                    </div>

                                    {/* Calculations Breakdown */}
                                    <div className="flex-1">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-800 text-white">
                                                <tr>
                                                    <th className="text-left p-2.5 font-semibold">Description</th>
                                                    <th className="text-right p-2.5 font-semibold">Amount (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y border-b border-slate-200">
                                                <tr>
                                                    <td className="p-2.5">Base Cost (Carpet Area × Base Rate)</td>
                                                    <td className="text-right p-2.5 font-mono">{(costSheetCalculations.baseCost).toLocaleString()}</td>
                                                </tr>
                                                {selectedUnit.floorRise > 0 && (
                                                    <tr>
                                                        <td className="p-2.5">Floor Rise Charges (₹ {selectedUnit.floorRise}/sqft)</td>
                                                        <td className="text-right p-2.5 font-mono">{(costSheetCalculations.floorRiseCost).toLocaleString()}</td>
                                                    </tr>
                                                )}
                                                {selectedUnit.plc > 0 && (
                                                    <tr>
                                                        <td className="p-2.5">Preferential Location Charges (PLC) & Premium Amenities</td>
                                                        <td className="text-right p-2.5 font-mono">{(costSheetCalculations.plc).toLocaleString()}</td>
                                                    </tr>
                                                )}
                                                {selectedUnit.parking > 0 && (
                                                    <tr>
                                                        <td className="p-2.5">Reserved Car Parking Allocation</td>
                                                        <td className="text-right p-2.5 font-mono">{(costSheetCalculations.parking).toLocaleString()}</td>
                                                    </tr>
                                                )}
                                                {selectedUnit.clubhouse > 0 && (
                                                    <tr>
                                                        <td className="p-2.5">Clubhouse & Recreation Center Membership Membership Fees</td>
                                                        <td className="text-right p-2.5 font-mono">{(costSheetCalculations.clubhouse).toLocaleString()}</td>
                                                    </tr>
                                                )}
                                                
                                                {/* Custom Costs */}
                                                {customCosts.map(cc => (
                                                    <tr key={cc.id}>
                                                        <td className="p-2.5">{cc.label}</td>
                                                        <td className="text-right p-2.5 font-mono">{cc.amount.toLocaleString()}</td>
                                                    </tr>
                                                ))}

                                                {discount > 0 && (
                                                    <tr className="bg-green-50 text-green-700 font-semibold">
                                                        <td className="p-2.5">Less: Special Authorized Discount</td>
                                                        <td className="text-right p-2.5 font-mono">- {discount.toLocaleString()}</td>
                                                    </tr>
                                                )}

                                                <tr className="bg-slate-100 font-bold text-slate-900">
                                                    <td className="p-2.5">Agreement Value (AV)</td>
                                                    <td className="text-right p-2.5 font-mono">₹ {costSheetCalculations.agreementValue.toLocaleString()}</td>
                                                </tr>

                                                {/* Tax rows */}
                                                <tr>
                                                    <td className="p-2.5 text-slate-500">GST on Agreement Value ({taxRates.gstPercent}%)</td>
                                                    <td className="text-right p-2.5 font-mono text-slate-500">{costSheetCalculations.gst.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2.5 text-slate-500">Stamp Duty on Agreement Value ({taxRates.stampDutyPercent}%)</td>
                                                    <td className="text-right p-2.5 font-mono text-slate-500">{costSheetCalculations.stampDuty.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2.5 text-slate-500">Government Registration Fees</td>
                                                    <td className="text-right p-2.5 font-mono text-slate-500">{costSheetCalculations.registration.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2.5 text-slate-500">Legal, Society & Infrastructure Development Levies</td>
                                                    <td className="text-right p-2.5 font-mono text-slate-500">{costSheetCalculations.otherCharges.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Final Price Block */}
                                    <div className="bg-slate-900 text-white p-5 rounded-xl mt-6 flex justify-between items-center">
                                        <div>
                                            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">TOTAL LANDING COST</span>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Inclusive of AV, taxes, stamp duty and possession charges</p>
                                        </div>
                                        <span className="text-2xl font-bold font-mono">₹ {costSheetCalculations.total.toLocaleString()}</span>
                                    </div>

                                    {/* Disclaimers */}
                                    <div className="mt-8 text-[10px] text-slate-400 border-t pt-4 space-y-1">
                                        <p>* This cost sheet is valid for 7 calendar days from date of generation.</p>
                                        <p>* Government taxes, levies and duties are subject to change according to statutory revisions without notice.</p>
                                        <p>* Registration, stamp duty and legal charges are to be paid on actuals at the time of execution.</p>
                                    </div>
                                </div>
                            )}

                            {activeDoc === "payment-plan" && (
                                <div className="flex-1 flex flex-col">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Customer</p>
                                            <p className="font-bold text-sm mt-0.5">{selectedCustomer.name}</p>
                                            <p className="text-xs text-slate-600 mt-0.5">{selectedCustomer.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Calculated Against AV</p>
                                            <p className="font-bold text-sm mt-0.5">₹ {costSheetCalculations.agreementValue.toLocaleString()}</p>
                                            <p className="text-xs text-slate-600 mt-0.5">Unit: {selectedUnit.name}</p>
                                        </div>
                                    </div>

                                    {/* Table of Installments */}
                                    <div className="flex-1">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-800 text-white">
                                                <tr>
                                                    <th className="text-left p-2.5 font-semibold">Milestone / Stage Of Construction</th>
                                                    <th className="text-center p-2.5 font-semibold">% Due</th>
                                                    <th className="text-right p-2.5 font-semibold">Milestone Amount (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y border-b border-slate-200">
                                                {milestones.map((m, idx) => {
                                                    const amt = Math.round(costSheetCalculations.agreementValue * (m.percent / 100))
                                                    return (
                                                        <tr key={m.id}>
                                                            <td className="p-2.5 font-medium">{idx + 1}. {m.stage}</td>
                                                            <td className="text-center p-2.5 font-mono">{m.percent}%</td>
                                                            <td className="text-right p-2.5 font-mono">₹ {amt.toLocaleString()}</td>
                                                        </tr>
                                                    )
                                                })}
                                                <tr className="font-bold bg-slate-50 text-slate-900">
                                                    <td className="p-2.5 text-right">TOTAL</td>
                                                    <td className="text-center p-2.5 font-mono">{milestoneSum}%</td>
                                                    <td className="text-right p-2.5 font-mono">₹ {costSheetCalculations.agreementValue.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Instructions */}
                                    <div className="mt-8 text-[11px] text-slate-500 border-t pt-4 space-y-2 bg-slate-50 p-3 rounded border">
                                        <p className="font-bold text-slate-700">Payment Guidelines & Guidelines:</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li>Dues must be cleared within 15 days of demand letter dispatch.</li>
                                            <li>Payments to be made electronically or via cheque in favor of: <strong>"{headerInfo.companyName}"</strong>.</li>
                                            <li>GST is additional and will be levied at the actual rate on each slab invoice date.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeDoc === "booking-form" && (
                                <div className="flex-1 flex flex-col space-y-5">
                                    {/* Title details */}
                                    <div className="border-b border-slate-200 pb-2">
                                        <h3 className="font-bold text-sm bg-slate-100 p-2 text-slate-800 tracking-wide uppercase">1. Applicant Details</h3>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-2 text-xs">
                                            <div><span className="text-slate-400">Primary Applicant:</span> <strong className="ml-1 text-slate-800">{selectedCustomer.name}</strong></div>
                                            <div><span className="text-slate-400">Co-Applicant:</span> <strong className="ml-1 text-slate-800">{applicantDetails.coApplicantName || "N/A"}</strong></div>
                                            <div><span className="text-slate-400">Primary PAN No:</span> <strong className="ml-1 text-slate-800">{selectedCustomer.pan || "N/A"}</strong></div>
                                            <div><span className="text-slate-400">Co-App relation:</span> <strong className="ml-1 text-slate-800">{applicantDetails.coApplicantRelation || "N/A"}</strong></div>
                                            <div><span className="text-slate-400">Mobile No:</span> <strong className="ml-1 text-slate-800">{selectedCustomer.phone}</strong></div>
                                            <div><span className="text-slate-400">Email Address:</span> <strong className="ml-1 text-slate-800">{selectedCustomer.email}</strong></div>
                                            <div className="col-span-2"><span className="text-slate-400">Contact Address:</span> <strong className="ml-1 text-slate-800">{selectedCustomer.address}</strong></div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-sm bg-slate-100 p-2 text-slate-800 tracking-wide uppercase">2. Apartment Details</h3>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-2 text-xs">
                                            <div><span className="text-slate-400">Unit Identification:</span> <strong className="ml-1 text-slate-800">{selectedUnit.name}</strong></div>
                                            <div><span className="text-slate-400">Carpet Area:</span> <strong className="ml-1 text-slate-800">{selectedUnit.area} Sq.Ft</strong></div>
                                            <div><span className="text-slate-400">Agreement Value:</span> <strong className="ml-1 text-slate-800">₹ {costSheetCalculations.agreementValue.toLocaleString()}</strong></div>
                                            <div><span className="text-slate-400">Parking Space:</span> <strong className="ml-1 text-slate-800">{applicantDetails.parkingAssigned}</strong></div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-sm bg-slate-100 p-2 text-slate-800 tracking-wide uppercase">3. Token Remittance details</h3>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-2 text-xs">
                                            <div><span className="text-slate-400">Booking Amount Paid:</span> <strong className="ml-1 text-slate-800">₹ {bookingPayment.bookingAmount.toLocaleString()}</strong></div>
                                            <div><span className="text-slate-400">Payment mode:</span> <strong className="ml-1 text-slate-800">{bookingPayment.paymentMode}</strong></div>
                                            <div><span className="text-slate-400">Ref/UTR/Instrument No:</span> <strong className="ml-1 text-slate-800">{bookingPayment.instrumentNo}</strong></div>
                                            <div><span className="text-slate-400">Bank & Branch:</span> <strong className="ml-1 text-slate-800">{bookingPayment.bankName} - {bookingPayment.branch}</strong></div>
                                            <div><span className="text-slate-400">Remittance Date:</span> <strong className="ml-1 text-slate-800">{new Date(bookingPayment.date).toLocaleDateString()}</strong></div>
                                        </div>
                                    </div>

                                    {/* Declaration Text Block */}
                                    <div className="pt-2">
                                        <h3 className="font-bold text-xs text-slate-700 uppercase">Declaration Note:</h3>
                                        <p className="text-[10px] text-slate-500 leading-relaxed text-justify mt-1">
                                            {applicantDetails.declarations}
                                        </p>
                                    </div>

                                    {/* Signatures */}
                                    <div className="pt-12 flex justify-between px-6 text-xs">
                                        <div className="text-center">
                                            <div className="border-b border-slate-400 w-44 mb-1.5 h-6"></div>
                                            <p className="font-semibold text-slate-600">Primary Applicant Signature</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="border-b border-slate-400 w-44 mb-1.5 h-6"></div>
                                            <p className="font-semibold text-slate-600">Co-Applicant Signature</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeDoc === "receipt" && (
                                <div className="flex-1 flex flex-col border-4 border-double border-slate-200 p-8 rounded-lg relative">
                                    {/* Watermark Logo Background */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                                        <Building2 className="w-[350px] h-[350px]" />
                                    </div>

                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold font-serif text-slate-800 uppercase tracking-widest border-b pb-1.5">Official Money Receipt</h3>
                                    </div>

                                    <div className="flex justify-between text-xs mb-8">
                                        <div>Receipt No: <span className="font-bold font-mono text-slate-800">{receiptDetails.receiptNo}</span></div>
                                        <div>Date: <span className="font-bold font-mono text-slate-800">{new Date(receiptDetails.date).toLocaleDateString()}</span></div>
                                    </div>

                                    {/* Receipt Statement details */}
                                    <div className="space-y-6 text-sm font-serif leading-loose text-slate-700 flex-1">
                                        <p>
                                            Received with thanks from Mr./Mrs./Ms. <span className="font-bold border-b border-slate-400 px-3 py-0.5 inline-block min-w-[200px] text-slate-900 font-sans">{selectedCustomer.name}</span>
                                        </p>
                                        <p>
                                            A sum of Rupees <span className="font-bold border-b border-slate-400 px-3 py-0.5 inline-block min-w-[180px] text-slate-900 font-sans">₹ {receiptDetails.receivedAmount.toLocaleString()}/-</span>
                                        </p>
                                        <p>
                                            Via payment mode <span className="font-bold border-b border-slate-400 px-3 py-0.5 inline-block text-slate-900 font-sans">{receiptDetails.paymentMode}</span> Reference No: <span className="font-bold border-b border-slate-400 px-3 py-0.5 inline-block text-slate-900 font-sans">{receiptDetails.instrumentNo}</span>
                                        </p>
                                        <p>
                                            Drawn on bank <span className="font-bold border-b border-slate-400 px-3 py-0.5 inline-block min-w-[150px] text-slate-900 font-sans">{receiptDetails.bankName || "N/A"}</span>
                                        </p>
                                        <p>
                                            Towards booking/allotment of Flat <span className="font-bold border-b border-slate-400 px-3 py-0.5 inline-block text-slate-900 font-sans">{selectedUnit.name}</span>
                                        </p>
                                    </div>

                                    {/* Signatory footer */}
                                    <div className="mt-12 flex justify-between items-end border-t border-slate-100 pt-6">
                                        <div className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                                            * Receipt is valid subject to realization of cheque / online fund transfer clearance.<br />
                                            * This is a computerized RERA-compliant receipt.
                                        </div>
                                        <div className="text-center mr-4">
                                            <div className="h-10 w-36 mb-1 border border-dashed border-slate-200 rounded flex items-center justify-center text-[10px] text-slate-300 italic select-none">
                                                [Sign Document]
                                            </div>
                                            <p className="font-bold text-xs text-slate-800">{receiptDetails.signatoryName}</p>
                                            <p className="text-[10px] text-slate-400">{receiptDetails.signatoryTitle}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeDoc === "demand-letter" && (
                                <div className="flex-1 flex flex-col text-xs leading-relaxed">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="font-semibold">To,</p>
                                            <p className="font-bold text-sm text-slate-800">{selectedCustomer.name}</p>
                                            <p className="text-slate-500">Contact: {selectedCustomer.phone}</p>
                                            <p className="text-slate-500">Address: {selectedCustomer.address}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-bold">Ref No: {demandDetails.refNo}</p>
                                            <p>Date: {new Date(demandDetails.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="bg-red-50 text-red-900 font-bold p-2.5 rounded border border-red-200 uppercase tracking-wide mb-5 text-center">
                                        Payment Demand Note: {demandDetails.stageTrigger}
                                    </div>

                                    <p className="mb-4">Dear Sir/Madam,</p>
                                    <p className="mb-4 leading-loose">
                                        We are pleased to share that construction is moving rapidly at the site. The milestone stage <strong>"{demandDetails.stageTrigger}"</strong> for your unit <strong>{selectedUnit.name}</strong> has been achieved. As per the linked payment plan terms, the current installment demand is now due for remittance:
                                    </p>

                                    {/* Calculations detail */}
                                    <table className="w-full text-xs mb-6 border-collapse border border-slate-200">
                                        <thead className="bg-slate-100 text-slate-800">
                                            <tr>
                                                <th className="border border-slate-200 p-2.5 text-left font-semibold">Description</th>
                                                <th className="border border-slate-200 p-2.5 text-right font-semibold">Amount (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y border-b">
                                            <tr>
                                                <td className="border border-slate-200 p-2.5">
                                                    Stage Demand Installment ({demandDetails.duePercent}% of AV: ₹ {costSheetCalculations.agreementValue.toLocaleString()})
                                                </td>
                                                <td className="border border-slate-200 p-2.5 text-right font-mono">
                                                    {Math.round(costSheetCalculations.agreementValue * (demandDetails.duePercent / 100)).toLocaleString()}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="border border-slate-200 p-2.5 text-slate-500">GST on installment amount (5% actuals)</td>
                                                <td className="border border-slate-200 p-2.5 text-right font-mono text-slate-500">
                                                    {Math.round(costSheetCalculations.agreementValue * (demandDetails.duePercent / 100) * 0.05).toLocaleString()}
                                                </td>
                                            </tr>
                                            <tr className="font-bold bg-slate-50">
                                                <td className="border border-slate-200 p-2.5 text-slate-900">Total Net Amount Payable</td>
                                                <td className="border border-slate-200 p-2.5 text-right font-mono text-slate-900 text-sm">
                                                    ₹ {(Math.round(costSheetCalculations.agreementValue * (demandDetails.duePercent / 100) * 1.05)).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {/* Due Warning Banner */}
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 font-semibold mb-6 flex justify-between items-center">
                                        <span>DUE DATE FOR REMITTANCE:</span>
                                        <span className="font-mono text-sm underline">{new Date(demandDetails.dueDate).toLocaleDateString()}</span>
                                    </div>

                                    {/* Banking details & QR code */}
                                    <div className="grid grid-cols-3 gap-4 border-t pt-4">
                                        <div className="col-span-2">
                                            <h4 className="font-bold text-slate-700 uppercase mb-1">Escrow Bank Details:</h4>
                                            <p className="font-mono text-[11px] leading-relaxed">
                                                Beneficiary: {demandDetails.accName}<br />
                                                Account No: {demandDetails.accNo}<br />
                                                IFSC Code: {demandDetails.ifscCode}<br />
                                                Bank Name: {demandDetails.bankName}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center border p-2 rounded bg-slate-50">
                                            <div className="w-16 h-16 bg-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold border-2 border-slate-300">
                                                QR Code
                                            </div>
                                            <p className="text-[9px] mt-1 font-semibold text-slate-500">Scan to Pay via UPI</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Document Footer (Print Details) */}
                        <div className="mt-12 text-center text-[9px] text-slate-400 border-t pt-2 w-full flex justify-between items-center print:mt-6">
                            <span>Generated by {headerInfo.companyName} Document Center</span>
                            <span>Page 1 of 1</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Float Action Toolbar Buttons (Print Hidden) */}
            {activeDoc !== "repository" && (
                <div className="fixed bottom-6 right-6 flex gap-2 z-50 print:hidden">
                    {(activeDoc === "booking-form" || activeDoc === "receipt") && (
                        <Button size="lg" className="rounded-full shadow-lg bg-rose-600 hover:bg-rose-700 gap-2 text-white font-semibold" onClick={handleMarkAsBooked}>
                            <CheckCircle2 className="h-4 w-4" /> Mark Unit Booked
                        </Button>
                    )}
                    <Button size="lg" className="rounded-full shadow-lg bg-amber-600 hover:bg-amber-700 gap-2 text-white font-semibold" onClick={handleAttachToCRM}>
                        <FileCheck className="h-4 w-4" /> Attach to CRM Timeline
                    </Button>
                    <Button size="lg" className="rounded-full shadow-lg bg-green-600 hover:bg-green-700 gap-2 text-white font-semibold" onClick={handleShare}>
                        <Share2 className="h-4 w-4" /> Share Summary
                    </Button>
                    <Button size="lg" className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 gap-2 text-white font-semibold" onClick={handlePrint}>
                        <Printer className="h-4 w-4" /> Print / Save PDF
                    </Button>
                </div>
            )}
        </div>
    )
}
