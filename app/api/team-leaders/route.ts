import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { checkRBAC } from "@/lib/rbac";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// Generate a unique User ID like TL-2024-001
async function generateUserId(builderId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TL-${year}-`;
  const count = await User.countDocuments({
    role: "teamLeader",
    builderId: builderId,
  });
  const seq = String(count + 1).padStart(3, "0");
  return `${prefix}${seq}`;
}

// GET /api/team-leaders — Get all team leaders for this builder
export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder"]);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const builderId = context!.builderId || context!.userId;

    const leaders = await User.find({
      role: "teamLeader",
      builderId: builderId,
      isDeleted: { $ne: true },
    }).select("email profile status createdAt").lean();

    const mapped = leaders.map((u: any) => ({
      id: u._id.toString(),
      name: u.profile?.name || u.email?.split("@")[0] || "Unknown",
      email: u.email,
      phone: u.profile?.phone || "",
      userId: u.profile?.userId || "",
      propertyId: u.profile?.propertyId || "",
      propertyName: u.profile?.propertyName || "",
      status: u.status || "active",
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ success: true, leaders: mapped });
  } catch (error: any) {
    console.error("Error fetching team leaders:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/team-leaders — Create a new Team Leader
export async function POST(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder"]);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const body = await req.json();
    const { name, email, phone, password, propertyId, propertyName } = body;

    if (!name || !email || !phone || !password || !propertyId) {
      return NextResponse.json(
        { error: "Name, email, phone, password, and propertyId are required" },
        { status: 400 }
      );
    }

    const builderId = context!.builderId || context!.userId;

    // Smart email conflict check
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      // Case 1: Same builder's teamLeader → update property assignment
      if (
        existing.role === "teamLeader" &&
        (existing.builderId?.toString() === builderId.toString())
      ) {
        const passwordHash = await bcrypt.hash(password, 12);
        existing.passwordHash = passwordHash;
        existing.profile = {
          ...existing.profile,
          name: name.trim(),
          phone: phone.trim(),
          propertyId,
          propertyName: propertyName || "",
        };
        await existing.save();

        return NextResponse.json({
          success: true,
          message: "Team Leader updated and reassigned to new property",
          leader: {
            id: existing._id.toString(),
            name,
            email: existing.email,
            phone,
            userId: existing.profile?.userId || "",
            propertyId,
            propertyName,
            status: "active",
          },
        });
      }

      // Case 2: Already a teamLeader under a different builder
      if (existing.role === "teamLeader") {
        return NextResponse.json(
          { error: "This email is already a Team Leader under a different builder. Use a different email." },
          { status: 409 }
        );
      }

      // Case 3: Email exists as builder/mandate/admin
      return NextResponse.json(
        { error: `This email is already registered as a '${existing.role}'. Please use a different email address.` },
        { status: 409 }
      );
    }


    // Auto-generate unique user ID
    const userId = await generateUserId(builderId);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const newLeader = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "teamLeader",
      status: "active",
      builderId: builderId,
      profile: {
        name: name.trim(),
        phone: phone.trim(),
        userId,
        propertyId,
        propertyName: propertyName || "",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team Leader created successfully",
      leader: {
        id: newLeader._id.toString(),
        name,
        email: newLeader.email,
        phone,
        userId,
        propertyId,
        propertyName,
        status: "active",
      },
    });
  } catch (error: any) {
    console.error("Error creating team leader:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
