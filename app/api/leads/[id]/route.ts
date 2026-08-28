import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { broadcastEvent } from "@/lib/sse";
import mongoose from "mongoose";

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const lead = await Lead.findOne({ 
      _id: id, 
      ...getOwnershipQuery(context!),
      isArchived: { $ne: true } 
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const body = await req.json();
    const { status, assignee, notes, interestedUnit, actionType, actionDesc, nextActionTime, groupSize, mergedMembers } = body;

    const lead = await Lead.findOne({ 
      _id: id, 
      ...getOwnershipQuery(context!),
      isArchived: { $ne: true } 
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    let isModified = false;

    if (status && status !== lead.status) {
      // Only push a generic status timeline update if a specific actionType wasn't provided
      if (!actionType) {
        lead.timeline.unshift({
          title: "Status Updated",
          desc: `Status changed from ${lead.status} to ${status}`,
          type: "system",
          date: new Date()
        });
      }
      lead.status = status;
      isModified = true;
    }

    if (assignee && assignee !== lead.assignee) {
      lead.timeline.unshift({
        title: "Lead Assigned",
        desc: `Assigned to ${assignee}`,
        type: "system",
        date: new Date()
      });
      lead.assignee = assignee;
      isModified = true;
    }

    if (interestedUnit) {
      lead.interestedUnit = interestedUnit;
      isModified = true;
    }

    if (notes) {
      lead.notes.push(notes);
      lead.timeline.unshift({
        title: "Note Added",
        desc: notes,
        type: "note",
        date: new Date()
      });
      isModified = true;
    }

    if (actionType) {
      lead.timeline.unshift({
        title: actionType,
        desc: actionDesc || "Action performed",
        type: actionType.toLowerCase().includes("call") ? "call" :
              actionType.toLowerCase().includes("visit") ? "visit" : "system",
        date: new Date()
      });
      isModified = true;
    }

    if (nextActionTime) {
      (lead as any).nextActionTime = new Date(nextActionTime);
      isModified = true;
    }

    if (groupSize !== undefined) {
      lead.groupSize = groupSize;
      isModified = true;
    }

    if (mergedMembers !== undefined) {
      lead.mergedMembers = mergedMembers;
      isModified = true;
    }

    if (isModified) {
      await lead.save();
      broadcastEvent({
        type: "LEAD_UPDATED",
        leadId: lead._id.toString(),
        data: lead,
        timestamp: Date.now()
      });
      console.log("[DB] Lead updated successfully in MongoDB:", id);
    }

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const lead = await Lead.findOne({ 
      _id: id, 
      ...getOwnershipQuery(context!),
      isArchived: { $ne: true } 
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Cascade delete any linked conversations (Group Pool and direct chats for this lead)
    try {
      const ConversationModel = (await import('@/models/Conversation')).default;
      await ConversationModel.deleteMany({
        $or: [
          { leadId: id },
          ...(lead.groupPoolKey ? [{ groupPoolKey: lead.groupPoolKey }] : [])
        ]
      });
    } catch (convDelErr) {
      console.warn("[DELETE /api/leads/[id]] Error deleting associated conversations:", convDelErr);
    }

    await Lead.deleteOne({ _id: id });

    broadcastEvent({
      type: "LEAD_DELETED",
      leadId: id,
      groupPoolKey: lead.groupPoolKey,
      timestamp: Date.now()
    });

    broadcastEvent({
      type: "CONVERSATION_DELETED",
      leadId: id,
      groupPoolKey: lead.groupPoolKey,
      timestamp: Date.now()
    });

    return NextResponse.json({ success: true, message: "Lead and associated chats permanently deleted" });
  } catch (error: any) {
    console.error("Error archiving lead:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
