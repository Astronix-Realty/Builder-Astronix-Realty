import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { broadcastEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(req.url);
        const builderId = searchParams.get("builderId");
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const assignee = searchParams.get("assignee");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "200");

        let query: any = { isArchived: { $ne: true } };

        if (builderId) query.builderId = builderId;
        if (status) query.status = status;
        if (assignee && assignee !== "all") query.assignee = { $regex: assignee, $options: "i" };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const skip = (page - 1) * limit;
        const [leads, total] = await Promise.all([
            Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Lead.countDocuments(query)
        ]);

        return NextResponse.json({ 
            success: true, 
            leads,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error: any) {
        console.error("Error fetching leads:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        // Validate required fields
        if (!body.name || !body.phone) {
            return NextResponse.json({
                success: false,
                message: "Name and Phone are required",
            }, { status: 400 });
        }

        // Create the new lead
        const newLead = await Lead.create({
            name: body.name,
            email: body.email?.toLowerCase(),
            phone: body.phone,
            source: body.source || "Website",
            requirement: body.requirement,
            budget: body.budget,
            assignee: body.assignee,
            builderId: body.builderId,
            status: "Fresh",
            timeline: [{
                title: "Lead Created",
                desc: `Created manually via CRM by ${body.assignee || "Team"}`,
                type: "system"
            }]
        });

        broadcastEvent({
            type: "LEAD_CREATED",
            leadId: newLead._id.toString(),
            data: newLead,
            timestamp: Date.now()
        });

        return NextResponse.json({
            success: true,
            message: "Lead created successfully",
            lead: newLead
        }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating lead:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to create lead",
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}
