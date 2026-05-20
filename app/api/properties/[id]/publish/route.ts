import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { checkRBAC } from "@/lib/rbac";
import { publishProperty } from "@/services/property-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: draftId } = await params;
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();

    // Pass the actual authenticated context to the service function
    const result = await publishProperty(draftId, context!);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error(`[POST /api/properties/${(await params).id}/publish] error:`, error.message);
    return NextResponse.json({ error: error.message || "Failed to publish property" }, { status: 500 });
  }
}
