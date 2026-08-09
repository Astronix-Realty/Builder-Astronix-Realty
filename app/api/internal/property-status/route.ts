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

    const correlationId = req.headers.get('x-correlation-id') || `sync_${Date.now()}`;
    const targetStatus = (status || '').toLowerCase();
    const updateData: any = {};

    if (['approved', 'published', 'active'].includes(targetStatus)) {
      updateData.status = 'published';
      updateData.isActive = true;
      updateData.approvedAt = new Date();
      updateData.rejectionReason = null;
    } else if (['rejected', 'revisions'].includes(targetStatus)) {
      updateData.status = 'rejected';
      updateData.isActive = false;
      updateData.rejectionReason = message || 'Property rejected by admin.';
    } else if (['withdrawn', 'deleted'].includes(targetStatus)) {
      updateData.status = 'withdrawn';
      updateData.isActive = false;
      updateData.rejectionReason = message || 'Property withdrawn / deleted.';
    } else if (['delisted'].includes(targetStatus)) {
      updateData.status = 'delisted';
      updateData.isActive = false;
      updateData.rejectionReason = message || 'Property delisted by admin.';
    } else if (['withdrawal_requested'].includes(targetStatus)) {
      updateData.status = 'withdrawal_requested';
      updateData.isActive = false;
    }

    const title = body.title || body.name || body.townshipName;
    const targetIdStr = String(externalId);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(targetIdStr);

    const matchConditions: any[] = [
      { externalId: targetIdStr },
      { id: targetIdStr },
      ...(isValidObjectId ? [{ _id: targetIdStr }] : []),
    ];

    if (title) {
      const cleanTitle = String(title).trim();
      const escapedTitle = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchConditions.push(
        { name: { $regex: new RegExp(`^${escapedTitle}$`, 'i') } },
        { townshipName: { $regex: new RegExp(`^${escapedTitle}$`, 'i') } }
      );
    }

    const updateResult = await Property.updateMany(
      { $or: matchConditions, isDeleted: false },
      { $set: updateData }
    );

    const property = await Property.findOne({ $or: matchConditions, isDeleted: false });

    if (!property && updateResult.matchedCount === 0) {
      console.error(`[Internal Correlation:${correlationId}] Property not found for externalId: ${externalId}`);
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    console.log(`[Internal Correlation:${correlationId}] Property "${property.name}" (${externalId}) status updated to: ${updateData.status || targetStatus}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Internal] Error updating property status:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
