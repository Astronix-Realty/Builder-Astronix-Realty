import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { broadcastEvent } from '@/lib/sse';
import mongoose from 'mongoose';

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

    // Sanitize builderId to prevent Mongoose CastError on invalid strings
    const validBuilderObjectId = (builderId && mongoose.isValidObjectId(builderId))
      ? new mongoose.Types.ObjectId(builderId)
      : undefined;

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
          builderId: validBuilderObjectId,
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
            builderId: validBuilderObjectId,
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

    const isSpecificDoubtLead = (
      leadType === 'specific-doubt' ||
      source === 'visitor-specific-doubt' ||
      Boolean(body.question) ||
      (typeof requirement === 'string' && requirement.includes('Specific Doubt'))
    );
    const isUserAuthenticated = (body.loginStatus === 'authenticated' || Boolean(body.userId));
    const resolvedLeadType = isSpecificDoubtLead ? 'specific-doubt' : (leadType || 'normal');
    const resolvedSource = isSpecificDoubtLead ? 'visitor-specific-doubt' : (source || 'Astronix Website');

    // Check for duplicate individual lead (strictly exclude Group Buying Pool leads)
    const phone10 = phone.replace(/\D/g, '').slice(-10);
    const identityOrConditions: any[] = [];
    if (phone10) {
      identityOrConditions.push(
        { phone },
        { phone: phone10 },
        { phone: `+91${phone10}` },
        { phone: `+91 ${phone10}` },
        { phone: new RegExp(`${phone10}$`) }
      );
    }
    if (body.userId) {
      if (mongoose.isValidObjectId(body.userId)) {
        identityOrConditions.push({ userId: new mongoose.Types.ObjectId(body.userId) });
      }
      identityOrConditions.push({ userId: body.userId }, { visitorId: body.userId });
    }
    if (body.visitorId && body.visitorId !== body.userId) {
      if (mongoose.isValidObjectId(body.visitorId)) {
        identityOrConditions.push({ visitorId: new mongoose.Types.ObjectId(body.visitorId) });
      }
      identityOrConditions.push({ visitorId: body.visitorId });
    }
    if (email) {
      identityOrConditions.push({ email: email.toString().trim().toLowerCase() });
    }

    const duplicateConditions: any[] = [
      { isArchived: { $ne: true } },
      { isGroup: { $ne: true } }, // Strictly isolate from Group Buying Pool
      { $or: identityOrConditions }
    ];

    if (validBuilderObjectId) {
      duplicateConditions.push({
        $or: [
          { builderId: validBuilderObjectId },
          { accountId: validBuilderObjectId },
        ]
      });
    }

    const existingLead = await Lead.findOne({ $and: duplicateConditions });

    if (existingLead) {
      // Classification: Logged-in user + Specific Doubt = Connected Lead. Never regress to Fresh.
      let targetStatus = existingLead.status || 'Fresh';
      if (existingLead.status === 'Token VIP' || isTokenPaid) {
        targetStatus = 'Token VIP';
      } else if (isUserAuthenticated && isSpecificDoubtLead) {
        if (targetStatus === 'Fresh') {
          targetStatus = 'Connected';
        }
      }

      const statusTransitionNote = (existingLead.status !== targetStatus)
        ? ` [Status updated from ${existingLead.status} to ${targetStatus}]`
        : '';

      const newAttemptsCount = ((existingLead as any).attemptsCount || 1) + 1;
      const currentLeadTypes = Array.isArray((existingLead as any).leadTypes) && (existingLead as any).leadTypes.length > 0
        ? (existingLead as any).leadTypes
        : [existingLead.leadType || 'normal'];
      const updatedLeadTypes = Array.from(new Set([...currentLeadTypes, resolvedLeadType || 'normal']));

      (existingLead as any).attemptsCount = newAttemptsCount;
      (existingLead as any).hasRepeatedEnquiry = true;
      (existingLead as any).lastEnquiryAt = new Date();
      (existingLead as any).leadTypes = updatedLeadTypes;
      existingLead.status = targetStatus;
      existingLead.source = resolvedSource;
      existingLead.leadType = resolvedLeadType;
      existingLead.loginStatus = isUserAuthenticated ? 'authenticated' : (existingLead.loginStatus || 'guest');
      if (body.userId) (existingLead as any).userId = body.userId;
      if (body.visitorId) (existingLead as any).visitorId = body.visitorId;
      if (requirement) existingLead.requirement = requirement;
      if (isTokenPaid) {
        existingLead.isTokenPaid = true;
        (existingLead as any).tokenAmount = Number(body.tokenAmount) || (existingLead as any).tokenAmount || 0;
      }

      const interactionEntry = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: resolvedLeadType || 'normal',
        title: `Re-Enquiry Attempt #${newAttemptsCount}: ${isSpecificDoubtLead ? 'Specific Doubt Submitted' : `Repeat inquiry from ${resolvedSource}`}`,
        desc: `${body.question || requirement || `Property: ${propertyTitle || 'Unknown'}`}${statusTransitionNote}`,
        date: new Date(),
        details: body.question || requirement || '',
        source: resolvedSource,
        propertyTitle: propertyTitle || '',
        unitNumber: body.hierarchyContext?.unitNumber || (existingLead as any).unitNumber || ''
      };

      if (!Array.isArray((existingLead as any).interactions)) {
        (existingLead as any).interactions = [];
      }
      (existingLead as any).interactions.unshift(interactionEntry);

      existingLead.timeline.unshift({
        title: `🔁 Re-Enquiry (#${newAttemptsCount}) - ${isSpecificDoubtLead ? 'Specific Doubt Submitted' : `Repeat inquiry from ${resolvedSource}`}`,
        desc: `${body.question || requirement || `Property: ${propertyTitle || 'Unknown'}`}${statusTransitionNote} [Total attempts: ${newAttemptsCount}]`,
        type: 'system',
        date: new Date(),
      });

      if (body.question) {
        if (!Array.isArray(existingLead.notes)) existingLead.notes = [];
        existingLead.notes.unshift(`🔁 [Attempt #${newAttemptsCount}] Visitor Query: "${body.question}"`);
      }

      if (body.hierarchyContext) {
        existingLead.hierarchyContext = body.hierarchyContext;
        if (body.hierarchyContext.unitId) existingLead.unitId = body.hierarchyContext.unitId;
        if (body.hierarchyContext.unitNumber) existingLead.unitNumber = body.hierarchyContext.unitNumber;
      }

      await existingLead.save();

      broadcastEvent({
        type: "LEAD_UPDATED",
        leadId: existingLead._id.toString(),
        role: existingLead.role,
        accountId: existingLead.accountId?.toString(),
        builderId: existingLead.builderId?.toString(),
        mandateId: existingLead.mandateId?.toString(),
        data: existingLead,
        timestamp: Date.now()
      });

      console.log(`[Internal] Consolidated lead for ${phone} (builder: ${builderId}). Attempts: ${newAttemptsCount}, status: ${targetStatus}`);
      return NextResponse.json({ success: true, duplicate: true, leadId: existingLead._id.toString(), status: targetStatus });
    }

    // Create new individual lead
    const initialStatus = (isUserAuthenticated && isSpecificDoubtLead)
      ? 'Connected'
      : (isTokenPaid ? 'Token VIP' : (body.status || 'Fresh'));

    const lead = await Lead.create({
      name,
      phone,
      email: email || '',
      builderId: validBuilderObjectId,
      source: resolvedSource,
      status: initialStatus,
      requirement: requirement || '',
      budget: budget || '',
      isTokenPaid: isTokenPaid || false,
      isGroup: false,
      leadType: resolvedLeadType,
      attemptsCount: 1,
      hasRepeatedEnquiry: false,
      lastEnquiryAt: new Date(),
      leadTypes: [resolvedLeadType || 'normal'],
      interactions: [{
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: resolvedLeadType || 'normal',
        title: isSpecificDoubtLead ? 'Specific Doubt Submitted' : `Lead received from ${resolvedSource}`,
        desc: body.question || requirement || `Property: ${propertyTitle || 'Unknown'}. Type: ${resolvedLeadType}`,
        date: new Date(),
        details: body.question || requirement || '',
        source: resolvedSource,
        propertyTitle: propertyTitle || '',
        unitNumber: body.hierarchyContext?.unitNumber || ''
      }],
      loginStatus: isUserAuthenticated ? 'authenticated' : (body.loginStatus || 'guest'),
      userId: body.userId || undefined,
      visitorId: body.visitorId || undefined,
      hierarchyContext: body.hierarchyContext || undefined,
      unitId: body.hierarchyContext?.unitId || undefined,
      unitNumber: body.hierarchyContext?.unitNumber || undefined,
      notes: body.question ? [`Visitor Query: "${body.question}"`] : [],
      timeline: [{
        title: isSpecificDoubtLead ? 'Specific Doubt Submitted' : `Lead received from ${resolvedSource}`,
        desc: body.question || requirement || `Property: ${propertyTitle || 'Unknown'}. Type: ${resolvedLeadType}`,
        type: 'system',
        date: new Date(),
      }],
    });

    broadcastEvent({
      type: "LEAD_CREATED",
      leadId: lead._id.toString(),
      role: lead.role,
      accountId: lead.accountId?.toString(),
      builderId: lead.builderId?.toString(),
      mandateId: lead.mandateId?.toString(),
      data: lead,
      timestamp: Date.now()
    });

    console.log(`[Internal] New lead created: ${name} (${phone}) for builder ${builderId} with status: ${initialStatus}`);

    return NextResponse.json({ success: true, leadId: lead._id.toString(), status: initialStatus });
  } catch (error: any) {
    console.error('[Internal] Error receiving lead:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
