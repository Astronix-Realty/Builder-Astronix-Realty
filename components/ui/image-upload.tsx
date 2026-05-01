"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, Camera } from "lucide-react"

interface ImageUploadProps {
    value?: string
    onChange: (value: string) => void
    label?: string
    className?: string
}

export function ImageUpload({ value, onChange, label, className }: ImageUploadProps) {
    const [isHovered, setIsHovered] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isLoading, setIsLoading] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Image size should be less than 2MB")
                return
            }

            try {
                setIsLoading(true)
                const formData = new FormData()
                formData.append("file", file)

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                })

                if (!response.ok) {
                    throw new Error("Upload failed")
                }

                const data = await response.json()
                onChange(data.url)
            } catch (error) {
                console.error("Error uploading image:", error)
                alert("Failed to upload image")
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            {label && <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>}

            <div
                className="relative group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div
                    onClick={() => !isLoading && fileInputRef.current?.click()}
                    className={`w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden cursor-pointer transition-all duration-300 relative ${isHovered ? "ring-4 ring-blue-500/30 scale-105" : "ring-1 ring-slate-200 dark:ring-slate-700"
                        } bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-blue-500 uppercase">Uploading</span>
                        </div>
                    ) : value ? (
                        <>
                            <Image
                                src={value}
                                alt="Logo"
                                fill
                                className="object-cover rounded-full"
                                unoptimized
                                onError={(e) => {
                                    // Fallback if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://via.placeholder.com/128?text=Logo";
                                }}
                            />
                            {/* Overlay on Hover */}
                            <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}>
                                <Camera className="h-6 w-6 mb-1" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-1">
                            <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Upload</span>
                        </div>
                    )}
                </div>

                {value && !isLoading && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onChange("")
                        }}
                        className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 border-2 border-white dark:border-slate-900 z-20 hover:scale-110 active:scale-95"
                        title="Remove image"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">Square logo recommended (max 2MB)</p>
        </div>
    )
}
