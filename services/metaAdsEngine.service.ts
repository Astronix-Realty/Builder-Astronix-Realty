import mongoose from 'mongoose';
import AdCampaign, { IAdCampaign, CampaignStatus } from '../models/AdCampaign';
import AdWallet, { IAdWallet } from '../models/AdWallet';
import AdWalletTransaction from '../models/AdWalletTransaction';
import AdAudiencePreset from '../models/AdAudiencePreset';
import AdLeadCrm from '../models/AdLeadCrm';

export interface MetaEngineConfig {
  executionMode: 'LOCAL_SIMULATION' | 'LIVE_META_API';
  appId: string;
  appSecret: string;
  apiVersion: string;
  systemAccessToken: string;
  adAccountId: string;
  pageId: string;
  catalogId: string;
  defaultCommissionPercent: number;
  defaultGstPercent: number;
  minBudget: number;
}

export function getMetaConfig(): MetaEngineConfig {
  return {
    executionMode: (process.env.ADS_EXECUTION_MODE as any) === 'LIVE_META_API' ? 'LIVE_META_API' : 'LOCAL_SIMULATION',
    appId: process.env.META_APP_ID || '2555091118327453',
    appSecret: process.env.META_APP_SECRET || '436e398da636e04355afe3e889a66ec6',
    apiVersion: process.env.META_GRAPH_API_VERSION || 'v21.0',
    systemAccessToken: process.env.META_SYSTEM_ACCESS_TOKEN || '',
    adAccountId: process.env.META_AD_ACCOUNT_ID || 'act_000000000000',
    pageId: process.env.META_PAGE_ID || '000000000000',
    catalogId: process.env.META_CATALOG_ID || '000000000000',
    defaultCommissionPercent: Number(process.env.DEFAULT_PLATFORM_COMMISSION_PERCENT || 10),
    defaultGstPercent: Number(process.env.DEFAULT_GST_PERCENT || 18),
    minBudget: Number(process.env.MIN_CAMPAIGN_BUDGET_INR || 2000),
  };
}

/**
 * Seeds default audience presets if collection is empty
 */
export async function seedDefaultAudiencePresets(): Promise<void> {
  const count = await AdAudiencePreset.countDocuments();
  if (count > 0) return;

  const defaultPresets = [
    {
      preset_code: 'HYPER_LOCAL',
      preset_title: '📍 Local Home Buyers (10-15 KM Radius)',
      buyer_segment: 'MID_SEGMENT',
      guide_description_hinglish:
        'Property ke 10-15 KM radius ke parivar jo kiraye se apne ghar ya bade flat mein shift hona chahte hain (Dombivli, Kalyan, Thakurli, Shilphata, Thane).',
      default_radius_km: 15,
      age_min: 25,
      age_max: 55,
      target_countries_json: ['IN'],
      target_cities_json: ['Dombivli', 'Kalyan', 'Thane', 'Ulhasnagar'],
      meta_interests_json: [
        { id: '6003139266472', name: 'Real estate' },
        { id: '6003088846192', name: 'First-time buyer' },
        { id: '6003352664977', name: 'Apartment' },
        { id: '6003295846192', name: 'Mortgage loans' },
      ],
      is_active: true,
    },
    {
      preset_code: 'MMR_INVESTOR',
      preset_title: '💼 Mumbai & MMR Working Upgraders',
      buyer_segment: 'MID_SEGMENT',
      guide_description_hinglish:
        'Thane, Mulund, Ghatkopar, Powai, Navi Mumbai aur Mumbai ke IT professionals aur salaried employees (Age 27–52) jo investment ya township home dhoondh rahe hain.',
      default_radius_km: 30,
      age_min: 27,
      age_max: 52,
      target_countries_json: ['IN'],
      target_cities_json: ['Mumbai', 'Thane', 'Navi Mumbai', 'Powai'],
      meta_interests_json: [
        { id: '6003139266472', name: 'Real estate investing' },
        { id: '6003024846192', name: 'Property management' },
        { id: '6003209846192', name: 'Residential area' },
      ],
      is_active: true,
    },
    {
      preset_code: 'NRI_BUYER',
      preset_title: '🌍 NRI Property Investors (Gulf, USA, UK, Singapore)',
      buyer_segment: 'LUXURY_HNI',
      guide_description_hinglish:
        'Dubai, UAE, USA, UK aur Singapore mein rehne wale Indians jo India mein high-return real estate ya luxury property lena chahte hain.',
      default_radius_km: 50,
      age_min: 30,
      age_max: 60,
      target_countries_json: ['AE', 'US', 'GB', 'SG', 'QA', 'KW'],
      target_cities_json: ['Dubai', 'Abu Dhabi', 'Singapore', 'London'],
      meta_interests_json: [
        { id: '6003139266472', name: 'Real estate' },
        { id: '6003295846192', name: 'Luxury real estate' },
        { id: '6003452664977', name: 'High-net-worth individuals' },
      ],
      is_active: true,
    },
    {
      preset_code: 'COMMERCIAL_BIZ',
      preset_title: '🏢 Commercial & Retail Investors',
      buyer_segment: 'COMMERCIAL',
      guide_description_hinglish:
        'Shops, Showrooms, aur Commercial Office Spaces dhoondhne wale business owners aur rental-yield investors.',
      default_radius_km: 25,
      age_min: 32,
      age_max: 60,
      target_countries_json: ['IN'],
      target_cities_json: ['Mumbai', 'Thane', 'Kalyan-Dombivli'],
      meta_interests_json: [
        { id: '6003139266472', name: 'Commercial property' },
        { id: '6003392664977', name: 'Retail' },
        { id: '6003089846192', name: 'Small business' },
      ],
      is_active: true,
    },
  ];

  await AdAudiencePreset.insertMany(defaultPresets);
  console.log('[MetaAdsEngine] Seeded 4 default audience presets successfully');
}

/**
 * 6-Step Execution Engine: Approves an ad and pushes to Meta (Live or Local Simulation)
 */
export async function approveAndPushToMeta(
  campaignId: string,
  adminUserId: string,
  editedOverrides?: {
    headline?: string;
    primary_text?: string;
    admin_edited_notes?: string;
    spend_limit_inr?: number;
  }
) {
  const config = getMetaConfig();
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'PENDING_ADMIN_APPROVAL' && campaign.status !== 'DRAFT') {
    throw new Error(`Cannot approve campaign with status: ${campaign.status}`);
  }

  // Apply admin edits if provided
  if (editedOverrides?.headline) campaign.headline = editedOverrides.headline;
  if (editedOverrides?.primary_text) campaign.primary_text = editedOverrides.primary_text;
  if (editedOverrides?.admin_edited_notes) campaign.admin_edited_notes = editedOverrides.admin_edited_notes;
  if (editedOverrides?.spend_limit_inr !== undefined && editedOverrides?.spend_limit_inr !== null) {
    const customLimit = Number(editedOverrides.spend_limit_inr);
    if (!isNaN(customLimit) && customLimit > 0) {
      campaign.spend_limit_inr = customLimit;
      if (customLimit < campaign.net_meta_budget) {
        campaign.net_meta_budget = customLimit;
      }
    }
  }

  campaign.status = 'APPROVED_PUSHING_TO_META';
  await campaign.save();

  const stepResults: Array<{ step: number; name: string; status: 'SUCCESS' | 'FAILED'; details: any }> = [];

  try {
    if (config.executionMode === 'LOCAL_SIMULATION') {
      // ═════════════════════════════════════════════════════════════════
      // DUAL-MODE: LOCAL SIMULATOR
      // ═════════════════════════════════════════════════════════════════
      const timestamp = Date.now();
      const code = campaign.campaign_code;

      // Step 1: Media upload simulation
      const simMediaId = `sim_media_${timestamp}`;
      stepResults.push({
        step: 1,
        name: 'Uploading Media to Meta Ad Account',
        status: 'SUCCESS',
        details: { media_id: simMediaId },
      });

      // Step 2: Campaign creation simulation
      const simCampaignId = `sim_camp_${code}_${timestamp}`;
      stepResults.push({
        step: 2,
        name: 'Creating Meta Campaign (OUTCOME_LEADS)',
        status: 'SUCCESS',
        details: { campaign_id: simCampaignId },
      });

      // Step 3: Instant Lead Form simulation
      const simLeadformId = `sim_form_${code}_${timestamp}`;
      stepResults.push({
        step: 3,
        name: 'Generating Instant Lead Form on Facebook Page',
        status: 'SUCCESS',
        details: { leadform_id: simLeadformId },
      });

      // Step 4: Ad Set creation simulation
      const simAdsetId = `sim_adset_${code}_${timestamp}`;
      stepResults.push({
        step: 4,
        name: `Configuring Ad Set (Net Budget: ₹${campaign.net_meta_budget})`,
        status: 'SUCCESS',
        details: { adset_id: simAdsetId },
      });

      // Step 5: Ad Creative creation simulation
      const simCreativeId = `sim_creative_${code}_${timestamp}`;
      stepResults.push({
        step: 5,
        name: 'Assembling Ad Creative with Video & Headline',
        status: 'SUCCESS',
        details: { creative_id: simCreativeId },
      });

      // Step 6: Ad Activation simulation
      const simAdId = `sim_ad_${code}_${timestamp}`;
      stepResults.push({
        step: 6,
        name: 'Activating Ad on Meta Ads Manager',
        status: 'SUCCESS',
        details: { ad_id: simAdId },
      });

      // Update Campaign in Database
      campaign.status = 'ACTIVE_RUNNING';
      campaign.execution_mode = 'LOCAL_SIMULATION';
      campaign.meta_video_or_image_id = simMediaId;
      campaign.meta_campaign_id = simCampaignId;
      campaign.meta_leadform_id = simLeadformId;
      campaign.meta_adset_id = simAdsetId;
      campaign.meta_creative_id = simCreativeId;
      campaign.meta_ad_id = simAdId;
      campaign.approved_by_admin_id = adminUserId;
      campaign.approved_at = new Date();
      campaign.last_synced_at = new Date();
      await campaign.save();

      return {
        success: true,
        mode: 'LOCAL_SIMULATION',
        campaignId: campaign._id,
        metaCampaignId: simCampaignId,
        stepResults,
      };
    } else {
      // ═════════════════════════════════════════════════════════════════
      // DUAL-MODE: LIVE META GRAPH API (v21.0)
      // ═════════════════════════════════════════════════════════════════
      const GRAPH_BASE = `https://graph.facebook.com/${config.apiVersion}`;
      const token = config.systemAccessToken;
      const adAccount = config.adAccountId.startsWith('act_') ? config.adAccountId : `act_${config.adAccountId}`;

      // Step 1: Upload Media (Video or Image)
      let uploadedMediaId = '';
      const primaryMedia = campaign.media_files_json?.[0];
      if (primaryMedia?.type === 'video') {
        const videoRes = await fetch(`${GRAPH_BASE}/${adAccount}/advideos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_url: primaryMedia.url,
            access_token: token,
          }),
        });
        const vData = await videoRes.json();
        if (vData.error) throw new Error(`Meta Step 1 (Video) Failed: ${vData.error.message}`);
        uploadedMediaId = vData.id;
      } else {
        const imgFetch = await fetch(primaryMedia?.url || 'https://astronixrealty.com/og-image.jpg');
        const buffer = await imgFetch.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const form = new FormData();
        form.append('bytes', base64);
        form.append('access_token', token);

        const imgRes = await fetch(`${GRAPH_BASE}/${adAccount}/adimages`, {
          method: 'POST',
          body: form,
        });
        const iData = await imgRes.json();
        if (iData.error) throw new Error(`Meta Step 1 (Image) Failed: ${iData.error.message}`);
        const firstImg = iData.images ? (Object.values(iData.images)[0] as any) : null;
        uploadedMediaId = firstImg?.hash || firstImg?.id || iData.id;
      }
      stepResults.push({ step: 1, name: 'Upload Media', status: 'SUCCESS', details: { id: uploadedMediaId } });

      // Step 2: Create Campaign
      const campRes = await fetch(`${GRAPH_BASE}/${adAccount}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `ASTRONIX | ${campaign.owner_role}_${campaign.owner_user_id} | ${campaign.hierarchy_breadcrumb} | ${campaign.campaign_code}`,
          objective: 'OUTCOME_LEADS',
          status: 'PAUSED',
          special_ad_categories: ['HOUSING'],
          is_adset_budget_sharing_enabled: false,
          access_token: token,
        }),
      });
      const campData = await campRes.json();
      if (campData.error) throw new Error(`Meta Step 2 (Campaign) Failed: ${campData.error.message}`);
      const metaCampaignId = campData.id;
      stepResults.push({ step: 2, name: 'Create Campaign', status: 'SUCCESS', details: { id: metaCampaignId } });

      // Step 3: Create Lead Form on Page
      const customQuestions = (campaign.lead_form_questions_json || []).map((q: any) => ({
        type: 'CUSTOM',
        label: q.label || q.text || 'Question',
      }));

      const formRes = await fetch(`${GRAPH_BASE}/${config.pageId}/leadgen_forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Astronix_${campaign.campaign_code}_${Date.now()}`,
          questions: [
            { type: 'FULL_NAME' },
            { type: 'PHONE' },
            { type: 'EMAIL' },
            { type: 'CITY' },
            ...customQuestions,
          ],
          privacy_policy: { url: 'https://astronixrealty.com/privacy-policy' },
          follow_up_action_url: campaign.landing_deep_link_url || 'https://astronixrealty.com',
          access_token: token,
        }),
      });
      const formData = await formRes.json();
      if (formData.error) throw new Error(`Meta Step 3 (Lead Form) Failed: ${formData.error.message}`);
      const metaLeadformId = formData.id;
      stepResults.push({ step: 3, name: 'Create Lead Form', status: 'SUCCESS', details: { id: metaLeadformId } });

      // Step 4: Create Ad Set
      const netPaise = Math.round(campaign.net_meta_budget * 100);
      const adsetRes = await fetch(`${GRAPH_BASE}/${adAccount}/adsets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `AdSet_${campaign.campaign_code}`,
          campaign_id: metaCampaignId,
          daily_budget: netPaise,
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'LEAD_GENERATION',
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          promoted_object: { page_id: config.pageId },
          targeting: {
            geo_locations: {
              countries: ['IN'],
            },
          },
          status: 'PAUSED',
          access_token: token,
        }),
      });
      const adsetData = await adsetRes.json();
      if (adsetData.error) throw new Error(`Meta Step 4 (AdSet) Failed: ${adsetData.error.message}`);
      const metaAdsetId = adsetData.id;
      stepResults.push({ step: 4, name: 'Create Ad Set', status: 'SUCCESS', details: { id: metaAdsetId } });

      // Sanitize CTA button: Meta Lead Gen Forms only accept APPLY_NOW, LEARN_MORE, GET_QUOTE, SIGN_UP, SUBSCRIBE, DOWNLOAD, GET_OFFER
      const validLeadGenCtas = ['APPLY_NOW', 'LEARN_MORE', 'GET_QUOTE', 'SIGN_UP', 'SUBSCRIBE', 'DOWNLOAD', 'GET_OFFER'];
      const rawCta = (campaign.cta_button_type || 'LEARN_MORE').toUpperCase();
      const finalCta = validLeadGenCtas.includes(rawCta)
        ? rawCta
        : (rawCta === 'BOOK_NOW' ? 'APPLY_NOW' : 'LEARN_MORE');

      // Step 5: Create Ad Creative
      const storySpec: any = {
        page_id: config.pageId,
      };

      if (primaryMedia?.type === 'video') {
        storySpec.video_data = {
          video_id: uploadedMediaId,
          message: campaign.primary_text,
          title: campaign.headline,
          call_to_action: {
            type: finalCta,
            value: { lead_gen_form_id: metaLeadformId },
          },
        };
      } else {
        storySpec.link_data = {
          image_hash: uploadedMediaId,
          link: 'http://fb.me/',
          message: campaign.primary_text,
          name: campaign.headline,
          call_to_action: {
            type: finalCta,
            value: { lead_gen_form_id: metaLeadformId },
          },
        };
      }

      const creativeRes = await fetch(`${GRAPH_BASE}/${adAccount}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Creative_${campaign.campaign_code}`,
          object_story_spec: storySpec,
          access_token: token,
        }),
      });
      const creativeData = await creativeRes.json();
      if (creativeData.error) {
        const detail = creativeData.error.error_user_msg || creativeData.error.error_user_title || creativeData.error.message;
        throw new Error(`Meta Step 5 (Creative) Failed: ${detail}`);
      }
      const metaCreativeId = creativeData.id;
      stepResults.push({ step: 5, name: 'Create Creative', status: 'SUCCESS', details: { id: metaCreativeId } });

      // Step 6: Create & Activate Ad
      const adRes = await fetch(`${GRAPH_BASE}/${adAccount}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Ad_${campaign.campaign_code}`,
          adset_id: metaAdsetId,
          creative: { creative_id: metaCreativeId },
          status: 'ACTIVE',
          access_token: token,
        }),
      });
      const adData = await adRes.json();
      if (adData.error) {
        const detail = adData.error.error_user_msg || adData.error.error_user_title || adData.error.message;
        throw new Error(`Meta Step 6 (Ad Activation) Failed: ${detail}`);
      }
      const metaAdId = adData.id;
      stepResults.push({ step: 6, name: 'Activate Ad', status: 'SUCCESS', details: { id: metaAdId } });

      // Update status on parent campaign
      await fetch(`${GRAPH_BASE}/${metaCampaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', access_token: token }),
      });

      // Save to database
      campaign.status = 'ACTIVE_RUNNING';
      campaign.execution_mode = 'LIVE_META_API';
      campaign.meta_video_or_image_id = uploadedMediaId;
      campaign.meta_campaign_id = metaCampaignId;
      campaign.meta_leadform_id = metaLeadformId;
      campaign.meta_adset_id = metaAdsetId;
      campaign.meta_creative_id = metaCreativeId;
      campaign.meta_ad_id = metaAdId;
      campaign.approved_by_admin_id = adminUserId;
      campaign.approved_at = new Date();
      campaign.last_synced_at = new Date();
      await campaign.save();

      return {
        success: true,
        mode: 'LIVE_META_API',
        campaignId: campaign._id,
        metaCampaignId,
        stepResults,
      };
    }
  } catch (error: any) {
    campaign.status = 'PENDING_ADMIN_APPROVAL';
    campaign.admin_edited_notes = `Approval attempt failed: ${error.message}`;
    await campaign.save();
    throw error;
  }
}

/**
 * Rejects an ad campaign and refunds 100% of the locked escrow budget to the builder's available wallet balance.
 */
export async function rejectCampaignAndRefund(
  campaignId: string,
  rejectionReason: string,
  adminUserId: string
) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  if (campaign.status === 'ACTIVE_RUNNING' || campaign.status === 'REJECTED_BY_ADMIN') {
    throw new Error(`Cannot reject campaign with status: ${campaign.status}`);
  }

  // Find Builder/Mandate Wallet
  const wallet = await AdWallet.findOne({ owner_user_id: campaign.owner_user_id });
  if (wallet) {
    // Unlock escrow back into available_balance
    wallet.locked_escrow_balance = Math.max(0, wallet.locked_escrow_balance - campaign.total_builder_budget);
    wallet.available_balance += campaign.total_builder_budget;
    await wallet.save();

    // Create Transaction Record
    await AdWalletTransaction.create({
      wallet_id: wallet._id,
      owner_user_id: campaign.owner_user_id,
      campaign_id: campaign._id,
      transaction_type: 'REJECT_REFUND',
      credit_amount: campaign.total_builder_budget,
      gst_amount: 0,
      total_gateway_paid: 0,
      payment_mode: 'ADMIN_MANUAL_ADJUST',
      payment_reference_id: `REFUND_${campaign.campaign_code}`,
      notes: `100% Escrow refund for rejected campaign ${campaign.campaign_code}. Reason: ${rejectionReason}`,
    });
  }

  campaign.status = 'REJECTED_BY_ADMIN';
  campaign.admin_rejection_reason = rejectionReason;
  campaign.approved_by_admin_id = adminUserId;
  await campaign.save();

  return { success: true, refundedAmount: campaign.total_builder_budget };
}

/**
 * Toggles an active campaign between PAUSED and ACTIVE
 */
export async function toggleCampaignStatus(
  campaignId: string,
  targetStatus: 'PAUSED_BY_USER' | 'PAUSED_BY_ADMIN' | 'ACTIVE_RUNNING',
  userId: string
) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  const config = getMetaConfig();

  if (config.executionMode === 'LIVE_META_API' && campaign.meta_campaign_id) {
    const metaStatus = targetStatus === 'ACTIVE_RUNNING' ? 'ACTIVE' : 'PAUSED';
    await fetch(`https://graph.facebook.com/${config.apiVersion}/${campaign.meta_campaign_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: metaStatus, access_token: config.systemAccessToken }),
    });
  }

  campaign.status = targetStatus;
  await campaign.save();
  return { success: true, status: campaign.status };
}

/**
 * Top-up existing campaign budget & duration
 */
export async function topupCampaignBudget(
  campaignId: string,
  topupAmount: number,
  additionalDays: number = 0
) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  const wallet = await AdWallet.findOne({ owner_user_id: campaign.owner_user_id });
  if (!wallet || wallet.available_balance < topupAmount) {
    throw new Error('Insufficient wallet balance for top-up');
  }

  // Lock top-up in wallet
  wallet.available_balance -= topupAmount;
  wallet.locked_escrow_balance += topupAmount;
  await wallet.save();

  // Calculate split
  const commissionAmt = (topupAmount * campaign.platform_commission_percent) / 100;
  const netMetaAdd = topupAmount - commissionAmt;

  campaign.total_builder_budget += topupAmount;
  campaign.platform_commission_amount += commissionAmt;
  campaign.net_meta_budget += netMetaAdd;
  if (additionalDays > 0) {
    campaign.duration_days += additionalDays;
    campaign.end_date = new Date(new Date(campaign.end_date).getTime() + additionalDays * 24 * 60 * 60 * 1000);
  }
  await campaign.save();

  await AdWalletTransaction.create({
    wallet_id: wallet._id,
    owner_user_id: campaign.owner_user_id,
    campaign_id: campaign._id,
    transaction_type: 'CAMPAIGN_TOPUP_LOCK',
    credit_amount: 0,
    total_gateway_paid: topupAmount,
    notes: `Top-up budget of ₹${topupAmount} locked for campaign ${campaign.campaign_code}`,
  });

  return { success: true, campaign };
}

/**
 * Injects a realistic fake buyer lead for Localhost Simulator testing
 */
export async function injectFakeBuyerLead(campaignId: string) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  const FIRST_NAMES = ['Rajesh', 'Pooja', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Rohan', 'Kavita', 'Suresh', 'Deepika'];
  const LAST_NAMES = ['Sharma', 'Mehta', 'Verma', 'Kulkarni', 'Patil', 'Deshmukh', 'Joshi', 'Gupta', 'Singh', 'Chavan'];
  const CITIES = ['Dombivli East', 'Kalyan West', 'Thane West', 'Ghatkopar', 'Mulund', 'Navi Mumbai', 'Powai'];

  const fName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const fullName = `${fName} ${lName}`;
  const randomPhone = `+91 ${9800000000 + Math.floor(Math.random() * 199999999)}`;
  const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${Math.floor(Math.random() * 999)}@gmail.com`;
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];

  const lead = await AdLeadCrm.create({
    campaign_id: campaign._id,
    owner_user_id: campaign.owner_user_id,
    root_property_id: campaign.root_property_id,
    target_hierarchy_level: campaign.target_hierarchy_level,
    hierarchy_breadcrumb: campaign.hierarchy_breadcrumb,
    meta_leadgen_id: `sim_lead_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    buyer_full_name: fullName,
    buyer_phone: randomPhone,
    buyer_email: email,
    buyer_city: city,
    qualification_answers_json: {
      interested_configuration: campaign.target_hierarchy_level === 'UNIT_OR_CONFIG' ? 'Selected Unit Offering' : '2 BHK Premium',
      budget_comfort: 'Yes, pre-approved home loan in place',
      buying_timeline: 'Immediate (Within 15-30 Days)',
      site_visit_interest: 'Yes, please call to arrange site visit this weekend',
    },
    lead_source_platform: 'LOCAL_SIMULATOR',
    crm_status: 'NEW_UNREAD',
    builder_remarks: 'Auto-injected simulated high-intent buyer inquiry.',
  });

  campaign.metrics_leads_count += 1;
  await campaign.save();

  return lead;
}

/**
 * Simulates metrics increment (Impressions, Clicks, Spend) for Localhost testing
 */
export async function simulateMetricsIncrement(
  campaignId: string,
  increments: { impressions?: number; clicks?: number; spend?: number }
) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  const addImp = increments.impressions || 1500;
  const addClicks = increments.clicks || 45;
  const addSpend = increments.spend || 1000;

  campaign.metrics_impressions += addImp;
  campaign.metrics_reach += Math.round(addImp * 0.85);
  campaign.metrics_clicks += addClicks;
  campaign.metrics_meta_spent_inr += addSpend;

  // Builder spent = Meta spent + proportional commission
  const commissionRatio = 1 + campaign.platform_commission_percent / 100;
  campaign.metrics_builder_spent_inr = Math.min(
    campaign.total_builder_budget,
    Math.round(campaign.metrics_meta_spent_inr * commissionRatio)
  );

  // Auto-kill switch if budget exhausted
  if (campaign.metrics_meta_spent_inr >= campaign.net_meta_budget) {
    campaign.status = 'COMPLETED_BUDGET_FULL';
  }

  campaign.last_synced_at = new Date();
  await campaign.save();

  return campaign;
}

/**
 * Simulates 100% budget exhaustion and triggers the hard kill-switch
 */
export async function simulateBudgetKillSwitch(campaignId: string) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  campaign.metrics_meta_spent_inr = campaign.net_meta_budget;
  campaign.metrics_builder_spent_inr = campaign.total_builder_budget;
  campaign.status = 'COMPLETED_BUDGET_FULL';
  campaign.last_synced_at = new Date();
  await campaign.save();

  // Settle Escrow in wallet
  const wallet = await AdWallet.findOne({ owner_user_id: campaign.owner_user_id });
  if (wallet) {
    wallet.locked_escrow_balance = Math.max(0, wallet.locked_escrow_balance - campaign.total_builder_budget);
    wallet.lifetime_spent_balance += campaign.total_builder_budget;
    await wallet.save();

    await AdWalletTransaction.create({
      wallet_id: wallet._id,
      owner_user_id: campaign.owner_user_id,
      campaign_id: campaign._id,
      transaction_type: 'SPEND_SETTLEMENT',
      credit_amount: 0,
      total_gateway_paid: campaign.total_builder_budget,
      notes: `100% budget settled upon completion of campaign ${campaign.campaign_code}`,
    });
  }

  return campaign;
}

/**
 * Event Hook: Pauses active ads if a property or hierarchy node is unpublished or sold out
 */
export async function pauseActiveAdsForHierarchyNode(nodeId: string, nodeType: string = 'property') {
  const query: any = {
    status: { $in: ['ACTIVE_RUNNING', 'PENDING_ADMIN_APPROVAL', 'APPROVED_PUSHING_TO_META'] },
  };

  if (nodeType === 'unit') {
    query.target_unit_id = nodeId;
  } else if (nodeType === 'tower') {
    query.target_tower_id = nodeId;
  } else if (nodeType === 'phase') {
    query.target_phase_id = nodeId;
  } else {
    query.root_property_id = nodeId;
  }

  const affectedCampaigns = await AdCampaign.find(query);
  const results = [];

  for (const campaign of affectedCampaigns) {
    campaign.status = 'PAUSED_PROPERTY_UNPUBLISHED';
    await campaign.save();

    // Unlock remaining unspent escrow
    const unspentBuilder = Math.max(0, campaign.total_builder_budget - campaign.metrics_builder_spent_inr);
    if (unspentBuilder > 0) {
      const wallet = await AdWallet.findOne({ owner_user_id: campaign.owner_user_id });
      if (wallet) {
        wallet.locked_escrow_balance = Math.max(0, wallet.locked_escrow_balance - unspentBuilder);
        wallet.available_balance += unspentBuilder;
        await wallet.save();

        await AdWalletTransaction.create({
          wallet_id: wallet._id,
          owner_user_id: campaign.owner_user_id,
          campaign_id: campaign._id,
          transaction_type: 'PARTIAL_UNSPENT_REFUND',
          credit_amount: unspentBuilder,
          notes: `Auto-refund unspent balance of ₹${unspentBuilder} because target property was marked unpublished/sold out.`,
        });
      }
    }

    results.push({ campaignId: campaign._id, code: campaign.campaign_code, unspentRefunded: unspentBuilder });
  }

  return results;
}
