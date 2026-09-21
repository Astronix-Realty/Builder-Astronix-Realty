import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

function parseBudgetToNumber(budgetStr: any): number {
  if (!budgetStr) return 4500000;
  if (typeof budgetStr === "number") return budgetStr;
  const str = String(budgetStr).toLowerCase().replace(/,/g, "").trim();
  const num = parseFloat(str.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return 4500000;
  if (str.includes("cr") || str.includes("crore")) return Math.round(num * 10000000);
  if (str.includes("l") || str.includes("lac") || str.includes("lakh")) return Math.round(num * 100000);
  if (str.includes("k")) return Math.round(num * 1000);
  return num > 1000 ? Math.round(num) : Math.round(num * 100000);
}

export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader"]);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const ownership = getOwnershipQuery(context!);

    // Multi-tenant security: Also fetch this builder's properties to strictly match leads by property
    let propertyIds: any[] = [];
    try {
      const Property = (await import("@/models/Property")).default;
      const builderProps = await Property.find({
        ...ownership,
        isDeleted: { $ne: true }
      }).select("_id").lean();
      propertyIds = builderProps.map(p => p._id);
    } catch (e) {
      console.error("Error fetching builder properties for isolation:", e);
    }

    const isolationConditions: any[] = [
      ownership
    ];

    if (propertyIds.length > 0) {
      const propIdStrings = propertyIds.map(p => String(p));
      isolationConditions.push(
        { propertyId: { $in: propIdStrings } },
        { propertyId: { $in: propertyIds } },
        { projectId: { $in: propertyIds } },
        { 'hierarchyContext.propertyId': { $in: propIdStrings } },
        { 'hierarchyContext.projectId': { $in: propIdStrings } },
        { 'hierarchyContext.townshipId': { $in: propIdStrings } }
      );
    }

    const leads = await Lead.find({
      $and: [
        { $or: isolationConditions },
        {
          $or: [
            { revenueStatus: { $in: ["Billed", "billed", "Received", "received"] } },
            { invoiceDetails: { $exists: true, $ne: null } },
            { "members.revenueStatus": { $in: ["Billed", "billed", "Received", "received"] } },
            { "mergedMembers.revenueStatus": { $in: ["Billed", "billed", "Received", "received"] } },
            { "members.invoiceDetails": { $exists: true, $ne: null } },
            { "mergedMembers.invoiceDetails": { $exists: true, $ne: null } }
          ]
        }
      ]
    }).sort({ updatedAt: -1, createdAt: -1 }).lean();

    const bills: any[] = [];

    leads.forEach((lead: any) => {
      // Only include direct leads if Admin has actually generated the bill
      const hasAdminBill = Boolean(lead.invoiceDetails) || (lead.revenueStatus && lead.revenueStatus.toLowerCase() !== "unbilled");

      const propName =
        lead.property ||
        lead.propertyName ||
        lead.project ||
        lead.hierarchyContext?.propertyTitle ||
        lead.hierarchyContext?.townshipTitle ||
        "Astronix Residences";

      const unitNo = lead.unitNumber || lead.unitDetails?.unitNumber || lead.hierarchyContext?.unitNumber || "";

      // 1. Direct Lead Bill
      if (hasAdminBill) {
        let revStatus: "Billed" | "Received" | "Payment Submitted" | "Unbilled" = "Billed";
        if (lead.revenueStatus) {
          const raw = String(lead.revenueStatus).toLowerCase();
          if (raw === "received") revStatus = "Received";
          else if (raw === "payment submitted" || raw === "payment_submitted") revStatus = "Payment Submitted";
          else if (raw === "unbilled") revStatus = "Unbilled";
          else revStatus = "Billed";
        }

        const inv = lead.invoiceDetails || null;
        const dealVal = inv?.dealValue ? Number(inv.dealValue) : parseBudgetToNumber(lead.budget || lead.dealValue);
        const brokPct = inv?.brokeragePercent ? Number(inv.brokeragePercent) : (lead.brokeragePercent || 2);
        const gstPct = inv?.gstPercent !== undefined ? Number(inv.gstPercent) : 18;

        const taxable = (dealVal * brokPct) / 100;
        const cgst = (taxable * (gstPct / 2)) / 100;
        const sgst = (taxable * (gstPct / 2)) / 100;
        const grandTotal = taxable + cgst + sgst;

        bills.push({
          id: String(lead.id || lead._id),
          dbId: String(lead._id),
          isMember: false,
          leadId: String(lead._id),
          leadName: inv?.leadName || lead.name || "Client",
          phone: lead.phone || "",
          email: lead.email || "",
          property: inv?.property || `${propName}${unitNo ? ` - Unit ${unitNo}` : ""}`,
          unitNo: inv?.unitNo || unitNo || "TBD",
          builderName: inv?.builderName || context?.propertyName || "Partner Developer",
          dealValue: dealVal,
          brokeragePercent: brokPct,
          gstPercent: gstPct,
          taxableAmount: taxable,
          cgst,
          sgst,
          totalAmount: grandTotal,
          status: revStatus, // "Billed" | "Received" | "Payment Submitted"
          invoiceNo: inv?.invoiceNo || `INV-${new Date(lead.createdAt || Date.now()).getFullYear()}-${String(lead._id).slice(-4).toUpperCase()}`,
          invoiceDate: inv?.invoiceDate || (lead.updatedAt ? new Date(lead.updatedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]),
          bankDetails: {
            bankName: inv?.bankName || "HDFC Bank Ltd.",
            accountName: inv?.accountName || "Astronix Realty",
            accountNo: inv?.accountNo || "50200012345678",
            ifscCode: inv?.ifscCode || "HDFC0001234"
          },
          invoiceDetails: inv,
          paymentProof: lead.paymentProof || null,
          rawLead: {
            status: lead.status,
            createdAt: lead.createdAt,
            updatedAt: lead.updatedAt
          }
        });
      }

      // 2. Group Leads with booked/billed members
      const members = Array.isArray(lead.mergedMembers) && lead.mergedMembers.length > 0
        ? lead.mergedMembers
        : Array.isArray(lead.members) ? lead.members : [];

      if (members.length > 0) {
        members.forEach((m: any, idx: number) => {
          const mHasAdminBill = Boolean(m.invoiceDetails) || (m.revenueStatus && m.revenueStatus.toLowerCase() !== "unbilled");

          if (mHasAdminBill) {
            let mRevStatus: "Billed" | "Received" | "Payment Submitted" | "Unbilled" = "Billed";
            if (m.revenueStatus) {
              const raw = String(m.revenueStatus).toLowerCase();
              if (raw === "received") mRevStatus = "Received";
              else if (raw === "payment submitted" || raw === "payment_submitted") mRevStatus = "Payment Submitted";
              else if (raw === "unbilled") mRevStatus = "Unbilled";
              else mRevStatus = "Billed";
            }

            const inv = m.invoiceDetails || null;
            const dealVal = inv?.dealValue ? Number(inv.dealValue) : parseBudgetToNumber(m.budget || lead.budget);
            const brokPct = inv?.brokeragePercent ? Number(inv.brokeragePercent) : (m.brokeragePercent || 1.5);
            const gstPct = inv?.gstPercent !== undefined ? Number(inv.gstPercent) : 18;

            const taxable = (dealVal * brokPct) / 100;
            const cgst = (taxable * (gstPct / 2)) / 100;
            const sgst = (taxable * (gstPct / 2)) / 100;
            const grandTotal = taxable + cgst + sgst;

            bills.push({
              id: `${lead.id || lead._id}-M${idx}`,
              dbId: String(lead._id),
              isMember: true,
              memberIndex: idx,
              leadId: String(lead._id),
              leadName: inv?.leadName || m.name || `Group Buyer ${idx + 1}`,
              phone: m.phone || "",
              email: m.email || "",
              property: inv?.property || `${propName}${unitNo ? ` - Unit ${unitNo}` : ""}`,
              unitNo: inv?.unitNo || unitNo || "TBD",
              builderName: inv?.builderName || context?.propertyName || "Partner Developer",
              dealValue: dealVal,
              brokeragePercent: brokPct,
              gstPercent: gstPct,
              taxableAmount: taxable,
              cgst,
              sgst,
              totalAmount: grandTotal,
              status: mRevStatus,
              invoiceNo: inv?.invoiceNo || (mRevStatus !== "Unbilled" ? `INV-${new Date(m.createdAt || Date.now()).getFullYear()}-${String(lead._id).slice(-4).toUpperCase()}-M${idx + 1}` : null),
              invoiceDate: inv?.invoiceDate || (m.joinedAt ? new Date(m.joinedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]),
              bankDetails: {
                bankName: inv?.bankName || "HDFC Bank Ltd.",
                accountName: inv?.accountName || "Astronix Realty",
                accountNo: inv?.accountNo || "50200012345678",
                ifscCode: inv?.ifscCode || "HDFC0001234"
              },
              invoiceDetails: inv,
              paymentProof: m.paymentProof || null,
              rawLead: {
                status: m.status || lead.status,
                createdAt: m.createdAt || lead.createdAt,
                updatedAt: lead.updatedAt
              }
            });
          }
        });
      }
    });

    // Compute Stats
    const totalBilled = bills
      .filter(b => b.status === "Billed" || b.status === "Received" || b.status === "Payment Submitted")
      .reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    const totalReceived = bills
      .filter(b => b.status === "Received")
      .reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    const totalPending = bills
      .filter(b => b.status === "Billed" || b.status === "Payment Submitted")
      .reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    const billedCount = bills.filter(b => b.status === "Billed").length;
    const submittedCount = bills.filter(b => b.status === "Payment Submitted").length;
    const receivedCount = bills.filter(b => b.status === "Received").length;

    return NextResponse.json({
      bills,
      stats: {
        totalBilled,
        totalReceived,
        totalPending,
        totalCount: bills.length,
        billedCount,
        submittedCount,
        receivedCount
      }
    });
  } catch (error: any) {
    console.error("Error fetching builder bills:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch bills" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader"]);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const body = await req.json();
    const { dbId, isMember, memberIndex, paymentProof } = body;

    if (!dbId || !paymentProof) {
      return NextResponse.json({ error: "Missing required fields: dbId or paymentProof" }, { status: 400 });
    }

    const queryId = mongoose.Types.ObjectId.isValid(dbId) ? new mongoose.Types.ObjectId(dbId) : dbId;
    const updateObj: Record<string, any> = { updatedAt: new Date() };

    const proofData = {
      ...paymentProof,
      submittedAt: new Date(),
      submittedBy: context?.role || "builder"
    };

    if (isMember && memberIndex !== undefined) {
      updateObj[`members.${memberIndex}.revenueStatus`] = "Payment Submitted";
      updateObj[`members.${memberIndex}.paymentProof`] = proofData;
      updateObj[`mergedMembers.${memberIndex}.revenueStatus`] = "Payment Submitted";
      updateObj[`mergedMembers.${memberIndex}.paymentProof`] = proofData;
    } else {
      updateObj.revenueStatus = "Payment Submitted";
      updateObj.paymentProof = proofData;
    }

    await Lead.updateOne({ _id: queryId }, { $set: updateObj });

    return NextResponse.json({ success: true, message: "Payment proof submitted successfully" });
  } catch (error: any) {
    console.error("Error submitting payment proof:", error);
    return NextResponse.json({ error: error.message || "Failed to submit payment proof" }, { status: 500 });
  }
}
