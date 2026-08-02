import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { broadcastEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";

// GET /api/conversations/[id]/messages — get full message history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const conversation = await Conversation.findOne({
      _id: id,
      ...getOwnershipQuery(context!)
    });

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found or unauthorized" }, { status: 404 });
    }

    if (conversation.unreadCount > 0) {
      conversation.unreadCount = 0;
      await conversation.save();
    }

    return NextResponse.json({ success: true, messages: conversation.messages, conversation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/conversations/[id]/messages — send a new message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const { text, sender, senderName } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ success: false, error: "Message text required" }, { status: 400 });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      ...getOwnershipQuery(context!)
    });
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found or unauthorized" }, { status: 404 });
    }

    const newMessage = {
      text: text.trim(),
      sender,
      senderName: senderName || (sender === "agent" ? "Team" : conversation.leadName),
      createdAt: new Date(),
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    if (sender === "lead") {
      conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    }

    await conversation.save();

    const savedMsg = conversation.messages[conversation.messages.length - 1];

    broadcastEvent({
      type: "MESSAGE_SENT",
      conversationId: id,
      leadId: conversation.leadId?.toString(),
      data: { ...savedMsg.toObject(), conversationId: id },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, message: savedMsg });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
