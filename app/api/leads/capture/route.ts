import { NextRequest, NextResponse } from "next/server"; 
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import Conversation from "@/models/Conversation";
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

        // --- Duplicate Prevention & Lead Sync ---
        const existingLead = await Lead.findOne({
            $or: [
                { phone },
                ...(email ? [{ email: email?.toLowerCase() }] : [])
            ],
            isArchived: { $ne: true }
        });

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

            // Broadcast real-time update to CRM
            broadcastEvent({
                type: "LEAD_UPDATED",
                leadId: existingLead._id.toString(),
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

        // --- Create New Lead ---
        const newLead = await Lead.create({
            name,
            email: email?.toLowerCase(),
            phone,
            source: source || "Website",
            requirement,
            budget,
            builderId,
            projectId,
            status: "Fresh",
            assignee: "astronixrealty",  // Website leads auto-assigned
            timeline: [{
                title: "Lead Captured",
                desc: `Captured via ${source || "Website"} — auto-assigned to astronixrealty`,
                type: "system"
            }]
        });

        // --- Auto-create Conversation Thread ---
        const conversation = await Conversation.create({
            leadId: newLead._id,
            builderId,
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
            data: newLead,
            timestamp: Date.now()
        });

        broadcastEvent({
            type: "CONVERSATION_CREATED",
            leadId: newLead._id.toString(),
            conversationId: conversation._id.toString(),
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
