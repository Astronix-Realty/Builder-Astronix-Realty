import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { submitPropertyForApproval } from "@/services/property-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: draftId } = await params;

    // Guard: invalid ObjectId format
    if (!/^[a-f\d]{24}$/i.test(draftId)) {
      return NextResponse.json({ error: "DRAFT_NOT_FOUND: Invalid draft ID format" }, { status: 404 });
    }

    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();

    const result = await submitPropertyForApproval(draftId, decoded.userId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error(`[POST /api/properties/${(await params).id}/submit] error:`, error.message);
    return NextResponse.json({ error: error.message || "Failed to submit property" }, { status: 500 });
  }
}
