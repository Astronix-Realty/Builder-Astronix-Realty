import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { aggregateTownshipCounts, aggregateProjectCounts, aggregateTowerCounts } from "@/lib/services/hierarchy-sync";
import { checkRBAC } from "@/lib/rbac";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const headerSecret = req.headers.get("x-internal-secret");
  const isInternalValid = Boolean(
    internalSecret &&
    headerSecret &&
    internalSecret.length === headerSecret.length &&
    crypto.timingSafeEqual(Buffer.from(internalSecret), Buffer.from(headerSecret))
  );

  if (process.env.NODE_ENV === "production" && !isInternalValid) {
    return NextResponse.json({ error: "Debug sync is strictly disabled in production." }, { status: 403 });
  }

  if (!isInternalValid) {
    const { errorResponse } = await checkRBAC(req, ["builder", "mandate", "admin"]);
    if (errorResponse) return errorResponse;
  }

  try {
    await dbConnect();
    
    // Find all towers to trigger bottom-up sync
    const properties = await Property.find({ type: "tower", isDeleted: { $ne: true } });
    
    for (const prop of properties) {
      await aggregateTowerCounts(prop._id);
    }
    
    // Also sync standalone projects that might have no towers
    const standaloneProjects = await Property.find({ type: "project", isDeleted: { $ne: true } });
    for (const prop of standaloneProjects) {
       await aggregateProjectCounts(prop._id);
    }

    // Also sync standalone townships that might have no projects
    const standaloneTownships = await Property.find({ type: "township", isDeleted: { $ne: true } });
    for (const prop of standaloneTownships) {
       await aggregateTownshipCounts(prop._id);
    }
    
    return NextResponse.json({ success: true, towers: properties.length, projects: standaloneProjects.length, townships: standaloneTownships.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
