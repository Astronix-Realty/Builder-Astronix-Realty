import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Builder from '@/models/Builder';
import Mandate from '@/models/Mandate';

// Ensure models are registered for populate
const _models = [Builder, Mandate];

// GET /api/internal/v2/builders — Return all builder and mandate accounts to Admin Panel
export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-internal-secret');
    const expectedSecret = process.env.INTERNAL_API_SECRET;

    if (!secret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const users = await User.find({
      role: { $in: ['builder', 'mandate'] },
      isDeleted: { $ne: true },
    })
      .populate('builderId')
      .populate('mandateId')
      .sort({ createdAt: -1 })
      .lean();

    const builders = users.map((u: any) => {
      const bProfile = u.builderId || {};
      const mProfile = u.mandateId || {};
      const companyName = bProfile.companyName || mProfile.companyName || u.profile?.companyName || u.profile?.fullName || '';
      const name = bProfile.developerName || mProfile.fullName || companyName || u.email;
      const status = u.approvalStatus || 'pending';

      return {
        id: u._id.toString(),
        externalId: u._id.toString(),
        _id: u._id.toString(),
        email: u.email,
        name: name,
        company: companyName,
        phone: bProfile.phone || mProfile.phone || u.profile?.phone || '',
        logo: bProfile.logo || mProfile.logo || u.profile?.logo || '',
        type: u.role,
        userType: u.role,
        status: status, // 'pending' | 'approved' | 'rejected'
        approvalStatus: status,
        verified: status === 'approved',
        rejectionMessage: u.approvalMessage || '',
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json({
      count: builders.length,
      builders: builders,
    });
  } catch (error: any) {
    console.error('[Internal v2 Builders GET Error]:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
