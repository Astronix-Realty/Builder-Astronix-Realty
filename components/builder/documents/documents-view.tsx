"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
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
    Info, RefreshCw, Layers
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
    documents?: any
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
    towerId?: string
    floorNumber?: number
    configuration?: string
    unitNumber?: string
}

const EditableText = ({ defaultText, className, tagName = "span" }: { defaultText: string, className?: string, tagName?: any }) => {
    const [text, setText] = useState(defaultText)
    
    useEffect(() => {
        setText(defaultText)
    }, [defaultText])

    const Tag = tagName
    return (
        <Tag 
            className={`cursor-text hover:bg-slate-100 px-1 -ml-1 rounded outline-none focus:bg-white focus:ring-2 ring-blue-400 print:p-0 print:m-0 print:hover:bg-transparent ${className || ''}`}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e: any) => setText(e.currentTarget.textContent || '')}
            dangerouslySetInnerHTML={{ __html: text }}
        />
    )
}

export function DocumentsView() {
    const [activeDoc, setActiveDoc] = useState<DocType>("cost-sheet")
    const [mobileDocTab, setMobileDocTab] = useState<'editor' | 'preview'>('editor')
    const [loadingData, setLoadingData] = useState(false)
    const [isAttaching, setIsAttaching] = useState(false)
    const searchParams = useSearchParams()

    useEffect(() => {
        const customer = searchParams?.get('customer')
        const doc = searchParams?.get('doc')
        if (customer) {
            setSelectedCustomerId(customer)
            // Auto-fetch lead details from CRM to populate the document
            fetch(`/api/leads/${customer}`)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) {
                        setCustomers(prev => {
                            if (prev.find(c => c.id === customer)) return prev
                            return [...prev, {
                                id: customer,
                                name: data.name || "Unknown",
                                phone: data.phone || "N/A",
                                email: data.email || "N/A",
                                pan: "",
                                aadhar: "",
                                address: ""
                            }]
                        })
                    }
                })
                .catch(console.error)
        }
        if (doc) {
            setActiveDoc(doc as DocType)
        }

        const unitParam = searchParams?.get('unit')
        const propertyParam = searchParams?.get('property')
        if (unitParam && propertyParam) {
            setSelectedUnitId(unitParam)
            fetch(`/api/properties/${propertyParam}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.details?.generatedUnits) {
                        const targetUnit = data.details.generatedUnits.find((u: any) => 
                            u.id === unitParam || u._id === unitParam || u.originalId === unitParam || String(u.unitNumber) === unitParam
                        );
                        if (targetUnit) {
                            setUnits(prev => {
                                if (prev.find(u => u.id === unitParam)) return prev;
                                
                                let cleanNum = String(targetUnit.unitNumber).replace(new RegExp(`^${data.name || ''}[\\s-]*`, 'i'), '');
                                
                                return [...prev, {
                                    id: unitParam,
                                    name: `Flat ${cleanNum} ${targetUnit.configuration ? `(${targetUnit.configuration})` : ''}`,
                                    area: targetUnit.area || targetUnit.carpetArea || targetUnit.builtUpArea || 1000,
                                    rate: targetUnit.ratePerSqft || (targetUnit.price ? (targetUnit.price / (targetUnit.area || 1000)) : 5000),
                                    floorRise: 0,
                                    plc: 0,
                                    parking: 0,
                                    clubhouse: 0,
                                    propertyId: propertyParam
                                }];
                            });
                        }
                    }
                })
                .catch(console.error);
        }
    }, [searchParams])

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

    // Real Estate Inventory Hierarchy States
    const [propertiesList, setPropertiesList] = useState<any[]>([])
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
    const [availableTowers, setAvailableTowers] = useState<any[]>([])
    const [selectedTowerId, setSelectedTowerId] = useState<string>("all")
    const [selectedFloor, setSelectedFloor] = useState<string>("all")
    const [isFetchingInventory, setIsFetchingInventory] = useState(false)

    // Selected values
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("C001")
    const [selectedUnitId, setSelectedUnitId] = useState<string>("A-502")

    // Filter units by selected property, tower, and floor
    const filteredUnits = useMemo(() => {
        return units.filter(u => {
            if (selectedPropertyId && u.propertyId && u.propertyId !== selectedPropertyId) return false
            if (selectedTowerId && selectedTowerId !== "all" && u.towerId && u.towerId !== selectedTowerId) return false
            if (selectedFloor && selectedFloor !== "all" && u.floorNumber !== undefined && String(u.floorNumber) !== selectedFloor) return false
            return true
        })
    }, [units, selectedPropertyId, selectedTowerId, selectedFloor])

    // Available floors derived from current tower/property units
    const availableFloors = useMemo(() => {
        const floorSet = new Set<number>()
        units.forEach(u => {
            if (selectedPropertyId && u.propertyId && u.propertyId !== selectedPropertyId) return
            if (selectedTowerId && selectedTowerId !== "all" && u.towerId && u.towerId !== selectedTowerId) return
            if (u.floorNumber !== undefined && !isNaN(u.floorNumber)) {
                floorSet.add(u.floorNumber)
            }
        })
        return Array.from(floorSet).sort((a, b) => a - b)
    }, [units, selectedPropertyId, selectedTowerId])

    // Find active selections
    const selectedCustomer = useMemo(() => 
        customers.find(c => c.id === selectedCustomerId) || customers[0] || { name: "", phone: "", email: "", pan: "", aadhar: "", address: "" }
    , [customers, selectedCustomerId])

    const selectedUnit = useMemo(() => 
        filteredUnits.find(u => u.id === selectedUnitId) || 
        units.find(u => u.id === selectedUnitId) || 
        filteredUnits[0] || 
        units[0] || 
        { name: "", area: 1000, rate: 5000, floorRise: 0, plc: 0, parking: 0, clubhouse: 0 }
    , [filteredUnits, units, selectedUnitId])

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

    const [costSheetSettings, setCostSheetSettings] = useState({
        date: new Date().toLocaleDateString(),
        terms: "* This cost sheet is valid for 7 calendar days from date of generation.\n* Government taxes, levies and duties are subject to change according to statutory revisions without notice.\n* Registration, stamp duty and legal charges are to be paid on actuals at the time of execution.",
        footer: "Generated by Astronix Realty Document Studio",
        labels: {
            title: "Cost Sheet",
            customerDetails: "CUSTOMER DETAILS",
            unitDetails: "UNIT DETAILS",
            baseRate: "Base Rate: ₹",
            description: "Description",
            amount: "Amount (₹)",
            baseCost: "Base Cost (Carpet Area × Base Rate)",
            floorRise: "Floor Rise Charges",
            plc: "Preferential Location Charges (PLC) & Premium Amenities",
            parking: "Reserved Car Parking Allocation",
            clubhouse: "Clubhouse & Recreation Center Membership Fees",
            agreementValue: "Agreement Value (AV)",
            gst: "GST on Agreement Value (5%)",
            stampDuty: "Stamp Duty on Agreement Value (7%)",
            registration: "Government Registration Fees",
            legal: "Legal, Society & Infrastructure Development Levies",
            totalCost: "TOTAL LANDING COST",
            totalCostDesc: "Inclusive of AV, taxes, stamp duty and possession charges"
        }
    })

    const updateCustomer = (field: keyof Customer, value: any) => {
        setCustomers(customers.map(c => c.id === selectedCustomerId ? { ...c, [field]: value } : c))
    }
    const updateUnit = (field: keyof Unit, value: string | number) => {
        setUnits(units.map(u => u.id === selectedUnitId ? { ...u, [field]: value } : u))
    }
    const updateHeader = (field: string, value: string) => {
        setHeaderInfo(prev => ({ ...prev, [field]: value }))
    }
    const updateCostSheetLabel = (key: string, value: string) => {
        setCostSheetSettings(prev => ({ ...prev, labels: { ...prev.labels, [key as keyof typeof prev.labels]: value } }))
    }

    const handleAddCost = () => {
        if (!newCostLabel || !newCostAmount) return
        setCustomCosts([...customCosts, { id: Math.random().toString(36).substr(2, 9), label: newCostLabel, amount: Number(newCostAmount) }])
        setNewCostLabel("")
        setNewCostAmount("")
    }

    const handleRemoveCost = (id: string) => {
        setCustomCosts(customCosts.filter(c => c.id !== id))
    }

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

    const handleAddMilestone = () => {
        if (!newStageName || !newStagePercent) return
        setMilestones([...milestones, { id: `m${Date.now()}`, stage: newStageName, percent: parseFloat(newStagePercent) }])
        setNewStageName("")
        setNewStagePercent("")
    }

    const handleRemoveMilestone = (id: string) => {
        setMilestones(milestones.filter(m => m.id !== id))
    }

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
    const [customBookingFields, setCustomBookingFields] = useState<{id: string, label: string, value: string}[]>([])
    const [newBookingLabel, setNewBookingLabel] = useState("")
    const [newBookingValue, setNewBookingValue] = useState("")

    const handleAddBookingField = () => {
        if (!newBookingLabel || !newBookingValue) return
        setCustomBookingFields([...customBookingFields, { id: `bf${Date.now()}`, label: newBookingLabel, value: newBookingValue }])
        setNewBookingLabel("")
        setNewBookingValue("")
    }

    const handleRemoveBookingField = (id: string) => {
        setCustomBookingFields(customBookingFields.filter(f => f.id !== id))
    }

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
    const [customReceiptLines, setCustomReceiptLines] = useState<{id: string, text: string}[]>([])
    const [newReceiptLine, setNewReceiptLine] = useState("")
    
    const handleAddReceiptLine = () => {
        if (!newReceiptLine) return
        setCustomReceiptLines([...customReceiptLines, { id: `rc${Date.now()}`, text: newReceiptLine }])
        setNewReceiptLine("")
    }
    
    const handleRemoveReceiptLine = (id: string) => {
        setCustomReceiptLines(customReceiptLines.filter(l => l.id !== id))
    }

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
    const [customDemandLines, setCustomDemandLines] = useState<{id: string, desc: string, amount: number}[]>([])
    const [newDemandDesc, setNewDemandDesc] = useState("")
    const [newDemandAmount, setNewDemandAmount] = useState("")

    const handleAddDemandLine = () => {
        if (!newDemandDesc || !newDemandAmount) return
        setCustomDemandLines([...customDemandLines, { id: `dl${Date.now()}`, desc: newDemandDesc, amount: parseFloat(newDemandAmount) }])
        setNewDemandDesc("")
        setNewDemandAmount("")
    }

    const handleRemoveDemandLine = (id: string) => {
        setCustomDemandLines(customDemandLines.filter(l => l.id !== id))
    }

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
                        // Include booked, token VIP, and unit hold leads (active customers)
                        const bookedLeads = data.leads.filter((l: any) => 
                            l.status === "Booked" || 
                            l.status === "Token VIP" || 
                            l.isUnitHeld || 
                            l.isTokenPaid || 
                            Boolean(l.holdId)
                        )
                        const mappedLeads: Customer[] = bookedLeads.map((l: any) => ({
                            id: l._id || l.id,
                            name: l.name,
                            phone: l.phone || "+91 N/A",
                            email: l.email || "N/A",
                            pan: l.pan || "______________",
                            aadhar: l.aadhar || "______________",
                            address: l.address || "________________________________",
                            documents: l.documents || {}
                        }))
                        
                        if (mappedLeads.length > 0) {
                            setCustomers(mappedLeads)
                            setSelectedCustomerId(mappedLeads[0].id)
                        } else {
                            setCustomers([])
                            setSelectedCustomerId("")
                        }
                    }
                }

                // Fetch Properties
                const propRes = await fetch("/api/properties")
                if (propRes.ok && isMounted) {
                    const data = await propRes.json()
                    const props = data.properties || []
                    setPropertiesList(props)

                    // Auto-select first property if none selected
                    if (props.length > 0) {
                        setSelectedPropertyId(prev => prev || props[0]._id || props[0].id)
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

    // ─── Fetch Inventory Hierarchy (Towers & Units) when selectedPropertyId changes ───
    useEffect(() => {
        if (!selectedPropertyId) {
            setAvailableTowers([])
            return
        }

        let cancelled = false
        setIsFetchingInventory(true)

        fetch(`/api/inventory/${selectedPropertyId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                // Deduplicate towers by unique id/key
                const seenTowerIds = new Set<string>()
                const uniqueTowers = (data.towers || []).filter((t: any) => {
                    const tid = String(t.id || t._id || "")
                    if (!tid || seenTowerIds.has(tid)) return false
                    seenTowerIds.add(tid)
                    return true
                })
                setAvailableTowers(uniqueTowers)

                const rawUnits = data.units || []
                const seenUnitIds = new Set<string>()
                const mappedUnits: Unit[] = []

                rawUnits.forEach((u: any, idx: number) => {
                    const baseId = String(u._id || u.id || u.unitNumber || `unit-${idx}`)
                    // Ensure unique id per unit
                    let uniqueId = baseId
                    let counter = 1
                    while (seenUnitIds.has(uniqueId)) {
                        uniqueId = `${baseId}-${counter++}`
                    }
                    seenUnitIds.add(uniqueId)

                    const area = u.area || u.carpetArea || u.builtUpArea || 1000
                    const price = u.price || 5000000
                    const rate = u.ratePerSqft || Math.round(price / area) || 5000
                    const towerObj = uniqueTowers.find((t: any) => String(t.id || t._id) === String(u.towerId || u.parentId))
                    const towerLabel = towerObj ? towerObj.name : ""
                    const cleanNum = u.unitNumber || u.unitNo || `Flat ${idx + 1}`
                    const name = towerLabel 
                        ? `${towerLabel} - ${cleanNum} (${u.configuration || "1BHK"})`
                        : `Unit ${cleanNum} (${u.configuration || "1BHK"})`

                    mappedUnits.push({
                        id: uniqueId,
                        name,
                        area,
                        rate,
                        floorRise: u.floorRise || 150,
                        plc: u.plc || 100000,
                        parking: u.parking || 250000,
                        clubhouse: u.clubhouse || 100000,
                        propertyId: selectedPropertyId,
                        towerId: u.towerId || u.parentId,
                        floorNumber: u.floorNumber !== undefined ? Number(u.floorNumber) : undefined,
                        configuration: u.configuration,
                        unitNumber: cleanNum
                    })
                })

                if (mappedUnits.length > 0) {
                    setUnits(mappedUnits)
                    setSelectedUnitId(prev => {
                        const exists = mappedUnits.some(mu => mu.id === prev)
                        return exists ? prev : mappedUnits[0].id
                    })
                }
            })
            .catch(err => {
                console.error("Failed to load inventory for property:", err)
            })
            .finally(() => {
                if (!cancelled) setIsFetchingInventory(false)
            })

        return () => { cancelled = true }
    }, [selectedPropertyId])

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

        setIsAttaching(true)
        const toastId = toast.loading("Saving document log to CRM Lead timeline...")
        try {
            const res = await fetch(`/api/leads/${customer.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    actionType: "Document Generated",
                    actionDesc: `${docTypeName} created: ${detailsSummary}\n\n[DOCUMENT LOG]\n${notesText}`,

                    documents: {
                        ...(customer.documents || {}),
                        milestones,
                        customBookingFields,
                        customDemandLines,
                        customReceiptLines
                    }
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to update lead timeline")
            }

            // Update local customer state with new documents
            const updatedDocs = {
                ...(customer.documents || {}),
                milestones,
                customBookingFields,
                customDemandLines,
                customReceiptLines
            }
            updateCustomer('documents', updatedDocs)

            toast.success(`Attached to ${customer.name}'s CRM Timeline successfully!`, { id: toastId })
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || "Failed to attach document to CRM", { id: toastId })
        } finally {
            setIsAttaching(false)
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

    // Sync document states from selected customer
    useEffect(() => {
        if (selectedCustomer?.documents) {
            if (selectedCustomer.documents.milestones && selectedCustomer.documents.milestones.length > 0) {
                setMilestones(selectedCustomer.documents.milestones);
            }
            if (selectedCustomer.documents.customBookingFields && selectedCustomer.documents.customBookingFields.length > 0) {
                setCustomBookingFields(selectedCustomer.documents.customBookingFields);
            }
            if (selectedCustomer.documents.customDemandLines && selectedCustomer.documents.customDemandLines.length > 0) {
                setCustomDemandLines(selectedCustomer.documents.customDemandLines);
            }
            if (selectedCustomer.documents.customReceiptLines && selectedCustomer.documents.customReceiptLines.length > 0) {
                setCustomReceiptLines(selectedCustomer.documents.customReceiptLines);
            }
        }
    }, [selectedCustomerId, selectedCustomer]);

    const filteredFiles = useMemo(() => {
        return repositoryFiles.filter(file => 
            file.name.toLowerCase().includes(fileSearchQuery.toLowerCase())
        )
    }, [repositoryFiles, fileSearchQuery])

    return (
        <div className="h-full max-h-full flex flex-col lg:flex-row gap-4 lg:gap-6 p-1 sm:p-2 lg:p-1 max-w-[1600px] w-full mx-auto print:p-0 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0">
            {/* Mobile View Mode Switcher (Editor vs Live Preview) */}
            <div className="flex lg:hidden items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 gap-1 print:hidden">
                <button
                    type="button"
                    onClick={() => setMobileDocTab('editor')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        mobileDocTab === 'editor'
                            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                    }`}
                >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Form</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMobileDocTab('preview')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        mobileDocTab === 'preview'
                            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                    }`}
                >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                </button>
            </div>

            {/* Left Control Panel / Editor (Hidden on Print) */}
            <div className={`w-full lg:w-[420px] flex-col gap-4 pr-1 shrink-0 h-full max-h-full print:hidden overflow-y-auto pb-6 ${mobileDocTab === 'editor' ? 'flex' : 'hidden lg:flex'}`}>
                
                {/* Selector Header */}
                <Card className="border-slate-200/90 dark:border-slate-800/90 shadow-2xs shrink-0 rounded-lg overflow-hidden">
                    <CardHeader className="px-3 py-2 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-1 select-none mr-1">
                                    <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                </div>
                                <CardTitle className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Document Studio Pro</CardTitle>
                            </div>
                            {loadingData && <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />}
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2.5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Template</label>
                            <Select value={activeDoc} onValueChange={(val) => setActiveDoc(val as DocType)}>
                                <SelectTrigger className="w-full h-8 text-xs font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
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
                            <div className="flex flex-col space-y-3 mt-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Customer</label>
                                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                        <SelectTrigger className="w-full h-8 text-xs font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.length === 0 ? (
                                                <SelectItem value="empty" disabled>No booked customers found</SelectItem>
                                            ) : (
                                                customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Layers className="h-3 w-3 text-blue-500" /> Inventory Hierarchy
                                        </label>
                                        {isFetchingInventory && (
                                            <span className="flex items-center gap-1 text-[9px] text-blue-600 font-mono">
                                                <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Loading
                                            </span>
                                        )}
                                    </div>

                                    {/* 1. Property / Project */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Building2 className="h-2.5 w-2.5 text-slate-500" /> 1. Property / Project
                                        </label>
                                        <Select 
                                            value={selectedPropertyId} 
                                            onValueChange={(val) => {
                                                setSelectedPropertyId(val)
                                                setSelectedTowerId("all")
                                                setSelectedFloor("all")
                                                setSelectedUnitId("")
                                            }}
                                        >
                                            <SelectTrigger className="w-full h-8 text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                                <SelectValue placeholder="Choose Property..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {propertiesList.length === 0 ? (
                                                    <SelectItem value="empty" disabled>No properties available</SelectItem>
                                                ) : (
                                                    propertiesList.map(p => (
                                                        <SelectItem key={p._id || p.id} value={p._id || p.id} className="text-xs">
                                                            {p.name || p.title || "Untitled Property"}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* 2. Tower / Phase / Block */}
                                    {availableTowers.length > 0 && (
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                                                2. Tower / Phase
                                            </label>
                                            <Select 
                                                value={selectedTowerId} 
                                                onValueChange={(val) => {
                                                    setSelectedTowerId(val)
                                                    setSelectedFloor("all")
                                                    setSelectedUnitId("")
                                                }}
                                                disabled={!selectedPropertyId}
                                            >
                                                <SelectTrigger className="w-full h-8 text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                                    <SelectValue placeholder="All Towers" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all" className="text-xs font-semibold">
                                                        All Towers ({availableTowers.length})
                                                    </SelectItem>
                                                    {availableTowers.map((t: any, idx: number) => {
                                                        const towerVal = String(t.id || t._id || `tower-${idx}`)
                                                        return (
                                                            <SelectItem key={`tower-${towerVal}-${idx}`} value={towerVal} className="text-xs">
                                                                {t.name || `Tower ${t.towerNumber || idx + 1}`}
                                                            </SelectItem>
                                                        )
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* 3. Floor (Optional Hierarchy Filter) */}
                                    {availableFloors.length > 0 && (
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                                                3. Floor Level
                                            </label>
                                            <Select 
                                                value={selectedFloor} 
                                                onValueChange={(val) => {
                                                    setSelectedFloor(val)
                                                    setSelectedUnitId("")
                                                }}
                                                disabled={!selectedPropertyId}
                                            >
                                                <SelectTrigger className="w-full h-8 text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                                    <SelectValue placeholder="All Floors" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all" className="text-xs font-semibold">
                                                        All Floors
                                                    </SelectItem>
                                                    {availableFloors.map(fl => (
                                                        <SelectItem key={fl} value={String(fl)} className="text-xs">
                                                            Floor {fl}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* 4. Unit / Flat Selection */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                            <span>4. Select Unit / Flat</span>
                                            <span className="text-[8px] font-normal text-slate-400">({filteredUnits.length} units available)</span>
                                        </label>
                                        <Select 
                                            value={selectedUnitId} 
                                            onValueChange={setSelectedUnitId}
                                            disabled={filteredUnits.length === 0}
                                        >
                                            <SelectTrigger className="w-full h-8 text-xs font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                                <SelectValue placeholder={filteredUnits.length === 0 ? "No units match filter" : "Choose Unit..."} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredUnits.length === 0 ? (
                                                    <SelectItem value="none" disabled>No units in this selection</SelectItem>
                                                ) : (
                                                    filteredUnits.map((u, idx) => (
                                                        <SelectItem key={`unit-${u.id}-${idx}`} value={u.id} className="text-xs">
                                                            {u.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {activeDoc === "cost-sheet" && (
                    <Card className="border-0 shadow-sm sm:border sm:shadow-md bg-white dark:bg-slate-900 overflow-visible mt-6">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b pb-4 pt-4 sm:pt-6 rounded-t-xl sticky top-0 z-10">
                            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Settings className="h-4 w-4 text-blue-500" /> Cost Sheet Adjustments (Advanced)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            
                            {/* Header Info */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company / Header</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Company Name</label>
                                        <Input className="h-8 text-xs" value={headerInfo.companyName} onChange={e => updateHeader('companyName', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Address</label>
                                        <Input className="h-8 text-xs" value={headerInfo.address} onChange={e => updateHeader('address', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Date</label>
                                        <Input className="h-8 text-xs" value={costSheetSettings.date} onChange={e => setCostSheetSettings(prev => ({ ...prev, date: e.target.value }))} />
                                    </div>
                                </div>
                            </div>
                            
                            <Separator />

                            {/* Customer & Unit Info */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer & Unit Overrides</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Customer PAN</label>
                                        <Input className="h-8 text-xs" value={selectedCustomer.pan || ""} onChange={e => updateCustomer('pan', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Customer Email</label>
                                        <Input className="h-8 text-xs" value={selectedCustomer.email || ""} onChange={e => updateCustomer('email', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Carpet Area (sqft)</label>
                                        <Input className="h-8 text-xs" type="number" value={selectedUnit.area} onChange={e => updateUnit('area', Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Base Rate (₹/sqft)</label>
                                        <Input className="h-8 text-xs" type="number" value={selectedUnit.rate} onChange={e => updateUnit('rate', Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                            
                            <Separator />

                            {/* Table Line Items (Amounts) */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adjust Line Item Amounts</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Floor Rise (₹/sqft)</label>
                                        <Input className="h-8 text-xs" type="number" value={selectedUnit.floorRise} onChange={e => updateUnit('floorRise', Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">PLC (₹)</label>
                                        <Input className="h-8 text-xs" type="number" value={selectedUnit.plc} onChange={e => updateUnit('plc', Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Car Parking (₹)</label>
                                        <Input className="h-8 text-xs" type="number" value={selectedUnit.parking} onChange={e => updateUnit('parking', Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Clubhouse (₹)</label>
                                        <Input className="h-8 text-xs" type="number" value={selectedUnit.clubhouse} onChange={e => updateUnit('clubhouse', Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                            <Separator />

                            {/* Custom Line Items & Discounts */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custom Additions & Discounts</h4>
                                
                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold text-slate-500">Add New Cost Line Item</label>
                                    <div className="flex gap-2">
                                        <Input className="h-8 text-xs flex-1" placeholder="Ex: Corner Premium" value={newCostLabel} onChange={(e) => setNewCostLabel(e.target.value)} />
                                        <Input className="h-8 text-xs w-24" placeholder="₹ Amount" type="number" value={newCostAmount} onChange={(e) => setNewCostAmount(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCost()} />
                                        <Button size="sm" variant="secondary" className="h-8 px-2" onClick={handleAddCost}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                    
                                    {customCosts.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {customCosts.map(cc => (
                                                <div key={cc.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 border rounded">
                                                    <span className="truncate flex-1">{cc.label}</span>
                                                    <span className="font-mono font-medium mx-2 w-24 text-right">₹ {cc.amount.toLocaleString()}</span>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500 hover:bg-red-50" onClick={() => handleRemoveCost(cc.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1 mt-4">
                                    <label className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                                        Special Discount (₹)
                                        <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200">Optional</Badge>
                                    </label>
                                    <Input className="h-8 text-xs" type="number" placeholder="0" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value))} />
                                </div>
                            </div>
                            
                            <Separator />

                            {/* Table Labels */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customize Labels</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex gap-2 items-center">
                                        <div className="w-1/3 text-[11px] text-slate-500 font-semibold truncate">Base Cost</div>
                                        <Input className="h-8 text-xs flex-1" value={costSheetSettings.labels.baseCost} onChange={e => updateCostSheetLabel('baseCost', e.target.value)} />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-1/3 text-[11px] text-slate-500 font-semibold truncate">Floor Rise</div>
                                        <Input className="h-8 text-xs flex-1" value={costSheetSettings.labels.floorRise} onChange={e => updateCostSheetLabel('floorRise', e.target.value)} />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-1/3 text-[11px] text-slate-500 font-semibold truncate">PLC</div>
                                        <Input className="h-8 text-xs flex-1" value={costSheetSettings.labels.plc} onChange={e => updateCostSheetLabel('plc', e.target.value)} />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-1/3 text-[11px] text-slate-500 font-semibold truncate">Parking</div>
                                        <Input className="h-8 text-xs flex-1" value={costSheetSettings.labels.parking} onChange={e => updateCostSheetLabel('parking', e.target.value)} />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-1/3 text-[11px] text-slate-500 font-semibold truncate">Clubhouse</div>
                                        <Input className="h-8 text-xs flex-1" value={costSheetSettings.labels.clubhouse} onChange={e => updateCostSheetLabel('clubhouse', e.target.value)} />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-1/3 text-[11px] text-slate-500 font-semibold truncate">Total Cost</div>
                                        <Input className="h-8 text-xs flex-1" value={costSheetSettings.labels.totalCost} onChange={e => updateCostSheetLabel('totalCost', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            
                            <Separator />

                            {/* Terms and Footer */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Terms & Footer</h4>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Terms & Conditions</label>
                                        <Textarea className="text-xs min-h-[80px]" value={costSheetSettings.terms} onChange={e => setCostSheetSettings(prev => ({ ...prev, terms: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Footer Text</label>
                                        <Input className="h-8 text-xs" value={costSheetSettings.footer} onChange={e => setCostSheetSettings(prev => ({ ...prev, footer: e.target.value }))} />
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                )}

                {/* 2. Payment Plan Editor Card */}
                {activeDoc === "payment-plan" && (
                    <Card className="border-0 shadow-sm sm:border sm:shadow-md bg-white dark:bg-slate-900 overflow-visible mt-6">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b pb-4 pt-4 sm:pt-6 rounded-t-xl sticky top-0 z-10">
                            <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-emerald-500" /> Payment Schedule Milestones
                                </span>
                                <Badge variant={milestoneSum === 100 ? "default" : "destructive"} className="text-[10px]">
                                    Total: {milestoneSum}%
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-5">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block">Pre-set Plan Templates</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleTemplateChange("clp")}>Construction Linked</Button>
                                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleTemplateChange("dp")}>Down Payment</Button>
                                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleTemplateChange("flexi")}>Flexi Plan</Button>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <label className="text-[11px] font-semibold text-slate-500 block">Add Construction Milestone</label>
                                <div className="flex gap-2">
                                    <Input 
                                        className="h-8 text-xs flex-1" 
                                        placeholder="Ex: On 7th Floor Slab" 
                                        value={newStageName} 
                                        onChange={(e) => setNewStageName(e.target.value)} 
                                    />
                                    <Input 
                                        className="h-8 text-xs w-20" 
                                        placeholder="%" 
                                        type="number" 
                                        value={newStagePercent} 
                                        onChange={(e) => setNewStagePercent(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                                    />
                                    <Button size="sm" className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddMilestone}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                {milestones.map((m, idx) => (
                                    <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded border text-xs">
                                        <span className="truncate flex-1 font-medium text-slate-700 dark:text-slate-300">
                                            {idx + 1}. {m.stage}
                                        </span>
                                        <span className="font-mono font-bold text-blue-600 mx-2">{m.percent}%</span>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500 hover:bg-red-50" onClick={() => handleRemoveMilestone(m.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 3. Booking Form Editor Card */}
                {activeDoc === "booking-form" && (
                    <Card className="border-0 shadow-sm sm:border sm:shadow-md bg-white dark:bg-slate-900 overflow-visible mt-6">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b pb-4 pt-4 sm:pt-6 rounded-t-xl sticky top-0 z-10">
                            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <PenTool className="h-4 w-4 text-purple-500" /> Booking Form Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Co-Applicant & Allotment</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Co-Applicant Name</label>
                                        <Input className="h-8 text-xs" value={applicantDetails.coApplicantName} onChange={(e) => setApplicantDetails(prev => ({ ...prev, coApplicantName: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Relation</label>
                                        <Input className="h-8 text-xs" value={applicantDetails.coApplicantRelation} onChange={(e) => setApplicantDetails(prev => ({ ...prev, coApplicantRelation: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-[11px] font-semibold text-slate-500">Parking Space Assigned</label>
                                        <Input className="h-8 text-xs" value={applicantDetails.parkingAssigned} onChange={(e) => setApplicantDetails(prev => ({ ...prev, parkingAssigned: e.target.value }))} />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Token Remittance Details</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Booking Amount (₹)</label>
                                        <Input className="h-8 text-xs" type="number" value={bookingPayment.bookingAmount} onChange={(e) => setBookingPayment(prev => ({ ...prev, bookingAmount: Number(e.target.value) }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-500">Payment Mode</label>
                                        <Input className="h-8 text-xs" value={bookingPayment.paymentMode} onChange={(e) => setBookingPayment(prev => ({ ...prev, paymentMode: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-[11px] font-semibold text-slate-500">Instrument / UTR No</label>
                                        <Input className="h-8 text-xs" value={bookingPayment.instrumentNo} onChange={(e) => setBookingPayment(prev => ({ ...prev, instrumentNo: e.target.value }))} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 4. Money Receipt Editor Card */}
                {activeDoc === "receipt" && (
                    <Card className="border-0 shadow-sm sm:border sm:shadow-md bg-white dark:bg-slate-900 overflow-visible mt-6">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b pb-4 pt-4 sm:pt-6 rounded-t-xl sticky top-0 z-10">
                            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-emerald-500" /> Receipt Voucher Adjustments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-500">Receipt No</label>
                                    <Input className="h-8 text-xs font-mono" value={receiptDetails.receiptNo} onChange={(e) => setReceiptDetails(prev => ({ ...prev, receiptNo: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-500">Receipt Date</label>
                                    <Input className="h-8 text-xs" value={receiptDetails.date} onChange={(e) => setReceiptDetails(prev => ({ ...prev, date: e.target.value }))} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-[11px] font-semibold text-slate-500">Amount Received (₹)</label>
                                    <Input className="h-8 text-xs font-mono font-bold" type="number" value={receiptDetails.receivedAmount} onChange={(e) => setReceiptDetails(prev => ({ ...prev, receivedAmount: Number(e.target.value) }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-500">Payment Mode</label>
                                    <Input className="h-8 text-xs" value={receiptDetails.paymentMode} onChange={(e) => setReceiptDetails(prev => ({ ...prev, paymentMode: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-500">Instrument / UTR</label>
                                    <Input className="h-8 text-xs" value={receiptDetails.instrumentNo} onChange={(e) => setReceiptDetails(prev => ({ ...prev, instrumentNo: e.target.value }))} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-[11px] font-semibold text-slate-500">Signatory Authority Name</label>
                                    <Input className="h-8 text-xs" value={receiptDetails.signatoryName} onChange={(e) => setReceiptDetails(prev => ({ ...prev, signatoryName: e.target.value }))} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 5. Demand Letter Editor Card */}
                {activeDoc === "demand-letter" && (
                    <Card className="border-0 shadow-sm sm:border sm:shadow-md bg-white dark:bg-slate-900 overflow-visible mt-6">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b pb-4 pt-4 sm:pt-6 rounded-t-xl sticky top-0 z-10">
                            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Send className="h-4 w-4 text-blue-500" /> Demand Notice Parameters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-500">Demand Reference No</label>
                                    <Input className="h-8 text-xs font-mono" value={demandDetails.refNo} onChange={(e) => setDemandDetails(prev => ({ ...prev, refNo: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-500">Due Date</label>
                                    <Input className="h-8 text-xs" type="date" value={demandDetails.dueDate} onChange={(e) => setDemandDetails(prev => ({ ...prev, dueDate: e.target.value }))} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-[11px] font-semibold text-slate-500">Milestone Stage Trigger</label>
                                    <Input className="h-8 text-xs font-medium" value={demandDetails.stageTrigger} onChange={(e) => setDemandDetails(prev => ({ ...prev, stageTrigger: e.target.value }))} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-[11px] font-semibold text-slate-500">% Due Against Agreement Value</label>
                                    <Input className="h-8 text-xs font-mono" type="number" value={demandDetails.duePercent} onChange={(e) => setDemandDetails(prev => ({ ...prev, duePercent: Number(e.target.value) }))} />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-[11px] font-semibold text-slate-500">Escrow Bank Account Name</label>
                                    <Input className="h-8 text-xs" value={demandDetails.accName} onChange={(e) => setDemandDetails(prev => ({ ...prev, accName: e.target.value }))} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>

            {/* Right Live Document Preview Container */}
            <div className={`flex-1 bg-slate-100 dark:bg-slate-950/60 rounded-2xl p-2 sm:p-6 overflow-y-auto shadow-inner justify-center items-start print:bg-white print:p-0 print:shadow-none h-full max-h-full border dark:border-slate-900 ${mobileDocTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
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
                    <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-4 sm:p-8 lg:p-12 flex flex-col text-sm relative print:shadow-none print:p-4 print:w-full print:min-h-0 print:bg-transparent">
                        
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

                        <div className="print-content flex-1 flex flex-col h-full relative z-0">
                            
                            {/* Watermark Background */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                                <img 
                                    src="/logo.png" 
                                    alt="Watermark" 
                                    className="w-[95%] max-w-[800px] h-auto object-contain print:block opacity-[0.04] mix-blend-multiply invert grayscale contrast-150" 
                                />
                            </div>

                            {/* Standard Letterhead */}
                            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 bg-slate-900 text-white rounded flex items-center justify-center font-bold tracking-tighter text-xs">
                                            <EditableText defaultText={headerInfo.logoText.slice(0,2)} />
                                        </div>
                                        <EditableText defaultText={headerInfo.companyName} tagName="h1" className="text-xl font-bold uppercase tracking-wider" />
                                    </div>
                                    <EditableText defaultText={headerInfo.address} tagName="p" className="text-[10px] text-slate-500 mt-1" />
                                    <EditableText defaultText={`${headerInfo.phone} | ${headerInfo.email}`} tagName="p" className="text-[10px] text-slate-500" />
                                </div>
                                <div className="text-right">
                                    <h2 className="text-sm font-bold text-slate-400 tracking-widest uppercase">
                                        {activeDoc === "cost-sheet" && <EditableText defaultText={costSheetSettings.labels.title} />}
                                        {activeDoc === "payment-plan" && <EditableText defaultText="Payment Schedule" />}
                                        {activeDoc === "booking-form" && <EditableText defaultText="Allotment App" />}
                                        {activeDoc === "receipt" && <EditableText defaultText="Money Receipt" />}
                                        {activeDoc === "demand-letter" && <EditableText defaultText="Demand Note" />}
                                    </h2>
                                    <p className="text-xs font-semibold text-slate-500 mt-1">RERA: <EditableText defaultText={headerInfo.reraNo} /></p>
                                    <p className="text-[10px] text-slate-400 mt-0.5"><EditableText defaultText="Date:" /> <EditableText defaultText={
                                        activeDoc === "cost-sheet" ? costSheetSettings.date : 
                                        activeDoc === "receipt" ? receiptDetails.date : 
                                        activeDoc === "demand-letter" ? demandDetails.date : 
                                        new Date().toLocaleDateString()
                                    } /></p>
                                </div>
                            </div>

                            {/* Document Content Renders */}
                            {activeDoc === "cost-sheet" && (
                                <div className="flex-1 flex flex-col">
                                    {/* Client & Unit Panel */}
                                    <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div>
                                            <EditableText defaultText={costSheetSettings.labels.customerDetails} tagName="p" className="text-[10px] text-slate-500 uppercase font-semibold" />
                                            <p className="font-bold text-base mt-0.5">{selectedCustomer.name}</p>
                                            <p className="text-xs text-slate-600 mt-0.5">{selectedCustomer.phone} | {selectedCustomer.email}</p>
                                            <p className="text-xs text-slate-500 mt-0.5"><EditableText defaultText="PAN:" /> {selectedCustomer.pan || "N/A"}</p>
                                        </div>
                                        <div className="text-right">
                                            <EditableText defaultText={costSheetSettings.labels.unitDetails} tagName="p" className="text-[10px] text-slate-500 uppercase font-semibold" />
                                            <p className="font-bold text-base mt-0.5">{selectedUnit.name}</p>
                                            <p className="text-xs text-slate-600 mt-0.5">{selectedUnit.area} sq.ft Carpet Area</p>
                                            <p className="text-xs text-slate-500 mt-0.5"><EditableText defaultText={costSheetSettings.labels.baseRate} /> {selectedUnit.rate.toLocaleString()}/sqft</p>
                                        </div>
                                    </div>

                                    {/* Calculations Breakdown */}
                                    <div className="flex-1">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-800 text-white">
                                                <tr>
                                                    <th className="text-left p-2.5 font-semibold"><EditableText defaultText={costSheetSettings.labels.description} /></th>
                                                    <th className="text-right p-2.5 font-semibold"><EditableText defaultText={costSheetSettings.labels.amount} /></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y border-b border-slate-200">
                                                <tr>
                                                    <td className="p-2.5"><EditableText defaultText={costSheetSettings.labels.baseCost} /></td>
                                                    <td className="text-right p-2.5 font-mono">{(costSheetCalculations.baseCost).toLocaleString()}</td>
                                                </tr>
                                                {selectedUnit.floorRise > 0 && (
                                                    <tr>
                                                        <td className="p-2.5"><EditableText defaultText={`${costSheetSettings.labels.floorRise} (₹ ${selectedUnit.floorRise}/sqft)`} /></td>
                                                        <td className="text-right p-2.5 font-mono">{(costSheetCalculations.floorRiseCost).toLocaleString()}</td>
                                                    </tr>
                                                )}
                                                {selectedUnit.plc > 0 && (
                                                    <tr>
                                                        <td className="p-2.5"><EditableText defaultText={costSheetSettings.labels.plc} /></td>
                                                        <td className="text-right p-2.5 font-mono">{(costSheetCalculations.plc).toLocaleString()}</td>
                                                    </tr>
                                                )}
                                                {selectedUnit.parking > 0 && (
                                                    <tr>
                                                        <td className="p-2.5"><EditableText defaultText={costSheetSettings.labels.parking} /></td>
                                                        <td className="text-right p-2.5 font-mono">{(costSheetCalculations.parking).toLocaleString()}</td>
                                                    </tr>
                                                )}
                                                {selectedUnit.clubhouse > 0 && (
                                                    <tr>
                                                        <td className="p-2.5"><EditableText defaultText={costSheetSettings.labels.clubhouse} /></td>
                                                        <td className="text-right p-2.5 font-mono">{(costSheetCalculations.clubhouse).toLocaleString()}</td>
                                                    </tr>
                                                )}
                                                
                                                {/* Custom Costs */}
                                                {customCosts.map(cc => (
                                                    <tr key={cc.id}>
                                                        <td className="p-2.5"><EditableText defaultText={cc.label} /></td>
                                                        <td className="text-right p-2.5 font-mono">{cc.amount.toLocaleString()}</td>
                                                    </tr>
                                                ))}

                                                {discount > 0 && (
                                                    <tr className="bg-green-50 text-green-700 font-semibold">
                                                        <td className="p-2.5"><EditableText defaultText="Less: Special Authorized Discount" /></td>
                                                        <td className="text-right p-2.5 font-mono">- {discount.toLocaleString()}</td>
                                                    </tr>
                                                )}

                                                <tr className="bg-slate-100 font-bold text-slate-900">
                                                    <td className="p-2.5"><EditableText defaultText={costSheetSettings.labels.agreementValue} /></td>
                                                    <td className="text-right p-2.5 font-mono">₹ {costSheetCalculations.agreementValue.toLocaleString()}</td>
                                                </tr>

                                                {/* Tax rows */}
                                                <tr>
                                                    <td className="p-2.5 text-slate-500"><EditableText defaultText={costSheetSettings.labels.gst} /></td>
                                                    <td className="text-right p-2.5 font-mono text-slate-500">{costSheetCalculations.gst.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2.5 text-slate-500"><EditableText defaultText={costSheetSettings.labels.stampDuty} /></td>
                                                    <td className="text-right p-2.5 font-mono text-slate-500">{costSheetCalculations.stampDuty.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2.5 text-slate-500"><EditableText defaultText={costSheetSettings.labels.registration} /></td>
                                                    <td className="text-right p-2.5 font-mono text-slate-500">{costSheetCalculations.registration.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2.5 text-slate-500"><EditableText defaultText={costSheetSettings.labels.legal} /></td>
                                                    <td className="text-right p-2.5 font-mono text-slate-500">{costSheetCalculations.otherCharges.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Final Price Block */}
                                    <div className="bg-slate-900 text-white p-5 rounded-xl mt-6 flex justify-between items-center">
                                        <div>
                                            <EditableText defaultText={costSheetSettings.labels.totalCost} tagName="span" className="text-xs uppercase tracking-wider text-slate-400 font-medium block" />
                                            <EditableText defaultText={costSheetSettings.labels.totalCostDesc} tagName="p" className="text-[10px] text-slate-400 mt-0.5" />
                                        </div>
                                        <span className="text-2xl font-bold font-mono">₹ {costSheetCalculations.total.toLocaleString()}</span>
                                    </div>

                                    {/* Disclaimers */}
                                    <div className="mt-8 text-[10px] text-slate-400 border-t pt-4 space-y-1 whitespace-pre-wrap">
                                        <EditableText defaultText={costSheetSettings.terms} />
                                    </div>
                                </div>
                            )}

                            {activeDoc === "payment-plan" && (
                                <div className="flex-1 flex flex-col">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div>
                                            <EditableText defaultText="Customer" tagName="p" className="text-[10px] text-slate-500 uppercase font-semibold" />
                                            <EditableText defaultText={selectedCustomer.name} tagName="p" className="font-bold text-sm mt-0.5" />
                                            <EditableText defaultText={selectedCustomer.phone} tagName="p" className="text-xs text-slate-600 mt-0.5" />
                                        </div>
                                        <div className="text-right">
                                            <EditableText defaultText="Calculated Against AV" tagName="p" className="text-[10px] text-slate-500 uppercase font-semibold" />
                                            <EditableText defaultText={`₹ ${costSheetCalculations.agreementValue.toLocaleString()}`} tagName="p" className="font-bold text-sm mt-0.5" />
                                            <p className="text-xs text-slate-600 mt-0.5"><EditableText defaultText="Unit:" /> <EditableText defaultText={selectedUnit.name} /></p>
                                        </div>
                                    </div>

                                    {/* Table of Installments */}
                                    <div className="flex-1">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-800 text-white">
                                                <tr>
                                                    <th className="text-left p-2.5 font-semibold"><EditableText defaultText="Milestone / Stage Of Construction" /></th>
                                                    <th className="text-center p-2.5 font-semibold"><EditableText defaultText="% Due" /></th>
                                                    <th className="text-right p-2.5 font-semibold"><EditableText defaultText="Milestone Amount (₹)" /></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y border-b border-slate-200">
                                                {milestones.map((m, idx) => {
                                                    const amt = Math.round(costSheetCalculations.agreementValue * (m.percent / 100))
                                                    return (
                                                        <tr key={m.id} className="group">
                                                            <td className="p-2.5 font-medium relative">
                                                                <button onClick={() => handleRemoveMilestone(m.id)} className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 print:hidden transition-opacity bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm border border-red-100">
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                                {idx + 1}. <EditableText defaultText={m.stage} />
                                                            </td>
                                                            <td className="text-center p-2.5 font-mono"><EditableText defaultText={`${m.percent}%`} /></td>
                                                            <td className="text-right p-2.5 font-mono">₹ <EditableText defaultText={amt.toLocaleString()} /></td>
                                                        </tr>
                                                    )
                                                })}
                                                <tr className="print:hidden border-t-2 border-dashed border-slate-200 hover:bg-slate-50 transition-colors">
                                                    <td className="p-2">
                                                        <Input placeholder="New Milestone Stage..." className="h-7 text-xs border-slate-300 w-full" value={newStageName} onChange={e => setNewStageName(e.target.value)} />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <Input placeholder="%" type="number" className="h-7 text-xs border-slate-300 w-16 mx-auto text-center" value={newStagePercent} onChange={e => setNewStagePercent(e.target.value)} />
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" onClick={handleAddMilestone} disabled={!newStageName || !newStagePercent}>
                                                            <Plus className="h-3 w-3 mr-1" /> Add
                                                        </Button>
                                                    </td>
                                                </tr>
                                                <tr className="font-bold bg-slate-50 text-slate-900">
                                                    <td className="p-2.5 text-right"><EditableText defaultText="TOTAL" /></td>
                                                    <td className="text-center p-2.5 font-mono"><EditableText defaultText={`${milestoneSum}%`} /></td>
                                                    <td className="text-right p-2.5 font-mono">₹ <EditableText defaultText={costSheetCalculations.agreementValue.toLocaleString()} /></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Instructions */}
                                    <div className="mt-8 text-[11px] text-slate-500 border-t pt-4 space-y-2 bg-slate-50 p-3 rounded border">
                                        <EditableText defaultText="Payment Guidelines & Guidelines:" tagName="p" className="font-bold text-slate-700" />
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li><EditableText defaultText="Dues must be cleared within 15 days of demand letter dispatch." /></li>
                                            <li><EditableText defaultText="Payments to be made electronically or via cheque in favor of:" /> <strong>"{headerInfo.companyName}"</strong>.</li>
                                            <li><EditableText defaultText="GST is additional and will be levied at the actual rate on each slab invoice date." /></li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeDoc === "booking-form" && (
                                <div className="flex-1 flex flex-col space-y-5">
                                    {/* Title details */}
                                    <div className="border-b border-slate-200 pb-2">
                                        <EditableText defaultText="1. Applicant Details" tagName="h3" className="font-bold text-sm bg-slate-100 p-2 text-slate-800 tracking-wide uppercase" />
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-2 text-xs">
                                            <div><span className="text-slate-400"><EditableText defaultText="Primary Applicant:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={selectedCustomer.name} /></strong></div>
                                            <div><span className="text-slate-400"><EditableText defaultText="Co-Applicant:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={applicantDetails.coApplicantName || "N/A"} /></strong></div>
                                            <div><span className="text-slate-400"><EditableText defaultText="Primary PAN No:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={selectedCustomer.pan || "N/A"} /></strong></div>
                                            <div><span className="text-slate-400"><EditableText defaultText="Co-App relation:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={applicantDetails.coApplicantRelation || "N/A"} /></strong></div>
                                            <div><span className="text-slate-400"><EditableText defaultText="Mobile No:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={selectedCustomer.phone} /></strong></div>
                                            <div><span className="text-slate-400"><EditableText defaultText="Email Address:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={selectedCustomer.email} /></strong></div>
                                            <div className="col-span-2"><span className="text-slate-400"><EditableText defaultText="Contact Address:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={selectedCustomer.address || "N/A"} /></strong></div>
                                            {customBookingFields.map(field => (
                                                <div key={field.id} className="group relative col-span-2 md:col-span-1">
                                                    <button onClick={() => handleRemoveBookingField(field.id)} className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 print:hidden transition-opacity bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm border border-red-100">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                    <span className="text-slate-400"><EditableText defaultText={field.label} />:</span> <strong className="ml-1 text-slate-800"><EditableText defaultText={field.value} /></strong>
                                                </div>
                                            ))}
                                            <div className="col-span-2 print:hidden mt-2 pt-2 border-t border-dashed border-slate-200 flex flex-wrap items-center gap-2">
                                                <Input placeholder="Field Label..." className="h-7 text-xs border-slate-300 w-40" value={newBookingLabel} onChange={e => setNewBookingLabel(e.target.value)} />
                                                <Input placeholder="Field Value..." className="h-7 text-xs border-slate-300 flex-1 min-w-[200px]" value={newBookingValue} onChange={e => setNewBookingValue(e.target.value)} />
                                                <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" onClick={handleAddBookingField} disabled={!newBookingLabel || !newBookingValue}>
                                                    <Plus className="h-3 w-3 mr-1" /> Add Field
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <EditableText defaultText="2. Apartment Details" tagName="h3" className="font-bold text-sm bg-slate-100 p-2 text-slate-800 tracking-wide uppercase" />
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-2 text-xs">
                                            <div><span className="text-slate-400"><EditableText defaultText="Unit Identification:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={selectedUnit.name} /></strong></div>
                                            <div><span className="text-slate-400"><EditableText defaultText="Carpet Area:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={`${selectedUnit.area} Sq.Ft`} /></strong></div>
                                            <div><span className="text-slate-400"><EditableText defaultText="Agreement Value:" /></span> <strong className="ml-1 text-slate-800">₹ <EditableText defaultText={costSheetCalculations.agreementValue.toLocaleString()} /></strong></div>
                                            <div><span className="text-slate-400"><EditableText defaultText="Parking Space:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={applicantDetails.parkingAssigned} /></strong></div>
                                        </div>
                                    </div>

                                    <div>
                                        <EditableText defaultText="3. Token Remittance details" tagName="h3" className="font-bold text-sm bg-slate-100 p-2 text-slate-800 tracking-wide uppercase" />
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-2 text-xs">
                                            <div><span className="text-slate-400"><EditableText defaultText="Booking Amount Paid:" /></span> <strong className="ml-1 text-slate-800">₹ <EditableText defaultText={bookingPayment.bookingAmount.toLocaleString()} /></strong></div>
                                            <div><span className="text-slate-400"><EditableText defaultText="Payment mode:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={bookingPayment.paymentMode} /></strong></div>
                                            <div><span className="text-slate-400"><EditableText defaultText="Ref/UTR/Instrument No:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={bookingPayment.instrumentNo} /></strong></div>
                                            <div><span className="text-slate-400"><EditableText defaultText="Bank & Branch:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={`${bookingPayment.bankName} - ${bookingPayment.branch}`} /></strong></div>
                                            <div><span className="text-slate-400"><EditableText defaultText="Remittance Date:" /></span> <strong className="ml-1 text-slate-800"><EditableText defaultText={new Date(bookingPayment.date).toLocaleDateString()} /></strong></div>
                                        </div>
                                    </div>

                                    {/* Declaration Text Block */}
                                    <div className="pt-2">
                                        <EditableText defaultText="Declaration Note:" tagName="h3" className="font-bold text-xs text-slate-700 uppercase" />
                                        <p className="text-[10px] text-slate-500 leading-relaxed text-justify mt-1">
                                            <EditableText defaultText={applicantDetails.declarations} />
                                        </p>
                                    </div>

                                    {/* Signatures */}
                                    <div className="pt-12 flex justify-between px-6 text-xs">
                                        <div className="text-center">
                                            <div className="border-b border-slate-400 w-44 mb-1.5 h-6"></div>
                                            <EditableText defaultText="Primary Applicant Signature" tagName="p" className="font-semibold text-slate-600" />
                                        </div>
                                        <div className="text-center">
                                            <div className="border-b border-slate-400 w-44 mb-1.5 h-6"></div>
                                            <EditableText defaultText="Co-Applicant Signature" tagName="p" className="font-semibold text-slate-600" />
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
                                        <EditableText defaultText="Official Money Receipt" tagName="h3" className="text-xl font-bold font-serif text-slate-800 uppercase tracking-widest border-b pb-1.5" />
                                    </div>

                                    <div className="flex justify-between text-xs mb-8">
                                        <div><EditableText defaultText="Receipt No:" /> <span className="font-bold font-mono text-slate-800"><EditableText defaultText={receiptDetails.receiptNo} /></span></div>
                                        <div><EditableText defaultText="Date:" /> <span className="font-bold font-mono text-slate-800"><EditableText defaultText={new Date(receiptDetails.date).toLocaleDateString()} /></span></div>
                                    </div>

                                    {/* Receipt Statement details */}
                                    <div className="space-y-6 text-sm font-serif leading-loose text-slate-700 flex-1">
                                        <p>
                                            <EditableText defaultText="Received with thanks from Mr./Mrs./Ms." /> <span className="font-bold border-b border-slate-400 px-3 py-0.5 inline-block min-w-[200px] text-slate-900 font-sans"><EditableText defaultText={selectedCustomer.name} /></span>
                                        </p>
                                        <p>
                                            <EditableText defaultText="A sum of Rupees" /> <span className="font-bold border-b border-slate-400 px-3 py-0.5 inline-block min-w-[180px] text-slate-900 font-sans">₹ <EditableText defaultText={`${receiptDetails.receivedAmount.toLocaleString()}/-`} /></span>
                                        </p>
                                        <p>
                                            <EditableText defaultText="Via payment mode" /> <span className="font-bold border-b border-slate-400 px-3 py-0.5 inline-block text-slate-900 font-sans"><EditableText defaultText={receiptDetails.paymentMode} /></span> <EditableText defaultText="Reference No:" /> <span className="font-bold border-b border-slate-400 px-3 py-0.5 inline-block text-slate-900 font-sans"><EditableText defaultText={receiptDetails.instrumentNo} /></span>
                                        </p>
                                        <p>
                                            <EditableText defaultText="Drawn on bank" /> <span className="font-bold border-b border-slate-400 px-3 py-0.5 inline-block min-w-[150px] text-slate-900 font-sans"><EditableText defaultText={receiptDetails.bankName || "N/A"} /></span>
                                        </p>
                                        <p>
                                            <EditableText defaultText="Towards booking/allotment of Flat" /> <span className="font-bold border-b border-slate-400 px-3 py-0.5 inline-block text-slate-900 font-sans"><EditableText defaultText={selectedUnit.name} /></span>
                                        </p>
                                        {customReceiptLines.map(line => (
                                            <div key={line.id} className="group relative">
                                                <button onClick={() => handleRemoveReceiptLine(line.id)} className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 print:hidden transition-opacity bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm border border-red-100 z-10">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                                <p><EditableText defaultText={line.text} /></p>
                                            </div>
                                        ))}
                                        <div className="print:hidden mt-4 pt-2 border-t border-dashed border-slate-200 flex items-center gap-2 font-sans">
                                            <Input placeholder="Additional receipt note/line..." className="h-7 text-xs border-slate-300 flex-1 font-sans" value={newReceiptLine} onChange={e => setNewReceiptLine(e.target.value)} />
                                            <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 font-sans" onClick={handleAddReceiptLine} disabled={!newReceiptLine}>
                                                <Plus className="h-3 w-3 mr-1" /> Add Note
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Signatory footer */}
                                    <div className="mt-12 flex justify-between items-end border-t border-slate-100 pt-6">
                                        <div className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                                            <EditableText defaultText="* Receipt is valid subject to realization of cheque / online fund transfer clearance." /><br />
                                            <EditableText defaultText="* This is a computerized RERA-compliant receipt." />
                                        </div>
                                        <div className="text-center mr-4">
                                            <div className="h-10 w-36 mb-1 border border-dashed border-slate-200 rounded flex items-center justify-center text-[10px] text-slate-300 italic select-none">
                                                [Sign Document]
                                            </div>
                                            <EditableText defaultText={receiptDetails.signatoryName} tagName="p" className="font-bold text-xs text-slate-800" />
                                            <EditableText defaultText={receiptDetails.signatoryTitle} tagName="p" className="text-[10px] text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeDoc === "demand-letter" && (
                                <div className="flex-1 flex flex-col text-xs leading-relaxed">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <EditableText defaultText="To," tagName="p" className="font-semibold" />
                                            <EditableText defaultText={selectedCustomer.name} tagName="p" className="font-bold text-sm text-slate-800" />
                                            <p className="text-slate-500"><EditableText defaultText="Contact:" /> <EditableText defaultText={selectedCustomer.phone} /></p>
                                            <p className="text-slate-500"><EditableText defaultText="Address:" /> <EditableText defaultText={selectedCustomer.address || "N/A"} /></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-bold"><EditableText defaultText="Ref No:" /> <EditableText defaultText={demandDetails.refNo} /></p>
                                            <p><EditableText defaultText="Date:" /> <EditableText defaultText={new Date(demandDetails.date).toLocaleDateString()} /></p>
                                        </div>
                                    </div>

                                    <div className="bg-red-50 text-red-900 font-bold p-2.5 rounded border border-red-200 uppercase tracking-wide mb-5 text-center">
                                        <EditableText defaultText="Payment Demand Note:" /> <EditableText defaultText={demandDetails.stageTrigger} />
                                    </div>

                                    <EditableText defaultText="Dear Sir/Madam," tagName="p" className="mb-4" />
                                    <p className="mb-4 leading-loose">
                                        <EditableText defaultText="We are pleased to share that construction is moving rapidly at the site. The milestone stage" /> <strong className="mx-1">"<EditableText defaultText={demandDetails.stageTrigger} />"</strong> <EditableText defaultText="for your unit" /> <strong className="mx-1"><EditableText defaultText={selectedUnit.name} /></strong> <EditableText defaultText="has been achieved. As per the linked payment plan terms, the current installment demand is now due for remittance:" />
                                    </p>

                                    {/* Calculations detail */}
                                    <table className="w-full text-xs mb-6 border-collapse border border-slate-200">
                                        <thead className="bg-slate-100 text-slate-800">
                                            <tr>
                                                <th className="border border-slate-200 p-2.5 text-left font-semibold"><EditableText defaultText="Description" /></th>
                                                <th className="border border-slate-200 p-2.5 text-right font-semibold"><EditableText defaultText="Amount (₹)" /></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y border-b">
                                            <tr>
                                                <td className="border border-slate-200 p-2.5">
                                                    <EditableText defaultText={`Stage Demand Installment (${demandDetails.duePercent}% of AV: ₹ ${costSheetCalculations.agreementValue.toLocaleString()})`} />
                                                </td>
                                                <td className="border border-slate-200 p-2.5 text-right font-mono">
                                                    <EditableText defaultText={Math.round(costSheetCalculations.agreementValue * (demandDetails.duePercent / 100)).toLocaleString()} />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="border border-slate-200 p-2.5 text-slate-500"><EditableText defaultText="GST on installment amount (5% actuals)" /></td>
                                                <td className="border border-slate-200 p-2.5 text-right font-mono text-slate-500">
                                                    <EditableText defaultText={Math.round(costSheetCalculations.agreementValue * (demandDetails.duePercent / 100) * 0.05).toLocaleString()} />
                                                </td>
                                            </tr>
                                            {customDemandLines.map(line => (
                                                <tr key={line.id} className="group relative">
                                                    <td className="border border-slate-200 p-2.5">
                                                        <button onClick={() => handleRemoveDemandLine(line.id)} className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 print:hidden transition-opacity bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm border border-red-100">
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                        <EditableText defaultText={line.desc} />
                                                    </td>
                                                    <td className="border border-slate-200 p-2.5 text-right font-mono">
                                                        <EditableText defaultText={line.amount.toLocaleString()} />
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="print:hidden border-t-2 border-dashed border-slate-200 hover:bg-slate-50 transition-colors">
                                                <td className="border border-slate-200 p-2">
                                                    <Input placeholder="Extra Description..." className="h-7 text-xs border-slate-300 w-full" value={newDemandDesc} onChange={e => setNewDemandDesc(e.target.value)} />
                                                </td>
                                                <td className="border border-slate-200 p-2">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <Input placeholder="Amount" type="number" className="h-7 text-xs border-slate-300 w-24 text-right" value={newDemandAmount} onChange={e => setNewDemandAmount(e.target.value)} />
                                                        <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" onClick={handleAddDemandLine} disabled={!newDemandDesc || !newDemandAmount}>
                                                            <Plus className="h-3 w-3 mr-1" /> Add
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="font-bold bg-slate-50">
                                                <td className="border border-slate-200 p-2.5 text-slate-900"><EditableText defaultText="Total Net Amount Payable" /></td>
                                                <td className="border border-slate-200 p-2.5 text-right font-mono text-slate-900 text-sm">
                                                    ₹ <EditableText defaultText={(Math.round(costSheetCalculations.agreementValue * (demandDetails.duePercent / 100) * 1.05) + customDemandLines.reduce((acc, cur) => acc + cur.amount, 0)).toLocaleString()} />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {/* Due Warning Banner */}
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 font-semibold mb-6 flex justify-between items-center">
                                        <span><EditableText defaultText="DUE DATE FOR REMITTANCE:" /></span>
                                        <span className="font-mono text-sm underline"><EditableText defaultText={new Date(demandDetails.dueDate).toLocaleDateString()} /></span>
                                    </div>

                                    {/* Banking details & QR code */}
                                    <div className="grid grid-cols-3 gap-4 border-t pt-4">
                                        <div className="col-span-2">
                                            <EditableText defaultText="Escrow Bank Details:" tagName="h4" className="font-bold text-slate-700 uppercase mb-1" />
                                            <p className="font-mono text-[11px] leading-relaxed">
                                                <EditableText defaultText="Beneficiary:" /> <EditableText defaultText={demandDetails.accName} /><br />
                                                <EditableText defaultText="Account No:" /> <EditableText defaultText={demandDetails.accNo} /><br />
                                                <EditableText defaultText="IFSC Code:" /> <EditableText defaultText={demandDetails.ifscCode} /><br />
                                                <EditableText defaultText="Bank Name:" /> <EditableText defaultText={demandDetails.bankName} />
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center border p-2 rounded bg-slate-50">
                                            <div className="w-16 h-16 bg-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold border-2 border-slate-300">
                                                <EditableText defaultText="QR Code" />
                                            </div>
                                            <EditableText defaultText="Scan to Pay via UPI" tagName="p" className="text-[9px] mt-1 font-semibold text-slate-500" />
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Document Footer (Print Details) */}
                        <div className="mt-12 text-center text-[9px] text-slate-400 border-t pt-2 w-full flex justify-between items-center print:mt-6">
                            <span><EditableText defaultText={activeDoc === 'cost-sheet' ? costSheetSettings.footer : `Generated by ${headerInfo.companyName} Document Center`} /></span>
                            <span><EditableText defaultText="Page 1 of 1" /></span>
                        </div>
                    </div>
                )}
            </div>
            {/* Float Action Toolbar Buttons (Print Hidden) */}
            {activeDoc !== "repository" && (
                <div className="fixed bottom-4 right-6 flex items-center gap-1.5 z-50 print:hidden p-1 rounded-lg bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 shadow-2xl font-mono">
                    {(activeDoc === "booking-form" || activeDoc === "receipt") && (
                        <Button size="sm" className="rounded-md h-7 px-2.5 shadow-2xs bg-rose-600 hover:bg-rose-700 gap-1.5 text-white font-mono font-bold text-[11px]" onClick={handleMarkAsBooked}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Book Unit
                        </Button>
                    )}
                    <Button size="sm" className="rounded-md h-7 px-2.5 shadow-2xs bg-amber-600 hover:bg-amber-700 gap-1.5 text-white font-mono font-bold text-[11px] disabled:opacity-70" onClick={handleAttachToCRM} disabled={isAttaching}>
                        {isAttaching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileCheck className="h-3.5 w-3.5" />} 
                        {isAttaching ? "Attaching..." : "Attach CRM"}
                    </Button>
                    <Button size="sm" className="rounded-md h-7 px-2.5 shadow-2xs bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-white font-mono font-bold text-[11px]" onClick={handleShare}>
                        <Share2 className="h-3.5 w-3.5" /> Share
                    </Button>
                    <Button size="sm" className="rounded-md h-7 px-3 shadow-2xs bg-blue-600 hover:bg-blue-700 gap-1.5 text-white font-mono font-bold text-[11px]" onClick={handlePrint}>
                        <Printer className="h-3.5 w-3.5" /> <span>Print / PDF</span><span className="software-kbd hidden sm:inline ml-1 text-[9px] text-white/90 bg-white/20 border-white/30">Ctrl+P</span>
                    </Button>
                </div>
            )}
        </div>
    )
}
