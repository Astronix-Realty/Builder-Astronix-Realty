import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
        if (errorResponse) return errorResponse;

        await dbConnect();
        
        // Strictly isolated query
        const query: any = {
            ...getOwnershipQuery(context!),
            isArchived: { $ne: true }
        };

        // Fetch only IDs and timestamps (lightweight checksum payload) for authorized leads
        const leads = await Lead.find(query, { _id: 1, updatedAt: 1, createdAt: 1 }).lean();
        
        const snapshot = leads.map((l: any) => ({
            id: String(l._id),
            updatedAt: l.updatedAt || l.createdAt || new Date().toISOString()
        }));

        return NextResponse.json({ snapshot });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
