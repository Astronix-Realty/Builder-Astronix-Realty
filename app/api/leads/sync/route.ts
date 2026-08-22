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
        
        const { searchParams } = new URL(req.url);
        const leadType = searchParams.get("leadType");

        // Strictly isolated query
        const andConditions: any[] = [
            { ...getOwnershipQuery(context!) },
            { isArchived: { $ne: true } }
        ];

        if (leadType === "our") {
            andConditions.push({
                $and: [
                    { source: { $not: /website|astronix|doubt|visitor/i } },
                    { status: { $ne: "Token VIP" } },
                    { isTokenPaid: { $ne: true } },
                    { isGroup: { $ne: true } },
                    { $or: [{ groupSize: 0 }, { groupSize: null }, { groupSize: { $exists: false } }] }
                ]
            });
        } else if (leadType === "astronix") {
            andConditions.push({
                $or: [
                    { source: { $regex: /website|astronix|doubt|visitor/i } },
                    { status: "Token VIP" },
                    { isTokenPaid: true },
                    { isGroup: true },
                    { groupSize: { $gt: 0 } }
                ]
            });
        }

        const query: any = { $and: andConditions };

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
