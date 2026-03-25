import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

// GET /api/properties/[id] - Fetch a single property
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();

    // Only allow fetching properties owned by the token holder and not deleted
    const property = await Property.findOne({ 
      _id: id,
      builderId: decoded.userId,
      isDeleted: false
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ property }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch property" }, { status: 500 });
  }
}

// PUT /api/properties/[id] - Update a property
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();

    await dbConnect();

    // Protect core fields from being overridden directly
    const updateData = { ...body, updatedBy: decoded.userId };
    delete updateData.builderId; 
    delete updateData.type;

    const property = await Property.findOneAndUpdate(
      { _id: id, builderId: decoded.userId, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!property) {
      return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ property }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }
}

// DELETE /api/properties/[id] - Soft delete a property
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();

    // Soft delete: set isDeleted to true
    const result = await Property.findOneAndUpdate(
      { _id: id, builderId: decoded.userId },
      { $set: { isDeleted: true, updatedBy: decoded.userId } }
    );

    if (!result) {
      return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Property deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}

