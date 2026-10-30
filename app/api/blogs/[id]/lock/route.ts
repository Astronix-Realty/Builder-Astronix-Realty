import { checkRBAC } from "@/lib/rbac";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "admin"]);
    if (errorResponse) return errorResponse;
    await dbConnect();
    const { action } = await req.json(); // action: 'acquire', 'release', 'ping'
    const userId = context!.userId;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const blog = await Blog.findById(id).select("lockedBy lockedAt");
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const now = new Date();
    // 60 seconds lock timeout. If the heartbeat (ping) isn't received within 60s, the lock is considered abandoned.
    const lockTimeoutMs = 60 * 1000; 

    const isLockedBySomeoneElse = blog.lockedBy && 
                                  blog.lockedBy.toString() !== userId && 
                                  blog.lockedAt && 
                                  (now.getTime() - blog.lockedAt.getTime()) < lockTimeoutMs;

    if (action === 'acquire' || action === 'ping') {
      if (isLockedBySomeoneElse) {
         return NextResponse.json({ 
           error: "Locked", 
           lockedBy: blog.lockedBy,
           message: "Another administrator is currently editing this blog." 
         }, { status: 423 }); // 423 Locked
      }

      // Acquire or renew lock
      blog.lockedBy = userId;
      blog.lockedAt = now;
      await blog.save();
      return NextResponse.json({ success: true, lockedAt: now }, { status: 200 });
    }

    if (action === 'release') {
      // Only release if the person releasing holds the lock
      if (blog.lockedBy && blog.lockedBy.toString() === userId) {
        blog.lockedBy = null;
        blog.lockedAt = null;
        await blog.save();
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("POST /api/blogs/[id]/lock error:", error);
    return NextResponse.json({ error: "Failed to process lock action" }, { status: 500 });
  }
}
