import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { slugify, generateRandomSlug } from "@/lib/utils/slug";

// GET /api/properties - Fetch root properties for the authenticated builder.
// Optional query param: ?status=draft|active|archived
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status"); // e.g. "draft", "active"

    // Root entities: parentId is null (townships and standalone projects/towers)
    const query: Record<string, any> = {
      builderId: decoded.userId,
      parentId: null,
      isDeleted: false,
    };

    if (statusFilter) {
      query.status = statusFilter; // narrow to draft / active / archived
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[GET /api/properties] query:", JSON.stringify(query));
    }

    const rawProperties = await Property.find(query).sort({ updatedAt: -1 }).lean();
    
    // Process properties to attach accurate counts and thumbnails
    const properties = await Promise.all(rawProperties.map(async (p: any) => {
      // 1. Handle Active/Published/Pending properties (Split DB rows)
      if (p.status !== "draft") {
        let projectsCount = 0, towersCount = 0, unitsCount = 0;
        let thumbnail = p.details?.heroImage || null;

        if (p.type === 'township') {
           const projects = await Property.find({ parentId: p._id, isDeleted: false }, '_id details.heroImage details.heroImages').lean();
           projectsCount = projects.length;
           
           const projectIds = projects.map(proj => proj._id);
           const towers = await Property.find({ parentId: { $in: projectIds }, isDeleted: false }, '_id details.heroImage details.id').lean();
           towersCount = towers.length;
           
           const towerObjectIds = towers.map(t => t._id);
           if (towerObjectIds.length > 0) unitsCount = await Unit.countDocuments({ towerId: { $in: towerObjectIds } });

           // Deep thumbnail resolution for Township
           if (!thumbnail) {
             // Try first project's hero image
             thumbnail = projects.find(proj => (proj.details as any)?.heroImage)?.details?.heroImage || 
                         projects.find(proj => (proj.details as any)?.heroImages?.[0])?.details?.heroImages?.[0];
             
             // If still no thumbnail, try first tower's hero image
             if (!thumbnail) {
               thumbnail = towers.find(tow => (tow.details as any)?.heroImage)?.details?.heroImage;
             }
           }

        } else if (p.type === 'project') {
           projectsCount = 1;
           const towers = await Property.find({ parentId: p._id, isDeleted: false }, '_id details.heroImage details.id').lean();
           towersCount = towers.length;

           const towerObjectIds = towers.map(t => t._id);
           if (towerObjectIds.length > 0) unitsCount = await Unit.countDocuments({ towerId: { $in: towerObjectIds } });

           // Deep thumbnail resolution for Project
           if (!thumbnail) {
             thumbnail = towers.find(tow => (tow.details as any)?.heroImage)?.details?.heroImage;
           }

        } else if (p.type === 'tower') {
           projectsCount = 0;
           towersCount = 1;
           unitsCount = await Unit.countDocuments({ towerId: p._id });
        }

        return { 
          ...p, 
          calculatedCounts: { projectsCount, towersCount, unitsCount }, 
          thumbnail: thumbnail || null,
          totalValue: p.details?.totalValue || 0,
          location: p.location?.city || p.location?.address || 'Location N/A'
        };
      } 
      
      // 2. Handle Draft properties (Fully contained WizardState snapshot)
      else {
        const details = p.details || {};
        const township = details.township || {};
        const projects = details.projects || [];
        const towers = details.towers || [];
        
        // Resolve thumbnail from draft snapshot
        const thumbnail = township.heroImage || 
                          projects.find((pr: any) => pr?.heroImage)?.heroImage ||
                          towers.find((tw: any) => tw?.heroImage)?.heroImage || 
                          null;

        const projectsCount = projects.length;
        const towersCount = towers.length;
        const unitsCount = details.generatedUnits?.length || 0;

        return { 
          ...p, 
          thumbnail,
          calculatedCounts: { projectsCount, towersCount, unitsCount },
          townshipName: township.name || p.name,
          location: township.city || township.address || p.location?.city || 'Location N/A',
          totalValue: township.totalValue || 0
        };
      }
    }));

    if (process.env.NODE_ENV !== "production") {
      console.log(`[GET /api/properties] returned ${properties.length} docs.`);
    }

    return NextResponse.json({ properties }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch properties error:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

// POST /api/properties - Create a new property sequentially
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const { type, flowType, parentId, name, slug, location, status, details } = body;

    if (!type || !name) {
      return NextResponse.json({ error: "Type and name are required." }, { status: 400 });
    }

    // flowType is always sent by useAutoDraft, but derive a safe fallback
    // from `type` if it's somehow absent (legacy callers, tests, etc.).
    const resolvedFlowType: string = flowType || type;
    if (process.env.NODE_ENV !== "production" && !flowType) {
      console.warn(`[POST /api/properties] flowType missing for type='${type}' — defaulting to '${resolvedFlowType}'`);
    }

    await dbConnect();

    let newProperty = null;
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      try {
        const finalSlug = generateRandomSlug(name, slug || "");

        newProperty = await Property.create({
          builderId: decoded.userId,
          type,
          flowType: resolvedFlowType,
          parentId: parentId || null,
          name,
          slug: finalSlug,
          location: location || {},
          status: status || "draft",
          details: details || {},
          createdBy: decoded.userId,
          updatedBy: decoded.userId
        });
        break; // Success!
      } catch (err: any) {
        lastError = err;
        // Check for duplicate key error (usually 11000)
        if (err.code === 11000) {
          attempts++;
          console.warn(`[POST /api/properties] Slug collision on attempt ${attempts}. Retrying...`);
        } else {
          throw err; // Re-throw other errors
        }
      }
    }

    if (!newProperty) {
      throw lastError || new Error("Failed to create property after max attempts");
    }

    return NextResponse.json({ success: true, property: newProperty }, { status: 201 });
  } catch (error: any) {
    console.error("Create property error:", error.message);
    
    // Catch Mongoose Validation Errors (like parentId rules)
    if (error.name === 'ValidationError' || error.message.includes('Validation') || error.message.includes('Hierarchy')) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: error.message } }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
