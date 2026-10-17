"use client"

import React from "react"
import { ShieldCheck, FileText } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DocumentUpload } from "@/components/ui/media-uploads"

export interface LegalDocumentsUploaderProps {
  constructionStatus?: string
  reraCertificateUrl?: string
  onReraCertificateChange: (url: string) => void
  ccNumber?: string
  onCcNumberChange?: (val: string) => void
  ccCertificateUrl?: string
  onCcCertificateChange?: (url: string) => void
  ocNumber?: string
  onOcNumberChange?: (val: string) => void
  ocCertificateUrl?: string
  onOcCertificateChange?: (url: string) => void
}

export function LegalDocumentsUploader({
  constructionStatus,
  reraCertificateUrl,
  onReraCertificateChange,
  ccNumber,
  onCcNumberChange,
  ccCertificateUrl,
  onCcCertificateChange,
  ocNumber,
  onOcNumberChange,
  ocCertificateUrl,
  onOcCertificateChange,
}: LegalDocumentsUploaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 1. RERA Certificate */}
      <div className="bg-gray-50 dark:bg-slate-800/50/50 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:border-slate-700 transition-colors shadow-sm flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-blue-100/50 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#1A3C8C] dark:text-blue-400" />
          </div>
          <Label className="text-[11px] font-bold uppercase tracking-wider text-[#1A3C8C] dark:text-blue-400">
            RERA Certificate
          </Label>
          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
            Required
          </span>
        </div>

        <div className="flex-1">
          <DocumentUpload
            value={reraCertificateUrl || ""}
            onChange={onReraCertificateChange}
            title="RERA Certificate"
            description="Official registration document."
            buttonLabel="View RERA"
          />
        </div>
      </div>

      {/* 2. CC Certificate (Visible for UC) */}
      {constructionStatus === "under-construction" && (
        <div className="bg-blue-50/20 rounded-2xl p-5 border border-blue-100/50 hover:border-blue-200 transition-colors shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#1A3C8C] dark:text-blue-400" />
            </div>
            <Label className="text-[11px] font-bold uppercase tracking-wider text-[#1A3C8C] dark:text-blue-400">
              Commencement (CC)
            </Label>
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
              Required
            </span>
          </div>

          <div className="mb-4">
            <Input
              value={ccNumber || ""}
              onChange={e => onCcNumberChange?.(e.target.value)}
              placeholder="CC Number (e.g. CC/2023/102)"
              className="text-xs bg-white dark:bg-slate-900/50"
            />
          </div>

          <div className="flex-1">
            <DocumentUpload
              value={ccCertificateUrl || ""}
              onChange={url => onCcCertificateChange?.(url)}
              title="CC Certificate"
              description="Official Commencement Certificate PDF."
              buttonLabel="View CC"
            />
          </div>
        </div>
      )}

      {/* 3. OC Certificate (Visible if Ready to Move) */}
      {constructionStatus === "ready-to-move" && (
        <div className="bg-green-50/10 rounded-2xl p-5 border border-green-100/50 hover:border-green-200 transition-colors shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-green-100/50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-green-600" />
            </div>
            <Label className="text-[11px] font-bold uppercase tracking-wider text-green-700">
              Occupancy (OC)
            </Label>
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
              Required
            </span>
          </div>

          <div className="mb-4">
            <Input
              value={ocNumber || ""}
              onChange={e => onOcNumberChange?.(e.target.value)}
              placeholder="OC Number (e.g. OC/2024/099)"
              className="text-xs bg-white dark:bg-slate-900/50"
            />
          </div>

          <div className="flex-1">
            <DocumentUpload
              value={ocCertificateUrl || ""}
              onChange={url => onOcCertificateChange?.(url)}
              title="OC Certificate"
              description="Official Occupancy Certificate PDF."
              buttonLabel="View OC"
            />
          </div>
        </div>
      )}
    </div>
  )
}
