import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import Lead from "@/models/Lead";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { broadcastEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";

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
      .limit(100);

    return NextResponse.json({ success: true, conversations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/conversations — create or get existing conversation for a lead / group pool / direct member
export async function POST(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const body = await req.json();
    const { 
      leadId, 
      leadName, 
      leadPhone, 
      assignee, 
      conversationType = "DIRECT",
      groupPoolKey,
      poolRootPropertyId,
      poolRootPropertyName,
      memberUserId,
      memberPhone,
      memberEmail,
      memberName
    } = body;

    if (!leadId && !groupPoolKey) {
      return NextResponse.json({ success: false, error: "leadId or groupPoolKey required" }, { status: 400 });
    }

    const ownership = getOwnershipQuery(context!);
    let conversation: any = null;

    if (conversationType === "GROUP") {
      const groupQuery: any = {
        conversationType: "GROUP",
        $or: [
          ...(groupPoolKey ? [{ groupPoolKey }] : []),
          ...(leadId ? [{ leadId }] : [])
        ],
        ...ownership
      };
      conversation = await Conversation.findOne(groupQuery);

      if (!conversation) {
        // Find corresponding Lead to derive merged members
        let initialParticipants: any[] = [
          {
            userId: context!.userId,
            role: context!.role,
            name: context!.email || 'Builder Team'
          }
        ];

        if (leadId || groupPoolKey) {
          const leadDoc: any = await Lead.findOne({
            $or: [
              ...(leadId ? [{ _id: leadId }] : []),
              ...(groupPoolKey ? [{ groupPoolKey }] : [])
            ]
          }).lean();

          if (leadDoc && Array.isArray(leadDoc.mergedMembers)) {
            for (const m of leadDoc.mergedMembers) {
              if (m.userId || m.visitorId) {
                initialParticipants.push({
                  userId: m.userId || m.visitorId,
                  role: 'buyer',
                  name: m.name,
                  phone: m.phone,
                  email: m.email
                });
              }
            }
          }
        }

        conversation = await Conversation.create({
          conversationType: "GROUP",
          groupPoolKey,
          poolRootPropertyId,
          poolRootPropertyName,
          leadId: leadId || undefined,
          builderId: context!.userId,
          accountId: context!.userId,
          role: context!.role,
          mandateId: context!.mandateId || null,
          leadName: leadName || `${poolRootPropertyName || 'Property'} — Group Buying Pool`,
          leadPhone: leadPhone || '',
          assignee: assignee || context!.email,
          participants: initialParticipants,
          messages: [
            {
              text: `Group Buying Conversation initiated for ${poolRootPropertyName || leadName || 'Pool'}.`,
              sender: "agent",
              senderRole: context!.role,
              senderName: "Builder Team",
              createdAt: new Date()
            }
          ],
          lastMessage: "Group Conversation initiated",
          lastMessageAt: new Date(),
        });
      }
    }
 else if (memberUserId) {
      // Direct Member Chat
      const convKey = `${groupPoolKey || leadId}_${memberUserId}_${context!.userId}`;
      conversation = await Conversation.findOne({
        $or: [
          { conversationKey: convKey },
          { memberUserId, leadId, conversationType: "DIRECT", ...ownership }
        ]
      });

      if (!conversation) {
        conversation = await Conversation.create({
          conversationType: "DIRECT",
          conversationKey: convKey,
          groupPoolKey,
          leadId: leadId || undefined,
          memberUserId,
          memberPhone: memberPhone || leadPhone,
          memberEmail: memberEmail || '',
          builderId: context!.userId,
          accountId: context!.userId,
          role: context!.role,
          mandateId: context!.mandateId || null,
          leadName: memberName || leadName || "Group Member",
          leadPhone: memberPhone || leadPhone || "",
          assignee: assignee || context!.email,
          participants: [
            {
              userId: memberUserId,
              role: "buyer",
              name: memberName || leadName || "Group Member",
              phone: memberPhone || leadPhone,
              email: memberEmail
            },
            {
              userId: context!.userId,
              role: context!.role,
              name: "Builder Team"
            }
          ],
          messages: [
            {
              text: `Direct conversation started with ${memberName || leadName || 'Group Member'}.`,
              sender: "agent",
              senderRole: context!.role,
              senderName: "Builder Team",
              createdAt: new Date()
            }
          ],
          lastMessage: "Direct conversation started",
          lastMessageAt: new Date(),
        });
      }
    } else {
      // Standard individual lead conversation
      conversation = await Conversation.findOne({ leadId, ...ownership });

      if (!conversation) {
        conversation = await Conversation.create({
          conversationType: "DIRECT",
          leadId,
          builderId: context!.userId,
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
      }
    }

    if (conversation) {
      broadcastEvent({
        type: "CONVERSATION_CREATED",
        leadId: leadId?.toString(),
        data: conversation,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ success: true, conversation });
  } catch (error: any) {
    console.error("Builder POST /api/conversations error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
