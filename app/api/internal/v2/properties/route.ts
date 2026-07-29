import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import Builder from '@/models/Builder';
import User from '@/models/User';

// GET /api/internal/v2/properties — Secure Internal S2S API returning live property data for Admin
export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-internal-secret');
    if (!secret || secret !== (process.env.INTERNAL_API_SECRET || 'astronix_realty_secure_internal_api_secret_2026')) {
      return NextResponse.json({ error: 'Unauthorized internal request' }, { status: 401 });
    }

    await dbConnect();

    // Fetch all root properties (parentId: null) that are not deleted and not in draft status
    const rootProperties = await Property.find({
      parentId: null,
      isDeleted: false,
    }).lean();

    const formattedProperties = await Promise.all(
      rootProperties.map(async (prop: any) => {
        let builderName = 'Unknown Builder';
        if (prop.builderId) {
          try {
            const builderDoc = await Builder.findById(prop.builderId).lean();
            if (builderDoc) {
              builderName = (builderDoc as any).companyName || (builderDoc as any).fullName || (builderDoc as any).email || 'Unknown Builder';
            } else {
              const userDoc = await User.findById(prop.builderId).lean();
              if (userDoc) {
                builderName = (userDoc as any).profile?.companyName || (userDoc as any).profile?.fullName || (userDoc as any).profile?.developerName || (userDoc as any).email || 'Unknown Builder';
              }
            }
          } catch (e) {
            // Silently continue
          }
        }

        const details = prop.details || {};
        const township = details.township || {};
        const locationStr = `${township.city || prop.location?.city || ''}, ${township.state || prop.location?.state || ''}`.replace(/^, |, $/g, '') || township.address || prop.location?.address || 'Location N/A';

        const typeMap: Record<string, string> = {
          'township': 'Township',
          'project': 'Standalone Project',
          'tower': 'Tower',
          'Township': 'Township',
          'Standalone Project': 'Standalone Project',
          'Tower': 'Tower',
        };

        return {
          id: prop._id.toString(),
          externalId: prop._id.toString(),
          title: prop.name || township.name || 'Untitled Property',
          builder: builderName,
          builderId: prop.builderId?.toString() || '',
          builderExternalId: prop.builderId?.toString() || '',
          builderName: builderName,
          location: locationStr,
          price: township.totalValue ? `₹${township.totalValue}` : (prop.details?.totalValue ? `₹${prop.details.totalValue}` : 'Price on Request'),
          type: typeMap[prop.type] || 'Township',
          units: details.generatedUnits?.length || prop.calculatedCounts?.unitsCount || 0,
          area: township.totalArea || '0',
          currentStage: prop.status === 'published' ? 'Published' : (prop.status === 'approved' ? 'Approved' : 'Initial Review'),
          status: prop.status || 'draft',
          snapshot: details,
          approvalChain: [{
            stage: 'Initial Review',
            status: prop.status || 'pending',
            reviewer: null,
            date: prop.updatedAt || null,
            notes: 'Fetched dynamically from Builder service API',
          }],
          createdAt: prop.createdAt,
          updatedAt: prop.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: formattedProperties.length,
      properties: formattedProperties,
    });
  } catch (error: any) {
    console.error('[Internal V2 Properties] Error fetching properties:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
