import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdCampaign from "@/models/AdCampaign";
import AdWallet from "@/models/AdWallet";
import AdWalletTransaction from "@/models/AdWalletTransaction";
import { getMetaConfig } from "@/services/metaAdsEngine.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/meta-ads
 * Automated Cron Job for:
 * 1) Syncing Meta Campaign Insights
 * 2) Hard Budget Kill-Switch & Auto-Settlement
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const config = getMetaConfig();
    const now = new Date();

    const activeCampaigns = await AdCampaign.find({
      status: "ACTIVE_RUNNING",
    });

    const syncedResults = [];
    const killedResults = [];

    for (const campaign of activeCampaigns) {
      // 1. Sync Insights (if LIVE_META_API)
      if (config.executionMode === "LIVE_META_API" && campaign.meta_campaign_id) {
        try {
          const insightsRes = await fetch(
            `https://graph.facebook.com/${config.apiVersion}/${campaign.meta_campaign_id}/insights?fields=spend,impressions,reach,clicks,actions&access_token=${config.systemAccessToken}`
          );
          if (insightsRes.ok) {
            const data = await insightsRes.json();
            const insight = data.data?.[0];
            if (insight) {
              campaign.metrics_impressions = Number(insight.impressions || campaign.metrics_impressions);
              campaign.metrics_reach = Number(insight.reach || campaign.metrics_reach);
              campaign.metrics_clicks = Number(insight.clicks || campaign.metrics_clicks);
              campaign.metrics_meta_spent_inr = Number(insight.spend || campaign.metrics_meta_spent_inr);

              const commissionRatio = 1 + campaign.platform_commission_percent / 100;
              campaign.metrics_builder_spent_inr = Math.min(
                campaign.total_builder_budget,
                Math.round(campaign.metrics_meta_spent_inr * commissionRatio)
              );
              campaign.last_synced_at = now;
              await campaign.save();
              syncedResults.push(campaign.campaign_code);
            }
          }
        } catch (e: any) {
          console.error(`[Cron Sync] Failed for ${campaign.campaign_code}:`, e.message);
        }
      }

      // 2. Hard Budget Kill-Switch Check
      const effectiveBudgetCap = (campaign as any).spend_limit_inr && (campaign as any).spend_limit_inr > 0
        ? Math.min((campaign as any).spend_limit_inr, campaign.net_meta_budget)
        : campaign.net_meta_budget;
      const isBudgetFull = campaign.metrics_meta_spent_inr >= effectiveBudgetCap;
      const isExpired = campaign.end_date && now >= new Date(campaign.end_date);

      if (isBudgetFull || isExpired) {
        // Pause on Meta Ads API if LIVE
        if (config.executionMode === "LIVE_META_API" && campaign.meta_campaign_id) {
          await fetch(`https://graph.facebook.com/${config.apiVersion}/${campaign.meta_campaign_id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "PAUSED", access_token: config.systemAccessToken }),
          });
        }

        campaign.status = "COMPLETED_BUDGET_FULL";
        campaign.last_synced_at = now;
        await campaign.save();

        // Settle Wallet Escrow
        const wallet = await AdWallet.findOne({ owner_user_id: campaign.owner_user_id });
        if (wallet) {
          const spentToSettle = campaign.metrics_builder_spent_inr || campaign.total_builder_budget;
          const unspentToRefund = Math.max(0, campaign.total_builder_budget - spentToSettle);

          wallet.locked_escrow_balance = Math.max(0, wallet.locked_escrow_balance - campaign.total_builder_budget);
          wallet.lifetime_spent_balance += spentToSettle;
          if (unspentToRefund > 0) {
            wallet.available_balance += unspentToRefund;
          }
          await wallet.save();

          await AdWalletTransaction.create({
            wallet_id: wallet._id,
            owner_user_id: campaign.owner_user_id,
            campaign_id: campaign._id,
            transaction_type: "SPEND_SETTLEMENT",
            credit_amount: unspentToRefund,
            total_gateway_paid: spentToSettle,
            notes: `Auto budget settlement on completion. Spent: ₹${spentToSettle}, Unspent refunded: ₹${unspentToRefund}`,
          });
        }

        killedResults.push({ code: campaign.campaign_code, reason: isBudgetFull ? "BUDGET_EXHAUSTED" : "DURATION_EXPIRED" });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      activeChecked: activeCampaigns.length,
      synced: syncedResults,
      settledOrKilled: killedResults,
    });
  } catch (error: any) {
    console.error("[GET /api/cron/meta-ads] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
