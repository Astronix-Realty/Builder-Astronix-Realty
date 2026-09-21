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
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate', 'teamLeader']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const rawLead = await Lead.findOne({ 
      _id: id, 
      ...getOwnershipQuery(context!),
      isArchived: { $ne: true } 
    });

    if (!rawLead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    const leadObj: any = rawLead.toObject ? rawLead.toObject() : { ...rawLead };

    try {
      const userIds = new Set<string>();
      const emails = new Set<string>();
      const phones = new Set<string>();

      if (leadObj.userId && mongoose.isValidObjectId(leadObj.userId)) userIds.add(leadObj.userId.toString());
      if (leadObj.visitorId && mongoose.isValidObjectId(leadObj.visitorId)) userIds.add(leadObj.visitorId.toString());
      if (leadObj.email) emails.add(leadObj.email.toLowerCase().trim());
      if (leadObj.phone) {
        const cp = leadObj.phone.replace(/\D/g, '').slice(-10);
        if (cp) phones.add(cp);
      }

      if (Array.isArray(leadObj.mergedMembers)) {
        leadObj.mergedMembers.forEach((m: any) => {
          if (m.userId && mongoose.isValidObjectId(m.userId)) userIds.add(m.userId.toString());
          if (m.visitorId && mongoose.isValidObjectId(m.visitorId)) userIds.add(m.visitorId.toString());
          if (m.email) emails.add(m.email.toLowerCase().trim());
          if (m.phone) {
            const cp = m.phone.replace(/\D/g, '').slice(-10);
            if (cp) phones.add(cp);
          }
        });
      }

      const userOrConditions: any[] = [];
      if (userIds.size > 0) userOrConditions.push({ _id: { $in: Array.from(userIds).map(uid => new mongoose.Types.ObjectId(uid)) } });
      if (emails.size > 0) userOrConditions.push({ email: { $in: Array.from(emails) } });
      if (phones.size > 0) {
        Array.from(phones).forEach(p => {
          userOrConditions.push({ phone: p });
          userOrConditions.push({ phone: `+91${p}` });
          userOrConditions.push({ phone: `+91 ${p}` });
          userOrConditions.push({ phone: `+91-${p}` });
          userOrConditions.push({ phone: new RegExp(`${p}$`) });
        });
      }

      if (userOrConditions.length > 0) {
        let userDocs: any[] = [];
        try {
          const { connectVisitorDB } = await import('@/lib/db');
          const visitorConn = await connectVisitorDB();
          const visitorUserCol = visitorConn.db?.collection('users');
          if (visitorUserCol) {
            userDocs = await visitorUserCol.find({ $or: userOrConditions }).toArray();
          }
        } catch (e) {
          console.error("Error batch fetching visitor users for lead detail:", e);
        }

        if (userDocs.length === 0) {
          try {
            const rawUserCol = mongoose.connection.db?.collection('users');
            if (rawUserCol) {
              userDocs = await rawUserCol.find({ $or: userOrConditions }).toArray();
            }
          } catch (e) {}
        }

        const userMapById = new Map<string, any>();
        const userMapByEmail = new Map<string, any>();
        const userMapByPhone = new Map<string, any>();

          userDocs.forEach((u: any) => {
            if (u._id) userMapById.set(u._id.toString(), u);
            if (u.email) userMapByEmail.set(u.email.toLowerCase().trim(), u);
            if (u.phone) {
              const cp = u.phone.toString().replace(/\D/g, '').slice(-10);
              if (cp) userMapByPhone.set(cp, u);
              userMapByPhone.set(u.phone.toString().trim(), u);
            }
          });

          const leadUser = (leadObj.userId && userMapById.get(leadObj.userId.toString())) ||
                           (leadObj.visitorId && userMapById.get(leadObj.visitorId.toString())) ||
                           (leadObj.email && userMapByEmail.get(leadObj.email.toLowerCase().trim())) ||
                           (leadObj.phone && userMapByPhone.get(leadObj.phone.replace(/\D/g, '').slice(-10)));

          if (leadUser) {
            leadObj.avatar = leadObj.avatar || leadUser.profilePhoto || leadUser.avatar || leadUser.photo || leadUser.profile?.photo || leadUser.profile?.avatar || "";
            leadObj.username = leadObj.username || leadUser.username || (leadUser.email ? leadUser.email.split('@')[0] : "") || "";
          }

          if (Array.isArray(leadObj.mergedMembers)) {
            leadObj.mergedMembers = leadObj.mergedMembers.map((m: any) => {
              const memberUser = (m.userId && userMapById.get(m.userId.toString())) ||
                                 (m.visitorId && userMapById.get(m.visitorId.toString())) ||
                                 (m.email && userMapByEmail.get(m.email.toLowerCase().trim())) ||
                                 (m.phone && userMapByPhone.get(m.phone.replace(/\D/g, '').slice(-10)));

              const avatar = m.avatar || m.photo || m.profilePhoto || memberUser?.profilePhoto || memberUser?.avatar || memberUser?.photo || memberUser?.profile?.photo || memberUser?.profile?.avatar || "";
              const username = m.username || memberUser?.username || (m.email ? m.email.split('@')[0] : (memberUser?.email ? memberUser.email.split('@')[0] : "")) || "";
              const name = m.name || memberUser?.fullName || memberUser?.name || "Buyer";

              return {
                ...m,
                name,
                avatar,
                photo: avatar,
                profilePhoto: avatar,
                username
              };
            });
          }
        }
    } catch (e) {
      console.error("Error enriching single lead:", e);
    }

    return NextResponse.json({ success: true, lead: leadObj });
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
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate', 'teamLeader']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const body = await req.json();
    const { status, assignee, notes, interestedUnit, actionType, actionDesc, nextActionTime, groupSize, mergedMembers, isUnitHeld, isUnitSold, unitId, propertyId } = body;

    let lead = await Lead.findOne({ 
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

    if (interestedUnit !== undefined) {
      lead.interestedUnit = interestedUnit;
      isModified = true;
    }

    if (isUnitHeld !== undefined) {
      lead.isUnitHeld = Boolean(isUnitHeld);
      isModified = true;
    }

    if (isUnitSold !== undefined) {
      lead.isUnitSold = Boolean(isUnitSold);
      isModified = true;
    }

    if (unitId !== undefined) {
      lead.unitId = unitId;
      isModified = true;
    }

    if (propertyId !== undefined) {
      lead.propertyId = propertyId;
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
      try {
        await lead.save();
      } catch (saveErr: any) {
        if (saveErr.name === 'VersionError') {
          console.warn(`[DB] VersionError encountered on lead ${id}, falling back to atomic update...`);
          const updateDoc: any = {};
          const pushDoc: any = {};

          if (status) updateDoc.status = status;
          if (assignee) updateDoc.assignee = assignee;
          if (interestedUnit !== undefined) updateDoc.interestedUnit = interestedUnit;
          if (isUnitHeld !== undefined) updateDoc.isUnitHeld = Boolean(isUnitHeld);
          if (isUnitSold !== undefined) updateDoc.isUnitSold = Boolean(isUnitSold);
          if (unitId !== undefined) updateDoc.unitId = unitId;
          if (propertyId !== undefined) updateDoc.propertyId = propertyId;
          if (nextActionTime) updateDoc.nextActionTime = new Date(nextActionTime);
          if (groupSize !== undefined) updateDoc.groupSize = groupSize;
          if (mergedMembers !== undefined) updateDoc.mergedMembers = mergedMembers;

          const timelineEntries: any[] = [];
          if (!actionType && status && status !== lead.status) {
            timelineEntries.push({
              title: "Status Updated",
              desc: `Status changed to ${status}`,
              type: "system",
              date: new Date()
            });
          }
          if (actionType) {
            timelineEntries.push({
              title: actionType,
              desc: actionDesc || "Action performed",
              type: actionType.toLowerCase().includes("call") ? "call" :
                    actionType.toLowerCase().includes("visit") ? "visit" : "system",
              date: new Date()
            });
          }
          if (notes) {
            pushDoc.notes = notes;
            timelineEntries.push({
              title: "Note Added",
              desc: notes,
              type: "note",
              date: new Date()
            });
          }
          if (timelineEntries.length > 0) {
            pushDoc.timeline = { $each: timelineEntries, $position: 0 };
          }

          const mongoOps: any = {};
          if (Object.keys(updateDoc).length > 0) mongoOps.$set = updateDoc;
          if (Object.keys(pushDoc).length > 0) mongoOps.$push = pushDoc;

          lead = await Lead.findByIdAndUpdate(id, mongoOps, { new: true });
        } else {
          throw saveErr;
        }
      }

      if (lead) {
        broadcastEvent({
          type: "LEAD_UPDATED",
          leadId: lead._id.toString(),
          data: lead,
          timestamp: Date.now()
        });
        console.log("[DB] Lead updated successfully in MongoDB:", id);
      }
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
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate', 'teamLeader']);
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
      timestamp: Date.now()
    } as any);

    broadcastEvent({
      type: "CONVERSATION_CREATED",
      leadId: id,
      timestamp: Date.now()
    } as any);

    return NextResponse.json({ success: true, message: "Lead and associated chats permanently deleted" });
  } catch (error: any) {
    console.error("Error archiving lead:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
