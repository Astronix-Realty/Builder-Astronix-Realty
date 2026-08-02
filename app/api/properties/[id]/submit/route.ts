import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { checkRBAC } from "@/lib/rbac";
import { submitPropertyForApproval } from "@/services/property-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: draftId } = await params;

    // Guard: invalid ObjectId format
    if (!/^[a-f\d]{24}$/i.test(draftId)) {
      return NextResponse.json({ error: "DRAFT_NOT_FOUND: Invalid draft ID format" }, { status: 404 });
    }

    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();

    // Pass the actual authenticated context to the service function
    const result = await submitPropertyForApproval(draftId, context!);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error(`[POST /api/properties/${(await params).id}/submit] error:`, error.message);
    return NextResponse.json({ error: error.message || "Failed to submit property" }, { status: 500 });
  }
}
