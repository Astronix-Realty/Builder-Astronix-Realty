import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import { invalidateInternalPropertiesCache } from '@/app/api/internal/v2/properties/route';
import mongoose from 'mongoose';

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

    // 1. Find root property matching conditions
    const matchedProperties = await Property.find({ $or: matchConditions, isDeleted: { $ne: true } }).lean();

    if (matchedProperties.length === 0) {
      console.error(`[Internal Correlation:${correlationId}] Property not found for externalId: ${externalId}`);
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // 2. Collect entire hierarchy of child & grandchild properties (projects, towers)
    const allPropertyDocs: any[] = [...matchedProperties];
    let idsToSearch = matchedProperties.map((p: any) => p._id);

    while (idsToSearch.length > 0) {
      const children = await Property.find({
        parentId: { $in: idsToSearch },
        isDeleted: { $ne: true },
      }).select('_id name type parentId publishedId draftId').lean();

      if (children.length === 0) break;
      allPropertyDocs.push(...children);
      idsToSearch = children.map((c: any) => c._id);
    }

    const allPropertyIds = Array.from(new Set(allPropertyDocs.map((d: any) => d._id)));
    const allPropertyIdStrings = allPropertyIds.map(id => id.toString());

    // 3. Atomically update all properties in the hierarchy (Township -> Projects -> Towers)
    const updateResult = await Property.updateMany(
      { _id: { $in: allPropertyIds }, isDeleted: { $ne: true } },
      { $set: updateData }
    );

    // Also update any twin linked documents (publishedId / draftId)
    const twinIds = allPropertyDocs
      .flatMap((d: any) => [d.publishedId, d.draftId])
      .filter((id: any) => id && mongoose.isValidObjectId(id));

    if (twinIds.length > 0) {
      await Property.updateMany(
        { _id: { $in: twinIds }, isDeleted: { $ne: true } },
        { $set: updateData }
      ).catch(() => {});
    }

    // 4. Cascade update to all associated Unit documents
    try {
      const Unit = (await import('@/models/Unit')).default;
      const unitFilter: any = {
        $or: [
          { parentId: { $in: allPropertyIds } },
          { towerId: { $in: [...allPropertyIds, ...allPropertyIdStrings] } },
          { projectId: { $in: [...allPropertyIds, ...allPropertyIdStrings] } },
        ],
        isDeleted: { $ne: true }
      };

      if (['approved', 'published', 'active'].includes(targetStatus)) {
        // For published properties: advance pending/draft units to available while preserving existing bookings/sales
        await Unit.updateMany(
          { ...unitFilter, status: { $in: ['pending', 'draft', 'published'] } },
          {
            $set: {
              status: 'available',
              isActive: true,
              approvedAt: updateData.approvedAt || new Date(),
              rejectionReason: null
            }
          }
        );
      } else if (['rejected', 'revisions'].includes(targetStatus)) {
        await Unit.updateMany(
          unitFilter,
          {
            $set: {
              status: 'rejected',
              isActive: false,
              rejectionReason: updateData.rejectionReason
            }
          }
        );
      } else if (['delisted', 'withdrawn'].includes(targetStatus)) {
        await Unit.updateMany(
          unitFilter,
          {
            $set: {
              status: targetStatus === 'delisted' ? 'delisted' : 'withdrawn',
              isActive: false,
              rejectionReason: updateData.rejectionReason
            }
          }
        );
      }
    } catch (unitErr: any) {
      console.error('[Internal] Error cascading status to units:', unitErr.message);
    }

    const property = matchedProperties[0] as any;

    if (property && updateData.status === 'published') {
      try {
        const User = (await import('@/models/User')).default;
        await User.updateMany(
          {
            role: 'teamLeader',
            $or: [
              { 'profile.propertyName': new RegExp(`^${property.name?.trim() || ''}$`, 'i') },
              { 'profile.propertyId': property._id?.toString() }
            ]
          },
          {
            $set: {
              'profile.propertyId': property._id?.toString(),
              'profile.propertyName': property.name
            }
          }
        );
      } catch (tlErr) {
        console.error('[Internal] Error updating team leader property link:', tlErr);
      }
    }

    console.log(`[Internal Correlation:${correlationId}] Property "${property?.name}" (${externalId}) status updated to: ${updateData.status || targetStatus}`);

    // Invalidate in-memory cache so Admin immediately sees the updated state
    invalidateInternalPropertiesCache();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Internal] Error updating property status:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
