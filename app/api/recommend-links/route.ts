import { checkRBAC } from "@/lib/rbac";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
// import Blog from "@/models/Blog";

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await checkRBAC(req, ["builder", "mandate", "admin"]);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ recommendations: [] }, { status: 200 });
    }

    // 1. Fetch active properties to use as link targets
    // Ideally we fetch a cached version or just titles/slugs to be fast
    const properties = await Property.find({ status: "published" })
      .select("townshipName type details")
      .lean();

    const recommendations: Array<{ keyword: string, suggestedUrl: string, type: string }> = [];
    const normalizedContent = content.toLowerCase();

    // 2. Simple Semantic Keyword Matching
    for (const prop of properties) {
      // @ts-ignore
      const propName = (prop.townshipName || prop.name || "").toLowerCase();
      if (!propName) continue;

      if (normalizedContent.includes(propName)) {
        // Find property ID or slug to build URL
        recommendations.push({
          keyword: propName,
          suggestedUrl: `/properties/${prop._id}`, // Replace with actual frontend URL pattern
          type: "property"
        });
      }
    }

    // You can extend this to also match against previously published blogs
    // const blogs = await Blog.find({ status: "published" }).select("title slug").lean(); ...

    // Deduplicate recommendations
    const uniqueRecommendations = Array.from(new Map(recommendations.map(item => [item.keyword, item])).values());

    return NextResponse.json({ recommendations: uniqueRecommendations }, { status: 200 });
  } catch (error: any) {
    console.error("Recommend Links error:", error);
    return NextResponse.json({ error: "Failed to fetch link recommendations" }, { status: 500 });
  }
}
