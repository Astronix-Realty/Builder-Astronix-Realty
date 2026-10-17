"use client"

import React from "react"
import { FileText } from "lucide-react"
import { DocumentUpload } from "@/components/ui/media-uploads"

export interface BrochureUploadCardProps {
  title: string
  subtitle?: string
  value?: string
  onChange: (url: string) => void
}

export function BrochureUploadCard({
  title,
  subtitle = "Upload your comprehensive brochure",
  value = "",
  onChange,
}: BrochureUploadCardProps) {
  return (
    <div className="pt-2">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
          <p className="text-xs text-[#2BB673] dark:text-emerald-400">{subtitle}</p>
        </div>
      </div>
      <DocumentUpload value={value} onChange={onChange} />
    </div>
  )
}
