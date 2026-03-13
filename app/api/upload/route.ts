import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

// POST /api/upload
// Accepts multipart/form-data with a "file" field
// Saves to public/uploads/ and returns the public URL
export async function POST(req: NextRequest) {
  try {
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

    // Generate unique filename
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin"
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const filename = `${timestamp}-${randomId}.${extension}`

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), "public", "uploads")
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch {
      // Ignore EEXIST error
    }

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadDir, filename)

    await writeFile(filePath, buffer)

    // Return the public URL
    const publicUrl = `/uploads/${filename}`

    return NextResponse.json({ url: publicUrl, filename }, { status: 200 })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: `Upload failed: ${error.message || "Unknown error"}` },
      { status: 500 }
    )
  }
}

// Increase the body size limit for this route
export const config = {
  api: {
    bodyParser: false,
  },
}
