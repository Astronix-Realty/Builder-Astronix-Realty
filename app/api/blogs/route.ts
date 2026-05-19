import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

// Utility to generate slug
const generateSlug = async (title: string, currentSlug?: string) => {
  let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  if (!baseSlug) baseSlug = `blog-${Date.now()}`;
  
  // If editing and title hasn't changed slug drastically, or we want to keep current
  if (currentSlug && currentSlug.startsWith(baseSlug)) return currentSlug;

  let slug = baseSlug;
  let counter = 1;
  let exists = await Blog.findOne({ slug });

  while (exists) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    exists = await Blog.findOne({ slug });
  }

  return slug;
};

// GET /api/blogs
export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    
    // Parse query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const query: any = {
      ...getOwnershipQuery(context!)
    };

    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Blog.countDocuments(query);

    return NextResponse.json({ 
      blogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("GET /api/blogs error:", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

// POST /api/blogs
export async function POST(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const body = await req.json();
    const { title, excerpt, blocks, category, coverImage, seo, status, publishedAt, authorName, authorRole, readTime, linkedProperties } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slug = await generateSlug(title);

    const newBlog = await Blog.create({
      title,
      slug,
      excerpt,
      blocks: blocks || [],
      category,
      coverImage,
      seo,
      status: status || "draft",
      publishedAt: status === "published" ? (publishedAt || new Date()) : null,
      authorName: authorName || context!.email.split('@')[0],
      authorRole: authorRole || context!.role,
      readTime,
      linkedProperties,
      authorId: context!.userId,
      accountId: context!.userId,
      role: context!.role,
      builderId: context!.builderId || null,
      mandateId: context!.mandateId || null
    });

    return NextResponse.json({ blog: newBlog }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/blogs error:", error);
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 });
  }
}
