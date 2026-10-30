import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    // Basic Security: Vercel Cron sends a Bearer token or we can use a custom secret header
    // Security Guard: Strictly verify Vercel Cron Secret in production
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (process.env.NODE_ENV === "production" && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
      return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
    }

    await dbConnect();
    
    const now = new Date();

    // Find all blogs that are scheduled and the publishAt time has passed
    const blogsToPublish = await Blog.find({
      status: "scheduled",
      publishedAt: { $lte: now }
    });

    if (blogsToPublish.length === 0) {
      return NextResponse.json({ message: "No scheduled blogs to publish at this time." }, { status: 200 });
    }

    const publishedSlugs: string[] = [];

    // Update their status to published
    for (const blog of blogsToPublish) {
      blog.status = "published";
      await blog.save();
      publishedSlugs.push(blog.slug);
      
      // Revalidate ISR Cache for each blog
      try {
        revalidatePath(`/blogs/${blog.slug}`);
      } catch (err) {
        console.error(`Failed to revalidate cache for /blogs/${blog.slug}`, err);
      }
    }

    // Revalidate the main blogs list page
    try {
      revalidatePath("/blogs");
    } catch (err) {
      console.error("Failed to revalidate cache for /blogs index", err);
    }

    return NextResponse.json({ 
      message: `Successfully published ${blogsToPublish.length} scheduled blogs.`,
      slugs: publishedSlugs
    }, { status: 200 });

  } catch (error: any) {
    console.error("Cron publish-blogs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
