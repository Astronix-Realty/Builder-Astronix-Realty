import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import Builder from '@/models/Builder';

// GET /api/internal/export-properties — Return all pending or active root properties for Admin sync
export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-internal-secret');
    if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Query all root properties (parentId: null) that are not deleted and not in draft status
    const rootProperties = await Property.find({
      parentId: null,
      isDeleted: false,
      status: { $ne: 'draft' },
    }).lean();

    // Map properties with builder name
    const formattedProperties = await Promise.all(
      rootProperties.map(async (prop: any) => {
        let builderName = 'Unknown Builder';
        if (prop.builderId) {
          try {
            const builderDoc = await Builder.findById(prop.builderId).lean();
            if (builderDoc) {
              builderName = (builderDoc as any).companyName || (builderDoc as any).fullName || (builderDoc as any).email || 'Unknown Builder';
            }
          } catch (e) {
            // Silently continue
          }
        }

        const details = prop.details || {};
        const township = details.township || {};
        const locationStr = `${township.city || prop.location?.city || ''}, ${township.state || prop.location?.state || ''}`.replace(/^, |, $/g, '') || township.address || prop.location?.address || 'Location N/A';

        return {
          externalId: prop._id.toString(),
          title: prop.name || township.name || 'Untitled Property',
          builder: builderName,
          builderId: prop.builderId?.toString() || '',
          builderExternalId: prop.builderId?.toString() || '',
          location: locationStr,
          price: township.totalValue ? `₹${township.totalValue}` : (prop.details?.totalValue ? `₹${prop.details.totalValue}` : 'Price on Request'),
          type: prop.type || 'township',
          units: details.generatedUnits?.length || prop.calculatedCounts?.unitsCount || 0,
          area: township.totalArea || '',
          status: prop.status || 'draft',
          snapshot: details,
          createdAt: prop.createdAt,
          updatedAt: prop.updatedAt,
        };
      })
    );

    return NextResponse.json({ success: true, count: formattedProperties.length, properties: formattedProperties });
  } catch (error: any) {
    console.error('[Internal Export] Error fetching properties for Admin sync:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
