import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Feedback from "@/models/Feedback";
import { checkRBAC } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate', 'teamLeader']);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const body = await req.json();
    const { feedbackType, message, attachments } = body;

    if (!feedbackType || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const feedback = new Feedback({
      user: context!.userId,
      userModel: 'Builder', // In the builder app, users are Builders or Mandates (but mapped to Builder model for auth often, or we just use 'Builder')
      feedbackType,
      message,
      attachments: attachments || [],
    });

    await feedback.save();

    return NextResponse.json({ success: true, feedback }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating feedback:", error);
    return NextResponse.json({ error: error.message || "Failed to submit feedback" }, { status: 500 });
  }
}
