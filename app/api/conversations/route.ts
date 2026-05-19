import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { broadcastEvent } from "@/lib/sse";

// GET /api/conversations — list all conversations for a builder
export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();

    // Query isolation by tenancy
    const query: any = {
      ...getOwnershipQuery(context!)
    };

    const conversations = await Conversation.find(query)
      .sort({ isPinned: -1, lastMessageAt: -1 })
      .select("-messages") // Don't send all messages in list view
      .limit(50);

    return NextResponse.json({ success: true, conversations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/conversations — create or get existing conversation for a lead
export async function POST(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const { leadId, leadName, leadPhone, assignee } = await req.json();

    if (!leadId) {
      return NextResponse.json({ success: false, error: "leadId required" }, { status: 400 });
    }

    // Upsert — find or create under the isolated tenant boundary
    let conversation = await Conversation.findOne({ leadId, ...getOwnershipQuery(context!) });

    if (!conversation) {
      conversation = await Conversation.create({
        leadId,
        builderId: context!.userId, // legacy compatibility
        accountId: context!.userId,
        role: context!.role,
        mandateId: context!.mandateId || null,
        leadName,
        leadPhone,
        assignee: assignee || context!.email,
        messages: [],
        lastMessage: "Conversation started",
        lastMessageAt: new Date(),
      });

      broadcastEvent({
        type: "CONVERSATION_CREATED",
        leadId,
        data: conversation,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ success: true, conversation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
