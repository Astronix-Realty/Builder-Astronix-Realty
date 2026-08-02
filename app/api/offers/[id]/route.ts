import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Offer from "@/models/Offer";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const { id } = await params;

    const offer = await Offer.findOne({
      _id: id,
      ...getOwnershipQuery(context!)
    }).lean();

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json({ offer }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch offer error:", error);
    return NextResponse.json({ error: "Failed to fetch offer" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const body = await req.json();

    // Prevent overwriting ownership
    delete body.builderId;
    delete body.accountId;
    delete body.mandateId;
    delete body.role;
    delete body.createdBy;

    body.updatedBy = context!.userId;
    const { id } = await params;

    const offer = await Offer.findOneAndUpdate(
      { _id: id, ...getOwnershipQuery(context!) },
      { $set: body },
      { new: true }
    );

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, offer }, { status: 200 });
  } catch (error: any) {
    console.error("Update offer error:", error);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const { id } = await params;

    const offer = await Offer.findOneAndDelete({
      _id: id,
      ...getOwnershipQuery(context!)
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Delete offer error:", error);
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
  }
}
