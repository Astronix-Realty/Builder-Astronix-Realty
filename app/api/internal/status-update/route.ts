import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// POST /api/internal/status-update — Receive approval status from Admin panel
export async function POST(req: NextRequest) {
  try {
    // Validate internal secret
    const secret = req.headers.get('x-internal-secret');
    if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, externalId, email, status, message } = body;

    if ((!externalId && !email) || !status) {
      return NextResponse.json({ error: 'externalId/email and status are required' }, { status: 400 });
    }

    await dbConnect();

    // Idempotency check
    if (eventId) {
      const ProcessedEvent = (await import('@/models/ProcessedEvent')).default;
      const existing = await ProcessedEvent.findOne({ eventId });
      if (existing) {
        return NextResponse.json({ success: true, idempotent: true });
      }
      await ProcessedEvent.create({ eventId, sourcePanel: 'admin', eventType: 'BUILDER_STATUS_UPDATE' });
    }

    const updateData: any = {
      approvalStatus: status, // 'approved' | 'rejected'
    };

    if (status === 'approved') {
      updateData.status = 'active';
      updateData.approvalMessage = '';
    } else if (status === 'rejected') {
      updateData.status = 'active'; // Keep active so they can still see rejection message
      updateData.approvalMessage = message || 'Your account has been rejected by admin.';
    }

    // Flexible query: lookup by _id OR by email
    const filterConditions: any[] = [];
    if (externalId && externalId.match(/^[0-9a-fA-F]{24}$/)) {
      filterConditions.push({ _id: externalId });
    }
    if (email) {
      filterConditions.push({ email: email.toLowerCase() });
    }
    if (externalId && externalId.includes('@')) {
      filterConditions.push({ email: externalId.toLowerCase() });
    }

    const user = await User.findOneAndUpdate(
      { $or: filterConditions },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      console.error(`[Internal] User not found for externalId: ${externalId} / email: ${email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`[Internal] User ${user.email} approval status updated to: ${status}`);

    return NextResponse.json({ success: true, userId: user._id.toString() });
  } catch (error: any) {
    console.error('[Internal] Error updating status:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
