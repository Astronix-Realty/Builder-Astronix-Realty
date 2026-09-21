import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { deleteCloudinaryFile } from "@/lib/utils/cloudinary"
import { checkRBAC } from "@/lib/rbac"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// POST /api/upload
export async function POST(req: NextRequest) {
  try {
    const isPublic = req.nextUrl.searchParams.get("public") === "true"

    if (!isPublic) {
      const { errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
      if (errorResponse) return errorResponse;
    }
    // Check if Cloud Name is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("[Upload] Missing Cloudinary env vars:", {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET,
      })
      return NextResponse.json(
        { error: "Cloudinary configuration is incomplete. Check server env." },
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

    // Validate file size: 1GB for videos, 100MB for images/PDFs
    const maxSize = isVideo ? 1024 * 1024 * 1024 : 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size: ${isVideo ? "1GB" : "100MB"}` },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log(`[Upload] Starting upload: ${file.name} (${(file.size / 1024).toFixed(1)}KB, type: ${file.type})`)

    // Configure specific options based on file type
    const uploadOptions: any = {
      folder: "astronix_realty_uploads",
      resource_type: isPdf ? "raw" : "auto",
      timeout: 120000, // 120 second timeout
    };

    // Auto-compress videos during upload so they take up very little space
    if (isVideo) {
      uploadOptions.transformation = [
        { width: 800, crop: "limit", quality: "auto:eco", fetch_format: "mp4", video_codec: "auto" }
      ];
    }

    // For raw files, explicitly defining public_id ensures the file extension is retained safely
    if (isPdf && file.name) {
      const cleanFileName = file.name.split('/').pop() || file.name;
      const nameWithoutExt = cleanFileName.replace(/\.[^/.]+$/, "");
      const ext = cleanFileName.split('.').pop() || 'pdf';
      uploadOptions.public_id = `${nameWithoutExt}_${Date.now()}.${ext}`;
    }

    // Convert Buffer to Data URI
    const base64Data = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64Data}`

    // Upload to Cloudinary using base64 (more reliable in Next.js API routes than streams)
    const uploadResponse = await cloudinary.uploader.upload(dataUri, uploadOptions)

    console.log(`[Upload] Success: ${uploadResponse.secure_url}`)

    return NextResponse.json({ 
      url: uploadResponse.secure_url, 
      filename: uploadResponse.original_filename,
      public_id: uploadResponse.public_id 
    }, { status: 200 })

  } catch (error: any) {
    console.error("[Upload] Cloudinary upload error:", error?.message || error)
    const userMessage = error?.http_code === 499 || error?.name === 'TimeoutError'
      ? "Upload timed out. Please try a smaller image or check your internet connection."
      : `Upload failed: ${error?.message || "Unknown error"}`
    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    )
  }
}

// DELETE /api/upload
// Body: { url: string } — the Cloudinary URL of the file to delete
export async function DELETE(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;
    const { url } = await req.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    const deleteResult = await deleteCloudinaryFile(url)
    
    if (deleteResult.success) {
      return NextResponse.json({ success: true, result: deleteResult.result }, { status: 200 })
    }

    return NextResponse.json({ error: `Cloudinary deletion failed: ${deleteResult.error}` }, { status: 500 })

  } catch (error: any) {
    console.error("Cloudinary delete error:", error)
    return NextResponse.json(
      { error: `Delete failed: ${error.message || "Unknown error"}` },
      { status: 500 }
    )
  }
}
