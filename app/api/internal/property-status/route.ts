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
    } else if (['delisted', 'draft', 'withdrawn'].includes(targetStatus)) {
      updateData.status = 'draft';
      updateData.isActive = false;
      updateData.rejectionReason = message || 'Property delisted by admin.';
    }

    const title = body.title || body.name || body.townshipName;
    const targetIdStr = String(externalId);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(targetIdStr);

    // Stage 1: Search by ID
    let property = await Property.findOneAndUpdate(
      {
        $or: [
          { externalId: targetIdStr },
          { id: targetIdStr },
          ...(isValidObjectId ? [{ _id: targetIdStr }] : []),
        ],
      },
      { $set: updateData },
      { new: true }
    );

    // Stage 2: Fallback search by title / name if ID lookup fails (Admin ID vs Builder ID mismatch)
    if (!property && title) {
      const cleanTitle = String(title).trim();
      const escapedTitle = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      property = await Property.findOneAndUpdate(
        {
          $or: [
            { name: { $regex: new RegExp(`^${escapedTitle}$`, 'i') } },
            { townshipName: { $regex: new RegExp(`^${escapedTitle}$`, 'i') } },
          ],
          isDeleted: false,
        },
        { $set: { ...updateData, externalId: targetIdStr } },
        { new: true }
      );
    }

    if (!property) {
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
