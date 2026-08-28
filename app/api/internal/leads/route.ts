import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';

// POST /api/internal/leads — Receive visitor leads from Visitor panel
export async function POST(req: NextRequest) {
  try {
    // Validate internal secret
    const secret = req.headers.get('x-internal-secret');
    if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      eventId,
      name,
      phone,
      email,
      builderId,
      propertyId,
      propertyTitle,
      source,
      leadType,
      groupSize,
      groupDiscount,
      isTokenPaid,
      requirement,
      budget,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'name and phone are required' }, { status: 400 });
    }

    await dbConnect();

    // Idempotency check
    if (eventId) {
      const ProcessedEvent = (await import('@/models/ProcessedEvent')).default;
      const existing = await ProcessedEvent.findOne({ eventId });
      if (existing) {
        return NextResponse.json({ success: true, idempotent: true });
      }
      await ProcessedEvent.create({ eventId, sourcePanel: 'visitor', eventType: 'LEAD_SYNC' });
    }

    const isGroupLead = leadType === 'group-buying' || leadType === 'group' || Boolean(body.isGroup);
    const poolRootPropertyId = body.hierarchyContext?.poolRootPropertyId || body.hierarchyContext?.townshipId || body.hierarchyContext?.projectId || body.hierarchyContext?.towerId || propertyId || '';
    const poolRootPropertyName = body.hierarchyContext?.poolRootPropertyName || body.hierarchyContext?.topPropertyName || propertyTitle || 'Property';
    const groupPoolKey = (body.groupPoolKey || body.hierarchyContext?.groupPoolKey || `${builderId || 'builder'}_${poolRootPropertyId}_group_buying`).toLowerCase();

    if (isGroupLead) {
      // Find existing group pool
      const existingGroupPool = await Lead.findOne({
        isGroup: true,
        $or: [
          { groupPoolKey: groupPoolKey },
          { groupPoolKey: `${builderId || 'builder'}_${poolRootPropertyId}_group_buying`.toUpperCase() },
          { poolRootPropertyId: poolRootPropertyId },
          ...(propertyTitle ? [{ propertyTitle }] : [])
        ]
      });

      const memberMembershipId = `mem_${body.userId || Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const memberObj = {
        membershipId: memberMembershipId,
        userId: body.userId || body.visitorId || '',
        visitorId: body.visitorId || '',
        name,
        phone,
        email: email || '',
        loginStatus: body.loginStatus || 'authenticated',
        clickedLevel: body.hierarchyContext?.level || 'Property',
        clickedPropertyId: propertyId || '',
        clickedPropertyName: propertyTitle || poolRootPropertyName,
        joinedAt: new Date(),
        updatedAt: new Date(),
        status: 'Fresh',
        leadStatus: 'Fresh'
      };

      let finalLeadId = '';
      if (existingGroupPool) {
        let members: any[] = Array.isArray(existingGroupPool.mergedMembers) ? [...existingGroupPool.mergedMembers] : [];
        const existingIdx = members.findIndex((m: any) => 
          (body.userId && m.userId === body.userId) || (m.phone && m.phone === phone)
        );

        if (existingIdx >= 0) {
          members[existingIdx] = { 
            ...members[existingIdx], 
            membershipId: members[existingIdx].membershipId || memberMembershipId,
            name, 
            email: email || members[existingIdx].email, 
            updatedAt: new Date() 
          };
        } else {
          members.push(memberObj);
        }

        existingGroupPool.mergedMembers = members;
        existingGroupPool.groupSize = members.length;
        existingGroupPool.status = 'Fresh';
        existingGroupPool.groupPoolKey = groupPoolKey;
        existingGroupPool.timeline.unshift({
          title: 'Member Joined Group Buying',
          desc: `${name} (+91 ${phone}) joined Group Buying pool for ${poolRootPropertyName}. Total Pool: ${members.length} buyers.`,
          type: 'system',
          date: new Date()
        });

        await existingGroupPool.save();
        finalLeadId = existingGroupPool._id.toString();
        console.log(`[Internal] Aggregated member ${name} into Group Pool ${existingGroupPool._id}`);
      } else {
        // Create new Group Pool
        const newGroupLead = await Lead.create({
          name: `${poolRootPropertyName} — Group Buying Pool`,
          phone,
          email: email || '',
          builderId: builderId || undefined,
          source: source || 'Group Buying',
          status: 'Fresh',
          requirement: requirement || `Group Buying: ${groupDiscount || 'Bulk Discount'} on ${poolRootPropertyName}`,
          budget: budget || '',
          isTokenPaid: isTokenPaid || false,
          isGroup: true,
          leadType: 'group-buying',
          groupPoolKey,
          poolRootLevel: body.hierarchyContext?.poolRootLevel || 'Project',
          poolRootPropertyId,
          poolRootPropertyName,
          groupSize: 1,
          groupDiscount: groupDiscount || 'Extra Discount Unlocked',
          mergedMembers: [memberObj],
          loginStatus: body.loginStatus || 'authenticated',
          visitorId: body.visitorId || undefined,
          hierarchyContext: body.hierarchyContext || undefined,
          timeline: [{
            title: 'Group Buying Pool Created',
            desc: `Initial buyer ${name} (+91 ${phone}) joined Group Buying pool for ${poolRootPropertyName}.`,
            type: 'system',
            date: new Date(),
          }],
        });
        finalLeadId = newGroupLead._id.toString();
        console.log(`[Internal] Created new Group Pool ${newGroupLead._id} for ${poolRootPropertyName}`);
      }

      // Auto-ensure GROUP conversation
      try {
        const Conversation = (await import('@/models/Conversation')).default;
        const conv = await Conversation.findOne({
          conversationType: 'GROUP',
          $or: [
            { groupPoolKey },
            { leadId: finalLeadId }
          ]
        });

        const newPart = {
          userId: body.userId || body.visitorId || phone,
          role: 'buyer',
          name,
          phone,
          email: email || ''
        };

        if (conv) {
          const hasP = Array.isArray(conv.participants) && conv.participants.some((p: any) => p.userId === newPart.userId || p.phone === phone);
          if (!hasP) {
            conv.participants.push(newPart);
            conv.updatedAt = new Date();
            await conv.save();
          }
        } else {
          await Conversation.create({
            conversationType: 'GROUP',
            groupPoolKey,
            poolRootPropertyId,
            poolRootPropertyName,
            leadId: finalLeadId,
            leadName: `${poolRootPropertyName} — Group Buying Pool`,
            leadPhone: phone,
            builderId: builderId || undefined,
            assignee: 'Team',
            participants: [
              newPart,
              {
                userId: builderId || 'builder-team',
                role: 'builder',
                name: 'Astronix Realty Team',
              }
            ],
            messages: [{
              text: `Group Buying Pool established for "${poolRootPropertyName}". Welcome to all participating buyers!`,
              sender: 'agent',
              senderRole: 'builder',
              senderName: 'Astronix Realty Team',
              createdAt: new Date()
            }],
            lastMessage: `Group Buying Pool established for "${poolRootPropertyName}".`,
            lastMessageAt: new Date(),
          });
        }
      } catch (convErr) {
        console.error('[Internal Sync] Conversation auto-ensure notice:', convErr);
      }

      return NextResponse.json({ success: true, leadId: finalLeadId, isGroup: true });
    }

    // Check for duplicate individual lead (same phone + same builder)
    const existingLead = await Lead.findOne({
      phone,
      builderId: builderId || undefined,
    });

    if (existingLead) {
      existingLead.timeline.push({
        title: `Repeat inquiry from ${source || 'Astronix Website'}`,
        desc: `Property: ${propertyTitle || 'Unknown'}. Type: ${leadType || 'normal'}`,
        type: 'system',
        date: new Date(),
      });
      if (body.hierarchyContext) {
        existingLead.hierarchyContext = body.hierarchyContext;
        if (body.hierarchyContext.unitId) existingLead.unitId = body.hierarchyContext.unitId;
        if (body.hierarchyContext.unitNumber) existingLead.unitNumber = body.hierarchyContext.unitNumber;
      }
      await existingLead.save();

      console.log(`[Internal] Duplicate lead updated for ${phone} (builder: ${builderId})`);
      return NextResponse.json({ success: true, duplicate: true, leadId: existingLead._id.toString() });
    }

    // Create new individual lead
    const lead = await Lead.create({
      name,
      phone,
      email: email || '',
      builderId: builderId || undefined,
      source: source || 'Astronix Website',
      status: 'Fresh',
      requirement: requirement || '',
      budget: budget || '',
      isTokenPaid: isTokenPaid || false,
      isGroup: false,
      leadType: leadType || 'normal',
      loginStatus: body.loginStatus || 'guest',
      visitorId: body.visitorId || undefined,
      hierarchyContext: body.hierarchyContext || undefined,
      unitId: body.hierarchyContext?.unitId || undefined,
      unitNumber: body.hierarchyContext?.unitNumber || undefined,
      timeline: [{
        title: `Lead received from ${source || 'Astronix Website'}`,
        desc: `Property: ${propertyTitle || 'Unknown'}. Type: ${leadType || 'normal'}`,
        type: 'system',
        date: new Date(),
      }],
    });

    console.log(`[Internal] New lead created: ${name} (${phone}) for builder ${builderId}`);

    return NextResponse.json({ success: true, leadId: lead._id.toString() });
  } catch (error: any) {
    console.error('[Internal] Error receiving lead:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
