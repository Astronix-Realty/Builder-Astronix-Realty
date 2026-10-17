"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Upload, X, FileText, Loader2, AlertCircle } from "lucide-react"
import { uploadFileToServer } from "@/components/ui/media-uploads"

export interface UnifiedMediaUploaderProps {
  value: string
  onChange: (url: string) => void
  label?: string
  helperText?: string
  accept?: string
  maxSizeMB?: number
  aspectRatio?: "video" | "banner" | "square" | "document"
  className?: string
}

export function UnifiedMediaUploader({
  value,
  onChange,
  label = "Upload File",
  helperText = "JPEG, PNG, WEBP, or PDF",
  accept = "image/*,application/pdf",
  aspectRatio = "banner",
  className = "",
}: UnifiedMediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const isPdf = Boolean(value && (value.endsWith(".pdf") || value.includes("/pdf/")))

  const heightClass =
    aspectRatio === "video"
      ? "h-[220px]"
      : aspectRatio === "square"
      ? "h-[160px] w-[160px]"
      : aspectRatio === "document"
      ? "h-[120px]"
      : "h-[180px]"

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")

    try {
      setIsUploading(true)
      const url = await uploadFileToServer(file)
      onChange(url)
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
          {label}
        </span>
      )}

      <div
        onClick={() => !isUploading && fileRef.current?.click()}
        className={`relative w-full ${heightClass} border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${
          value
            ? "border-transparent bg-slate-50 dark:bg-slate-900"
            : "border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-900/10 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-400"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            <span className="text-xs font-semibold text-blue-600">Uploading to cloud...</span>
          </div>
        ) : value ? (
          <>
            {isPdf ? (
              <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]">
                  {value.split("/").pop()}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">PDF Document Uploaded</span>
              </div>
            ) : (
              <Image src={value} alt="Media Preview" fill className="object-cover" unoptimized />
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity backdrop-blur-[1px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  fileRef.current?.click()
                }}
                className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-gray-50 flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" /> Replace
              </button>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-white/90 text-red-500 p-1 rounded-lg shadow hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <span className="font-semibold text-gray-700 dark:text-slate-300 text-xs">
              Click or drag file to upload
            </span>
            {helperText && (
              <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                {helperText}
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-[11px] text-red-500">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
