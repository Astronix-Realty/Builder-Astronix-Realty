import { NextRequest, NextResponse } from "next/server"; 
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import Conversation from "@/models/Conversation";
import Property from "@/models/Property";
import User from "@/models/User";
import { broadcastEvent } from "@/lib/sse";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        
        const { name, email, phone, source, requirement, budget, builderId, projectId } = body;

        if (!name || !phone) {
            return NextResponse.json({ 
                success: false, 
                error: "Name and phone are required" 
            }, { status: 400 });
        }

        // --- Resolve Tenant Boundaries ---
        let leadRole: any = "builder";
        let leadAccountId = builderId;
        let leadBuilderId = builderId;
        let leadMandateId = null;

        if (projectId) {
            const property = await Property.findById(projectId);
            if (property) {
                leadRole = property.role || "builder";
                leadAccountId = property.accountId || property.builderId;
                leadBuilderId = property.builderId;
                leadMandateId = property.mandateId || null;
            }
        } 
        
        if (!leadAccountId && builderId) {
            const user = await User.findById(builderId);
            if (user) {
                leadRole = user.role || "builder";
                leadAccountId = user._id;
                leadBuilderId = user.builderId || user._id;
                leadMandateId = user.mandateId || null;
            }
        }

        // --- Duplicate Prevention strictly scoped to this tenant ---
        const duplicateQuery: any = {
            $or: [
                { phone },
                ...(email ? [{ email: email?.toLowerCase() }] : [])
            ],
            isArchived: { $ne: true },
            role: leadRole
        };

        if (leadRole === 'builder') {
            duplicateQuery.$or = duplicateQuery.$or.map((cond: any) => ({
                ...cond,
                $or: [
                    { builderId: leadBuilderId },
                    { accountId: leadAccountId }
                ]
            }));
        } else if (leadRole === 'mandate') {
            duplicateQuery.$or = duplicateQuery.$or.map((cond: any) => {
                const conditions: any[] = [{ accountId: leadAccountId }];
                if (leadMandateId) {
                    conditions.push({ mandateId: leadMandateId });
                }
                return {
                    ...cond,
                    $or: conditions
                };
            });
        }

        const existingLead = await Lead.findOne(duplicateQuery);

        if (existingLead) {
            // Update existing lead with new interest/activity
            existingLead.timeline.unshift({
                title: "Repeated Inquiry",
                desc: `Lead inquired again via ${source || "Website"}. Requirement: ${requirement || "N/A"}`,
                type: "system",
                date: new Date()
            });
            
            if (requirement) existingLead.requirement = requirement;
            if (budget) existingLead.budget = budget;
            if (projectId) existingLead.projectId = projectId;

            await existingLead.save();

            // Update conversation's last message too
            await Conversation.findOneAndUpdate(
                { leadId: existingLead._id },
                { 
                    lastMessage: `New inquiry via ${source || "Website"}`,
                    lastMessageAt: new Date(),
                    $inc: { unreadCount: 1 }
                }
            );

            // Broadcast real-time update to CRM (with tenancy fields to assist filter)
            broadcastEvent({
                type: "LEAD_UPDATED",
                leadId: existingLead._id.toString(),
                role: existingLead.role,
                accountId: existingLead.accountId?.toString(),
                builderId: existingLead.builderId?.toString(),
                mandateId: existingLead.mandateId?.toString(),
                data: existingLead,
                timestamp: Date.now()
            });

            return NextResponse.json({ 
                success: true, 
                message: "Existing lead updated with new inquiry",
                lead: existingLead,
                isNew: false
            }, { status: 200 });
        }

        // --- Create New Lead with resolved tenant attributes ---
        const newLead = await Lead.create({
            name,
            email: email?.toLowerCase(),
            phone,
            source: source || "Website",
            requirement,
            budget,
            builderId: leadBuilderId,
            accountId: leadAccountId,
            role: leadRole,
            mandateId: leadMandateId,
            projectId,
            status: "Fresh",
            assignee: "astronixrealty",  // Website leads auto-assigned
            timeline: [{
                title: "Lead Captured",
                desc: `Captured via ${source || "Website"} — auto-assigned to astronixrealty`,
                type: "system"
            }]
        });

        // --- Auto-create Conversation Thread with resolved tenant attributes ---
        const conversation = await Conversation.create({
            leadId: newLead._id,
            builderId: leadBuilderId,
            accountId: leadAccountId,
            role: leadRole,
            mandateId: leadMandateId,
            leadName: name,
            leadPhone: phone,
            messages: [{
                text: `Hi, I'm interested. Requirement: ${requirement || "Not specified"}, Budget: ${budget || "Not specified"}`,
                sender: "lead",
                senderName: name,
            }],
            lastMessage: `Hi, I'm interested. Requirement: ${requirement || "Not specified"}`,
            lastMessageAt: new Date(),
            unreadCount: 1,
        });

        // Broadcast real-time creation to CRM
        broadcastEvent({
            type: "LEAD_CREATED",
            leadId: newLead._id.toString(),
            role: newLead.role,
            accountId: newLead.accountId?.toString(),
            builderId: newLead.builderId?.toString(),
            mandateId: newLead.mandateId?.toString(),
            data: newLead,
            timestamp: Date.now()
        });

        broadcastEvent({
            type: "CONVERSATION_CREATED",
            leadId: newLead._id.toString(),
            conversationId: conversation._id.toString(),
            role: conversation.role,
            accountId: conversation.accountId?.toString(),
            builderId: conversation.builderId?.toString(),
            mandateId: conversation.mandateId?.toString(),
            data: conversation,
            timestamp: Date.now()
        });

        return NextResponse.json({ 
            success: true, 
            message: "Lead captured successfully",
            lead: newLead,
            conversation,
            isNew: true
        }, { status: 201 });
    } catch (error: any) {
        console.error("Error capturing lead:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: "Lead capture endpoint is active" });
}
