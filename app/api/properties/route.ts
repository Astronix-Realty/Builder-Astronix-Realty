import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

// GET /api/properties - Fetch all ROOT properties (Townships or Standalone Projects) for the user
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();

    // Fetch properties where parentId is null (usually Townships)
    const properties = await Property.find({ 
      builderId: decoded.userId,
      parentId: null,
      isDeleted: false
    }).sort({ updatedAt: -1 });

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
    const { type, parentId, name, slug, location, status, details } = body;

    if (!type || !name) {
      return NextResponse.json({ error: "Type and name are required." }, { status: 400 });
    }

    await dbConnect();

    // Auto-generate slug if not provided logically (simplified)
    const baseSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const finalSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    const newProperty = await Property.create({
      builderId: decoded.userId,
      type,
      parentId: parentId || null,
      name,
      slug: finalSlug,
      location: location || {},
      status: status || "draft",
      details: details || {},
      createdBy: decoded.userId,
      updatedBy: decoded.userId
    });

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

