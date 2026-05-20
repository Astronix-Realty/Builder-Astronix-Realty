"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    FileText, Download, Share2, Folder, Search, Plus, Calculator,
    CreditCard, PenTool, Receipt, Send, CheckCircle2, User, Printer, Eye,
    Building2, Calendar, FileCheck
} from "lucide-react"

// --- Types ---
type DocType = "cost-sheet" | "payment-plan" | "booking-form" | "receipt" | "demand-letter" | "repository"

// --- Mock Data ---
const CUSTOMERS = [
    { id: "C001", name: "Rahul Kumar", phone: "+91 98765 43210", email: "rahul@gmail.com" },
    { id: "C002", name: "Amit Singh", phone: "+91 99887 76655", email: "amit@yahoo.com" },
]

const UNITS = [
    { id: "A-502", name: "Tower A - 502 (3BHK)", area: 1200, rate: 6500, floorRise: 200 },
    { id: "B-201", name: "Tower B - 201 (2BHK)", area: 950, rate: 6000, floorRise: 0 },
]

export function DocumentsView() {
    const [activeDoc, setActiveDoc] = useState<DocType>("cost-sheet")
    const [previewMode, setPreviewMode] = useState(true)

    // Form States
    const [customers, setCustomers] = useState(CUSTOMERS)
    const [units, setUnits] = useState(UNITS)
    const [selectedCustomer, setSelectedCustomer] = useState(CUSTOMERS[0])
    const [selectedUnit, setSelectedUnit] = useState(UNITS[0])
    const [discount, setDiscount] = useState(0)
    const [loadingData, setLoadingData] = useState(false)

    useEffect(() => {
        let isMounted = true
        async function fetchContextData() {
            setLoadingData(true)
            try {
                // Fetch Leads dynamically
                const leadsRes = await fetch("/api/leads?limit=100")
                if (leadsRes.ok && isMounted) {
                    const data = await leadsRes.json()
                    if (data.success && data.leads && data.leads.length > 0) {
                        const mappedLeads = data.leads.map((l: any) => ({
                            id: l._id || l.id,
                            name: l.name,
                            phone: l.phone || "+91 N/A",
                            email: l.email || "N/A"
                        }))
                        setCustomers(mappedLeads)
                        setSelectedCustomer(mappedLeads[0])
                    }
                }

                // Fetch Properties dynamically
                const propRes = await fetch("/api/properties")
                if (propRes.ok && isMounted) {
                    const data = await propRes.json()
                    const allUnits: any[] = []
                    
                    if (data.properties && data.properties.length > 0) {
                        for (const p of data.properties) {
                            const detailRes = await fetch(`/api/properties/${p._id}`)
                            if (detailRes.ok && isMounted) {
                                const detailData = await detailRes.json()
                                const genUnits = detailData.property?.details?.generatedUnits || []
                                genUnits.forEach((u: any) => {
                                    allUnits.push({
                                        id: u._dbId || u.id || Math.random().toString(),
                                        name: `${p.name} - ${u.unitNumber} (${u.configuration})`,
                                        area: u.area || 1000,
                                        rate: u.area ? Math.round((u.price || 5000000) / u.area) : 5000,
                                        floorRise: 150
                                    })
                                })
                            }
                        }
                    }
                    if (allUnits.length > 0 && isMounted) {
                        setUnits(allUnits)
                        setSelectedUnit(allUnits[0])
                    }
                }
            } catch (err) {
                console.error("Failed to load documents context dynamically:", err)
            } finally {
                if (isMounted) setLoadingData(false)
            }
        }
        fetchContextData()
        return () => {
            isMounted = false
        }
    }, [])

    // --- GENERATORS ---

    // 1. Cost Sheet Generator
    const CostSheet = () => {
        const baseCost = selectedUnit.area * selectedUnit.rate
        const floorRiseCost = selectedUnit.area * selectedUnit.floorRise
        const plc = 150000 // Fixed for demo
        const agreementValue = baseCost + floorRiseCost + plc
        const gst = agreementValue * 0.05
        const stampDuty = agreementValue * 0.07
        const registration = 30000
        const otherCharges = 150000 // Legal + Maintenance

        const total = agreementValue + gst + stampDuty + registration + otherCharges - discount

        return (
            <div className="flex flex-col lg:flex-row h-full gap-6">
                {/* Inputs */}
                <Card className="w-full lg:w-1/3 overflow-y-auto border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-blue-600" /> Cost Sheet
                        </CardTitle>
                        <CardDescription>Generate final quotation for negotiation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Customer</label>
                            <Select defaultValue={selectedCustomer?.id || ""} onValueChange={(v) => setSelectedCustomer(customers.find(c => c.id === v) || customers[0])}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Unit</label>
                            <Select defaultValue={selectedUnit?.id || ""} onValueChange={(v) => setSelectedUnit(units.find(u => u.id === v) || units[0])}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-green-600">Lumpsum Discount (₹)</label>
                            <Input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                                className="border-green-200 focus:border-green-500"
                            />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">Generate & Save</Button>
                    </CardContent>
                </Card>

                {/* Live Preview */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-8 overflow-y-auto shadow-inner flex justify-center">
                    <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-12 flex flex-col text-sm relative">
                        {/* Header */}
                        <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-8">
                            <div>
                                <h1 className="text-2xl font-bold uppercase tracking-wider">Astronix Realty</h1>
                                <p className="text-xs text-slate-500">RERA: P52100012345</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold text-slate-400">COST SHEET</h2>
                                <p className="font-medium">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Customer & Unit */}
                        <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-4 rounded-lg border">
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Customer</p>
                                <p className="font-bold text-lg">{selectedCustomer.name}</p>
                                <p>{selectedCustomer.phone}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase">Unit Details</p>
                                <p className="font-bold text-lg">{selectedUnit.name}</p>
                                <p>{selectedUnit.area} sq.ft Carpet</p>
                            </div>
                        </div>

                        {/* Calculation Table */}
                        <div className="flex-1">
                            <table className="w-full">
                                <thead className="bg-slate-800 text-white">
                                    <tr>
                                        <th className="text-left p-3">Description</th>
                                        <th className="text-right p-3">Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr><td className="p-3">Base Cost (@ {selectedUnit.rate}/sqft)</td><td className="text-right p-3 font-mono">{baseCost.toLocaleString()}</td></tr>
                                    <tr><td className="p-3">Floor Rise Charges</td><td className="text-right p-3 font-mono">{floorRiseCost.toLocaleString()}</td></tr>
                                    <tr><td className="p-3">PLC & Amenities</td><td className="text-right p-3 font-mono">{plc.toLocaleString()}</td></tr>
                                    <tr className="bg-slate-100 font-bold"><td className="p-3">A. Agreement Value</td><td className="text-right p-3 font-mono">{agreementValue.toLocaleString()}</td></tr>

                                    <tr><td className="p-3 text-slate-500">GST (5%)</td><td className="text-right p-3 font-mono text-slate-500">{gst.toLocaleString()}</td></tr>
                                    <tr><td className="p-3 text-slate-500">Stamp Duty (7%)</td><td className="text-right p-3 font-mono text-slate-500">{stampDuty.toLocaleString()}</td></tr>
                                    <tr><td className="p-3 text-slate-500">Registration Fees</td><td className="text-right p-3 font-mono text-slate-500">{registration.toLocaleString()}</td></tr>
                                    <tr><td className="p-3 text-slate-500">Other Charges (Legal, Maint.)</td><td className="text-right p-3 font-mono text-slate-500">{otherCharges.toLocaleString()}</td></tr>

                                    {discount > 0 && (
                                        <tr className="bg-green-50 text-green-700 font-medium">
                                            <td className="p-3">Less: Special Discount</td>
                                            <td className="text-right p-3 font-mono">- {discount.toLocaleString()}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Total */}
                        <div className="bg-slate-900 text-white p-6 rounded-lg mt-4 flex justify-between items-center">
                            <span className="text-lg font-medium">TOTAL LANDING COST</span>
                            <span className="text-3xl font-bold">₹ {total.toLocaleString()}</span>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 text-center text-xs text-slate-400 border-t pt-4">
                            <p>Valid for 7 Days Only. This is a computer generated document.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 2. Receipt Generator
    const MoneyReceipt = () => {
        const [amount, setAmount] = useState(100000)
        const [mode, setMode] = useState("cheque")
        const [refNo, setRefNo] = useState("")

        return (
            <div className="flex flex-col lg:flex-row h-full gap-6">
                {/* Inputs */}
                <Card className="w-full lg:w-1/3 border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-purple-600" /> Money Receipt
                        </CardTitle>
                        <CardDescription>Instant payment acknowledgement.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Customer</label>
                            <Select defaultValue={selectedCustomer?.id || ""} onValueChange={(v) => setSelectedCustomer(customers.find(c => c.id === v) || customers[0])}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Amount Received (₹)</label>
                            <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Payment Mode</label>
                                <Select value={mode} onValueChange={setMode}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                        <SelectItem value="upi">UPI</SelectItem>
                                        <SelectItem value="neft">NEFT/RTGS</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Ref/Cheque No.</label>
                                <Input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="XXXXXX" />
                            </div>
                        </div>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-4">Create & Send</Button>
                    </CardContent>
                </Card>

                {/* Preview */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-8 flex justify-center items-start overflow-y-auto">
                    <div className="w-[210mm] bg-white text-slate-900 shadow-xl p-12 border-4 border-double border-purple-100 relative">
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                            <Building2 className="w-96 h-96" />
                        </div>

                        <div className="text-center border-b-2 border-purple-900 pb-4 mb-8">
                            <h1 className="text-3xl font-serif text-purple-900 font-bold">OFFICIAL RECEIPT</h1>
                            <p className="text-slate-500">Astronix Realty Pvt Ltd.</p>
                        </div>

                        <div className="flex justify-between mb-8">
                            <p>Receipt No: <span className="font-mono font-bold">REC-{Math.floor(Math.random() * 1000)}</span></p>
                            <p>Date: <span className="font-mono font-bold">{new Date().toLocaleDateString()}</span></p>
                        </div>

                        <div className="space-y-6 text-lg leading-relaxed font-serif">
                            <p>
                                Received with thanks from Mr./Mrs. <span className="font-bold border-b border-dashed border-slate-400 px-2">{selectedCustomer.name}</span>
                            </p>
                            <p>
                                a sum of Rupees <span className="font-bold border-b border-dashed border-slate-400 px-2">₹ {amount.toLocaleString()}</span>
                            </p>
                            <p>
                                vide {mode.toUpperCase()} No. <span className="font-bold border-b border-dashed border-slate-400 px-2">{refNo || "_______"}</span> dated {new Date().toLocaleDateString()}
                            </p>
                            <p>
                                towards booking/installment for Flat No. <span className="font-bold border-b border-dashed border-slate-400 px-2">{selectedUnit.name}</span>
                            </p>
                        </div>

                        <div className="mt-16 flex justify-between items-end">
                            <div className="text-xs text-slate-500 max-w-xs">
                                * Subject to realization of Cheque.<br />
                                * This receipt is valid only if signed by authorized signatory.
                            </div>
                            <div className="text-center">
                                <div className="h-16 w-32 mb-2 bg-[url('/signature-placeholder.png')] bg-contain bg-no-repeat bg-center opacity-50"></div>
                                <p className="font-bold border-t pt-2 w-40">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 3. Demand Letter (Bulk)
    const DemandLetter = () => (
        <div className="flex flex-col lg:flex-row h-full gap-6">
            <Card className="w-full lg:w-1/3 border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-red-600" /> Demand Letter
                    </CardTitle>
                    <CardDescription>Bulk send payment reminders for slab completion.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Project & Tower</label>
                        <Select><SelectTrigger><SelectValue placeholder="Astronix City - Tower A" /></SelectTrigger><SelectContent><SelectItem value="A">Tower A</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Stage Completed</label>
                        <Select><SelectTrigger><SelectValue placeholder="5th Slab" /></SelectTrigger><SelectContent><SelectItem value="5">5th Slab</SelectItem><SelectItem value="6">6th Slab</SelectItem></SelectContent></Select>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Eligible Customers (3)</p>
                        <div className="flex items-center justify-between text-sm p-2 bg-white dark:bg-slate-800 rounded border">
                            <span>Rahul Kumar (502)</span>
                            <Badge variant="outline" className="text-green-600 bg-green-50">Due: ₹ 5.25L</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm p-2 bg-white dark:bg-slate-800 rounded border">
                            <span>Amit Singh (401)</span>
                            <Badge variant="outline" className="text-green-600 bg-green-50">Due: ₹ 5.25L</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm p-2 bg-white dark:bg-slate-800 rounded border">
                            <span>Sneha Gupta (505)</span>
                            <Badge variant="outline" className="text-green-600 bg-green-50">Due: ₹ 5.25L</Badge>
                        </div>
                    </div>

                    <Button className="w-full bg-red-600 hover:bg-red-700 mt-4">Send to All (3)</Button>
                </CardContent>
            </Card>

            {/* Preview */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-8 flex justify-center items-start overflow-y-auto">
                <div className="w-[210mm] bg-white text-slate-900 shadow-xl p-12 text-sm">
                    <div className="text-center mb-12">
                        <h1 className="font-bold text-xl uppercase text-red-700">Demand for Payment</h1>
                        <p className="text-slate-500">Ref: DEM/A/005/2026</p>
                    </div>

                    <p className="mb-6">To,<br /><strong>Mr. Rahul Kumar</strong><br />Flat No. 502, Tower A<br />Astronix City</p>

                    <p className="mb-4">Subject: <strong>Demand for payment on completion of 5th Slab.</strong></p>

                    <p className="mb-4 leading-relaxed">
                        Dear Sir/Madam,<br /><br />
                        We are pleased to inform you that the construction of <strong>Tower A</strong> has progressed significantly and we have successfully completed the <strong>5th Slab</strong>.
                        <br /><br />
                        As per the construction linked payment plan opted by you, the following amount is now due for payment:
                    </p>

                    <table className="w-full mb-8 border-collapse border">
                        <thead className="bg-slate-100">
                            <tr><th className="border p-2 text-left">Description</th><th className="border p-2 text-right">Amount</th></tr>
                        </thead>
                        <tbody>
                            <tr><td className="border p-2">Stage Installment (5%)</td><td className="border p-2 text-right font-mono">₹ 5,00,000</td></tr>
                            <tr><td className="border p-2">GST (5%)</td><td className="border p-2 text-right font-mono">₹ 25,000</td></tr>
                            <tr className="font-bold"><td className="border p-2">Total Payable</td><td className="border p-2 text-right font-mono">₹ 5,25,000</td></tr>
                        </tbody>
                    </table>

                    <p className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                        <strong>Due Date:</strong> Please clear the dues by <strong>15th Feb 2026</strong> to avoid interest charges @ 12% p.a.
                    </p>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="font-bold mb-2">Bank Details:</p>
                            <p className="font-mono text-sm">
                                A/C Name: Astronix Realty<br />
                                A/C No: 1234567890<br />
                                IFSC: HDFC0001234<br />
                                Branch: Mumbai Main
                            </p>
                        </div>
                        <div className="text-center border p-2 rounded">
                            <div className="w-24 h-24 bg-slate-200 mx-auto mb-1 flex items-center justify-center text-xs">QR Code</div>
                            <p className="text-xs">Scan to Pay</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="h-[calc(100vh-140px)] flex gap-4">
            {/* Sidebar Navigation */}
            <div className="w-[80px] lg:w-[240px] flex flex-col gap-1 pr-2 border-r border-slate-200 dark:border-slate-800 shrink-0">
                <div className="font-bold text-xs text-slate-500 uppercase px-4 py-2 hidden lg:block">Generators</div>
                <div className="space-y-1">
                    {[
                        { id: 'cost-sheet', icon: Calculator, label: 'Cost Sheet' },
                        { id: 'payment-plan', icon: CreditCard, label: 'Payment Plan' },
                        { id: 'booking-form', icon: FileCheck, label: 'Booking Form' },
                        { id: 'receipt', icon: Receipt, label: 'Money Receipt' },
                        { id: 'demand-letter', icon: Send, label: 'Demand Letter' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveDoc(item.id as DocType)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                                ${activeDoc === item.id
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"}
                            `}
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="hidden lg:block">{item.label}</span>
                        </button>
                    ))}
                </div>

                <Separator className="my-2" />

                <div className="font-bold text-xs text-slate-500 uppercase px-4 py-2 hidden lg:block">Storage</div>
                <button
                    onClick={() => setActiveDoc('repository')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                        ${activeDoc === 'repository'
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"}
                    `}
                >
                    <Folder className="h-4 w-4 shrink-0" />
                    <span className="hidden lg:block">All Files</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                {activeDoc === 'cost-sheet' && <CostSheet />}
                {activeDoc === 'payment-plan' && <div className="flex items-center justify-center h-full text-slate-400">Payment Plan Generator Coming Soon...</div>}
                {activeDoc === 'booking-form' && <div className="flex items-center justify-center h-full text-slate-400">Booking Form Generator Coming Soon...</div>}
                {activeDoc === 'receipt' && <MoneyReceipt />}
                {activeDoc === 'demand-letter' && <DemandLetter />}

                {activeDoc === 'repository' && (
                    <div className="h-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-500">
                        <Folder className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-700" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">File Repository</h3>
                        <p className="text-sm">Store brochures, legal docs, and plans here.</p>
                    </div>
                )}
            </div>

            {/* Dynamic Toolbar - Only shows for Generators */}
            {activeDoc !== 'repository' && (
                <div className="fixed bottom-8 right-8 flex gap-2">
                    <Button size="lg" className="rounded-full shadow-lg bg-green-600 hover:bg-green-700 gap-2">
                        <Share2 className="h-5 w-5" /> Share WhatsApp
                    </Button>
                    <Button size="lg" className="rounded-full shadow-lg gap-2">
                        <Download className="h-5 w-5" /> Download PDF
                    </Button>
                </div>
            )}
        </div>
    )
}
