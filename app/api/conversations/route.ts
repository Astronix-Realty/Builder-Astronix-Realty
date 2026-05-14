import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import { broadcastEvent } from "@/lib/sse";

// GET /api/conversations — list all conversations for a builder
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const builderId = searchParams.get("builderId");

    const query: any = {};
    if (builderId) query.builderId = builderId;

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
    await dbConnect();
    const { leadId, builderId, leadName, leadPhone, assignee } = await req.json();

    if (!leadId) {
      return NextResponse.json({ success: false, error: "leadId required" }, { status: 400 });
    }

    // Upsert — find or create
    let conversation = await Conversation.findOne({ leadId });

    if (!conversation) {
      conversation = await Conversation.create({
        leadId,
        builderId,
        leadName,
        leadPhone,
        assignee,
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
