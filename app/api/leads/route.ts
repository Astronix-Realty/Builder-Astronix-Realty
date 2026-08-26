import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { broadcastEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
        if (errorResponse) return errorResponse;

        await dbConnect();
        
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const assignee = searchParams.get("assignee");
        const leadType = searchParams.get("leadType");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "200");

        // Dynamic isolation query
        let andConditions: any[] = [
            { ...getOwnershipQuery(context!) },
            { isArchived: { $ne: true } }
        ];

        if (status) andConditions.push({ status });
        if (assignee && assignee !== "all") andConditions.push({ assignee: { $regex: assignee, $options: "i" } });
        if (search) {
            andConditions.push({
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ]
            });
        }

        if (leadType === "our") {
            andConditions.push({
                $and: [
                    { source: { $not: /website|astronix|doubt|visitor|group/i } },
                    { leadType: { $not: /group-buying|token-hold|specific-doubt/i } },
                    { status: { $ne: "Token VIP" } },
                    { isTokenPaid: { $ne: true } },
                    { isGroup: { $ne: true } },
                    { $or: [{ groupSize: 0 }, { groupSize: null }, { groupSize: { $exists: false } }] }
                ]
            });
        } else if (leadType === "astronix") {
            andConditions.push({
                $or: [
                    { source: { $regex: /website|astronix|doubt|visitor|group/i } },
                    { leadType: "group-buying" },
                    { leadType: "token-hold" },
                    { leadType: "specific-doubt" },
                    { status: "Token VIP" },
                    { isTokenPaid: true },
                    { isGroup: true },
                    { groupSize: { $gt: 0 } }
                ]
            });
        }

        const query = { $and: andConditions };

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
        const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
        if (errorResponse) return errorResponse;

        await dbConnect();
        const body = await req.json();

        // Validate required fields
        if (!body.name || !body.phone) {
            return NextResponse.json({
                success: false,
                message: "Name and Phone are required",
            }, { status: 400 });
        }

        // Create the new lead with injected tenancy attributes
        const newLead = await Lead.create({
            name: body.name,
            email: body.email?.toLowerCase(),
            phone: body.phone,
            source: body.source || "Website",
            requirement: body.requirement,
            budget: body.budget,
            assignee: body.assignee || context!.email,
            builderId: context!.userId, // legacy compatibility
            accountId: context!.userId,
            role: context!.role,
            mandateId: context!.mandateId || null,
            status: body.status || "Fresh",
            isGroup: body.isGroup || false,
            groupSize: body.groupSize || 0,
            groupDiscount: body.groupDiscount,
            mergedMembers: body.mergedMembers || [],
            timeline: [{
                title: "Lead Created",
                desc: `Created manually via CRM by ${body.assignee || context!.email || "Team"}`,
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
