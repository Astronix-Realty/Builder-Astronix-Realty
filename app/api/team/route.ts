import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// GET /api/team — returns all active team members (agents) for a builder or mandate
export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();

    // Query based on ownership isolation
    const query: any = { 
        isDeleted: { $ne: true }, 
        status: "active",
        ...getOwnershipQuery(context!)
    };

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
