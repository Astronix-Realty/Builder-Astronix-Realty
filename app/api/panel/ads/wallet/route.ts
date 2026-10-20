import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdWallet from "@/models/AdWallet";
import AdWalletTransaction from "@/models/AdWalletTransaction";
import { checkRBAC } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * GET /api/panel/ads/wallet
 * Fetches user's 3-tier wallet balances and recent passbook transactions
 */
export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader", "admin"]);
    if (errorResponse) return errorResponse;

    await dbConnect();

    let wallet = await AdWallet.findOne({ owner_user_id: context!.userId });

    // Auto-initialize wallet if doesn't exist yet
    if (!wallet) {
      wallet = await AdWallet.create({
        owner_user_id: context!.userId,
        owner_role: context!.role === "mandate" ? "MANDATE" : "BUILDER",
        available_balance: 0,
        locked_escrow_balance: 0,
        lifetime_spent_balance: 0,
      });
    }

    const transactions = await AdWalletTransaction.find({ owner_user_id: context!.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet._id,
        available_balance: wallet.available_balance,
        locked_escrow_balance: wallet.locked_escrow_balance,
        lifetime_spent_balance: wallet.lifetime_spent_balance,
        company_gstin: wallet.company_gstin || "",
        billing_company_name: wallet.billing_company_name || "",
        billing_address: wallet.billing_address || "",
      },
      transactions,
    });
  } catch (error: any) {
    console.error("[GET /api/panel/ads/wallet] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/panel/ads/wallet/recharge
 * Recharges Ad Credits:
 * - Base Ad Credit: amount
 * - GST (18%): amount * 0.18
 * - Total Gateway Paid: amount * 1.18
 * - Supports LOCAL_MOCK_TEST instant credit addition
 */
export async function POST(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader", "admin"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const {
      amount, // Base ad credit requested (e.g. 10000)
      payment_mode = "LOCAL_MOCK_TEST",
      company_gstin,
      billing_company_name,
      billing_address,
    } = body;

    const creditAmount = Number(amount);
    if (!creditAmount || creditAmount < 500) {
      return NextResponse.json(
        { success: false, error: "Minimum recharge amount is ₹500" },
        { status: 400 }
      );
    }

    await dbConnect();

    let wallet = await AdWallet.findOne({ owner_user_id: context!.userId });
    if (!wallet) {
      wallet = await AdWallet.create({
        owner_user_id: context!.userId,
        owner_role: context!.role === "mandate" ? "MANDATE" : "BUILDER",
        available_balance: 0,
        locked_escrow_balance: 0,
        lifetime_spent_balance: 0,
      });
    }

    // Update billing details if provided
    if (company_gstin) wallet.company_gstin = company_gstin;
    if (billing_company_name) wallet.billing_company_name = billing_company_name;
    if (billing_address) wallet.billing_address = billing_address;

    // GST Formula (18%)
    const gstRate = Number(process.env.DEFAULT_GST_PERCENT || 18) / 100;
    const gstAmount = Math.round(creditAmount * gstRate * 100) / 100;
    const totalGatewayPaid = Math.round((creditAmount + gstAmount) * 100) / 100;

    // Credit added to available_balance
    wallet.available_balance = (wallet.available_balance || 0) + creditAmount;
    await wallet.save();

    // Generate Invoice Number (e.g., AST-INV-2026-XXXX)
    const count = await AdWalletTransaction.countDocuments();
    const invoiceNumber = `AST-INV-2026-${String(count + 1001).padStart(5, "0")}`;
    const paymentRef = `MOCK_TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const transaction = await AdWalletTransaction.create({
      wallet_id: wallet._id,
      owner_user_id: context!.userId,
      transaction_type: "RECHARGE_CREDIT",
      credit_amount: creditAmount,
      gst_amount: gstAmount,
      total_gateway_paid: totalGatewayPaid,
      payment_mode,
      payment_reference_id: paymentRef,
      invoice_number: invoiceNumber,
      notes: `Recharge ₹${creditAmount.toLocaleString("en-IN")} Ad Credits (+ 18% GST ₹${gstAmount.toLocaleString("en-IN")})`,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ₹${creditAmount.toLocaleString("en-IN")} Ad Credits!`,
      wallet: {
        available_balance: wallet.available_balance,
        locked_escrow_balance: wallet.locked_escrow_balance,
        lifetime_spent_balance: wallet.lifetime_spent_balance,
      },
      transaction,
    });
  } catch (error: any) {
    console.error("[POST /api/panel/ads/wallet/recharge] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
