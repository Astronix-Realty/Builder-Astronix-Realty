import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { publishProperty } from "@/services/property-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: draftId } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();

    const result = await publishProperty(draftId, decoded.userId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error(`[POST /api/properties/${(await params).id}/publish] error:`, error.message);
    return NextResponse.json({ error: error.message || "Failed to publish property" }, { status: 500 });
  }
}
