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

    // Check for duplicate lead (same phone + same builder)
    const existingLead = await Lead.findOne({
      phone,
      builderId: builderId || undefined,
    });

    if (existingLead) {
      // Update existing lead with new interaction
      existingLead.timeline.push({
        title: `Repeat inquiry from ${source || 'Astronix Website'}`,
        desc: `Property: ${propertyTitle || 'Unknown'}. Type: ${leadType || 'normal'}`,
        type: 'system',
        date: new Date(),
      });
      await existingLead.save();

      console.log(`[Internal] Duplicate lead updated for ${phone} (builder: ${builderId})`);
      return NextResponse.json({ success: true, duplicate: true, leadId: existingLead._id.toString() });
    }

    // Create new lead
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
      isGroup: leadType === 'group',
      groupSize: groupSize || 0,
      groupDiscount: groupDiscount || '',
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
