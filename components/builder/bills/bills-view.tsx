"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  Receipt,
  FileText,
  IndianRupee,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Printer,
  Eye,
  RefreshCw,
  Search,
  ArrowUpRight,
  ShieldCheck,
  X,
  CreditCard,
  UploadCloud,
  ExternalLink,
  Paperclip,
  Loader2,
  FileCheck
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export interface BillItem {
  id: string
  dbId: string
  isMember: boolean
  memberIndex?: number
  leadId: string
  leadName: string
  phone?: string
  email?: string
  property: string
  unitNo: string
  builderName: string
  dealValue: number
  brokeragePercent: number
  gstPercent: number
  taxableAmount: number
  cgst: number
  sgst: number
  totalAmount: number
  status: "Billed" | "Received" | "Unbilled" | "Payment Submitted"
  invoiceNo: string | null
  invoiceDate: string
  bankDetails: {
    bankName: string
    accountName: string
    accountNo: string
    ifscCode: string
  }
  invoiceDetails?: any
  paymentProof?: {
    utrNumber: string
    paymentMode: string
    paidAmount: number
    paymentDate: string
    receiptUrl?: string
    receiptFileName?: string
    notes?: string
    submittedAt?: string
    submittedBy?: string
  } | null
  rawLead?: any
}

export function BillsView() {
  const [bills, setBills] = useState<BillItem[]>([])
  const [stats, setStats] = useState<any>({
    totalBilled: 0,
    totalReceived: 0,
    totalPending: 0,
    totalCount: 0,
    billedCount: 0,
    submittedCount: 0,
    receivedCount: 0,
    unbilledCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "BILLED" | "SUBMITTED" | "RECEIVED">("ALL")
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  // Payment Proof Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showProofModal, setShowProofModal] = useState(false)
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<BillItem | null>(null)
  const [selectedBillForProof, setSelectedBillForProof] = useState<BillItem | null>(null)
  const [isSubmittingProof, setIsSubmittingProof] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [paymentForm, setPaymentForm] = useState({
    utrNumber: "",
    paymentMode: "NEFT",
    paidAmount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    receiptUrl: "",
    receiptFileName: "",
    notes: ""
  })

  const fetchBills = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/bills")
      if (!res.ok) throw new Error("Failed to fetch bills")
      const data = await res.json()
      setBills(data.bills || [])
      if (data.stats) setStats(data.stats)
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load bills data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBills()
  }, [])

  // Desktop keyboard accelerator: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0)
  }

  const filteredBills = useMemo(() => {
    return bills.filter((item) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (item.invoiceNo || "").toLowerCase().includes(q) ||
        (item.leadName || "").toLowerCase().includes(q) ||
        (item.property || "").toLowerCase().includes(q) ||
        (item.unitNo || "").toLowerCase().includes(q) ||
        (item.paymentProof?.utrNumber || "").toLowerCase().includes(q)

      let matchesFilter = true
      if (filterStatus === "BILLED") {
        matchesFilter = item.status === "Billed"
      } else if (filterStatus === "SUBMITTED") {
        matchesFilter = item.status === "Payment Submitted"
      } else if (filterStatus === "RECEIVED") {
        matchesFilter = item.status === "Received"
      }

      return matchesSearch && matchesFilter
    })
  }, [bills, searchTerm, filterStatus])

  const handleOpenPaymentModal = (bill: BillItem) => {
    setSelectedBillForPayment(bill)
    setPaymentForm({
      utrNumber: bill.paymentProof?.utrNumber || "",
      paymentMode: bill.paymentProof?.paymentMode || "NEFT",
      paidAmount: bill.paymentProof?.paidAmount || bill.totalAmount || 0,
      paymentDate: bill.paymentProof?.paymentDate || new Date().toISOString().split("T")[0],
      receiptUrl: bill.paymentProof?.receiptUrl || "",
      receiptFileName: bill.paymentProof?.receiptFileName || "",
      notes: bill.paymentProof?.notes || ""
    })
    setShowPaymentModal(true)
  }

  const handleOpenProofModal = (bill: BillItem) => {
    setSelectedBillForProof(bill)
    setShowProofModal(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 25MB.")
      return
    }

    setIsUploadingFile(true)
    const toastId = toast.loading("Uploading payment receipt...")
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload?public=true", {
        method: "POST",
        body: formData
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Receipt upload failed")
      }

      const data = await res.json()
      setPaymentForm(prev => ({
        ...prev,
        receiptUrl: data.url,
        receiptFileName: file.name
      }))
      toast.success("Payment receipt uploaded successfully!", { id: toastId })
    } catch (err: any) {
      console.error("Upload error:", err)
      toast.error(err.message || "Failed to upload file", { id: toastId })
    } finally {
      setIsUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBillForPayment) return

    if (!paymentForm.utrNumber.trim()) {
      toast.error("Please enter the UTR / Transaction Reference Number")
      return
    }

    if (!paymentForm.receiptUrl) {
      toast.error("Please attach the transaction receipt or screenshot")
      return
    }

    setIsSubmittingProof(true)
    const toastId = toast.loading("Submitting payment proof to Admin...")
    try {
      const res = await fetch("/api/bills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dbId: selectedBillForPayment.dbId,
          isMember: selectedBillForPayment.isMember,
          memberIndex: selectedBillForPayment.memberIndex,
          paymentProof: {
            utrNumber: paymentForm.utrNumber.trim(),
            paymentMode: paymentForm.paymentMode,
            paidAmount: Number(paymentForm.paidAmount) || selectedBillForPayment.totalAmount,
            paymentDate: paymentForm.paymentDate,
            receiptUrl: paymentForm.receiptUrl,
            receiptFileName: paymentForm.receiptFileName,
            notes: paymentForm.notes.trim()
          }
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to submit payment proof")
      }

      toast.success("Payment proof submitted! Astronix Admin will verify and mark received.", { id: toastId })
      setShowPaymentModal(false)
      setSelectedBillForPayment(null)
      fetchBills()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error submitting payment proof", { id: toastId })
    } finally {
      setIsSubmittingProof(false)
    }
  }

  const handleOpenInvoice = (bill: BillItem) => {
    setSelectedBill(bill)
    setShowInvoiceModal(true)
  }

  const handlePrintInvoice = () => {
    const printContent = document.getElementById("printable-builder-invoice")
    if (!printContent) {
      toast.error("Invoice content not found")
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Please allow popups to print the invoice.")
      return
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((style) => style.outerHTML)
      .join("\n")

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${selectedBill?.invoiceNo || "Astronix-Invoice"}</title>
          ${styles}
          <style>
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              background-color: white !important;
              padding: 20px;
              font-family: system-ui, -apple-system, sans-serif;
            }
            @page { size: auto; margin: 10mm; }
            #printable-builder-invoice {
              box-shadow: none !important;
              border: none !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
    ]
    const idx = (name || "A").charCodeAt(0) % colors.length
    return colors[idx]
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Desktop Ledger OS Window Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-4 py-3 bg-slate-900 dark:bg-slate-950 text-white rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm tracking-tight text-white">Astronix Ledger OS</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">Enterprise Billing Engine</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Official brokerage tax accounting, invoices, and clearance proofs issued by Astronix Realty Admin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={fetchBills}
            variant="outline"
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 font-mono text-xs font-bold h-7 px-3 rounded-md transition-all shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Sync Ledger
          </Button>
        </div>
      </div>

      {/* ─── Desktop Metric Tiles Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Total Invoiced</span>
            <FileText className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
            {formatCurrency(stats.totalBilled)}
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            {stats.billedCount + stats.receivedCount} bills issued
          </p>
        </div>

        <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-lg border border-amber-200/80 dark:border-amber-900/40 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Payment Due</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-mono font-bold text-amber-700 dark:text-amber-300">
            {formatCurrency(stats.totalPending)}
          </div>
          <p className="text-[10px] font-mono text-amber-600/80 dark:text-amber-400/80 mt-0.5">
            {stats.billedCount} pending settlement
          </p>
        </div>

        <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Settled / Paid</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(stats.totalReceived)}
          </div>
          <p className="text-[10px] font-mono text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
            {stats.receivedCount} marked received
          </p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Total Bills</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
            {stats.totalCount}
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            Audited ledger records
          </p>
        </div>
      </div>

      {/* ─── Controls: Search and Filter Tabs ─── */}
      <div className="bg-slate-50/70 dark:bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto">
          {[
            { id: "ALL", label: "All Bills", count: stats.totalCount },
            { id: "BILLED", label: "Payment Due", count: stats.billedCount },
            { id: "SUBMITTED", label: "Verification Pending", count: stats.submittedCount || bills.filter(b => b.status === "Payment Submitted").length },
            { id: "RECEIVED", label: "Settled / Paid", count: stats.receivedCount }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterStatus === tab.id
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px] md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by invoice, client, or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 h-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <span className="software-kbd absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none hidden sm:inline-block">/</span>
        </div>
      </div>

      {/* ─── Bills Listing Table / Cards ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-semibold">Loading bills and invoices...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              No bills found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {searchTerm
                ? "No bills matched your search criteria. Try a different query."
                : "When Admin generates brokerage bills for your booked clients, they will appear here with full invoice breakdown and print options."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  <th className="py-2 px-3">Invoice & Date</th>
                  <th className="py-2 px-3">Booked Client</th>
                  <th className="py-2 px-3">Property & Unit</th>
                  <th className="py-2 px-3 text-right">Deal Value</th>
                  <th className="py-2 px-3 text-right">Brokerage Fee</th>
                  <th className="py-2 px-3 text-right">Total Bill (inc. GST)</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredBills.map((bill) => {
                  const isUnbilled = bill.status === "Unbilled"
                  const isReceived = bill.status === "Received"
                  const isSubmitted = bill.status === "Payment Submitted"

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group text-[11.5px]"
                    >
                      {/* Invoice & Date */}
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          {bill.invoiceNo ? (
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              {bill.invoiceNo}
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-400 italic">
                              Pending Admin Issue
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {bill.invoiceDate ? new Date(bill.invoiceDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            }) : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Booked Client */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${getAvatarColor(
                              bill.leadName
                            )}`}
                          >
                            {bill.leadName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {bill.leadName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {bill.phone || bill.email || "Direct Booking"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Property & Unit */}
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {bill.property}
                          </span>
                          {bill.unitNo && bill.unitNo !== "TBD" && (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                              Unit: {bill.unitNo}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Deal Value */}
                      <td className="py-4 px-5 text-right font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(bill.dealValue)}
                      </td>

                      {/* Brokerage Fee */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(bill.taxableAmount)}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            @{bill.brokeragePercent}%
                          </span>
                        </div>
                      </td>

                      {/* Total Bill */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                            {formatCurrency(bill.totalAmount)}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            incl. {bill.gstPercent}% GST
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 text-center">
                        {isReceived ? (
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-2.5 py-0.5">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Settled / Paid
                          </Badge>
                        ) : isSubmitted ? (
                          <Badge className="bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-bold px-2.5 py-0.5 shadow-sm">
                            <Clock className="w-3 h-3 mr-1 text-amber-600 animate-pulse" /> Verification Pending
                          </Badge>
                        ) : isUnbilled ? (
                          <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold px-2.5 py-0.5">
                            <Clock className="w-3 h-3 mr-1" /> Awaiting Bill
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[10px] font-bold px-2.5 py-0.5">
                            <AlertCircle className="w-3 h-3 mr-1" /> Payment Due
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {bill.status === "Billed" && (
                            <Button
                              onClick={() => handleOpenPaymentModal(bill)}
                              size="sm"
                              className="h-8 px-3 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all shadow-emerald-600/20"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay / Attach Receipt
                            </Button>
                          )}

                          {bill.status === "Payment Submitted" && (
                            <Button
                              onClick={() => handleOpenProofModal(bill)}
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 flex items-center gap-1.5"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                              Proof Submitted
                            </Button>
                          )}

                          {bill.status === "Received" && bill.paymentProof && (
                            <Button
                              onClick={() => handleOpenProofModal(bill)}
                              variant="ghost"
                              size="sm"
                              title="View Transaction Receipt"
                              className="h-8 px-2.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                              Receipt
                            </Button>
                          )}

                          <Button
                            onClick={() => handleOpenInvoice(bill)}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 rounded-lg text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 text-slate-700 dark:text-slate-300"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View Bill
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Tax Invoice Modal Preview (A4 Authentic Layout) ─── */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ Tax Invoice
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Official brokerage invoice issued for {selectedBill?.leadName} ({selectedBill?.property})
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrintInvoice}
                size="sm"
                className="bg-slate-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold h-9 px-4 rounded-xl shadow-sm"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print / Download PDF
              </Button>
            </div>
          </div>

          {/* Invoice Body Container */}
          <div className="p-6 flex justify-center items-start">
            {selectedBill && (
              <div
                id="printable-builder-invoice"
                className="bg-white text-slate-900 shadow-xl w-full max-w-[720px] aspect-[1/1.414] p-8 md:p-10 text-xs font-sans ring-1 ring-slate-200 rounded-sm"
              >
                {/* Header / Letterhead */}
                <div className="border-b-4 border-indigo-700 pb-5 mb-6 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-md overflow-hidden shadow-sm border border-slate-200 bg-black flex items-center justify-center p-1">
                      <img
                        src="/astronix-logo.png"
                        alt="Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                        ASTRONIX REALTY
                      </h2>
                      <p className="text-[9px] text-slate-500 tracking-[0.2em] uppercase font-bold mt-1">
                        Premium Real Estate Consultants & Mandate Partner
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-600 space-y-0.5">
                    <p className="font-medium">123 Business Avenue, Sector 62</p>
                    <p className="font-medium">Gurugram, Haryana 122018</p>
                    <p>contact@astronixrealty.com | +91 98765 43210</p>
                    <p className="font-bold text-slate-900 pt-0.5">GSTIN: 06AAAPC1234F1Z9</p>
                  </div>
                </div>

                {/* Title & Metadata */}
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">
                      Tax Invoice
                    </h1>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                          Invoice No
                        </p>
                        <p className="font-bold text-slate-900 text-xs">
                          {selectedBill.invoiceNo || "PENDING"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                          Date
                        </p>
                        <p className="font-bold text-slate-900 text-xs">
                          {selectedBill.invoiceDate
                            ? new Date(selectedBill.invoiceDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                          Payment Status
                        </p>
                        <p
                          className={`font-black text-xs uppercase ${
                            selectedBill.status === "Received"
                              ? "text-emerald-600"
                              : selectedBill.status === "Billed"
                              ? "text-amber-600"
                              : "text-slate-500"
                          }`}
                        >
                          {selectedBill.status === "Received" ? "Paid / Settled" : "Payment Due"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billed To & Deal Particulars */}
                <div className="grid grid-cols-2 gap-6 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-indigo-700 uppercase text-[9px] tracking-widest mb-1.5 border-b border-indigo-100 pb-1">
                      Billed To (Developer / Mandate)
                    </p>
                    <h3 className="text-sm font-black text-slate-900 mb-0.5">
                      {selectedBill.builderName}
                    </h3>
                    <p className="text-slate-600 text-[11px]">Corporate Office, India</p>
                    <p className="text-slate-600 text-[11px] mt-0.5 font-medium">
                      GSTIN: 06XXXYY8888Z1Z1
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-indigo-700 uppercase text-[9px] tracking-widest mb-1.5 border-b border-indigo-100 pb-1">
                      Deal Particulars
                    </p>
                    <p className="text-slate-800 mb-1 text-[11px]">
                      <span className="font-bold text-slate-500 w-16 inline-block">Customer:</span>{" "}
                      <span className="font-bold text-slate-900">{selectedBill.leadName}</span>
                    </p>
                    <p className="text-slate-800 mb-1 text-[11px]">
                      <span className="font-bold text-slate-500 w-16 inline-block">Project:</span>{" "}
                      {selectedBill.property}
                    </p>
                    <p className="text-slate-800 text-[11px]">
                      <span className="font-bold text-slate-500 w-16 inline-block">Unit No:</span>{" "}
                      <span className="font-black text-indigo-700">
                        {selectedBill.unitNo || "TBD"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Service Item Table */}
                <table className="w-full mb-6 border border-slate-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-900 text-[9px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-left font-black border-r border-slate-200">
                        Description of Services
                      </th>
                      <th className="py-2.5 px-3 text-right font-black border-r border-slate-200 w-28">
                        Deal Value
                      </th>
                      <th className="py-2.5 px-3 text-center font-black border-r border-slate-200 w-16">
                        Rate
                      </th>
                      <th className="py-2.5 px-3 text-right font-black w-32">Taxable Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-3 text-slate-800 border-r border-slate-200 align-top">
                        <p className="font-bold text-xs mb-0.5">Professional Brokerage Services</p>
                        <p className="text-slate-500 text-[10px] leading-tight">
                          For successful conversion and facilitation of unit{" "}
                          {selectedBill.unitNo || "TBD"} at {selectedBill.property} to buyer{" "}
                          {selectedBill.leadName}.
                        </p>
                      </td>
                      <td className="py-4 px-3 text-right text-slate-800 border-r border-slate-200 align-top font-semibold text-xs">
                        {formatCurrency(selectedBill.dealValue)}
                      </td>
                      <td className="py-4 px-3 text-center text-slate-800 border-r border-slate-200 align-top font-semibold text-xs">
                        {selectedBill.brokeragePercent}%
                      </td>
                      <td className="py-4 px-3 text-right text-slate-900 font-black align-top text-xs">
                        {formatCurrency(selectedBill.taxableAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Calculation Totals */}
                <div className="flex justify-end mb-6">
                  <div className="w-1/2 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-medium">Total Taxable Value:</span>
                      <span className="font-bold">{formatCurrency(selectedBill.taxableAmount)}</span>
                    </div>
                    {selectedBill.gstPercent > 0 && (
                      <>
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Add: CGST @ {selectedBill.gstPercent / 2}%:</span>
                          <span>{formatCurrency(selectedBill.cgst)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px] border-b border-slate-200 pb-1.5">
                          <span>Add: SGST @ {selectedBill.gstPercent / 2}%:</span>
                          <span>{formatCurrency(selectedBill.sgst)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-sm font-black text-indigo-950 pt-2 bg-indigo-50 px-3 py-2 border border-indigo-100 rounded-lg">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(selectedBill.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Bank Details & Signature */}
                <div className="mt-8 pt-4 border-t-2 border-slate-900 grid grid-cols-2">
                  <div>
                    <p className="font-black text-slate-900 mb-1.5 uppercase text-[9px] tracking-wider flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-indigo-700" />
                      Bank Details for Wire Transfer
                    </p>
                    <div className="space-y-0.5 text-[11px]">
                      <p className="text-slate-600">
                        <span className="w-16 inline-block text-slate-400">Bank:</span>{" "}
                        <span className="font-bold text-slate-900">
                          {selectedBill.bankDetails?.bankName}
                        </span>
                      </p>
                      <p className="text-slate-600">
                        <span className="w-16 inline-block text-slate-400">Account:</span>{" "}
                        <span className="font-bold text-slate-900">
                          {selectedBill.bankDetails?.accountName}
                        </span>
                      </p>
                      <p className="text-slate-600">
                        <span className="w-16 inline-block text-slate-400">A/C No:</span>{" "}
                        <span className="font-bold text-slate-900">
                          {selectedBill.bankDetails?.accountNo}
                        </span>
                      </p>
                      <p className="text-slate-600">
                        <span className="w-16 inline-block text-slate-400">IFSC:</span>{" "}
                        <span className="font-bold text-slate-900">
                          {selectedBill.bankDetails?.ifscCode}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-end">
                    <div className="h-12 flex items-end justify-end mb-1">
                      <span
                        className="text-indigo-700/70 text-2xl pr-3 -rotate-6 tracking-wide"
                        style={{ fontFamily: "Brush Script MT, cursive" }}
                      >
                        Ankit Singh
                      </span>
                    </div>
                    <p className="text-slate-900 font-black border-t border-slate-300 pt-1 inline-block ml-auto leading-tight text-right text-[11px]">
                      Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ
                      <br />
                      <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                        Authorized Signatory
                      </span>
                    </p>
                  </div>
                </div>

                <p className="text-center text-[8px] text-slate-400 mt-6 font-medium uppercase tracking-widest border-t border-slate-100 pt-3">
                  This is a computer-generated tax invoice and does not require a physical signature.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Submit Payment Proof Modal ─── */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Submit Payment Proof
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Attach transaction receipt and UTR for Admin verification
              </DialogDescription>
            </div>
          </div>

          {selectedBillForPayment && (
            <form onSubmit={handleSubmitPaymentProof} className="space-y-4">
              {/* Bill Details Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Invoice: <span className="text-slate-900 dark:text-white font-mono">{selectedBillForPayment.invoiceNo || "INV-NEW"}</span>
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {selectedBillForPayment.leadName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                    {selectedBillForPayment.property}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Payable</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedBillForPayment.totalAmount)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">incl. 18% GST</span>
                </div>
              </div>

              {/* Wire Transfer Beneficiary Note */}
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-[11px]">
                <p className="font-bold text-indigo-950 dark:text-indigo-200 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  Beneficiary Account (Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ)
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Bank: <span className="font-bold text-slate-900 dark:text-slate-200">{selectedBillForPayment.bankDetails?.bankName}</span> | 
                  A/C: <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{selectedBillForPayment.bankDetails?.accountNo}</span> | 
                  IFSC: <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{selectedBillForPayment.bankDetails?.ifscCode}</span>
                </p>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* UTR / Reference No */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    UTR / Transaction Reference No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC000129849202, CMS291839102..."
                    value={paymentForm.utrNumber}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, utrNumber: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400">Unique transaction ID from your bank statement or payment app</p>
                </div>

                {/* Payment Mode */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Payment Mode
                  </label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    <option value="NEFT">NEFT (National Electronic Fund)</option>
                    <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                    <option value="IMPS">IMPS (Immediate Payment Service)</option>
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="Cheque / DD">Cheque / Demand Draft</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                  </select>
                </div>

                {/* Payment Date */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Paid Amount */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={paymentForm.paidAmount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Upload Receipt File */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Attach Payment Receipt / Screenshot <span className="text-rose-500">*</span></span>
                    {paymentForm.receiptUrl && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Attached
                      </span>
                    )}
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />

                  {paymentForm.receiptUrl ? (
                    <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-700 dark:text-emerald-300">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {paymentForm.receiptFileName || "Transaction_Receipt.png"}
                          </p>
                          <a
                            href={paymentForm.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> View Uploaded Receipt
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingFile}
                          className="h-7 px-2.5 text-xs text-slate-600 hover:text-slate-900"
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPaymentForm(prev => ({ ...prev, receiptUrl: "", receiptFileName: "" }))}
                          className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                        isUploadingFile
                          ? "border-emerald-400 bg-emerald-50/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/20"
                      }`}
                    >
                      {isUploadingFile ? (
                        <div className="flex flex-col items-center justify-center py-2">
                          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mb-1.5" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Uploading receipt to secure cloud...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 mb-2">
                            <UploadCloud className="w-5 h-5 text-emerald-600" />
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Click to upload receipt or screenshot
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Supports JPG, PNG, WEBP, PDF up to 25MB
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes / Remarks */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Remarks / Bank Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Paid via Builder Current Account with HDFC bank..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isSubmittingProof}
                  className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingProof || isUploadingFile || !paymentForm.receiptUrl || !paymentForm.utrNumber.trim()}
                  className="h-9 px-5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all shadow-emerald-600/20"
                >
                  {isSubmittingProof ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Submit Payment Proof
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── View Submitted Payment Proof Modal ─── */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-600" />
                Submitted Payment Proof
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Transaction receipt and details submitted for Admin clearance
              </DialogDescription>
            </div>
          </div>

          {selectedBillForProof && (
            <div className="space-y-4 text-xs">
              {/* Status Banner */}
              <div className={`p-3 rounded-xl flex items-center justify-between ${
                selectedBillForProof.status === "Received"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-800 dark:text-emerald-300"
                  : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-800 dark:text-amber-300"
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {selectedBillForProof.status === "Received" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Payment Verified & Received by Astronix Admin</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                      <span>Verification Pending by Astronix Admin</span>
                    </>
                  )}
                </div>
                <span className="font-mono text-[10px] uppercase font-black">
                  {selectedBillForProof.status}
                </span>
              </div>

              {/* Particulars Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">UTR / Ref No.</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                    {selectedBillForProof.paymentProof?.utrNumber || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Mode</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedBillForProof.paymentProof?.paymentMode || "NEFT"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount Paid</span>
                  <span className="font-black text-emerald-600 text-sm">
                    {formatCurrency(selectedBillForProof.paymentProof?.paidAmount || selectedBillForProof.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedBillForProof.paymentProof?.paymentDate || "—"}
                  </span>
                </div>
                {selectedBillForProof.paymentProof?.notes && (
                  <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Builder Remarks</span>
                    <p className="text-slate-700 dark:text-slate-300 italic text-[11px] mt-0.5">
                      "{selectedBillForProof.paymentProof.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Receipt Preview */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Attached Receipt
                </span>
                {selectedBillForProof.paymentProof?.receiptUrl ? (
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    {/* If image, display inline thumbnail */}
                    {selectedBillForProof.paymentProof.receiptUrl.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i) ||
                     !selectedBillForProof.paymentProof.receiptUrl.endsWith(".pdf") ? (
                      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 max-h-60 bg-black/5 flex items-center justify-center">
                        <img
                          src={selectedBillForProof.paymentProof.receiptUrl}
                          alt="Payment Receipt"
                          className="w-full h-auto max-h-60 object-contain rounded-lg"
                        />
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                        {selectedBillForProof.paymentProof.receiptFileName || "Transaction_Receipt"}
                      </span>
                      <a
                        href={selectedBillForProof.paymentProof.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Full Receipt
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-center py-4">No receipt file uploaded.</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button
                  onClick={() => setShowProofModal(false)}
                  className="h-9 px-5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
