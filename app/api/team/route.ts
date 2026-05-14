import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// GET /api/team — returns all active team members (agents) for a builder
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const builderId = searchParams.get("builderId");

    const query: any = { isDeleted: { $ne: true }, status: "active" };
    if (builderId) {
      // Match users whose builderId matches OR the builder themselves
      query.$or = [
        { builderId },
        { _id: builderId }
      ];
    }

    const users = await User.find(query)
      .select("profile email role")
      .limit(50);

    // Extract display names from profile or fallback to email prefix
    const members = users.map((u: any) => ({
      id: u._id.toString(),
      name: u.profile?.name || u.profile?.fullName || u.email?.split("@")[0] || "Unknown",
      email: u.email,
      role: u.role,
    }));

    return NextResponse.json({ success: true, members });
  } catch (error: any) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
