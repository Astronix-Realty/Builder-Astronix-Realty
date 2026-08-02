import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { aggregateTownshipCounts, aggregateProjectCounts, aggregateTowerCounts } from "@/lib/services/hierarchy-sync";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Find all towers to trigger bottom-up sync
    const properties = await Property.find({ type: "tower", isDeleted: false });
    
    for (const prop of properties) {
      await aggregateTowerCounts(prop._id);
    }
    
    // Also sync standalone projects that might have no towers
    const standaloneProjects = await Property.find({ type: "project", isDeleted: false });
    for (const prop of standaloneProjects) {
       await aggregateProjectCounts(prop._id);
    }

    // Also sync standalone townships that might have no projects
    const standaloneTownships = await Property.find({ type: "township", isDeleted: false });
    for (const prop of standaloneTownships) {
       await aggregateTownshipCounts(prop._id);
    }
    
    return NextResponse.json({ success: true, towers: properties.length, projects: standaloneProjects.length, townships: standaloneTownships.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
