import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import User from '@/models/User';
import Builder from '@/models/Builder';
import Mandate from '@/models/Mandate';

// Register models for populate
const _models = [User, Builder, Mandate];

// In-memory cache for ultra-fast S2S responses to Admin Panel
let cachedResponse: { count: number; properties: any[] } | null = null;
let lastCacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min TTL

export function invalidateInternalPropertiesCache() {
  cachedResponse = null;
  lastCacheTimestamp = 0;
}

// GET /api/internal/v2/properties — Serve live properties queue from Builder DB to Admin Panel
export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-internal-secret');
    const expectedSecret = process.env.INTERNAL_API_SECRET;

    if (!secret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';
    const now = Date.now();
    if (!forceRefresh && cachedResponse && now - lastCacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json(cachedResponse);
    }

    await dbConnect();

    // Query 4 root townships/projects with full details (excluding heavy PDFs), and child projects/towers with lightweight projection
    const [rootProperties, childProperties] = await Promise.all([
      Property.find({
        parentId: null,
        isDeleted: { $ne: true },
      })
        .select('-details.brochure -details.rawBrochure -details.pdfBuffer -details.brochurePdf')
        .populate({
          path: 'builderId',
          select: 'name companyName developerName role mandateId builderId logo profile',
        })
        .lean(),
      Property.find({
        parentId: { $ne: null },
        isDeleted: { $ne: true },
      })
        .select('name type status parentId details.tag details.tagType details.priceRangeMin details.priceRangeMax')
        .lean(),
    ]);

    const allProperties = [...rootProperties, ...childProperties];

    allProperties.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
      
    const allUnits: any[] = [];

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
        floor: `${u.floorNumber || u.floor || 1} Floor`,
        status: (u.status || 'available').toLowerCase(),
        config: u.configuration || u.type || '',
        price: u.price || 'N/A',
        priceValue,
        priceLabel: priceValue ? fmtPrice(priceValue) : '',
        allInclusivePrice: u.allInclusivePrice || priceValue,
        area: u.area || u.carpetArea || 'N/A',
        carpet: u.carpetArea || u.area || 'N/A',
        balcony: u.builtUpArea || 'N/A',
        facing: u.facing || 'N/A',
        vastuDetails: u.vastuDetails || null,
        roomDimensions: u.roomDimensions || [],
      };
    };

    const getUnitsForTower = (towerId: string) => {
      return allUnits
        .filter((u: any) => u.towerId?.toString() === towerId || u.parentId?.toString() === towerId)
        .map((u: any) => mapUnit(u));
    };

    const getEmbeddedUnits = (candidateIds: (string | undefined)[], ...sources: any[]) => {
      const validIds = candidateIds.filter(Boolean).map(String);
      if (validIds.length === 0) return [];
      const src = sources.find((s) => Array.isArray(s?.generatedUnits) && s.generatedUnits.length > 0);
      return (src?.generatedUnits || [])
        .filter((u: any) => validIds.includes(String(u.towerId || '')) || validIds.includes(String(u.tower || '')))
        .map((u: any) => mapUnit(u, true));
    };

    const formatTower = (t: any, rootDetails: any = null, embeddedProjectId?: string) => {
      const own = t.details || {};
      const wiz = pickWizard('towers', rootDetails, own);
      const towerList: any[] = wiz?.towers || [];
      const genTowerList: any[] = rootDetails?.generatedTowers || own.generatedTowers || [];
      const allPossibleTowers = [...towerList, ...genTowerList];

      const emb =
        (embeddedProjectId && allPossibleTowers.find((x: any) => sameName(x.name || x.towerName, t.name) && x.projectId === embeddedProjectId)) ||
        allPossibleTowers.find((x: any) => x.id === t.id || x.id === t._id?.toString()) ||
        allPossibleTowers.find((x: any) => sameName(x.name || x.towerName, t.name)) ||
        null;
      const embId: string | undefined = emb?.id;

      let units = getUnitsForTower(t._id ? t._id.toString() : (t.id || ''));
      if (units.length === 0) {
        units = getEmbeddedUnits([embId, t.id, t._id ? t._id.toString() : undefined], rootDetails, own);
      }

      const tuc = embId ? (wiz?.towerUnitConfigs || []).find((c: any) => c.towerId === embId) : null;

      const range =
        mkRange(emb?.priceRangeMin, emb?.priceRangeMax) ||
        rangeFromPrices(configPrices(tuc?.configurations)) ||
        mkRange(own.priceRangeMin, own.priceRangeMax) ||
        rangeFromPrices(units.map((u: any) => u.priceValue));

      const rawName = t.name || t.towerName || emb?.name || emb?.towerName || '';
      const resolvedName = rawName && !rawName.toLowerCase().startsWith('untitled') ? rawName : (emb?.name || 'Tower ' + (t.id?.slice(-1) || '1'));

      return {
        id: t._id ? t._id.toString() : (t.id || embId || 'tower-node'),
        name: resolvedName,
        desc: own.description || t.description || `${t.totalFloors || 20} Floors Building`,
        status: t.status || 'active',
        totalFloors: t.totalFloors || t.totalFloorsNum || 20,
        ...withLabel(range),
        propertyUnits: units,
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
        tag: own.tag || own.tagType || 'Phase',
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
        const wizardProjects: any[] = docDetails.projects || [];
        if (wizardProjects.length > 0) {
          // Resolve canonical projects from docDetails.projects (Deduplicated single source of truth)
          projects = wizardProjects.map((wp: any) => {
            const allTowersSource = [
              ...(docDetails.towers || []),
              ...(docDetails.generatedTowers || [])
            ];
            const matchedTowers = allTowersSource.filter(
              (tw: any) => tw.projectId === wp.id || tw.parentProjectId === wp.id || tw.projectId === wp.name
            );

            // Deduplicate towers by name
            const seenTowerNames = new Set<string>();
            const uniqueTowers: any[] = [];
            for (const tw of (matchedTowers.length > 0 ? matchedTowers : (wp.towers || []))) {
              const rawName = tw.name || tw.towerName || 'Tower';
              const normName = rawName.trim().toLowerCase();
              if (!seenTowerNames.has(normName) && !normName.startsWith('untitled')) {
                seenTowerNames.add(normName);
                uniqueTowers.push(tw);
              }
            }

            const formattedTowers = uniqueTowers.map((tw: any) => {
              const rawName = tw.name || tw.towerName || 'Tower';
              const candidateIds = [tw.id, tw._id?.toString(), ...(docDetails.generatedTowers || []).filter((gt: any) => gt.name === rawName).map((gt: any) => gt.id)];
              const units = getEmbeddedUnits(candidateIds, docDetails);
              const range = mkRange(tw.priceRangeMin, tw.priceRangeMax) || rangeFromPrices(units.map((u: any) => u.priceValue));
              return {
                id: tw.id || tw._id?.toString() || `tower-${Math.random().toString(36).substring(2, 7)}`,
                name: rawName,
                desc: tw.description || `${tw.totalFloors || 20} Floors Building`,
                status: tw.status || 'active',
                totalFloors: tw.totalFloors || tw.totalFloorsNum || 20,
                ...withLabel(range),
                propertyUnits: units,
                units,
              };
            });

            const projRange = mkRange(wp.priceRangeMin, wp.priceRangeMax) || mergeRanges(formattedTowers);
            return {
              id: wp.id || wp._id?.toString() || `proj-${Math.random().toString(36).substring(2, 7)}`,
              name: wp.name || wp.projectName || 'Project Phase',
              tag: wp.tagType || wp.tag || 'Phase',
              status: wp.approvalStatus || wp.status || 'active',
              ...withLabel(projRange),
              towers: formattedTowers,
            };
          });
        } else {
          // Fallback to deduplicated childProjects
          const seenNames = new Set<string>();
          projects = childProjects
            .filter((cp: any) => {
              if (cp.parentId?.toString() !== p._id.toString()) return false;
              const n = (cp.name || '').trim().toLowerCase();
              if (seenNames.has(n)) return false;
              seenNames.add(n);
              return true;
            })
            .map((cp: any) => formatProject(cp, docDetails));
        }

        rootRange =
          mkRange(docDetails.township?.priceRangeMin, docDetails.township?.priceRangeMax) ||
          mkRange(docDetails.priceRangeMin, docDetails.priceRangeMax) ||
          mergeRanges(projects || []);
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

    const responsePayload = {
      count: formattedProperties.length,
      properties: formattedProperties,
    };

    cachedResponse = responsePayload;
    lastCacheTimestamp = Date.now();

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('[Internal v2 Properties GET Error]:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
