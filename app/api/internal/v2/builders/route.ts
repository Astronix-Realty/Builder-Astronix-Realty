import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Builder from '@/models/Builder';
import Mandate from '@/models/Mandate';

// GET /api/internal/v2/builders — Secure Internal S2S API returning live Builder & Mandate profiles for Admin
export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-internal-secret');
    if (!secret || secret !== (process.env.INTERNAL_API_SECRET || 'astronix_realty_secure_internal_api_secret_2026')) {
      return NextResponse.json({ error: 'Unauthorized internal request' }, { status: 401 });
    }

    await dbConnect();

    // Fetch all builder and mandate accounts that are active/pending and not deleted
    const builderUsers = await User.find({
      role: { $in: ['builder', 'mandate'] },
      isDeleted: false,
    }).lean();

    const formattedBuilders = await Promise.all(
      builderUsers.map(async (user: any) => {
        let bProfile: any = null;
        let mProfile: any = null;

        if (user.role === 'builder' && user.builderId) {
          bProfile = await Builder.findById(user.builderId).lean();
        } else if (user.role === 'mandate' && user.mandateId) {
          mProfile = await Mandate.findById(user.mandateId).lean();
        }

        const mergedProfile = {
          ...(user.profile || {}),
          ...(bProfile || {}),
          ...(mProfile || {}),
        };

        const name = mergedProfile.developerName || mergedProfile.fullName || mergedProfile.companyName || user.email;
        const company = mergedProfile.companyName || name;
        const phone = mergedProfile.phone || user.phone || '';
        const logo = mergedProfile.logo || '';
        const externalId = user._id.toString();
        const status = user.approvalStatus || user.status || 'pending';

        return {
          id: externalId,
          externalId,
          name: name || user.email,
          email: user.email.toLowerCase(),
          company: company || name || user.email,
          phone: phone,
          logo: logo,
          type: user.role,
          status: status,
          verified: status === 'approved',
          developerName: mergedProfile.developerName || '',
          fullName: mergedProfile.fullName || '',
          address: mergedProfile.address || '',
          description: mergedProfile.description || mergedProfile.developerDescription || mergedProfile.mandateDescription || '',
          reraNumber: mergedProfile.reraNumber || '',
          website: mergedProfile.website || '',
          establishedYear: mergedProfile.establishedYear || '',
          tagline: mergedProfile.tagline || '',
          state: mergedProfile.state || '',
          reraCertificate: mergedProfile.reraCertificate || '',
          operatingCities: mergedProfile.operatingCities || mergedProfile.city || '',
          experience: mergedProfile.experience || '',
          aboutCompany: mergedProfile.aboutCompany || '',
          specialization: mergedProfile.specialization || '',
          panNumber: mergedProfile.panNumber || '',
          aadharNumber: mergedProfile.aadharNumber || '',
          preferredAreas: mergedProfile.preferredAreas || '',
          joinDate: user.createdAt || new Date(),
          profile: mergedProfile,
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: formattedBuilders.length,
      builders: formattedBuilders,
    });
  } catch (error: any) {
    console.error('[Internal V2 Builders] Error fetching builder accounts:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
