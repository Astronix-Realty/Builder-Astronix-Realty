"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, Camera, Loader2 } from "lucide-react"

interface MiniImageUploadProps {
    value?: string
    onChange: (value: string) => void
    size?: number
    className?: string
}

export function MiniImageUpload({ value, onChange, size = 48, className }: MiniImageUploadProps) {
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
                const oldUrl = value
                const formData = new FormData()
                formData.append("file", file)

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || "Upload failed")
                }

                const data = await response.json()
                onChange(data.url)
                // Delete old image from Cloudinary after new one is uploaded
                if (oldUrl && oldUrl.includes("cloudinary.com")) {
                    fetch("/api/upload", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: oldUrl }),
                    }).catch(() => {})
                }
            } catch (error: any) {
                console.error("Error uploading image:", error)
                alert(`Failed to upload image: ${error.message}`)
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
            <div
                className={`w-full h-full rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-blue-400 group relative ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : value ? (
                    <div className="relative w-full h-full">
                        <Image src={value} alt="Amenity" fill className="object-cover" unoptimized />
                        {isHovered && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                                <Camera className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Upload className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                )}
            </div>

            {value && !isLoading && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        if (value && value.includes("cloudinary.com")) {
                            fetch("/api/upload", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ url: value }),
                            }).catch(() => {})
                        }
                        onChange("")
                    }}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full shadow-md z-10 hover:bg-red-600 transition-colors"
                >
                    <X className="w-2.5 h-2.5" />
                </button>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    )
}
