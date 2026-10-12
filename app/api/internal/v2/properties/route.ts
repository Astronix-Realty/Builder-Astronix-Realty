import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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
    const expectedSecret = process.env.INTERNAL_API_SECRET;

    if (!secret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const Unit = mongoose.models.Unit || (await import('@/models/Unit')).default;

    const allProperties = await Property.find({
      isDeleted: { $ne: true },
    })
      .populate({
        path: 'builderId',
        populate: [{ path: 'builderId' }, { path: 'mandateId' }],
      })
      .sort({ createdAt: -1 })
      .lean();
      
    const allUnits = await Unit.find({}).lean();

    const townships = allProperties.filter((p: any) => (!p.parentId || p.parentId === null) && p.type === 'township');
    const standaloneProjects = allProperties.filter((p: any) => (!p.parentId || p.parentId === null) && p.type === 'project');
    const standaloneTowers = allProperties.filter((p: any) => (!p.parentId || p.parentId === null) && p.type === 'tower');
    
    const childProjects = allProperties.filter((p: any) => p.parentId && p.type === 'project');
    const childTowers = allProperties.filter((p: any) => p.parentId && p.type === 'tower');

    // ─── Price helpers (mirror the Builder form's "Display Price Range" logic) ───
    type PriceRange = { min: number; max: number } | null;

    const num = (v: any): number => {
      const n = typeof v === 'string' ? parseFloat(v.replace(/[^\d.]/g, '')) : Number(v);
      return Number.isFinite(n) && n > 0 ? n : 0;
    };

    const fmtPrice = (p: number) => {
      if (p >= 10000000) return `₹${(p / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
      if (p >= 100000) return `₹${(p / 100000).toFixed(0)} L`;
      return `₹${p.toLocaleString('en-IN')}`;
    };

    const mkRange = (min: any, max: any): PriceRange => {
      const a = num(min);
      const b = num(max);
      if (!a && !b) return null;
      return { min: a || b, max: Math.max(a, b) };
    };

    const rangeFromPrices = (prices: number[]): PriceRange => {
      const valid = prices.filter((p) => p > 0);
      return valid.length ? { min: Math.min(...valid), max: Math.max(...valid) } : null;
    };

    const mergeRanges = (items: { priceMin?: number; priceMax?: number }[]): PriceRange =>
      rangeFromPrices(items.flatMap((i) => [num(i.priceMin), num(i.priceMax)]));

    const withLabel = (r: PriceRange) =>
      r
        ? { priceMin: r.min, priceMax: r.max, priceLabel: r.min === r.max ? fmtPrice(r.min) : `${fmtPrice(r.min)} – ${fmtPrice(r.max)}` }
        : { priceMin: 0, priceMax: 0, priceLabel: '' };

    const configPrices = (cfgs: any[] | undefined) =>
      (Array.isArray(cfgs) ? cfgs : []).map((c: any) => num(c?.allInclusivePrice));

    const unitPriceOf = (u: any): number => {
      if (num(u.allInclusivePrice)) return num(u.allInclusivePrice);
      if (num(u.price)) return num(u.price);
      const carpet = num(u.carpetArea || u.area);
      const builtUp = num(u.builtUpArea) || (carpet ? Math.round(carpet * 1.2) : 0);
      return builtUp && num(u.ratePerSqft) ? Math.round(builtUp * num(u.ratePerSqft)) : 0;
    };

    const sameName = (a: any, b: any) =>
      String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

    // Wizard state (projects / towers / towerUnitConfigs) is stored in details of every doc in the hierarchy
    const pickWizard = (key: 'projects' | 'towers', ...sources: any[]) =>
      sources.find((s) => s && Array.isArray(s[key]) && s[key].length > 0) || null;

    const mapUnit = (u: any, isEmbedded = false) => {
      const priceValue = unitPriceOf(u);
      return {
        id: isEmbedded ? (u.id || u.unitNumber) : u._id.toString(),
        unitNumber: u.unitNumber || '',
        floorNum: u.floorNumber || u.floor || 1,
        status: (u.status || 'available').toLowerCase(),
        config: u.configuration || '',
        price: u.price || 'N/A',
        priceValue,
        priceLabel: priceValue ? fmtPrice(priceValue) : '',
        area: u.area || 'N/A',
        carpet: u.carpetArea || 'N/A',
        balcony: u.builtUpArea || 'N/A',
        facing: u.facing || 'N/A',
      };
    };

    const getUnitsForTower = (towerId: string) => {
      return allUnits
        .filter((u: any) => u.towerId?.toString() === towerId || u.parentId?.toString() === towerId)
        .map((u: any) => mapUnit(u));
    };

    const getEmbeddedUnits = (embeddedTowerId: string | undefined, ...sources: any[]) => {
      if (!embeddedTowerId) return [];
      const src = sources.find((s) => Array.isArray(s?.generatedUnits) && s.generatedUnits.length > 0);
      return (src?.generatedUnits || [])
        .filter((u: any) => String(u.towerId || '') === embeddedTowerId)
        .map((u: any) => mapUnit(u, true));
    };

    const formatTower = (t: any, rootDetails: any = null, embeddedProjectId?: string) => {
      const own = t.details || {};
      const wiz = pickWizard('towers', rootDetails, own);
      const towerList: any[] = wiz?.towers || [];
      const emb =
        (embeddedProjectId && towerList.find((x: any) => sameName(x.name || x.towerName, t.name) && x.projectId === embeddedProjectId)) ||
        towerList.find((x: any) => sameName(x.name || x.towerName, t.name)) ||
        null;
      const embId: string | undefined = emb?.id;

      let units = getUnitsForTower(t._id.toString());
      if (units.length === 0) units = getEmbeddedUnits(embId, rootDetails, own);

      const tuc = embId ? (wiz?.towerUnitConfigs || []).find((c: any) => c.towerId === embId) : null;

      const range =
        mkRange(emb?.priceRangeMin, emb?.priceRangeMax) ||
        rangeFromPrices(configPrices(tuc?.configurations)) ||
        mkRange(own.priceRangeMin, own.priceRangeMax) ||
        rangeFromPrices(units.map((u: any) => u.priceValue));

      return {
        id: t._id.toString(),
        name: t.name,
        desc: own.description || 'Tower details',
        status: t.status,
        ...withLabel(range),
        propertyUnits: units, // the admin UI sometimes looks for units on towers
        units,
      };
    };

    const formatProject = (p: any, rootDetails: any = null) => {
      const pTowers = childTowers.filter((t: any) => t.parentId?.toString() === p._id.toString());
      const own = p.details || {};
      const wiz = pickWizard('projects', rootDetails, own);
      const emb = (wiz?.projects || []).find((x: any) => sameName(x.name || x.projectName, p.name)) || null;
      const towers = pTowers.map((t: any) => formatTower(t, rootDetails || own, emb?.id));

      const range =
        mkRange(emb?.priceRangeMin, emb?.priceRangeMax) ||
        mkRange(own.priceRangeMin, own.priceRangeMax) ||
        mergeRanges(towers);

      return {
        id: p._id.toString(),
        name: p.name,
        tag: own.tag || 'Phase',
        status: p.status,
        ...withLabel(range),
        towers,
      };
    };

    const topLevelProps = [...townships, ...standaloneProjects, ...standaloneTowers];

    const formattedProperties = topLevelProps.map((p: any) => {
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

      const userRole = (p.role || builderUser.role || (builderUser.mandateId ? 'mandate' : (p.mandateId ? 'mandate' : 'builder'))).toLowerCase();

      // Attach projects / towers based on type
      let projects: any[] | undefined = undefined;
      let towers: any[] | undefined = undefined;
      let propertyUnits: any[] | undefined = undefined;
      let rootRange: PriceRange = null;

      if (p.type === 'township') {
        projects = childProjects
          .filter((cp: any) => cp.parentId?.toString() === p._id.toString())
          .map((cp: any) => formatProject(cp, docDetails));
        rootRange =
          mkRange(docDetails.township?.priceRangeMin, docDetails.township?.priceRangeMax) ||
          mkRange(docDetails.priceRangeMin, docDetails.priceRangeMax) ||
          mergeRanges(projects);
      } else if (p.type === 'project') {
        towers = childTowers
          .filter((ct: any) => ct.parentId?.toString() === p._id.toString())
          .map((ct: any) => formatTower(ct, docDetails));
        rootRange =
          mkRange(docDetails.project?.priceRangeMin, docDetails.project?.priceRangeMax) ||
          mkRange(docDetails.priceRangeMin, docDetails.priceRangeMax) ||
          mergeRanges(towers);
      } else if (p.type === 'tower') {
        propertyUnits = getUnitsForTower(p._id.toString());
        if (propertyUnits.length === 0 && Array.isArray(docDetails.generatedUnits)) {
          propertyUnits = docDetails.generatedUnits.map((u: any) => mapUnit(u, true));
        }
        rootRange =
          mkRange(docDetails.tower?.priceRangeMin, docDetails.tower?.priceRangeMax) ||
          mkRange(docDetails.priceRangeMin, docDetails.priceRangeMax) ||
          rangeFromPrices(configPrices(docDetails.unitConfig?.configurations || docDetails.unitTemplate?.configurations)) ||
          rangeFromPrices((propertyUnits || []).map((u: any) => u.priceValue));
      }
      const rootPrice = withLabel(rootRange);

      return {
        id: p._id.toString(),
        externalId: p._id.toString(),
        _id: p._id.toString(),
        title: p.name,
        name: p.name,
        slug: p.slug,
        type: typeLabel,
        flowType: p.flowType || p.type,
        role: userRole,
        userRole: userRole,
        source: userRole,
        builderType: userRole,
        isMandate: userRole === 'mandate',
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
        price: rootPrice.priceLabel || p.details?.priceRange || p.details?.startingPrice || 'Price on Request',
        priceMin: rootPrice.priceMin,
        priceMax: rootPrice.priceMax,
        priceLabel: rootPrice.priceLabel,
        units: p.details?.generatedUnits?.length || p.details?.inventoryCount || 0,
        area: p.details?.totalArea || p.details?.plotArea || '0',
        snapshot: p.details || {},
        details: p.details || {},
        rejectionMessage: p.rejectionReason || '',
        submittedAt: p.submittedAt || p.createdAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        projects,
        towers,
        propertyUnits
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
