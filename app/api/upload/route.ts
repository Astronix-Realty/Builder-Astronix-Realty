import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// POST /api/upload
export async function POST(req: NextRequest) {
  try {
    // Check if Cloud Name is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json(
        { error: "Cloudinary configuration is incomplete. Missing CLOUDINARY_CLOUD_NAME." },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    const isPdf = file.type === "application/pdf"

    if (!isImage && !isVideo && !isPdf) {
      return NextResponse.json(
        { error: "Only image, video, and PDF files are allowed" },
        { status: 400 }
      )
    }

    // Validate file size: 100MB for videos, 10MB for images/PDFs
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size: ${isVideo ? "100MB" : "10MB"}` },
        { status: 400 }
      )
    }

    // Convert File to ArrayBuffer to Base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64String = buffer.toString("base64")
    const dataURI = `data:${file.type};base64,${base64String}`

    // Configure specific options based on file type
    const uploadOptions: any = {
      folder: "astronix_realty_uploads",
      resource_type: isPdf ? "raw" : "auto", 
    };

    // For raw files, explicitly defining public_id ensures the file extension is retained safely
    if (isPdf && file.name) {
      // Remove any folder paths if present and separate the name from extension
      const cleanFileName = file.name.split('/').pop() || file.name;
      const nameWithoutExt = cleanFileName.replace(/\.[^/.]+$/, "");
      const ext = cleanFileName.split('.').pop() || 'pdf';
      // Append a small timestamp to prevent overriding while retaining safe extension
      uploadOptions.public_id = `${nameWithoutExt}_${Date.now()}.${ext}`;
    }

    // Upload to Cloudinary using Base64 URI
    const uploadResponse = await cloudinary.uploader.upload(dataURI, uploadOptions)

    return NextResponse.json({ 
      url: uploadResponse.secure_url, 
      filename: uploadResponse.original_filename,
      public_id: uploadResponse.public_id 
    }, { status: 200 })

  } catch (error: any) {
    console.error("Cloudinary upload error:", error)
    return NextResponse.json(
      { error: `Upload failed: ${error.message || "Unknown error"}` },
      { status: 500 }
    )
  }
}

// DELETE /api/upload
// Body: { url: string } — the Cloudinary URL of the file to delete
export async function DELETE(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // ── Extract public_id from Cloudinary URL ─────────────────────────────
    // Example URL: https://res.cloudinary.com/cloud/image/upload/v123/folder/file.jpg
    // Example PDF:  https://res.cloudinary.com/cloud/raw/upload/folder/file_123.pdf
    let publicId: string | null = null
    let resourceType: "image" | "video" | "raw" = "image"

    // Determine resource_type from URL path segment
    if (url.includes("/raw/upload/")) {
      resourceType = "raw"
    } else if (url.includes("/video/upload/")) {
      resourceType = "video"
    } else {
      resourceType = "image"
    }

    // Extract the part after /upload/ (strip optional version like v1234567890/)
    const uploadMarker = "/upload/"
    const uploadIdx = url.indexOf(uploadMarker)
    if (uploadIdx === -1) {
      return NextResponse.json({ error: "Not a valid Cloudinary URL" }, { status: 400 })
    }

    let afterUpload = url.slice(uploadIdx + uploadMarker.length)

    // Strip version prefix (v followed by digits then slash)
    afterUpload = afterUpload.replace(/^v\d+\//, "")

    // For raw files, keep the extension as part of public_id
    // For images/videos, strip the extension
    if (resourceType !== "raw") {
      afterUpload = afterUpload.replace(/\.[^/.]+$/, "")
    }

    publicId = afterUpload

    if (!publicId) {
      return NextResponse.json({ error: "Could not extract public_id from URL" }, { status: 400 })
    }

    // ── Delete from Cloudinary ────────────────────────────────────────────
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })

    if (result.result === "ok" || result.result === "not found") {
      return NextResponse.json({ success: true, result: result.result }, { status: 200 })
    }

    return NextResponse.json({ error: `Cloudinary deletion failed: ${result.result}` }, { status: 500 })

  } catch (error: any) {
    console.error("Cloudinary delete error:", error)
    return NextResponse.json(
      { error: `Delete failed: ${error.message || "Unknown error"}` },
      { status: 500 }
    )
  }
}
