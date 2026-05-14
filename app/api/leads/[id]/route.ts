import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { broadcastEvent } from "@/lib/sse";
import mongoose from "mongoose";

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isValidId(params.id)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }
  try {
    await dbConnect();
    const lead = await Lead.findOne({ _id: params.id, isArchived: { $ne: true } });

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
  { params }: { params: { id: string } }
) {
  if (!isValidId(params.id)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }
  try {
    await dbConnect();
    const body = await req.json();
    const { status, assignee, notes, interestedUnit, actionType, actionDesc } = body;

    const lead = await Lead.findOne({ _id: params.id, isArchived: { $ne: true } });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    let isModified = false;

    // Prepare activity log if status or other fields changed
    if (status && status !== lead.status) {
      lead.timeline.unshift({
        title: "Status Updated",
        desc: `Status changed from ${lead.status} to ${status}`,
        type: "system",
        date: new Date()
      });
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

    // Log manual actions if provided
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

    if (isModified) {
      await lead.save();
      // Broadcast SSE Event
      broadcastEvent({
        type: "LEAD_UPDATED",
        leadId: lead._id.toString(),
        data: lead,
        timestamp: Date.now()
      });
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
  { params }: { params: { id: string } }
) {
  if (!isValidId(params.id)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }
  try {
    await dbConnect();
    const lead = await Lead.findOne({ _id: params.id, isArchived: { $ne: true } });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Soft delete
    lead.isArchived = true;
    await lead.save();

    // Broadcast SSE Event
    broadcastEvent({
      type: "LEAD_DELETED",
      leadId: lead._id.toString(),
      timestamp: Date.now()
    });

    return NextResponse.json({ success: true, message: "Lead archived successfully" });
  } catch (error: any) {
    console.error("Error archiving lead:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
