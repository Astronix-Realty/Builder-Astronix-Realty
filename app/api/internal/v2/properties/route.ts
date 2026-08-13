import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import User from '@/models/User';
import Builder from '@/models/Builder';
import Mandate from '@/models/Mandate';

// Register models for populate
const _models = [User, Builder, Mandate];

// GET /api/internal/v2/properties — Serve live properties queue from Builder DB to Admin Panel
export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-internal-secret');
    const expectedSecret = process.env.INTERNAL_API_SECRET || 'astronix-internal-2026-xK9mN3pQ';

    if (!secret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const properties = await Property.find({
      isDeleted: { $ne: true },
      $or: [{ parentId: null }, { parentId: { $exists: false } }],
    })
      .populate({
        path: 'builderId',
        populate: [{ path: 'builderId' }, { path: 'mandateId' }],
      })
      .sort({ createdAt: -1 })
      .lean();

    const formattedProperties = properties.map((p: any) => {
      const builderUser = p.builderId || {};
      const bProfile = builderUser.builderId || {};
      const mProfile = builderUser.mandateId || {};
      
      const companyName = bProfile.companyName || mProfile.companyName || builderUser.profile?.companyName || p.details?.companyName || 'Astronix Realty Group';
      const companyLogo = bProfile.logo || mProfile.logo || builderUser.profile?.logo || p.details?.logo || p.details?.companyLogo || '';

      const docDetails = p.details || {};
      const developerPersonName = bProfile.developerName || mProfile.fullName || builderUser.profile?.fullName || builderUser.profile?.developerName || '';
      const formBuilderName = p.builderName || docDetails.builderName || docDetails.township?.builderName || docDetails.township?.developerName || docDetails.project?.builderName || '';

      // builderName is the Developer/Promoter person name (or form builder name if distinct from companyName)
      const builderName = developerPersonName || (formBuilderName && formBuilderName !== companyName ? formBuilderName : '') || (builderUser.email ? builderUser.email.split('@')[0] : 'Promoter / Developer');

      const typeLabel = p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : 'Standalone Project';
      const locStr = p.location ? [p.location.address, p.location.city, p.location.state].filter(Boolean).join(', ') : '';
      
      let statusStr = (p.status || 'pending').toLowerCase();
      if (statusStr === 'published') {
        statusStr = 'approved';
      }

      let stageStr = 'Initial Review';
      if (statusStr === 'approved') {
        stageStr = 'final-approval';
      } else if (statusStr === 'rejected') {
        stageStr = 'admin-review';
      }

      return {
        id: p._id.toString(),
        externalId: p._id.toString(),
        _id: p._id.toString(),
        title: p.name,
        name: p.name,
        slug: p.slug,
        type: typeLabel,
        flowType: p.flowType || p.type,
        status: statusStr, // 'pending' | 'approved' | 'rejected' | 'delisted' | 'draft' | 'withdrawal_requested' | 'withdrawn'
        currentStage: stageStr,
        builderId: builderUser._id ? builderUser._id.toString() : (p.builderId ? p.builderId.toString() : ''),
        builderName: builderName,
        builder: builderName,
        companyName: companyName,
        companyLogo: companyLogo,
        location: locStr || p.location?.city || '',
        city: p.location?.city || '',
        state: p.location?.state || '',
        price: p.details?.priceRange || p.details?.startingPrice || 'Price on Request',
        units: p.details?.generatedUnits?.length || p.details?.inventoryCount || 0,
        area: p.details?.totalArea || p.details?.plotArea || '0',
        snapshot: p.details || {},
        details: p.details || {},
        rejectionMessage: p.rejectionReason || '',
        submittedAt: p.submittedAt || p.createdAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return NextResponse.json({
      count: formattedProperties.length,
      properties: formattedProperties,
    });
  } catch (error: any) {
    console.error('[Internal v2 Properties GET Error]:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
