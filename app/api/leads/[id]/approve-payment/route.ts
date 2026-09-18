import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { checkRBAC } from "@/lib/rbac";
import { broadcastEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";

/**
 * POST /api/leads/[id]/approve-payment
 * 
 * Admin (Builder) approves or rejects a VIP token payment.
 * This is the ONLY way a "PendingVerification" payment can become "Success".
 * 
 * Body: { action: 'approve' | 'reject', adminNote?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate', 'teamLeader']);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const body = await req.json();
    const { action, adminNote } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject".' },
        { status: 400 }
      );
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const leadObj: any = lead;
    const now = new Date();
    const utr = leadObj.bank_utr_number || leadObj.paymentId || 'N/A';
    const amount = leadObj.amount || leadObj.tokenAmount || 111;
    const adminName = context?.name || context?.username || 'Admin';

    if (action === 'approve') {
      // ─── APPROVE PAYMENT ───
      const receiptNo = `REC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const timelineEntry = {
        title: 'VIP Token Payment Approved by Admin',
        desc: `₹${amount} payment verified & approved by ${adminName}. UTR: ${utr}. Receipt No: ${receiptNo}.${adminNote ? ` Note: ${adminNote}` : ''}`,
        type: 'booking',
        date: now,
      };

      leadObj.status = 'Token VIP';
      leadObj.payment_status = 'Success';
      leadObj.isTokenPaid = true;
      leadObj.paymentVerifiedAt = now;
      leadObj.receipt_no = receiptNo;
      leadObj.crmStage = 'Token VIP';
      leadObj.paymentApprovedBy = adminName;
      leadObj.updatedAt = now;

      if (!leadObj.paymentId) leadObj.paymentId = utr;

      leadObj.timeline.unshift(timelineEntry);
      leadObj.notes.unshift(`[APPROVED] Admin ${adminName} approved payment. UTR: ${utr} | Receipt: ${receiptNo} | Amount: ₹${amount}${adminNote ? ` | Note: ${adminNote}` : ''}`);

      await lead.save();

      broadcastEvent({
        type: "LEAD_UPDATED",
        leadId: lead._id.toString(),
        data: lead,
        timestamp: Date.now()
      });

      console.log(`[VIP Admin] Payment APPROVED for lead ${id} by ${adminName}. UTR: ${utr}, Receipt: ${receiptNo}`);

      return NextResponse.json({
        success: true,
        action: 'approved',
        leadId: id,
        receiptNo,
        bankUtr: utr,
        amount,
        paymentVerifiedAt: now.toISOString(),
        message: `Payment of ₹${amount} approved successfully. Receipt ${receiptNo} generated.`,
      });

    } else {
      // ─── REJECT PAYMENT ───
      const timelineEntry = {
        title: 'VIP Token Payment Rejected by Admin',
        desc: `Payment of ₹${amount} rejected by ${adminName}. UTR: ${utr}.${adminNote ? ` Reason: ${adminNote}` : ' No reason provided.'}`,
        type: 'system',
        date: now,
      };

      leadObj.payment_status = 'Rejected';
      leadObj.isTokenPaid = false;
      leadObj.paymentRejectedBy = adminName;
      leadObj.paymentRejectedAt = now;
      leadObj.paymentRejectionReason = adminNote || 'Payment could not be verified';
      leadObj.updatedAt = now;

      leadObj.timeline.unshift(timelineEntry);
      leadObj.notes.unshift(`[REJECTED] Admin ${adminName} rejected payment. UTR: ${utr} | Amount: ₹${amount}${adminNote ? ` | Reason: ${adminNote}` : ''}`);

      await lead.save();

      broadcastEvent({
        type: "LEAD_UPDATED",
        leadId: lead._id.toString(),
        data: lead,
        timestamp: Date.now()
      });

      console.log(`[VIP Admin] Payment REJECTED for lead ${id} by ${adminName}. UTR: ${utr}`);

      return NextResponse.json({
        success: true,
        action: 'rejected',
        leadId: id,
        message: `Payment of ₹${amount} has been rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`,
      });
    }
  } catch (error: any) {
    console.error('[VIP Approve Payment Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process payment action' },
      { status: 500 }
    );
  }
}
