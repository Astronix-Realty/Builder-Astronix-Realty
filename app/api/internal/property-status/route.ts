import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';

// POST /api/internal/property-status — Receive property approval/rejection from Admin panel
export async function POST(req: NextRequest) {
  try {
    // Validate internal secret
    const secret = req.headers.get('x-internal-secret');
    if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { externalId, status, message } = body;

    if (!externalId || !status) {
      return NextResponse.json({ error: 'externalId and status are required' }, { status: 400 });
    }

    await dbConnect();

    const updateData: any = {};

    if (status === 'approved') {
      updateData.status = 'published';
      updateData.isActive = true;
      updateData.approvedAt = new Date();
      updateData.rejectionReason = null;
    } else if (status === 'rejected') {
      updateData.status = 'rejected';
      updateData.isActive = false;
      updateData.rejectionReason = message || 'Property rejected by admin.';
    }

    // Find by _id since externalId is the Builder panel's property _id
    const property = await Property.findByIdAndUpdate(
      externalId,
      { $set: updateData },
      { new: true }
    );

    if (!property) {
      console.error(`[Internal] Property not found for externalId: ${externalId}`);
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    console.log(`[Internal] Property ${property.name} status updated to: ${status}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Internal] Error updating property status:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
