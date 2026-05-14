import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";

// Force re-build comment v2
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await dbConnect();
        
        // Fetch only IDs and timestamps (lightweight checksum payload)
        const leads = await Lead.find({}, { _id: 1, updatedAt: 1, createdAt: 1 }).lean();
        
        const snapshot = leads.map((l: any) => ({
            id: String(l._id),
            updatedAt: l.updatedAt || l.createdAt || new Date().toISOString()
        }));

        return NextResponse.json({ snapshot });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
