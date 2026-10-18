import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { broadcastEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";

import mongoose from "mongoose";

// Helper to batch-enrich leads and merged members with user profile photos & usernames
async function enrichLeadsWithUserProfiles(rawLeads: any[]) {
    if (!rawLeads || rawLeads.length === 0) return rawLeads;

    const userIds = new Set<string>();
    const emails = new Set<string>();
    const phones = new Set<string>();

    rawLeads.forEach((l: any) => {
        if (l.userId && mongoose.isValidObjectId(l.userId)) userIds.add(l.userId.toString());
        if (l.visitorId && mongoose.isValidObjectId(l.visitorId)) userIds.add(l.visitorId.toString());
        if (l.email) emails.add(l.email.toLowerCase().trim());
        if (l.phone) {
            const cp = l.phone.replace(/\D/g, '').slice(-10);
            if (cp) phones.add(cp);
        }

        if (Array.isArray(l.mergedMembers)) {
            l.mergedMembers.forEach((m: any) => {
                if (m.userId && mongoose.isValidObjectId(m.userId)) userIds.add(m.userId.toString());
                if (m.visitorId && mongoose.isValidObjectId(m.visitorId)) userIds.add(m.visitorId.toString());
                if (m.email) emails.add(m.email.toLowerCase().trim());
                if (m.phone) {
                    const cp = m.phone.replace(/\D/g, '').slice(-10);
                    if (cp) phones.add(cp);
                }
            });
        }
    });

    const userOrConditions: any[] = [];
    if (userIds.size > 0) {
        userOrConditions.push({ _id: { $in: Array.from(userIds).map(id => new mongoose.Types.ObjectId(id)) } });
    }
    if (emails.size > 0) {
        userOrConditions.push({ email: { $in: Array.from(emails) } });
    }
    if (phones.size > 0) {
        Array.from(phones).forEach(p => {
            const cleanDigits = p.replace(/\D/g, '').slice(-10);
            if (cleanDigits) {
                userOrConditions.push({ phone: cleanDigits });
                userOrConditions.push({ phone: `+91${cleanDigits}` });
                userOrConditions.push({ phone: `+91 ${cleanDigits}` });
                userOrConditions.push({ phone: `+91-${cleanDigits}` });
                userOrConditions.push({ phone: { $regex: `${cleanDigits}$` } });
            }
        });
    }

    let userDocs: any[] = [];
    if (userOrConditions.length > 0) {
        try {
            const { connectVisitorDB } = await import('@/lib/db');
            const visitorConn = await connectVisitorDB();
            const visitorUserCol = visitorConn.db?.collection('users');
            if (visitorUserCol) {
                userDocs = await visitorUserCol.find({ $or: userOrConditions }).toArray();
            }
        } catch (e) {
            console.error("Error batch fetching visitor users for leads enrichment:", e);
        }

        if (userDocs.length === 0) {
            try {
                const rawUserCol = mongoose.connection.db?.collection('users');
                if (rawUserCol) {
                    userDocs = await rawUserCol.find({ $or: userOrConditions }).toArray();
                }
            } catch (e) {}
        }
    }

    const userMapById = new Map<string, any>();
    const userMapByEmail = new Map<string, any>();
    const userMapByPhone = new Map<string, any>();

    userDocs.forEach((u: any) => {
        if (u._id) userMapById.set(u._id.toString(), u);
        if (u.email) userMapByEmail.set(u.email.toLowerCase().trim(), u);
        if (u.phone) {
            const cp = u.phone.toString().replace(/\D/g, '').slice(-10);
            if (cp) userMapByPhone.set(cp, u);
            userMapByPhone.set(u.phone.toString().trim(), u);
        }
    });

    return rawLeads.map((l: any) => {
        const leadObj = l.toObject ? l.toObject() : { ...l };
        
        // Find lead primary user doc
        const leadUser = (leadObj.userId && userMapById.get(leadObj.userId.toString())) ||
                         (leadObj.visitorId && userMapById.get(leadObj.visitorId.toString())) ||
                         (leadObj.email && userMapByEmail.get(leadObj.email.toLowerCase().trim())) ||
                         (leadObj.phone && userMapByPhone.get(leadObj.phone.replace(/\D/g, '').slice(-10)));

        if (leadUser) {
            leadObj.avatar = leadObj.avatar || leadUser.profilePhoto || leadUser.avatar || leadUser.photo || leadUser.profile?.photo || leadUser.profile?.avatar || "";
            leadObj.username = leadObj.username || leadUser.username || (leadUser.email ? leadUser.email.split('@')[0] : "") || "";
        }

        if (Array.isArray(leadObj.mergedMembers)) {
            leadObj.mergedMembers = leadObj.mergedMembers.map((m: any) => {
                const memberUser = (m.userId && userMapById.get(m.userId.toString())) ||
                                   (m.visitorId && userMapById.get(m.visitorId.toString())) ||
                                   (m.email && userMapByEmail.get(m.email.toLowerCase().trim())) ||
                                   (m.phone && userMapByPhone.get(m.phone.replace(/\D/g, '').slice(-10)));
                
                const avatar = m.avatar || m.photo || m.profilePhoto || memberUser?.profilePhoto || memberUser?.avatar || memberUser?.photo || memberUser?.profile?.photo || memberUser?.profile?.avatar || "";
                const username = m.username || memberUser?.username || (m.email ? m.email.split('@')[0] : (memberUser?.email ? memberUser.email.split('@')[0] : "")) || "";
                const name = m.name || memberUser?.fullName || memberUser?.name || "Buyer";

                return {
                    ...m,
                    name,
                    avatar,
                    photo: avatar,
                    profilePhoto: avatar,
                    username
                };
            });
        }

        return leadObj;
    });
}

export async function GET(req: NextRequest) {
    try {
        const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate', 'teamLeader']);
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
        if (assignee && assignee !== "all") {
            const escapedAssignee = assignee.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            andConditions.push({ assignee: { $regex: escapedAssignee, $options: "i" } });
        }
        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            andConditions.push({
                $or: [
                    { name: { $regex: escapedSearch, $options: "i" } },
                    { phone: { $regex: escapedSearch, $options: "i" } },
                    { email: { $regex: escapedSearch, $options: "i" } }
                ]
            });
        }

        if (leadType === "our") {
            andConditions.push({
                $and: [
                    { source: { $not: /website|astronix|doubt|visitor|offer|discovery|enquiry|portal/i } },
                    { leadType: { $not: /group-buying|token-hold|specific-doubt|vip-lead|offer-enquiry|enquiry-form/i } },
                    { status: { $ne: "Token VIP" } },
                    { isTokenPaid: { $ne: true } },
                    { isGroup: { $ne: true } },
                    { claimedOffer: { $exists: false } },
                    { $or: [{ groupSize: 0 }, { groupSize: null }, { groupSize: { $exists: false } }] }
                ]
            });
        } else if (leadType === "astronix") {
            andConditions.push({
                $or: [
                    { source: { $regex: /website|astronix|doubt|visitor|offer|discovery|enquiry|portal/i } },
                    { leadType: "group-buying" },
                    { leadType: "token-hold" },
                    { leadType: "specific-doubt" },
                    { leadType: "offer-enquiry" },
                    { leadType: "vip-lead" },
                    { leadType: "enquiry-form" },
                    { status: "Token VIP" },
                    { isTokenPaid: true },
                    { isGroup: true },
                    { claimedOffer: { $exists: true, $ne: null } },
                    { groupSize: { $gt: 0 } }
                ]
            });
        }

        const query = { $and: andConditions };

        const skip = (page - 1) * limit;
        const [rawLeads, total] = await Promise.all([
            Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Lead.countDocuments(query)
        ]);

        const leads = await enrichLeadsWithUserProfiles(rawLeads);

        return NextResponse.json({ 
            success: true, 
            leads,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error: any) {
        console.error("Error in GET /api/leads:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate', 'teamLeader']);
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

        const effectiveBuilderId = context!.role === 'teamLeader'
            ? (context!.builderAccountIds?.[0] || context!.builderId)
            : context!.userId;

        // Create the new lead with injected tenancy attributes
        const newLead = await Lead.create({
            name: body.name,
            email: body.email?.toLowerCase(),
            phone: body.phone,
            source: body.source || "Website",
            requirement: body.requirement,
            budget: body.budget,
            assignee: body.assignee || context!.email,
            builderId: effectiveBuilderId, // legacy compatibility
            accountId: effectiveBuilderId,
            projectId: context!.role === 'teamLeader' && context!.propertyId ? context!.propertyId : body.projectId,
            role: context!.role === 'teamLeader' ? 'builder' : context!.role,
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
