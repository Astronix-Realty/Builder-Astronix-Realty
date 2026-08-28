import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import Lead from "@/models/Lead";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { broadcastEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";

// Helper to extract property hero image
function extractPropertyImage(propDoc: any): string {
  if (!propDoc) return "";
  const d = propDoc.details || {};
  let img = 
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

  if (!img) {
    const str = JSON.stringify(propDoc);
    const matches = str.match(/https?:\/\/[^"\s]+\.(?:jpg|jpeg|png|webp|avif)/gi);
    if (matches && matches.length > 0) img = matches[0];
  }
  return img || "";
}

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

    const rawConversations = await Conversation.find(query)
      .sort({ isPinned: -1, lastMessageAt: -1 })
      .select("-messages") // Don't send all messages in list view
      .lean()
      .limit(100);

    // Collect Property IDs and names to fetch Property documents in a single batch query
    const propIds = rawConversations.map((c: any) => c.poolRootPropertyId).filter(Boolean);
    const propNames = rawConversations.map((c: any) => {
      const name = c.poolRootPropertyName || c.leadName || '';
      return name.replace(/\s*—\s*Group Buying Pool/i, '').trim();
    }).filter(Boolean);

    const PropertyModel = (await import("@/models/Property")).default;
    const propDocs = await PropertyModel.find({
      $or: [
        ...(propIds.length > 0 ? [{ _id: { $in: propIds } }] : []),
        ...(propNames.length > 0 ? [{ name: { $in: propNames } }] : [])
      ]
    }).lean();

    const propMapById = new Map();
    const propMapByName = new Map();
    propDocs.forEach((p: any) => {
      propMapById.set(p._id.toString(), p);
      if (p.name) propMapByName.set(p.name.toLowerCase().trim(), p);
      if (p.details?.township?.name) propMapByName.set(p.details.township.name.toLowerCase().trim(), p);
    });

    const conversations = rawConversations.map((conv: any) => {
      const cleanName = (conv.poolRootPropertyName || conv.leadName || '').replace(/\s*—\s*Group Buying Pool/i, '').trim().toLowerCase();
      const propDoc = (conv.poolRootPropertyId && propMapById.get(conv.poolRootPropertyId.toString())) || propMapByName.get(cleanName);
      const propertyImage = extractPropertyImage(propDoc);

      return {
        ...conv,
        propertyImage: propertyImage || "",
        poolRootPropertyThumbnail: propertyImage || "",
      };
    });

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

    const cleanPoolKey = groupPoolKey ? groupPoolKey.toLowerCase().trim() : undefined;
    const ownership = getOwnershipQuery(context!);
    let conversation: any = null;

    if (conversationType === "GROUP") {
      const groupQuery: any = {
        conversationType: "GROUP",
        $or: [
          ...(cleanPoolKey ? [{ groupPoolKey: cleanPoolKey }] : []),
          ...(leadId ? [{ leadId }] : [])
        ],
        ...ownership
      };
      conversation = await Conversation.findOne(groupQuery);

      // Find corresponding Lead to derive/sync merged members
      let currentParticipants: any[] = [
        {
          userId: context!.userId,
          role: context!.role,
          name: context!.email || 'Builder Team'
        }
      ];

      if (leadId || cleanPoolKey) {
        const leadDoc: any = await Lead.findOne({
          $or: [
            ...(leadId ? [{ _id: leadId }] : []),
            ...(cleanPoolKey ? [{ groupPoolKey: cleanPoolKey }] : [])
          ]
        }).lean();

        if (leadDoc && Array.isArray(leadDoc.mergedMembers)) {
          for (const m of leadDoc.mergedMembers) {
            if (m.userId || m.visitorId || m.phone) {
              currentParticipants.push({
                userId: m.userId || m.visitorId || m.phone,
                role: 'buyer',
                name: m.name || 'Group Buyer',
                phone: m.phone || '',
                email: m.email || ''
              });
            }
          }
        }
      }

      if (!conversation) {
        conversation = await Conversation.create({
          conversationType: "GROUP",
          groupPoolKey: cleanPoolKey,
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
          participants: currentParticipants,
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
      } else {
        // Heal / synchronize participants list
        await Conversation.updateOne(
          { _id: conversation._id },
          { 
            $set: { 
              participants: currentParticipants,
              groupPoolKey: cleanPoolKey || conversation.groupPoolKey,
              updatedAt: new Date() 
            } 
          }
        );
      }
    } else if (memberUserId) {
      // Direct Member Chat
      const convKey = `${cleanPoolKey || leadId}_${memberUserId}_${context!.userId}`;
      conversation = await Conversation.findOne({
        $or: [
          { conversationKey: convKey },
          { memberUserId, groupPoolKey: cleanPoolKey, conversationType: "DIRECT", ...ownership },
          { memberUserId, leadId, conversationType: "DIRECT", ...ownership }
        ]
      });

      if (!conversation) {
        conversation = await Conversation.create({
          conversationType: "DIRECT",
          conversationKey: convKey,
          groupPoolKey: cleanPoolKey,
          poolRootPropertyId,
          poolRootPropertyName,
          leadId: leadId || undefined,
          memberUserId,
          staffUserId: context!.userId,
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
      const eventType = conversationType === "GROUP" 
        ? "GROUP_CONVERSATION_CREATED" 
        : (memberUserId ? "DIRECT_CONVERSATION_CREATED" : "CONVERSATION_CREATED");

      broadcastEvent({
        type: eventType,
        leadId: leadId?.toString(),
        conversationId: conversation._id.toString(),
        role: context!.role,
        builderId: context!.userId,
        mandateId: context!.mandateId || undefined,
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
