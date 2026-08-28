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

    let propertyImage = "";
    try {
      const PropertyModel = (await import("@/models/Property")).default;
      let propDoc: any = null;
      if (conversation.poolRootPropertyId) {
        propDoc = await PropertyModel.findById(conversation.poolRootPropertyId).lean();
      }
      if (!propDoc && (conversation.poolRootPropertyName || conversation.leadName)) {
        const cleanName = (conversation.poolRootPropertyName || conversation.leadName).replace(/\s*—\s*Group Buying Pool/i, '').trim();
        propDoc = await PropertyModel.findOne({ name: new RegExp(`^${cleanName}$`, 'i') }).lean();
      }
      if (propDoc) {
        const d = propDoc.details || {};
        propertyImage = 
          propDoc.thumbnail ||
          d.heroImage ||
          d.township?.heroImage ||
          d.projectTemplate?.heroImage ||
          d.towerTemplate?.heroImage ||
          d.township?.galleryImages?.[0] ||
          d.media?.heroImage ||
          d.media?.photos?.[0] ||
          d.photos?.[0] ||
          propDoc.heroImage || "";
      }
    } catch {
      // Safe fallback
    }

    const enrichedConv = {
      ...(conversation.toObject ? conversation.toObject() : conversation),
      propertyImage: propertyImage || "",
      poolRootPropertyThumbnail: propertyImage || ""
    };

    return NextResponse.json({ success: true, messages: conversation.messages, conversation: enrichedConv });
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

    const isStaff = sender === "agent" || sender === "builder" || sender === "mandate";
    let staffAvatar = "";

    if (isStaff) {
      try {
        const UserModel = (await import('@/models/User')).default;
        const userDoc: any = await UserModel.findById(context!.userId).select('profile role builderId mandateId').lean();
        if (userDoc) {
          if (userDoc.profile?.logo) staffAvatar = userDoc.profile.logo;
          else if (userDoc.profile?.photo) staffAvatar = userDoc.profile.photo;
          else if (userDoc.profile?.avatar) staffAvatar = userDoc.profile.avatar;
          else if (userDoc.builderId) {
            const BuilderModel = (await import('@/models/Builder')).default;
            const bDoc: any = await BuilderModel.findById(userDoc.builderId).select('logo').lean();
            if (bDoc?.logo) staffAvatar = bDoc.logo;
          } else if (userDoc.mandateId) {
            const MandateModel = (await import('@/models/Mandate')).default;
            const mDoc: any = await MandateModel.findById(userDoc.mandateId).select('logo').lean();
            if (mDoc?.logo) staffAvatar = mDoc.logo;
          }
        }

        if (!staffAvatar) {
          const BuilderModel = (await import('@/models/Builder')).default;
          const bDoc: any = await BuilderModel.findById(context!.userId).select('logo').lean();
          if (bDoc?.logo) staffAvatar = bDoc.logo;
        }

        if (!staffAvatar) {
          const MandateModel = (await import('@/models/Mandate')).default;
          const mDoc: any = await MandateModel.findById(context!.userId).select('logo').lean();
          if (mDoc?.logo) staffAvatar = mDoc.logo;
        }
      } catch (err) {
        console.warn('Could not resolve staff avatar in builder messages route:', err);
      }
    }

    const newMessage: any = {
      text: text.trim(),
      sender: isStaff ? "agent" : "lead",
      senderId: context!.userId,
      senderRole: context!.role,
      senderName: senderName || (isStaff ? (context!.email || "Builder Team") : conversation.leadName),
      senderAvatar: staffAvatar,
      senderPhoto: staffAvatar,
      createdAt: new Date(),
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    if (!isStaff) {
      conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    }

    await conversation.save();

    const savedMsg = conversation.messages[conversation.messages.length - 1];

    broadcastEvent({
      type: "MESSAGE_SENT",
      conversationId: id,
      leadId: conversation.leadId?.toString(),
      role: context!.role,
      builderId: context!.userId,
      mandateId: context!.mandateId || undefined,
      data: { ...(savedMsg.toObject ? savedMsg.toObject() : savedMsg), conversationId: id, groupPoolKey: conversation.groupPoolKey },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, message: savedMsg });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
