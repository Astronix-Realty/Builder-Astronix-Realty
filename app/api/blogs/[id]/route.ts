import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { getTokenFromRequest } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromRequest(req);
    let context = null;
    if (token) {
      const rbacResult = await checkRBAC(req, ['builder', 'mandate']);
      if (!rbacResult.errorResponse) {
        context = rbacResult.context;
      }
    }

    await dbConnect();
    
    // Await params to fix sync dynamic APIs error
    const { id } = await params;

    // We can fetch by ID or slug
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { slug: id };

    const blog = await Blog.findOne(query).populate("linkedProperties");

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Role-based Draft Isolation: Drafts can only be read by their creator.
    if (blog.status !== "published") {
      const authorIdStr = blog.authorId?.toString() || blog.accountId?.toString();
      if (!context || (authorIdStr && authorIdStr !== context.userId)) {
        return NextResponse.json({ error: "Unauthorized access to draft content" }, { status: 403 });
      }
    }

    return NextResponse.json({ blog }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/blogs/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch blog" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const body = await req.json();

    const { id } = await params;
    const blog = await Blog.findOne({ _id: id, ...getOwnershipQuery(context!) });
    if (!blog) {
      return NextResponse.json({ error: "Blog not found or unauthorized" }, { status: 404 });
    }

    // Health Engine Publish Validation
    if (body.status === "published" && blog.status !== "published") {
      // Basic validation checks before allowing publish
      if (!body.title || body.title.length < 5) {
        return NextResponse.json({ error: "Title must be at least 5 characters to publish" }, { status: 400 });
      }
      if (!body.blocks || body.blocks.length === 0) {
        return NextResponse.json({ error: "Cannot publish an empty blog" }, { status: 400 });
      }
    }

    // Slug collision handling if title changes
    if (body.title && body.title !== blog.title) {
      let baseSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (baseSlug && baseSlug !== blog.slug && !baseSlug.startsWith(blog.slug)) {
        let slug = baseSlug;
        let counter = 1;
        let exists = await Blog.findOne({ slug, _id: { $ne: blog._id } });
        while (exists) {
          slug = `${baseSlug}-${counter}`;
          counter++;
          exists = await Blog.findOne({ slug, _id: { $ne: blog._id } });
        }
        
        // Save old slug for SEO redirects
        if (blog.slug) {
           body.previousSlugs = [...(blog.previousSlugs || []), blog.slug];
        }
        body.slug = slug;
      }
    }

    // Save version history on major edits
    if (body.saveVersion) {
      blog.versions.push({
        contentSnapshots: blog.blocks,
        savedAt: new Date(),
        savedBy: context!.userId
      });
      delete body.saveVersion;
    }

    // Handle status transition to published
    if (body.status === "published" && blog.status !== "published") {
      body.publishedAt = new Date();
    }

    // Prevent VersionError and immutable field errors during concurrent saves
    delete body.__v;
    delete body._id;
    delete body.authorId;
    delete body.accountId;
    delete body.role;
    delete body.builderId;
    delete body.mandateId;
    delete body.createdAt;
    delete body.updatedAt;

    Object.assign(blog, body);
    
    // Completely bypass Mongoose internal VersionError for concurrent saves (last writer wins)
    if (blog.$__) {
      delete blog.$__.version;
    }
    
    await blog.save();

    // Trigger ISR revalidation for the public site if it affects live content
    if (blog.status === "published") {
      revalidatePath(`/blogs/${blog.slug}`);
      revalidatePath('/blogs');
    }

    return NextResponse.json({ blog }, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/blogs/[id] error:", error);
    return NextResponse.json({ error: "Failed to update blog" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const { id } = await params;
    const blog = await Blog.findOneAndDelete({ _id: id, ...getOwnershipQuery(context!) });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found or unauthorized" }, { status: 404 });
    }

    if (blog.status === "published") {
      revalidatePath(`/blogs/${blog.slug}`);
      revalidatePath('/blogs');
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/blogs/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 });
  }
}
