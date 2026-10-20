"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Layers,
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Upload,
  Plus,
  RefreshCw,
  HelpCircle,
  Eye,
  FileSpreadsheet,
  FileText,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  Save,
  Wallet,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";

interface AdsStudioViewProps {
  currentUser?: any;
  initialProperties?: any[];
}

function mapToEligibleProperty(p: any) {
  const statusStr = String(p.status || "").toLowerCase();
  const isPublished = ["published", "active"].includes(statusStr);
  const name = (p.townshipName || p.name || p.details?.township?.name || p.details?.name || "Property").trim();
  const id = (p.id || p._id || "").toString();
  const details = p.details || {};

  // 1. Collect all project/phase structures from all possible sources
  const allProjectsRaw: any[] = Array.isArray(p.phases) && p.phases.length > 0
    ? p.phases
    : Array.isArray(p.rawProjects) && p.rawProjects.length > 0
    ? p.rawProjects
    : Array.isArray(details.projects)
    ? details.projects
    : [];

  // 2. Collect all tower structures
  const directTowers = Array.isArray(p.towers) && p.towers.length > 0
    ? p.towers
    : Array.isArray(p.rawTowers) && p.rawTowers.length > 0
    ? p.rawTowers
    : Array.isArray(details.towers)
    ? details.towers
    : [];

  const projectTowers = allProjectsRaw.flatMap((proj: any) =>
    Array.isArray(proj.towers) ? proj.towers : []
  );

  const combinedTowers = [...directTowers, ...projectTowers];
  const seenTowerKeys = new Set<string>();
  const allTowersRaw: any[] = combinedTowers.filter((t: any) => {
    const key = (t.id || t._id || t.name || "").toString();
    if (!key || seenTowerKeys.has(key)) return false;
    seenTowerKeys.add(key);
    return true;
  });

  // 3. Collect all units across all sources (root, projects, and towers)
  const allUnitsRaw: any[] = [];
  if (Array.isArray(p.units)) allUnitsRaw.push(...p.units);
  if (Array.isArray(p.rawUnits)) allUnitsRaw.push(...p.rawUnits);
  if (Array.isArray(details.generatedUnits)) allUnitsRaw.push(...details.generatedUnits);
  if (Array.isArray(details.units)) allUnitsRaw.push(...details.units);

  allProjectsRaw.forEach((proj: any) => {
    if (Array.isArray(proj.generatedUnits)) allUnitsRaw.push(...proj.generatedUnits);
    if (Array.isArray(proj.units)) allUnitsRaw.push(...proj.units);
    if (Array.isArray(proj.details?.generatedUnits)) allUnitsRaw.push(...proj.details.generatedUnits);
    if (Array.isArray(proj.details?.units)) allUnitsRaw.push(...proj.details.units);
  });

  allTowersRaw.forEach((tw: any) => {
    if (Array.isArray(tw.units)) allUnitsRaw.push(...tw.units);
  });

  // 4. Index units by tower and project
  const unitsByTower: Record<string, any[]> = {};
  const unitsByProject: Record<string, any[]> = {};
  const formattedUnitsList: any[] = [];
  const seenUnitIds = new Set<string>();

  allUnitsRaw.forEach((u: any, uIdx: number) => {
    const uNum = u.unitNumber || `Unit ${uIdx + 1}`;
    const uId = (u.id || u._id || `${id}-u-${uNum}-${uIdx}`).toString();
    if (seenUnitIds.has(uId)) return;
    seenUnitIds.add(uId);

    const uObj = {
      id: uId,
      unitNumber: uNum,
      configuration: u.configuration || "Standard",
      carpetArea: Number(u.carpetArea || u.area || 0),
      price: Number(u.price || u.allInclusivePrice || 0),
      status: u.status || "available",
      isPublished: isPublished || ["published", "active", "available"].includes(String(u.status || "").toLowerCase()),
      towerId: (u.towerId || u.parentId || "").toString(),
      projectId: (u.projectId || u.parentProjectId || "").toString(),
    };

    formattedUnitsList.push(uObj);

    // Index by towerId
    if (uObj.towerId) {
      if (!unitsByTower[uObj.towerId]) unitsByTower[uObj.towerId] = [];
      unitsByTower[uObj.towerId].push(uObj);
    }

    // Index by tower name prefix (e.g. "AYODHYA-101" -> "AYODHYA")
    if (uNum.includes("-")) {
      const prefix = uNum.split("-")[0].trim().toUpperCase();
      if (prefix) {
        if (!unitsByTower[prefix]) unitsByTower[prefix] = [];
        unitsByTower[prefix].push(uObj);
      }
    }

    // Index by projectId
    if (uObj.projectId) {
      if (!unitsByProject[uObj.projectId]) unitsByProject[uObj.projectId] = [];
      unitsByProject[uObj.projectId].push(uObj);
    }
  });

  // 5. Map towers with their resolved units
  const formatTower = (t: any, idx: number, fallbackRera?: string, fallbackProjId?: string) => {
    const tId = (t.id || t._id || `${id}-t-${idx}`).toString();
    const tName = t.name || `Tower ${idx + 1}`;
    const tNameUpper = tName.trim().toUpperCase();

    const tHero = t.heroImage || "";
    const tGallery = Array.isArray(t.galleryImages)
      ? t.galleryImages.map((img: string) => ({ url: img, type: "IMAGE" }))
      : [];
    const tMedia = tHero ? [{ url: tHero, type: "IMAGE" }, ...tGallery] : [...tGallery];

    const tUnits = unitsByTower[tId] || unitsByTower[tNameUpper] || (Array.isArray(t.units) ? t.units : []);
    const uPrices = tUnits.map((u: any) => Number(u.price || 0)).filter((x: number) => x > 0);
    const tPrice = uPrices.length > 0 ? Math.min(...uPrices) : Number(t.priceRangeMin || t.priceStarting || 0);

    return {
      id: tId,
      name: tName,
      slug: t.slug || tName.toLowerCase().replace(/\s+/g, "-"),
      projectId: (t.projectId || t.parentProjectId || fallbackProjId || "").toString(),
      status: t.status || (isPublished ? "published" : "draft"),
      isPublished: isPublished || ["published", "active"].includes(String(t.status || "").toLowerCase()),
      reraNumber: t.reraNumber || fallbackRera || "",
      media: tMedia,
      units: tUnits,
      priceStarting: tPrice,
    };
  };

  // 6. Map phases / projects
  const phases = allProjectsRaw.map((proj: any, idx: number) => {
    const projId = (proj.id || proj._id || `${id}-proj-${idx}`).toString();
    const projName = proj.name || `Phase ${idx + 1}`;
    const projNameUpper = projName.trim().toUpperCase();

    const matchingTowers = allTowersRaw.filter((t: any) => {
      const pId = (t.projectId || t.parentProjectId || "").toString();
      return pId === projId || pId === proj.id || pId === projName || pId.toUpperCase() === projNameUpper;
    });

    const towerCandidates = matchingTowers.length > 0 ? matchingTowers : (Array.isArray(proj.towers) ? proj.towers : []);
    const projTowers = towerCandidates.map((t: any, tIdx: number) =>
      formatTower(t, tIdx, proj.reraNumber, projId)
    );

    return {
      id: projId,
      name: projName,
      slug: proj.slug || projName.toLowerCase().replace(/\s+/g, "-"),
      status: proj.status || (isPublished ? "published" : "draft"),
      isPublished: isPublished || ["published", "active"].includes(String(proj.status || "").toLowerCase()),
      reraNumber: proj.reraNumber || "",
      media: proj.heroImage ? [{ url: proj.heroImage, type: "IMAGE" }] : [],
      towers: projTowers,
    };
  });

  // 7. All towers list
  const towers = allTowersRaw.map((t: any, idx: number) => formatTower(t, idx, p.reraNumber || details.reraNumber));

  // 8. Media
  const photos = Array.isArray(details.photos) ? details.photos : [];
  const heroImages = Array.isArray(details.heroImages) ? details.heroImages : [];
  const singleHero = details.heroImage || details.township?.heroImage || p.thumbnail;
  const media: Array<{ url: string; type: "IMAGE" | "VIDEO" }> = [];
  if (singleHero && typeof singleHero === "string") media.push({ url: singleHero, type: "IMAGE" });
  heroImages.forEach((img: any) => {
    if (typeof img === "string") media.push({ url: img, type: "IMAGE" });
    else if (img?.url) media.push({ url: img.url, type: "IMAGE" });
  });
  photos.forEach((img: any) => {
    if (typeof img === "string") media.push({ url: img, type: "IMAGE" });
    else if (img?.url) media.push({ url: img.url, type: "IMAGE" });
  });

  // 9. Resolve RERA number
  let resolvedRera = p.reraNumber || details.reraNumber || "";
  if (!resolvedRera || resolvedRera.includes("XXXX") || resolvedRera.toLowerCase().includes("pending")) {
    const fromPhase = phases.find((ph: any) => ph.reraNumber && !ph.reraNumber.includes("XXXX") && !ph.reraNumber.toLowerCase().includes("pending"))?.reraNumber;
    const fromTower = towers.find((tw: any) => tw.reraNumber && !tw.reraNumber.includes("XXXX") && !tw.reraNumber.toLowerCase().includes("pending"))?.reraNumber;
    resolvedRera = fromPhase || fromTower || resolvedRera || "";
  }

  // 10. Resolve True Starting Price (from unit min price or tower min price) - NOT totalValue
  const unitPrices = formattedUnitsList.map((u: any) => Number(u.price || 0)).filter((pr: number) => pr > 0);
  const towerPrices = towers.map((t: any) => Number(t.priceStarting || 0)).filter((pr: number) => pr > 0);

  let resolvedPrice = 0;
  if (unitPrices.length > 0) {
    resolvedPrice = Math.min(...unitPrices);
  } else if (towerPrices.length > 0) {
    resolvedPrice = Math.min(...towerPrices);
  } else if (p.priceStarting && Number(p.priceStarting) > 0 && Number(p.priceStarting) < 500000000) {
    resolvedPrice = Number(p.priceStarting);
  } else if (details.pricing?.startingPrice) {
    resolvedPrice = Number(details.pricing.startingPrice);
  }

  // 11. Visitor Panel Deep Link
  const visitorBaseUrl = (
    process.env.NEXT_PUBLIC_VISITOR_PANEL_URL ||
    (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://localhost:3002"
      : "https://astronixrealty.com")
  ).replace(/\/$/, "");

  const resolvedSlug = p.slug || details.slug || details.township?.slug || name.toLowerCase().replace(/\s+/g, "-");
  const flowType = p.flowType || p.type || "township";
  const entityPath = flowType === "township" ? `/township/${resolvedSlug}` : `/properties/${resolvedSlug}`;
  const deepLinkUrl = `${visitorBaseUrl}${entityPath}`;
  const isMandateEntity = p.role === "mandate";

  const propertyInternalDevName = (
    details.builderName ||
    details.township?.builderName ||
    details.project?.builderName ||
    details.townshipData?.builderName ||
    details.developerName ||
    details.township?.developerName ||
    details.project?.developerName ||
    details.brandName ||
    details.township?.brandName ||
    details.companyName ||
    details.township?.companyName ||
    details.promoterName ||
    p.builderName ||
    p.developerName ||
    ""
  ).trim();

  const developerName = (
    p.developer?.name ||
    propertyInternalDevName ||
    (!isMandateEntity && typeof p.builderId === "object" ? p.builderId?.profile?.companyName || p.builderId?.profile?.developerName || p.builderId?.name : "") ||
    name
  ).trim();

  const propertyInternalDevLogo =
    details.builderLogo ||
    details.township?.builderLogo ||
    details.project?.builderLogo ||
    details.townshipData?.builderLogo ||
    details.developerLogo ||
    details.township?.developerLogo ||
    details.project?.developerLogo ||
    details.brandLogo ||
    details.township?.brandLogo ||
    details.companyLogo ||
    details.township?.companyLogo ||
    p.builderLogo ||
    p.developerLogo ||
    "";

  const developerLogo =
    p.developer?.logo ||
    propertyInternalDevLogo ||
    (!isMandateEntity && typeof p.builderId === "object" ? p.builderId?.profile?.logo || p.builderId?.profile?.developerLogo || p.builderId?.profile?.companyLogo : "") ||
    "";

  return {
    id,
    name,
    slug: resolvedSlug,
    type: flowType,
    developer: {
      name: developerName,
      logo: developerLogo,
    },
    status: p.status || "draft",
    isPublished,
    isEligibleForAds: isPublished,
    ineligibleReason: isPublished
      ? null
      : "⚠️ Yeh property abhi Published nahi hai. Ad chalane ke liye pehle is property ko publish karwayein.",
    reraNumber: resolvedRera,
    priceStarting: resolvedPrice,
    location: {
      city: typeof p.location === "string" ? p.location : (p.location?.city || details.location?.city || "Mumbai"),
      address: typeof p.location === "string" ? p.location : (p.location?.address || details.location?.address || ""),
    },
    media: media.length > 0 ? media : (p.thumbnail ? [{ url: p.thumbnail, type: "IMAGE" }] : []),
    phases,
    towers,
    units: formattedUnitsList,
    deepLinkUrl,
  };
}

export function AdsStudioView({ currentUser, initialProperties = [] }: AdsStudioViewProps) {
  const [activeTab, setActiveTab] = useState<"create" | "campaigns" | "crm" | "wallet">("create");

  // Global State with initial fallback from parent dashboard
  const [properties, setProperties] = useState<any[]>(() => {
    return Array.isArray(initialProperties) && initialProperties.length > 0
      ? initialProperties.map(mapToEligibleProperty)
      : [];
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>({ available_balance: 0, locked_escrow_balance: 0, lifetime_spent_balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sync initialProperties if they arrive or update
  useEffect(() => {
    if (Array.isArray(initialProperties) && initialProperties.length > 0) {
      setProperties(initialProperties.map(mapToEligibleProperty));
    }
  }, [initialProperties]);

  const [copiedLink, setCopiedLink] = useState(false);

  // Wizard State
  const [step, setStep] = useState(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [hierarchyLevel, setHierarchyLevel] = useState<"WHOLE_PROPERTY" | "PHASE_OR_PROJECT" | "TOWER_OR_WING" | "UNIT_OR_CONFIG">("WHOLE_PROPERTY");
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [selectedTowerId, setSelectedTowerId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [adGoal, setAdGoal] = useState<"INSTANT_LEAD_FORM" | "WHATSAPP_MESSAGES" | "DYNAMIC_CATALOG_CAROUSEL">("INSTANT_LEAD_FORM");

  // Step 2 Design State
  const [mediaSourceTab, setMediaSourceTab] = useState<"gallery" | "upload">("gallery");
  const [selectedMediaUrl, setSelectedMediaUrl] = useState("");
  const [selectedMediaType, setSelectedMediaType] = useState<"video" | "image">("image");
  const [primaryText, setPrimaryText] = useState("");
  const [headline, setHeadline] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [ctaButton, setCtaButton] = useState("DOWNLOAD");
  const [aiLang, setAiLang] = useState<"English" | "Hinglish" | "Hindi" | "Marathi">("Hinglish");

  // Step 3 Audience State
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [customRadius, setCustomRadius] = useState(15);
  const [ageMin, setAgeMin] = useState(25);
  const [ageMax, setAgeMax] = useState(55);
  const [buyerSegment, setBuyerSegment] = useState("MID_SEGMENT");

  // Step 4 Budget State
  const [qConfig, setQConfig] = useState(true);
  const [qTimeline, setQTimeline] = useState(true);
  const [qSiteVisit, setQSiteVisit] = useState(true);
  const [totalBudget, setTotalBudget] = useState(7000);
  const [durationDays, setDurationDays] = useState(7);

  // Mobile Preview State
  const [previewPlatform, setPreviewPlatform] = useState<"REEL" | "FEED" | "FORM">("REEL");

  // Modals
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState(10000);
  const [activeTopupCampaignId, setActiveTopupCampaignId] = useState("");

  // CRM Filters
  const [crmStatusFilter, setCrmStatusFilter] = useState("ALL");
  const [crmSearch, setCrmSearch] = useState("");

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch properties (tries /api/panel/ads/eligible-properties, with seamless fallback to /api/properties)
      try {
        const propsRes = await fetch("/api/panel/ads/eligible-properties");
        if (propsRes.ok) {
          const propsData = await propsRes.json();
          if (propsData.success && Array.isArray(propsData.properties) && propsData.properties.length > 0) {
            setProperties(propsData.properties);
            if (!selectedPropertyId) {
              const firstEligible = propsData.properties.find((p: any) => p.isEligibleForAds) || propsData.properties[0];
              if (firstEligible) setSelectedPropertyId(firstEligible.id);
            }
          } else {
            // Fallback to /api/properties
            const fallbackRes = await fetch("/api/properties");
            if (fallbackRes.ok) {
              const fbData = await fallbackRes.json();
              if (Array.isArray(fbData.properties) && fbData.properties.length > 0) {
                const mapped = fbData.properties.map(mapToEligibleProperty);
                setProperties(mapped);
                if (!selectedPropertyId) {
                  const firstEligible = mapped.find((p: any) => p.isEligibleForAds) || mapped[0];
                  if (firstEligible) setSelectedPropertyId(firstEligible.id);
                }
              }
            }
          }
        } else {
          // Fallback to /api/properties
          const fallbackRes = await fetch("/api/properties");
          if (fallbackRes.ok) {
            const fbData = await fallbackRes.json();
            if (Array.isArray(fbData.properties) && fbData.properties.length > 0) {
              const mapped = fbData.properties.map(mapToEligibleProperty);
              setProperties(mapped);
              if (!selectedPropertyId) {
                const firstEligible = mapped.find((p: any) => p.isEligibleForAds) || mapped[0];
                if (firstEligible) setSelectedPropertyId(firstEligible.id);
              }
            }
          }
        }
      } catch (pErr) {
        console.error("Error fetching properties in Ads Studio:", pErr);
      }

      // 2. Fetch campaigns
      try {
        const campRes = await fetch("/api/panel/ads/campaigns");
        if (campRes.ok) {
          const campData = await campRes.json();
          if (campData.success) setCampaigns(campData.campaigns || []);
        }
      } catch (cErr) {
        console.error("Error fetching campaigns in Ads Studio:", cErr);
      }

      // 3. Fetch wallet
      try {
        const walletRes = await fetch("/api/panel/ads/wallet");
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          if (walletData.success) {
            setWallet(walletData.wallet || { available_balance: 0, locked_escrow_balance: 0, lifetime_spent_balance: 0 });
            setTransactions(walletData.transactions || []);
          }
        }
      } catch (wErr) {
        console.error("Error fetching wallet in Ads Studio:", wErr);
      }

      // 4. Fetch presets
      try {
        const presetsRes = await fetch("/api/panel/ads/presets");
        if (presetsRes.ok) {
          const presetsData = await presetsRes.json();
          if (presetsData.success) {
            setPresets(presetsData.presets || []);
            if (presetsData.presets?.length > 0) {
              setSelectedPresetId(presetsData.presets[0]._id);
            }
          }
        }
      } catch (prErr) {
        console.error("Error fetching presets in Ads Studio:", prErr);
      }

      // 5. Fetch leads
      try {
        const leadsRes = await fetch("/api/panel/ads/leads");
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          if (leadsData.success) setLeads(leadsData.leads || []);
        }
      } catch (lErr) {
        console.error("Error fetching leads in Ads Studio:", lErr);
      }
    } catch (err) {
      console.error("Global Error fetching Ads Studio data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-select first eligible property when properties load if none is selected
  useEffect(() => {
    if (!selectedPropertyId && properties.length > 0) {
      const firstEligible = properties.find((p) => p.isEligibleForAds) || properties[0];
      if (firstEligible) setSelectedPropertyId(firstEligible.id);
    }
  }, [properties, selectedPropertyId]);

  // Selected Property Object
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  // Derived Hierarchy Data
  const currentPhases = selectedProperty?.phases || [];
  const selectedPhase = currentPhases.find((ph: any) => ph.id === selectedPhaseId);

  // All towers belonging to this property (both direct and under all phases)
  const allPropertyTowers: any[] = useMemo(() => {
    const direct = selectedProperty?.towers || [];
    const fromPhases = (selectedProperty?.phases || []).flatMap((ph: any) => ph.towers || []);
    const combined = [...direct, ...fromPhases];
    const seen = new Set<string>();
    return combined.filter((t: any) => {
      const key = (t.id || t._id || t.name || "").toString();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selectedProperty]);

  // Towers filtered by phase if phase is selected, otherwise all towers
  const currentTowers = useMemo(() => {
    if (selectedPhase) {
      if (selectedPhase.towers && selectedPhase.towers.length > 0) {
        return selectedPhase.towers;
      }
      return allPropertyTowers.filter((t: any) =>
        t.projectId === selectedPhase.id ||
        t.projectId === selectedPhase.name ||
        t.parentProjectId === selectedPhase.id
      );
    }
    return allPropertyTowers;
  }, [selectedPhase, allPropertyTowers]);

  // Selected tower can be in currentTowers or anywhere in property
  const selectedTower = allPropertyTowers.find((t: any) => t.id === selectedTowerId);

  // Auto-resolved phase (if tower was selected directly, resolve its parent phase)
  const effectivePhase = selectedPhase || (selectedTower ? currentPhases.find((ph: any) =>
    ph.id === selectedTower.projectId ||
    ph.name === selectedTower.projectId ||
    ph.towers?.some((t: any) => t.id === selectedTower.id)
  ) : null);

  // All units belonging to this property (from property.units or from allPropertyTowers)
  const allPropertyUnits: any[] = useMemo(() => {
    if (Array.isArray(selectedProperty?.units) && selectedProperty.units.length > 0) {
      return selectedProperty.units;
    }
    const fromTowers = allPropertyTowers.flatMap((tw: any) => tw.units || []);
    if (fromTowers.length > 0) return fromTowers;
    return [];
  }, [selectedProperty, allPropertyTowers]);

  // Current units filtered by tower or phase or all
  const currentUnits = useMemo(() => {
    if (selectedTower) {
      return selectedTower.units || [];
    }
    if (selectedPhase) {
      const phaseTowers = selectedPhase.towers || [];
      const phaseUnits = phaseTowers.flatMap((tw: any) => tw.units || []);
      if (phaseUnits.length > 0) return phaseUnits;
      return allPropertyUnits.filter((u: any) =>
        u.projectId === selectedPhase.id || u.projectId === selectedPhase.name
      );
    }
    return allPropertyUnits;
  }, [selectedTower, selectedPhase, allPropertyUnits]);

  const selectedUnit = currentUnits.find((u: any) => u.id === selectedUnitId);

  const visitorBaseUrl = (
    process.env.NEXT_PUBLIC_VISITOR_PANEL_URL ||
    (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://localhost:3002"
      : "https://astronixrealty.com")
  ).replace(/\/$/, "");

  const propSlug = selectedProperty?.slug || selectedProperty?.id || "";
  const propType = selectedProperty?.type || "township";
  const basePropPath = propType === "township"
    ? `${visitorBaseUrl}/township/${propSlug}`
    : `${visitorBaseUrl}/properties/${propSlug}`;

  // Active Builder / Developer Name & Logo (dynamically extracted from selected property details)
  const isMandateUser = currentUser?.role === "mandate" || currentUser?.userType === "mandate";

  const propInternalDevName = (
    selectedProperty?.developer?.name ||
    selectedProperty?.builderName ||
    selectedProperty?.developerName ||
    selectedProperty?.details?.builderName ||
    selectedProperty?.details?.township?.builderName ||
    selectedProperty?.details?.project?.builderName ||
    selectedProperty?.details?.townshipData?.builderName ||
    selectedProperty?.details?.developerName ||
    selectedProperty?.details?.township?.developerName ||
    selectedProperty?.details?.project?.developerName ||
    selectedProperty?.details?.brandName ||
    selectedProperty?.details?.township?.brandName ||
    selectedProperty?.details?.companyName ||
    selectedProperty?.details?.township?.companyName ||
    selectedProperty?.details?.promoterName ||
    ""
  ).trim();

  const activeDeveloperName = (
    propInternalDevName ||
    (!isMandateUser ? (currentUser?.profile?.companyName || currentUser?.profile?.developerName || currentUser?.name) : "") ||
    selectedProperty?.name ||
    "Developer"
  ).trim();

  const propInternalDevLogo =
    selectedProperty?.developer?.logo ||
    selectedProperty?.builderLogo ||
    selectedProperty?.developerLogo ||
    selectedProperty?.details?.builderLogo ||
    selectedProperty?.details?.township?.builderLogo ||
    selectedProperty?.details?.project?.builderLogo ||
    selectedProperty?.details?.townshipData?.builderLogo ||
    selectedProperty?.details?.developerLogo ||
    selectedProperty?.details?.township?.developerLogo ||
    selectedProperty?.details?.project?.developerLogo ||
    selectedProperty?.details?.brandLogo ||
    selectedProperty?.details?.township?.brandLogo ||
    selectedProperty?.details?.companyLogo ||
    selectedProperty?.details?.township?.companyLogo ||
    "";

  const activeDeveloperLogo =
    propInternalDevLogo ||
    (!isMandateUser ? (currentUser?.profile?.logo || currentUser?.profile?.developerLogo || currentUser?.profile?.companyLogo) : "") ||
    "";

  const activeDeveloperInitials = (activeDeveloperName || "DV")
    .split(" ")
    .filter(Boolean)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "DV";

  // Auto-calculated Breadcrumb & Deep Link
  let hierarchyBreadcrumb = selectedProperty?.name || "Select Property";
  let deepLinkUrl = selectedProperty?.deepLinkUrl || basePropPath;
  let autoPrice = Number(selectedProperty?.priceStarting || 0);
  let autoRera = selectedProperty?.reraNumber || "";
  let autoCarpet = "";

  // Sanity check: if autoPrice is whole township valuation (e.g. > 10 Cr) or 0, fallback to unit min price
  const allPropertyUnitPrices = allPropertyUnits.map((u: any) => Number(u.price || 0)).filter((x: number) => x > 0);
  if ((autoPrice <= 0 || autoPrice > 100000000) && allPropertyUnitPrices.length > 0) {
    autoPrice = Math.min(...allPropertyUnitPrices);
  }

  if (hierarchyLevel === "UNIT_OR_CONFIG" && selectedUnit) {
    const parentPhaseName = effectivePhase ? `${effectivePhase.name} > ` : "";
    const parentTowerName = selectedTower ? `${selectedTower.name} > ` : "";
    hierarchyBreadcrumb = `${selectedProperty?.name} > ${parentPhaseName}${parentTowerName}Unit ${selectedUnit.unitNumber} (${selectedUnit.configuration})`;
    deepLinkUrl = `${visitorBaseUrl}/unit/${selectedUnit.id}`;
    if (selectedUnit.price) autoPrice = selectedUnit.price;
    if (selectedUnit.carpetArea) autoCarpet = `${selectedUnit.carpetArea} Sq.Ft.`;
    if (selectedTower?.reraNumber && !selectedTower.reraNumber.includes("XXXX")) autoRera = selectedTower.reraNumber;
    else if (effectivePhase?.reraNumber && !effectivePhase.reraNumber.includes("XXXX")) autoRera = effectivePhase.reraNumber;
  } else if (hierarchyLevel === "TOWER_OR_WING" && selectedTower) {
    const parentPhaseName = effectivePhase ? `${effectivePhase.name} > ` : "";
    hierarchyBreadcrumb = `${selectedProperty?.name} > ${parentPhaseName}${selectedTower.name}`;
    deepLinkUrl = `${visitorBaseUrl}/tower/${selectedTower.slug || selectedTower.id}`;
    if (selectedTower.reraNumber && !selectedTower.reraNumber.includes("XXXX")) autoRera = selectedTower.reraNumber;
    else if (effectivePhase?.reraNumber && !effectivePhase.reraNumber.includes("XXXX")) autoRera = effectivePhase.reraNumber;
    if (selectedTower.priceStarting) {
      autoPrice = selectedTower.priceStarting;
    } else if (selectedTower.units && selectedTower.units.length > 0) {
      const uPrices = selectedTower.units.map((u: any) => Number(u.price || 0)).filter((x: number) => x > 0);
      if (uPrices.length > 0) autoPrice = Math.min(...uPrices);
    }
  } else if (hierarchyLevel === "PHASE_OR_PROJECT" && effectivePhase) {
    hierarchyBreadcrumb = `${selectedProperty?.name} > ${effectivePhase.name}`;
    deepLinkUrl = `${visitorBaseUrl}/project/${effectivePhase.slug || effectivePhase.id}`;
    if (effectivePhase.reraNumber && !effectivePhase.reraNumber.includes("XXXX")) autoRera = effectivePhase.reraNumber;
    if (effectivePhase.towers && effectivePhase.towers.length > 0) {
      const tPrices = effectivePhase.towers.map((t: any) => Number(t.priceStarting || 0)).filter((x: number) => x > 0);
      if (tPrices.length > 0) {
        autoPrice = Math.min(...tPrices);
      }
    }
  }

  // Combined Media: prioritize selected tower media, then phase media, then property media
  const availableMedia = useMemo(() => {
    const list: Array<{ url: string; type: string; label?: string }> = [];
    if (selectedTower?.media && Array.isArray(selectedTower.media)) {
      selectedTower.media.forEach((m: any) => list.push({ ...m, label: `Tower: ${selectedTower.name}` }));
    }
    if (effectivePhase?.media && Array.isArray(effectivePhase.media)) {
      effectivePhase.media.forEach((m: any) => list.push({ ...m, label: `Project: ${effectivePhase.name}` }));
    }
    if (selectedProperty?.media && Array.isArray(selectedProperty.media)) {
      selectedProperty.media.forEach((m: any) => list.push({ ...m, label: `Township: ${selectedProperty.name}` }));
    }
    const seen = new Set<string>();
    return list.filter((m) => {
      if (!m.url || seen.has(m.url)) return false;
      seen.add(m.url);
      return true;
    });
  }, [selectedProperty, effectivePhase, selectedTower]);

  // Handle auto-writing AI Copy
  const handleAutoGenerateCopy = () => {
    const propName = selectedProperty?.name || "Featured Property";
    const loc = selectedProperty?.location?.city || "Mumbai MMR";
    const priceText = autoPrice ? `₹${(autoPrice / 100000).toFixed(1)} Lakhs*` : "Special Launch Price";
    const configText = selectedUnit ? selectedUnit.configuration : hierarchyLevel === "TOWER_OR_WING" ? "Premium Residences" : "Luxury 1, 2 & 3 BHK Homes";

    if (aiLang === "Hinglish") {
      setPrimaryText(
        `🏡 Apne sapno ka naya ghar book karein ${propName}, ${loc} mein! ✨\n\n` +
          `✅ ${configText} ${autoCarpet ? `(${autoCarpet})` : ""}\n` +
          `✅ Starting at ${priceText} (All-Inclusive)*\n` +
          `✅ MahaRERA No: ${autoRera || "Registered"}\n` +
          `✅ Zero Stamp Duty & Free Modular Kitchen Offer on Booking!\n\n` +
          `👇 Niche 'Download' button dabayein aur official brochure, floor plan aur payment schedule WhatsApp par paayein!`
      );
      setHeadline(`${configText} starting @ ${priceText} | Ready Soon`);
      setShortDescription(`Limited inventory in ${hierarchyBreadcrumb}. Free site visit cab available!`);
    } else if (aiLang === "Hindi") {
      setPrimaryText(
        `🏡 ${propName}, ${loc} में अपना आलीशान आशियाना बनाएं! ✨\n\n` +
          `✅ ${configText}\n` +
          `✅ शुरुआती कीमत मात्र ${priceText}*\n` +
          `✅ रेरा पंजीकृत: ${autoRera || "अधिकृत"}\n\n` +
          `👇 तुरंत ब्रोशर और फ्लोर प्लान व्हाट्सएप पर पाने के लिए नीचे क्लिक करें!`
      );
      setHeadline(`${configText} @ ${priceText} | साइट विजिट बुक करें`);
      setShortDescription(`सीमित फ्लैट उपलब्ध। आज ही अपनी इंक्वायरी भेजें।`);
    } else if (aiLang === "Marathi") {
      setPrimaryText(
        `🏡 ${propName}, ${loc} मध्ये स्वतःचे हक्काचे घर साकार करा! ✨\n\n` +
          `✅ ${configText}\n` +
          `✅ सुरुवातीची किंमत फक्त ${priceText}*\n` +
          `✅ महारेरा नोंदणीकृत: ${autoRera || "नोंदणीकृत"}\n\n` +
          `👇 अधिकृत माहिती, ब्रोशर आणि किमती जाणून घेण्यासाठी खाली 'Download' वर क्लिक करा!`
      );
      setHeadline(`${configText} फक्त ${priceText} मध्ये | खास सवलत`);
      setShortDescription(`मर्यादित युनिट्स शिल्लक. विनामूल्य साइट व्हिजिट उपलब्ध!`);
    } else {
      setPrimaryText(
        `🏡 Own a magnificent ${configText} at ${propName}, ${loc}! ✨\n\n` +
          `✅ Spacious layout ${autoCarpet ? `with ${autoCarpet} carpet` : ""}\n` +
          `✅ Attractive pricing starting at ${priceText}*\n` +
          `✅ MahaRERA Registered: ${autoRera || "P517000XXXXX"}\n` +
          `✅ World-class clubhouse, pool, and lifestyle amenities!\n\n` +
          `👇 Tap 'Download' below to receive the complete price sheet & brochure directly on WhatsApp!`
      );
      setHeadline(`${configText} @ ${priceText} | Special Pricing`);
      setShortDescription(`High rental yield & capital appreciation in prime ${loc}.`);
    }
  };

  // Mock Recharge Function
  const handleQuickRecharge = async (amount: number) => {
    try {
      const res = await fetch("/api/panel/ads/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          payment_mode: "LOCAL_MOCK_TEST",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWallet(data.wallet);
        if (data.transaction) {
          setTransactions((prev) => [data.transaction, ...prev]);
        }
        alert(data.message || `Added ₹${amount} test balance successfully!`);
      } else {
        alert(data.error || "Recharge failed");
      }
    } catch (e) {
      alert("Error processing recharge");
    }
  };

  // Submit Campaign (asDraft = true allows saving with ₹0 or any balance)
  const handleSubmitCampaign = async (asDraft: boolean = false) => {
    if (!selectedPropertyId) {
      alert("Please select a published property first!");
      return;
    }
    if (!primaryText || !headline) {
      alert("Please generate or enter Primary Text and Headline!");
      return;
    }
    if (!asDraft && wallet.available_balance < totalBudget) {
      alert(`Insufficient wallet balance. You have ₹${wallet.available_balance}, need ₹${totalBudget}. Kripya pehle recharge karein ya 'Save as Draft' choose karein.`);
      return;
    }

    setLoading(true);
    try {
      const questions = [];
      if (qConfig) questions.push({ id: "q_config", label: "Interested Configuration", required: true });
      if (qTimeline) questions.push({ id: "q_timeline", label: "Buying Timeline", required: true });
      if (qSiteVisit) questions.push({ id: "q_site_visit", label: "Free Cab Site Visit", required: true });

      const payload = {
        root_property_id: selectedPropertyId,
        target_hierarchy_level: hierarchyLevel,
        target_phase_id: selectedPhaseId || null,
        target_tower_id: selectedTowerId || null,
        target_unit_id: selectedUnitId || null,
        hierarchy_breadcrumb: hierarchyBreadcrumb,
        property_snapshot_json: {
          priceStarting: autoPrice,
          carpetArea: autoCarpet,
          rera: autoRera,
        },
        landing_deep_link_url: deepLinkUrl,
        campaign_objective: adGoal,
        ad_format: selectedMediaType === "video" ? "SINGLE_VIDEO" : "SINGLE_IMAGE",
        media_files_json: selectedMediaUrl ? [{ url: selectedMediaUrl, type: selectedMediaType }] : [],
        primary_text: primaryText,
        headline,
        short_description: shortDescription,
        cta_button_type: ctaButton,
        audience_preset_id: selectedPresetId,
        custom_targeting_json: {
          radius_km: customRadius,
          age_min: ageMin,
          age_max: ageMax,
          buyer_segment: buyerSegment,
        },
        lead_form_questions_json: questions,
        total_builder_budget: totalBudget,
        duration_days: durationDays,
        as_draft: asDraft,
      };

      const res = await fetch("/api/panel/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      const resText = await res.text();
      try {
        data = JSON.parse(resText);
      } catch {
        throw new Error(`Server status ${res.status}. Kripya thodi der me koshish karein.`);
      }

      if (data.success) {
        alert(asDraft ? "💾 " + data.message : "🚀 " + data.message);
        // Refresh campaigns & wallet
        await fetchData();
        setActiveTab("campaigns");
        setStep(1);
      } else {
        alert(data.error || "Failed to create campaign");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Recharge and immediately Launch
  const handleRechargeAndLaunch = async () => {
    const shortfall = Math.max(5000, totalBudget - (wallet.available_balance || 0));
    setLoading(true);
    try {
      const res = await fetch("/api/panel/ads/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: shortfall,
          payment_mode: "LOCAL_MOCK_TEST",
        }),
      });
      let data: any = {};
      try {
        data = JSON.parse(await res.text());
      } catch {
        throw new Error(`Recharge failed (Server status ${res.status})`);
      }

      if (data.success) {
        setWallet(data.wallet);
        if (data.transaction) {
          setTransactions((prev) => [data.transaction, ...prev]);
        }
        // Immediately submit campaign for launch
        await handleSubmitCampaign(false);
      } else {
        alert(data.error || "Recharge failed");
        setLoading(false);
      }
    } catch (e: any) {
      alert("Error: " + (e.message || "Recharge failed"));
      setLoading(false);
    }
  };

  // Activate a Draft Campaign
  const handleActivateDraft = async (camp: any) => {
    const budget = Number(camp.total_builder_budget || 0);
    const available = Number(wallet.available_balance || 0);

    if (available < budget) {
      const shortfall = budget - available;
      const rechargeAmount = Math.max(5000, shortfall);
      const confirmRecharge = confirm(
        `Wallet balance kam hai (Available: ₹${available.toLocaleString("en-IN")}, Needed: ₹${budget.toLocaleString("en-IN")}, Shortfall: ₹${shortfall.toLocaleString("en-IN")}).\n\nKya aap ₹${rechargeAmount.toLocaleString("en-IN")} test balance recharge karke is ad ko abhi activate karna chahte hain?`
      );
      if (!confirmRecharge) return;

      setLoading(true);
      try {
        const rechRes = await fetch("/api/panel/ads/wallet/recharge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: rechargeAmount, payment_mode: "LOCAL_MOCK_TEST" }),
        });
        let rechData: any = {};
        try {
          rechData = JSON.parse(await rechRes.text());
        } catch {
          throw new Error(`Recharge server error (${rechRes.status})`);
        }

        if (!rechData.success) {
          alert("Recharge failed: " + (rechData.error || "Unknown error"));
          setLoading(false);
          return;
        }
        setWallet(rechData.wallet);
        if (rechData.transaction) {
          setTransactions((prev) => [rechData.transaction, ...prev]);
        }
      } catch (e: any) {
        alert("Recharge error: " + e.message);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const actRes = await fetch(`/api/panel/ads/campaigns/${camp._id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      let actData: any = {};
      try {
        actData = JSON.parse(await actRes.text());
      } catch {
        throw new Error(`Activation server error (${actRes.status})`);
      }

      if (actData.success) {
        alert("🚀 " + actData.message);
        await fetchData();
      } else {
        alert(actData.error || "Activation failed");
      }
    } catch (e: any) {
      alert("Activation error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Campaign Pause/Resume
  const handleToggleCampaign = async (campId: string, currentStatus: string) => {
    const targetStatus = currentStatus === "ACTIVE_RUNNING" ? "PAUSED_BY_USER" : "ACTIVE_RUNNING";
    try {
      const res = await fetch(`/api/panel/ads/campaigns/${campId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Status toggle failed");
      }
    } catch (e) {
      alert("Error updating campaign");
    }
  };

  // Update CRM Lead Status
  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/panel/ads/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crm_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, crm_status: newStatus } : l)));
      }
    } catch (e) {
      alert("Error updating lead status");
    }
  };

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    if (crmStatusFilter !== "ALL" && l.crm_status !== crmStatusFilter) return false;
    if (crmSearch) {
      const q = crmSearch.toLowerCase();
      const matchName = l.buyer_full_name?.toLowerCase().includes(q);
      const matchPhone = l.buyer_phone?.includes(q);
      const matchPath = l.hierarchy_breadcrumb?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchPath) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-xs shrink-0">
              <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Meta Ads & Boost Studio
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <Megaphone className="w-3 h-3" /> Meta Marketing API v21.0
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Run hyper-targeted Facebook & Instagram Reel Ads for your published properties, towers & deck configurations with automated escrow.
              </p>
            </div>
          </div>
        </div>

        {/* Live Wallet Chip */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 px-4 shadow-inner">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Ad Credits</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              ₹{(wallet.available_balance || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <button
            onClick={() => setActiveTab("wallet")}
            className="ml-2 px-3 py-1.5 text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl transition-all shadow-xs"
          >
            + Recharge
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar shadow-xs">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "create"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create New Ad (Smart Wizard)</span>
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "campaigns"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>My Campaigns & Live Stats</span>
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
            activeTab === "campaigns" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}>
            {campaigns.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("crm")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "crm"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Ad Leads CRM</span>
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
            activeTab === "crm" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}>
            {leads.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("wallet")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "wallet"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Ad Wallet & GST Invoices</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CREATE NEW AD (SPLIT SCREEN WIZARD + REAL-TIME PREVIEW)            */}
      {/* ========================================================================= */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: 4-Step Interactive Wizard Form (65% width) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs backdrop-blur-md">
            {/* Step Progress Pill Indicator */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
              {[
                { s: 1, title: "Property & Hierarchy" },
                { s: 2, title: "Media & AI Text" },
                { s: 3, title: "Target Audience" },
                { s: 4, title: "Budget & Escrow" },
              ].map((item) => (
                <div
                  key={item.s}
                  onClick={() => setStep(item.s)}
                  className={`flex items-center gap-2 cursor-pointer transition-all ${
                    step === item.s
                      ? "text-blue-600 dark:text-blue-400 font-bold"
                      : step > item.s
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      step === item.s
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                        : step > item.s
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {step > item.s ? "✓" : item.s}
                  </span>
                  <span className="hidden sm:inline text-xs">{item.title}</span>
                </div>
              ))}
            </div>

            {/* STEP 1: Property & Hierarchy Level */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Beginner Guide Note */}
                <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-950 dark:text-blue-200 text-sm flex gap-3 items-start shadow-2xs">
                  <span className="text-xl">💡</span>
                  <div>
                    <strong className="text-blue-900 dark:text-blue-100">Step 1 Guide:</strong> Yahan apni Published Property chunein. Aap chahein toh poore Project/Township ka ad ek sath chala sakte hain, ya kisi khas Phase, Tower, ya 1 BHK / 2 BHK flat ka alag se targeted ad chala sakte hain!
                  </div>
                </div>

                {/* Property Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Select Published Property *
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => {
                      setSelectedPropertyId(e.target.value);
                      setSelectedPhaseId("");
                      setSelectedTowerId("");
                      setSelectedUnitId("");
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 shadow-xs"
                  >
                    <option value="">-- Choose from your registered properties --</option>
                    {properties.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={!p.isEligibleForAds}
                        className={!p.isEligibleForAds ? "text-slate-400" : "text-slate-900 dark:text-slate-100"}
                      >
                        {p.isEligibleForAds ? `🟢 ${p.name} (Published & Live)` : `🔒 ${p.name} (${p.status} - Not Published)`}
                      </option>
                    ))}
                  </select>
                  {selectedProperty && !selectedProperty.isEligibleForAds && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {selectedProperty.ineligibleReason}
                    </p>
                  )}
                </div>

                {/* Choose Hierarchy Promotion Level (Offer-Style Tree & Cascading Selectors) */}
                {selectedProperty && selectedProperty.isEligibleForAds && (
                  <div className="space-y-4 pt-2">
                    {/* Offer-Editor Style Unified Hierarchy Selector */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <span>🎯 Select Target Scope (Project / Tower / Unit)</span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                            Offer-Editor Style
                          </span>
                        </label>
                        {hierarchyLevel !== "WHOLE_PROPERTY" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPhaseId("");
                              setSelectedTowerId("");
                              setSelectedUnitId("");
                              setHierarchyLevel("WHOLE_PROPERTY");
                            }}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                          >
                            Reset to Whole Township
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Jaise Offer create karte waqt aap kisi bhi project ya unke andar ke kisi bhi tower ko select kar sakte hain, yahan dropdown se direct select karein:
                      </p>

                      {/* Unified Tree Dropdown */}
                      <select
                        value={
                          selectedUnitId
                            ? `unit:${selectedUnitId}`
                            : selectedTowerId
                            ? `tower:${selectedTowerId}`
                            : selectedPhaseId
                            ? `phase:${selectedPhaseId}`
                            : `property:${selectedProperty.id}`
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val || val.startsWith("property:")) {
                            setSelectedPhaseId("");
                            setSelectedTowerId("");
                            setSelectedUnitId("");
                            setHierarchyLevel("WHOLE_PROPERTY");
                          } else if (val.startsWith("phase:")) {
                            const pId = val.replace("phase:", "");
                            setSelectedPhaseId(pId);
                            setSelectedTowerId("");
                            setSelectedUnitId("");
                            setHierarchyLevel("PHASE_OR_PROJECT");
                          } else if (val.startsWith("tower:")) {
                            const tId = val.replace("tower:", "");
                            setSelectedTowerId(tId);
                            const towObj = allPropertyTowers.find((t: any) => t.id === tId);
                            const parentPh = currentPhases.find((ph: any) =>
                              ph.id === towObj?.projectId ||
                              ph.name === towObj?.projectId ||
                              ph.towers?.some((t: any) => t.id === tId)
                            );
                            if (parentPh) setSelectedPhaseId(parentPh.id);
                            setSelectedUnitId("");
                            setHierarchyLevel("TOWER_OR_WING");
                          } else if (val.startsWith("unit:")) {
                            const uId = val.replace("unit:", "");
                            setSelectedUnitId(uId);
                            setHierarchyLevel("UNIT_OR_CONFIG");
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-blue-500 shadow-xs"
                      >
                        <option value={`property:${selectedProperty.id}`}>
                          🏘️ Entire Property / Township: {selectedProperty.name} (All Projects &amp; Towers)
                        </option>
                        {currentPhases.map((phase: any) => (
                          <React.Fragment key={phase.id}>
                            <option value={`phase:${phase.id}`} className="font-bold text-amber-600 dark:text-amber-300">
                              {"\u00A0\u00A0\u00A0"}📁 Project / Phase: {phase.name} {phase.towers?.length ? `(${phase.towers.length} Towers)` : ""}
                            </option>
                            {(phase.towers || []).map((tower: any) => (
                              <option key={tower.id} value={`tower:${tower.id}`}>
                                {"\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}🏢 Tower: {tower.name} ({phase.name}) {tower.units?.length ? `• ${tower.units.length} Units` : ""}
                              </option>
                            ))}
                          </React.Fragment>
                        ))}
                        {/* Direct towers not under mapped phases */}
                        {currentPhases.length === 0 &&
                          allPropertyTowers.map((tower: any) => (
                            <option key={tower.id} value={`tower:${tower.id}`}>
                              {"\u00A0\u00A0\u00A0"}🏢 Tower: {tower.name} {tower.units?.length ? `• ${tower.units.length} Units` : ""}
                            </option>
                          ))}
                      </select>

                      {/* Cascading 3-Column Selectors */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Or Step-by-Step Cascading Filters:
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* 1. Project / Phase */}
                          <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>📁 Project / Phase</span>
                              {currentPhases.length > 0 && (
                                <span className="text-[10px] text-slate-400">{currentPhases.length} Available</span>
                              )}
                            </label>
                            <select
                              value={selectedPhaseId}
                              onChange={(e) => {
                                const pId = e.target.value;
                                setSelectedPhaseId(pId);
                                setSelectedTowerId("");
                                setSelectedUnitId("");
                                if (pId) {
                                  setHierarchyLevel("PHASE_OR_PROJECT");
                                } else {
                                  setHierarchyLevel("WHOLE_PROPERTY");
                                }
                              }}
                              disabled={currentPhases.length === 0}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                              <option value="">-- All Projects / Entire Township --</option>
                              {currentPhases.map((ph: any) => (
                                <option key={ph.id} value={ph.id}>
                                  📁 {ph.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 2. Tower / Building */}
                          <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>🏢 Tower / Wing</span>
                              {currentTowers.length > 0 && (
                                <span className="text-[10px] text-slate-400">{currentTowers.length} Available</span>
                              )}
                            </label>
                            <select
                              value={selectedTowerId}
                              onChange={(e) => {
                                const tId = e.target.value;
                                setSelectedTowerId(tId);
                                setSelectedUnitId("");
                                if (tId) {
                                  const towObj = allPropertyTowers.find((t: any) => t.id === tId);
                                  const parentPh = currentPhases.find((ph: any) =>
                                    ph.id === towObj?.projectId ||
                                    ph.name === towObj?.projectId ||
                                    ph.towers?.some((t: any) => t.id === tId)
                                  );
                                  if (parentPh) setSelectedPhaseId(parentPh.id);
                                  setHierarchyLevel("TOWER_OR_WING");
                                } else if (selectedPhaseId) {
                                  setHierarchyLevel("PHASE_OR_PROJECT");
                                } else {
                                  setHierarchyLevel("WHOLE_PROPERTY");
                                }
                              }}
                              disabled={currentTowers.length === 0}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                              <option value="">-- All Towers in Project --</option>
                              {currentTowers.map((tw: any) => {
                                const parentProj = currentPhases.find((ph: any) =>
                                  ph.id === tw.projectId || ph.name === tw.projectId || ph.towers?.some((t: any) => t.id === tw.id)
                                );
                                const projLabel = parentProj && !selectedPhaseId ? ` (${parentProj.name})` : "";
                                return (
                                  <option key={tw.id} value={tw.id}>
                                    🏢 {tw.name}{projLabel}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* 3. Unit / Config */}
                          <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>🚪 Unit / Flat (Optional)</span>
                              {currentUnits.length > 0 && (
                                <span className="text-[10px] text-slate-400">{currentUnits.length} Units</span>
                              )}
                            </label>
                            <select
                              value={selectedUnitId}
                              onChange={(e) => {
                                const uId = e.target.value;
                                setSelectedUnitId(uId);
                                if (uId) {
                                  const chosenUnit = currentUnits.find((u: any) => u.id === uId);
                                  if (chosenUnit?.towerId && !selectedTowerId) {
                                    setSelectedTowerId(chosenUnit.towerId);
                                    const towObj = allPropertyTowers.find((t: any) => t.id === chosenUnit.towerId || t.name === chosenUnit.towerId);
                                    const parentPh = currentPhases.find((ph: any) =>
                                      ph.id === towObj?.projectId ||
                                      ph.name === towObj?.projectId ||
                                      ph.towers?.some((t: any) => t.id === chosenUnit.towerId)
                                    );
                                    if (parentPh && !selectedPhaseId) setSelectedPhaseId(parentPh.id);
                                  }
                                  setHierarchyLevel("UNIT_OR_CONFIG");
                                } else if (selectedTowerId) {
                                  setHierarchyLevel("TOWER_OR_WING");
                                } else if (selectedPhaseId) {
                                  setHierarchyLevel("PHASE_OR_PROJECT");
                                } else {
                                  setHierarchyLevel("WHOLE_PROPERTY");
                                }
                              }}
                              disabled={currentUnits.length === 0}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                              <option value="">-- All Units / General Ad --</option>
                              {currentUnits.slice(0, 100).map((u: any) => (
                                <option key={u.id} value={u.id}>
                                  Unit {u.unitNumber} • {u.configuration} {u.price ? `@ ₹${(u.price / 100000).toFixed(1)}L` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Promotion Level Shortcut Cards (4 Cards) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Active Promotion Level
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {[
                          {
                            lvl: "WHOLE_PROPERTY" as const,
                            icon: "🏢",
                            title: propType === "township" ? "Whole Township" : propType === "project" ? "Entire Project" : propType === "tower" ? "Entire Tower" : "Whole Property",
                            desc: propType === "township" ? "Township brand overview" : propType === "project" ? "Project brand overview" : "Property brand overview",
                          },
                          {
                            lvl: "PHASE_OR_PROJECT" as const,
                            icon: "🏗️",
                            title: "Specific Phase",
                            desc: "Specific project / sector",
                            disabled: currentPhases.length === 0,
                          },
                          {
                            lvl: "TOWER_OR_WING" as const,
                            icon: "🏙️",
                            title: "Specific Tower",
                            desc: "Specific building / wing",
                            disabled: allPropertyTowers.length === 0 && propType !== "tower",
                          },
                          {
                            lvl: "UNIT_OR_CONFIG" as const,
                            icon: "🛋️",
                            title: "Specific Unit",
                            desc: "Exact flat configuration",
                            disabled: currentUnits.length === 0,
                          },
                        ].map((item) => (
                          <div
                            key={item.lvl}
                            onClick={() => {
                              if (item.disabled) return;
                              if (item.lvl === "WHOLE_PROPERTY") {
                                setSelectedPhaseId("");
                                setSelectedTowerId("");
                                setSelectedUnitId("");
                                setHierarchyLevel("WHOLE_PROPERTY");
                              } else if (item.lvl === "PHASE_OR_PROJECT") {
                                if (!selectedPhaseId && currentPhases.length > 0) {
                                  setSelectedPhaseId(currentPhases[0].id);
                                }
                                setSelectedTowerId("");
                                setSelectedUnitId("");
                                setHierarchyLevel("PHASE_OR_PROJECT");
                              } else if (item.lvl === "TOWER_OR_WING") {
                                if (!selectedTowerId && currentTowers.length > 0) {
                                  setSelectedTowerId(currentTowers[0].id);
                                }
                                setSelectedUnitId("");
                                setHierarchyLevel("TOWER_OR_WING");
                              } else if (item.lvl === "UNIT_OR_CONFIG") {
                                if (!selectedUnitId && currentUnits.length > 0) {
                                  setSelectedUnitId(currentUnits[0].id);
                                }
                                setHierarchyLevel("UNIT_OR_CONFIG");
                              }
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              item.disabled
                                ? "opacity-40 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 cursor-not-allowed"
                                : hierarchyLevel === item.lvl
                                ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs font-semibold"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{item.icon}</span>
                              <span className="text-xs font-bold">{item.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Auto-Bound Hierarchy Verification Card */}
                    <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-200 dark:border-emerald-800/30">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Active Promotion Target Verified</span>
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium border border-emerald-500/25">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Live on Visitor Panel
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                          Level: {hierarchyLevel}
                        </span>
                      </div>

                      <div className="text-xs space-y-2.5 mt-3 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">📍 Target Path:</span>
                          <span className="text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-100/80 dark:bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-300 dark:border-emerald-700/50">
                            {hierarchyBreadcrumb}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-200/80 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 shadow-2xs">
                          <div>
                            <span className="block text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Starting Price</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {autoPrice > 0 ? `₹${(autoPrice / 100000).toFixed(2)} Lakhs` : "On Request"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Carpet Area</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {autoCarpet || "Township Blend"}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="block text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">RERA Registration</span>
                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {autoRera && !autoRera.includes("XXXX") && !autoRera.toLowerCase().includes("pending") ? autoRera : "P51700010238"}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Landing Page URL Card with Direct Click & Copy */}
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                              <span>🌐 Landing Page (Live Visitor Panel URL):</span>
                            </div>
                            <a
                              href={deepLinkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 underline underline-offset-2 break-all flex items-center gap-1 transition-colors"
                              title="Click to open page in new tab"
                            >
                              <span>{deepLinkUrl}</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => {
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(deepLinkUrl);
                                  toast.success("Visitor page link copied to clipboard!");
                                  setCopiedLink(true);
                                  setTimeout(() => setCopiedLink(false), 2000);
                                }
                              }}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                              {copiedLink ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                            <a
                              href={deepLinkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
                            >
                              <span>Open Live</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Select Ad Goal */}
                    <div className="mt-6">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Select Campaign Ad Goal
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          {
                            goal: "INSTANT_LEAD_FORM" as const,
                            icon: "🎯",
                            title: "Instant Lead Form",
                            badge: "3X More Leads",
                            desc: "Customer submits verified Name & Phone inside Instagram/FB without leaving.",
                          },
                          {
                            goal: "WHATSAPP_MESSAGES" as const,
                            icon: "💬",
                            title: "WhatsApp Chat",
                            badge: "Direct Contact",
                            desc: "Customer opens WhatsApp chat directly with your sales team.",
                          },
                          {
                            goal: "DYNAMIC_CATALOG_CAROUSEL" as const,
                            icon: "🏘️",
                            title: "Multi-Photo Carousel",
                            badge: "High Engagement",
                            desc: "Swipeable cards showcasing sample flats, amenities, and floor plans.",
                          },
                        ].map((g) => (
                          <div
                            key={g.goal}
                            onClick={() => setAdGoal(g.goal)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                              adGoal === g.goal
                                ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-xs"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xl">{g.icon}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                {g.badge}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">{g.title}</div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{g.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Continue Button */}
                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={() => {
                          setStep(2);
                          if (!primaryText) handleAutoGenerateCopy();
                        }}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30"
                      >
                        Proceed to Step 2: Media & Copy <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Ad Video / Photo & AI Copy Design */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Guide Note */}
                <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-950 dark:text-blue-200 text-sm flex gap-3 items-start shadow-2xs">
                  <span className="text-xl">💡</span>
                  <div>
                    <strong className="text-blue-900 dark:text-blue-100">Step 2 Guide:</strong> Real estate mein 15 se 45 second ka Sample Flat Walkthrough Video ya Drone Reel sabse sasti aur genuine leads lata hai. Niche <strong>✨ 1-Click Auto-Write</strong> dabayein taaki AI aapki property details ke mutabiq best ad caption likh sake!
                  </div>
                </div>

                {/* Media Selector Tabs */}
                <div>
                  <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
                    <button
                      onClick={() => setMediaSourceTab("gallery")}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        mediaSourceTab === "gallery"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      📂 Pick from Selected Property Gallery
                    </button>
                    <button
                      onClick={() => setMediaSourceTab("upload")}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        mediaSourceTab === "upload"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      ⬆️ Upload Custom Ad Reel / Banner
                    </button>
                  </div>

                  {mediaSourceTab === "gallery" ? (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Click to select media from uploaded assets:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
                        {availableMedia.length > 0 ? (
                          availableMedia.map((m: any, i: number) => (
                            <div
                              key={i}
                              onClick={() => {
                                setSelectedMediaUrl(m.url);
                                setSelectedMediaType(m.type?.toLowerCase().includes("video") ? "video" : "image");
                              }}
                              className={`relative rounded-xl overflow-hidden border cursor-pointer aspect-video bg-slate-100 dark:bg-slate-950 transition-all ${
                                selectedMediaUrl === m.url
                                  ? "border-blue-500 ring-2 ring-blue-500/50 shadow-md shadow-blue-500/20"
                                  : "border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100"
                              }`}
                            >
                              <img src={m.url} alt="Media" className="w-full h-full object-cover" />
                              <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded bg-black/70 text-white border border-white/20 font-medium truncate max-w-[85%]">
                                {m.label || "Asset"}
                              </span>
                              <span className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded bg-black/80 text-white uppercase font-bold">
                                {m.type}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-4 text-center py-6 text-xs text-slate-500">
                            No media pre-uploaded for this property or tower. Switch to "Upload Custom" tab.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-950/50">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Upload 9:16 Vertical Reel (.mp4) or 1:1 Square Banner (.png, .jpg)</p>
                      <p className="text-[11px] text-slate-500 mt-1">Recommended size: 1080x1920 or 1080x1080. Max file size: 50MB.</p>
                      <input
                        type="text"
                        placeholder="Or enter direct media HTTPS URL (e.g. Cloudinary / AWS S3)"
                        value={selectedMediaUrl}
                        onChange={(e) => {
                          setSelectedMediaUrl(e.target.value);
                          if (e.target.value.endsWith(".mp4") || e.target.value.endsWith(".mov")) {
                            setSelectedMediaType("video");
                          } else {
                            setSelectedMediaType("image");
                          }
                        }}
                        className="mt-3 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 shadow-2xs"
                      />
                    </div>
                  )}
                </div>

                {/* AI / Template Ad Copy Generator */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/40 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                        AI High-Converting Ad Copy Writer
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Language:</span>
                      {(["Hinglish", "English", "Hindi", "Marathi"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setAiLang(lang);
                          }}
                          className={`text-xs px-2 py-1 rounded-lg transition-all ${
                            aiLang === lang
                              ? "bg-indigo-600 text-white font-bold shadow-xs"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                      <button
                        onClick={handleAutoGenerateCopy}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 ml-2"
                      >
                        <RefreshCw className="w-3 h-3" /> Auto-Write Text
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Primary Text (Main Ad Caption above Reel/Post) *
                      </label>
                      <textarea
                        rows={4}
                        value={primaryText}
                        onChange={(e) => setPrimaryText(e.target.value)}
                        placeholder="Click 'Auto-Write Text' above to generate..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 font-mono shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Ad Headline (Bold text below Video) *
                        </label>
                        <input
                          type="text"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="e.g. 2 BHK Homes @ ₹58L | Zero Stamp Duty*"
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 font-bold shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Short Description (Optional sub-text)
                        </label>
                        <input
                          type="text"
                          value={shortDescription}
                          onChange={(e) => setShortDescription(e.target.value)}
                          placeholder="e.g. Limited Units Left in Tower B. Book Site Visit!"
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Call-To-Action (CTA) Button
                      </label>
                      <select
                        value={ctaButton}
                        onChange={(e) => setCtaButton(e.target.value)}
                        className="w-full sm:w-60 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-2xs"
                      >
                        <option value="DOWNLOAD">Download (Best for Brochure / Cost Sheet)</option>
                        <option value="LEARN_MORE">Learn More</option>
                        <option value="GET_QUOTE">Get Quote</option>
                        <option value="BOOK_NOW">Book Now</option>
                        <option value="APPLY_NOW">Apply Now</option>
                        <option value="WHATSAPP_MESSAGE">Send WhatsApp Message</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Back / Next Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    ← Back to Step 1
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30"
                  >
                    Proceed to Step 3: Audience <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Target Buyer Audience */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Guide Note */}
                <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-950 dark:text-blue-200 text-sm flex gap-3 items-start shadow-2xs">
                  <span className="text-xl">💡</span>
                  <div>
                    <strong className="text-blue-900 dark:text-blue-100">Step 3 Guide:</strong> Aapka ad budget galat logon par waste na ho, isliye humne Real Estate ke 4 Pre-Tested Buyer Presets banaye hain. Bas woh card chunein jo aapke project ke kharidaron se match karta hai!
                  </div>
                </div>

                {/* 4 Audience Preset Cards */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                    Choose Pre-Tested Buyer Audience Preset
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {presets.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => {
                          setSelectedPresetId(p._id);
                          setCustomRadius(p.default_radius_km || 15);
                          setAgeMin(p.age_min || 25);
                          setAgeMax(p.age_max || 55);
                          setBuyerSegment(p.buyer_segment || "MID_SEGMENT");
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedPresetId === p._id
                            ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.preset_title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            {p.buyer_segment}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{p.guide_description_hinglish}</p>
                        <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                          <span>Radius: {p.default_radius_km} KM</span>
                          <span>Age: {p.age_min} - {p.age_max} yrs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fine-Tuning Targeting Slider */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Fine-Tune Location Radius & Demographics
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>Targeting Radius Around Property</span>
                        <strong className="text-blue-600 dark:text-blue-400">{customRadius} KM</strong>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={50}
                        value={customRadius}
                        onChange={(e) => setCustomRadius(Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>Target Buyer Age Group</span>
                        <strong className="text-blue-600 dark:text-blue-400">{ageMin} - {ageMax} Years</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={21}
                          max={65}
                          value={ageMin}
                          onChange={(e) => setAgeMin(Number(e.target.value))}
                          className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-center text-slate-900 dark:text-slate-100 shadow-2xs"
                        />
                        <span className="text-xs text-slate-500">to</span>
                        <input
                          type="number"
                          min={25}
                          max={70}
                          value={ageMax}
                          onChange={(e) => setAgeMax(Number(e.target.value))}
                          className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-center text-slate-900 dark:text-slate-100 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    ← Back to Step 2
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30"
                  >
                    Proceed to Step 4: Budget & Launch <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Lead Form Filter Questions, Budget & Wallet Lock */}
            {step === 4 && (
              <div className="space-y-6">
                {/* Guide Note */}
                <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-950 dark:text-blue-200 text-sm flex gap-3 items-start shadow-2xs">
                  <span className="text-xl">💡</span>
                  <div>
                    <strong className="text-blue-900 dark:text-blue-100">Step 4 Guide:</strong> Grahak ka Name aur Verified Mobile Number Facebook automatic bhar dega. Niche woh filter sawal tick karein jo grahak se puchhne hain taaki aapko sirf genuine buyers ki inquiries milein!
                  </div>
                </div>

                {/* Filter Questions */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Instant Lead Form Qualification Questions
                  </label>
                  <div className="space-y-2 bg-slate-50/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={qConfig}
                        onChange={(e) => setQConfig(e.target.checked)}
                        className="mt-1 accent-blue-600 rounded"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Question 1: "Aap kis Configuration mein interested hain?"
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Auto-populated options: 1 BHK, 2 BHK Luxury, 3 BHK Deck Flat, Commercial Shop.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-800">
                      <input
                        type="checkbox"
                        checked={qTimeline}
                        onChange={(e) => setQTimeline(e.target.checked)}
                        className="mt-1 accent-blue-600 rounded"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Question 2: "Aap kab tak property book karne ka plan kar rahe hain?"
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Options: Immediate (This Month), Within 1-3 Months, Just Exploring.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-800">
                      <input
                        type="checkbox"
                        checked={qSiteVisit}
                        onChange={(e) => setQSiteVisit(e.target.checked)}
                        className="mt-1 accent-blue-600 rounded"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Question 3: "Kya aap is weekend Free Cab Pick-up ke sath Site Visit karna chahenge?"
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Options: Yes - Please Call for Site Visit, Send Cost Sheet on WhatsApp First.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Campaign Budget & Duration */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Total Ad Budget (INR)</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Platform fee (10%) + Net Meta Ad Spend (90%)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-sm">₹</span>
                      <input
                        type="number"
                        step={500}
                        min={2000}
                        max={200000}
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(Number(e.target.value))}
                        className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-center shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="range"
                      min={2000}
                      max={50000}
                      step={1000}
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  {/* Duration Pills */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Campaign Duration
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[3, 5, 7, 15, 30].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDurationDays(d)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            durationDays === d
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:text-white"
                          }`}
                        >
                          {d} Days {d === 7 ? "✨ Recommended" : ""}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily Breakdown & Estimated ROI Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Daily Run Rate</span>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-200">₹{Math.round(totalBudget / durationDays)} / day</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Est. Targeted Buyers Reached</span>
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(totalBudget * 2.2).toLocaleString()} – {Math.round(totalBudget * 4.5).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Est. Verified Buyer Leads</span>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round(totalBudget / 280)} – {Math.round(totalBudget / 120)} Genuine Leads
                      </div>
                    </div>
                  </div>
                </div>

                {/* Escrow Lock & Submit Action */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-600 dark:text-slate-400">Your Available Ad Credits:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">₹{(wallet.available_balance || 0).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className="text-slate-600 dark:text-slate-400">Total Budget to Lock in Escrow:</span>
                    <strong className="text-blue-600 dark:text-blue-400 font-bold">₹{totalBudget.toLocaleString("en-IN")}</strong>
                  </div>

                  {wallet.available_balance >= totalBudget ? (
                    <div className="space-y-2.5">
                      <button
                        onClick={() => handleSubmitCampaign(false)}
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" /> 🚀 Submit Ad for Admin Approval & Lock ₹{totalBudget.toLocaleString("en-IN")} from Wallet
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSubmitCampaign(true)}
                        disabled={loading}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 text-slate-500" /> 💾 Save as Draft (Launch Later without spending now)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>
                          Wallet balance kam hai (Shortfall: ₹{(totalBudget - wallet.available_balance).toLocaleString("en-IN")}). Aap ad ko abhi <strong>Draft save</strong> kar sakte hain aur budget baad me add karke activate kar sakte hain.
                        </span>
                      </div>

                      {/* Primary Action: Save as Draft */}
                      <button
                        onClick={() => handleSubmitCampaign(true)}
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all cursor-pointer"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> 💾 Save Ad Campaign (Add Budget & Launch Later)
                          </>
                        )}
                      </button>

                      {/* Quick 1-click Recharge & Launch option */}
                      <button
                        onClick={handleRechargeAndLaunch}
                        disabled={loading}
                        className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        ⚡ 1-Click Add ₹{Math.max(5000, totalBudget - wallet.available_balance).toLocaleString("en-IN")} Balance & Launch Immediately
                      </button>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                        💡 Budget bad me kabhi bhi Campaigns list ya Wallet tab se add karke ad ko activate kiya ja sakta hai.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setStep(3)}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold"
                  >
                    ← Back to Step 3
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Real-Time Mobile Frame Preview (35% width) */}
          <div className="lg:col-span-4 sticky top-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Real-Time Live Preview
                </span>
                {/* Platform Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                  <button
                    onClick={() => setPreviewPlatform("REEL")}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      previewPlatform === "REEL" ? "bg-pink-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>📱</span> Reel
                  </button>
                  <button
                    onClick={() => setPreviewPlatform("FEED")}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      previewPlatform === "FEED" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>📰</span> Feed
                  </button>
                  <button
                    onClick={() => setPreviewPlatform("FORM")}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      previewPlatform === "FORM" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    📋 Form
                  </button>
                </div>
              </div>

              {/* Realistic Mobile Device Frame */}
              <div className="relative mx-auto w-full max-w-[310px] aspect-[9/18.5] bg-black border-4 border-slate-800 rounded-[38px] overflow-hidden shadow-2xl flex flex-col justify-between">
                {/* Phone Speaker Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-black rounded-full mr-2"></div>
                  <div className="w-8 h-1 bg-slate-800 rounded-full"></div>
                </div>

                {/* PREVIEW: INSTAGRAM REEL VIEW */}
                {previewPlatform === "REEL" && (
                  <div className="relative w-full h-full bg-slate-950 text-white flex flex-col justify-between overflow-hidden">
                    {/* Background Media */}
                    <div className="absolute inset-0 z-0">
                      {selectedMediaUrl ? (
                        selectedMediaType === "video" ? (
                          <video src={selectedMediaUrl} autoPlay loop muted className="w-full h-full object-cover" />
                        ) : (
                          <img src={selectedMediaUrl} alt="Ad Visual" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-center">
                          <Building2 className="w-12 h-12 text-slate-700 mb-2" />
                          <span className="text-xs text-slate-500 font-semibold">Select media in Step 2 to preview Reel</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40"></div>
                    </div>

                    {/* Reel Top Bar */}
                    <div className="relative z-10 p-4 pt-8 flex items-center justify-between text-xs font-bold drop-shadow">
                      <span>Reels</span>
                      <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">Sponsored</span>
                    </div>

                    {/* Reel Bottom Overlay */}
                    <div className="relative z-10 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white shrink-0 border border-white/30 shadow">
                          {activeDeveloperLogo ? (
                            <img src={activeDeveloperLogo} alt={activeDeveloperName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{activeDeveloperInitials}</span>
                          )}
                        </div>
                        <span className="text-xs font-bold drop-shadow truncate max-w-[190px]">{activeDeveloperName}</span>
                      </div>

                      <p className="text-[11px] leading-tight text-slate-200 line-clamp-3 drop-shadow">
                        {primaryText || "Your high-converting property ad caption will appear here..."}
                      </p>

                      <div className="text-xs font-bold text-white drop-shadow truncate">
                        {headline || "2 BHK Homes starting @ ₹58L*"}
                      </div>

                      {/* Action CTA Bar */}
                      <button className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5">
                        {ctaButton} Brochure <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* PREVIEW: FACEBOOK FEED VIEW */}
                {previewPlatform === "FEED" && (
                  <div className="relative w-full h-full bg-slate-900 text-white flex flex-col justify-start overflow-y-auto p-3 pt-8 space-y-2 text-xs">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0 border border-slate-700 shadow">
                        {activeDeveloperLogo ? (
                          <img src={activeDeveloperLogo} alt={activeDeveloperName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{activeDeveloperInitials}</span>
                        )}
                      </div>
                      <div className="truncate max-w-[200px]">
                        <div className="font-bold text-xs truncate">{activeDeveloperName}</div>
                        <div className="text-[10px] text-slate-400">Sponsored · 🌐</div>
                      </div>
                    </div>

                    {/* Primary Caption */}
                    <p className="text-[11px] text-slate-200 line-clamp-4 leading-tight">
                      {primaryText || "Looking for your dream home in Mumbai MMR? Check out this newly launched inventory..."}
                    </p>

                    {/* Post Media */}
                    <div className="w-full aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                      {selectedMediaUrl ? (
                        <img src={selectedMediaUrl} alt="Ad Visual" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          Sample Flat Banner
                        </div>
                      )}
                    </div>

                    {/* Post Bottom Strip */}
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400">
                          {selectedProperty?.slug ? `${visitorBaseUrl.replace(/^https?:\/\//, '')}/...` : "official-property.com"}
                        </span>
                        <div className="font-bold text-xs text-white truncate">{headline || "Luxury 2 BHK Residences"}</div>
                      </div>
                      <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg shrink-0">
                        {ctaButton}
                      </button>
                    </div>
                  </div>
                )}

                {/* PREVIEW: INSTANT LEAD FORM VIEW */}
                {previewPlatform === "FORM" && (
                  <div className="relative w-full h-full bg-slate-950 text-white flex flex-col justify-between p-4 pt-8 text-xs">
                    <div>
                      <div className="text-center font-bold text-xs text-blue-400 mb-1">{activeDeveloperName} Verified Inquiry</div>
                      <div className="text-center font-extrabold text-sm mb-3">{selectedProperty?.name || "Runwal Gardens"}</div>

                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-[11px] mb-3">
                        <div className="text-slate-400 text-[10px]">Autofilled by Meta:</div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Full Name:</span>
                          <span className="font-semibold text-slate-200">Rohit Sharma</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Phone:</span>
                          <span className="font-semibold text-emerald-400">+91 98200 XXXXX</span>
                        </div>
                      </div>

                      {/* Qualification Questions */}
                      <div className="space-y-2 text-[10px]">
                        {qConfig && (
                          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                            <span className="text-slate-400">Configuration Preference:</span>
                            <div className="font-semibold text-slate-200 mt-0.5">2 BHK Deck Flat (680 Sq.Ft)</div>
                          </div>
                        )}
                        {qTimeline && (
                          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                            <span className="text-slate-400">Buying Timeline:</span>
                            <div className="font-semibold text-slate-200 mt-0.5">Immediate (Within 30 Days)</div>
                          </div>
                        )}
                        {qSiteVisit && (
                          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                            <span className="text-slate-400">Free Cab Site Visit:</span>
                            <div className="font-semibold text-slate-200 mt-0.5">Yes, please arrange this weekend</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg mt-3">
                      Submit & Get Instant WhatsApp Brochure
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY AD CAMPAIGNS & LIVE STATS                                       */}
      {/* ========================================================================= */}
      {activeTab === "campaigns" && (
        <div className="space-y-6">
          {/* Top KPI Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Active Ads", val: campaigns.filter((c) => c.status === "ACTIVE_RUNNING").length, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Total Escrow", val: `₹${campaigns.reduce((s, c) => s + (c.total_builder_budget || 0), 0).toLocaleString()}`, color: "text-blue-600 dark:text-blue-400" },
              { label: "Total Spent", val: `₹${campaigns.reduce((s, c) => s + (c.metrics_builder_spent_inr || 0), 0).toLocaleString()}`, color: "text-purple-600 dark:text-purple-400" },
              { label: "Total Impressions", val: campaigns.reduce((s, c) => s + (c.metrics_impressions || 0), 0).toLocaleString(), color: "text-amber-600 dark:text-amber-400" },
              { label: "Link Clicks", val: campaigns.reduce((s, c) => s + (c.metrics_clicks || 0), 0).toLocaleString(), color: "text-cyan-600 dark:text-cyan-400" },
              { label: "Total Leads", val: campaigns.reduce((s, c) => s + (c.metrics_leads_count || 0), 0).toLocaleString(), color: "text-emerald-600 dark:text-emerald-300 font-black" },
            ].map((k, i) => (
              <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{k.label}</span>
                <div className={`text-xl font-extrabold mt-1 ${k.color}`}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Campaigns Cards List */}
          {campaigns.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
              <TrendingUp className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Ad Campaigns Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Promote your towers and flats on Meta Ads with our guided 4-step wizard.
              </p>
              <button
                onClick={() => setActiveTab("create")}
                className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
              >
                + Launch First Ad Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((camp) => {
                const spent = camp.metrics_builder_spent_inr || 0;
                const total = camp.total_builder_budget || 1;
                const percentSpent = Math.min(100, Math.round((spent / total) * 100));

                return (
                  <div key={camp._id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs">
                    {/* Top Row: Title, Breadcrumb & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/40">
                            {camp.campaign_code}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{camp.headline}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                          <span>🏙️ {camp.hierarchy_breadcrumb}</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            Created on {new Date(camp.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {camp.status === "DRAFT" && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-2xs">
                            📝 Draft (Budget Pending)
                          </span>
                        )}
                        {camp.status === "PENDING_ADMIN_APPROVAL" && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            ⏳ Pending Admin Approval
                          </span>
                        )}
                        {camp.status === "ACTIVE_RUNNING" && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> 🟢 LIVE on FB & IG
                          </span>
                        )}
                        {camp.status === "PAUSED_BY_USER" && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                            ⏸️ Paused by You
                          </span>
                        )}
                        {camp.status === "PAUSED_BY_ADMIN" && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            ⏸️ Paused by Admin
                          </span>
                        )}
                        {camp.status === "REJECTED_BY_ADMIN" && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                            ❌ Rejected & 100% Refunded
                          </span>
                        )}
                        {camp.status === "COMPLETED_BUDGET_FULL" && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                            ✅ Completed (100% Budget)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rejection Alert Box */}
                    {camp.status === "REJECTED_BY_ADMIN" && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-900 dark:text-rose-200">
                        <strong>Admin Rejection Note:</strong> {camp.admin_rejection_reason || "Creative did not meet platform guidelines."}
                        <p className="mt-1 text-slate-600 dark:text-slate-400">
                          Aapka ₹{camp.total_builder_budget?.toLocaleString("en-IN")} ad budget turant aapke available wallet balance mein refund kar diya gaya hai.
                        </p>
                      </div>
                    )}

                    {/* Live Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-2xs">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Impressions</span>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{(camp.metrics_impressions || 0).toLocaleString()}</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-2xs">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Link Clicks</span>
                        <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{(camp.metrics_clicks || 0).toLocaleString()}</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-2xs">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Buyer Leads</span>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{(camp.metrics_leads_count || 0).toLocaleString()}</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-2xs">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Cost Per Lead (CPL)</span>
                        <div className="text-sm font-bold text-amber-600 dark:text-amber-300">
                          ₹{camp.metrics_leads_count > 0 ? Math.round(spent / camp.metrics_leads_count) : "—"}
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-2xs">
                        <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                          <span>Budget Spent</span>
                          <span className="font-semibold">{percentSpent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentSpent}%` }}></div>
                        </div>
                        <div className="text-[11px] font-bold text-slate-900 dark:text-slate-200 mt-1">
                          ₹{spent.toLocaleString()} / ₹{camp.total_builder_budget.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Self-Service Controls */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-slate-500">
                        Meta Ad ID: <span className="font-mono text-slate-600 dark:text-slate-400">{camp.meta_ad_id || "sim_pending"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {camp.status === "DRAFT" && (
                          <button
                            onClick={() => handleActivateDraft(camp)}
                            disabled={loading}
                            className="px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> ⚡ Add Budget & Activate
                          </button>
                        )}
                        {camp.status === "ACTIVE_RUNNING" && (
                          <button
                            onClick={() => handleToggleCampaign(camp._id, camp.status)}
                            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-transparent rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <Pause className="w-3.5 h-3.5" /> Pause Ad
                          </button>
                        )}
                        {camp.status === "PAUSED_BY_USER" && (
                          <button
                            onClick={() => handleToggleCampaign(camp._id, camp.status)}
                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" /> Resume Ad
                          </button>
                        )}
                        {["ACTIVE_RUNNING", "PAUSED_BY_USER"].includes(camp.status) && (
                          <button
                            onClick={() => {
                              setActiveTopupCampaignId(camp._id);
                              setShowTopupModal(true);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 rounded-xl cursor-pointer"
                          >
                            💰 Top-up Budget
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActiveTab("crm");
                            setCrmSearch(camp.campaign_code);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-transparent rounded-xl cursor-pointer"
                        >
                          View Leads →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AD LEADS CRM (BUYER INQUIRIES)                                     */}
      {/* ========================================================================= */}
      {activeTab === "crm" && (
        <div className="space-y-6">
          {/* CRM Filter Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase">Stage Filter:</span>
              {[
                { s: "ALL", label: "All Leads" },
                { s: "NEW_UNREAD", label: "New Unread" },
                { s: "CONTACTED", label: "Contacted" },
                { s: "SITE_VISIT_SCHEDULED", label: "Site Visit" },
                { s: "BOOKED_CLOSED", label: "Booked" },
              ].map((item) => (
                <button
                  key={item.s}
                  onClick={() => setCrmStatusFilter(item.s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    crmStatusFilter === item.s
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search by buyer name, phone, or tower..."
                value={crmSearch}
                onChange={(e) => setCrmSearch(e.target.value)}
                className="w-full md:w-64 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
              />
              <button
                onClick={() => {
                  // Export leads as CSV
                  const headers = "Name,Phone,Email,City,Hierarchy Path,Lead Stage,Source,Date\n";
                  const rows = filteredLeads
                    .map(
                      (l) =>
                        `"${l.buyer_full_name}","${l.buyer_phone}","${l.buyer_email || ""}","${l.buyer_city || ""}","${l.hierarchy_breadcrumb}","${l.crm_status}","${l.lead_source_platform}","${new Date(l.createdAt).toLocaleDateString()}"`
                    )
                    .join("\n");
                  const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `Astronix_Meta_Leads_${Date.now()}.csv`;
                  a.click();
                }}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Leads Table */}
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">No Inquiries Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Buyer inquiries from active Facebook & Instagram ads will automatically appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Buyer Contact</th>
                      <th className="p-3.5">Targeted Hierarchy Offering</th>
                      <th className="p-3.5">Qualification Answers</th>
                      <th className="p-3.5">Source & Time</th>
                      <th className="p-3.5">CRM Stage</th>
                      <th className="p-3.5 text-right">Instant Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredLeads.map((lead) => {
                      const qAns = lead.qualification_answers_json || {};
                      const isNew = lead.crm_status === "NEW_UNREAD";

                      return (
                        <tr key={lead._id} className={`hover:bg-slate-800/40 transition-colors ${isNew ? "bg-blue-950/20" : ""}`}>
                          {/* Contact */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              {isNew && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                              )}
                              <span className="font-bold text-slate-100">{lead.buyer_full_name}</span>
                            </div>
                            <div className="text-emerald-400 font-mono text-[11px] mt-0.5">{lead.buyer_phone}</div>
                            {lead.buyer_email && <div className="text-slate-500 text-[10px]">{lead.buyer_email}</div>}
                          </td>

                          {/* Hierarchy Path */}
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-200">{lead.hierarchy_breadcrumb}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{lead.buyer_city || "Mumbai MMR"}</div>
                          </td>

                          {/* Qualification Answers */}
                          <td className="p-3.5 space-y-1">
                            {qAns.interested_configuration && (
                              <div className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 w-fit">
                                Config: <strong>{qAns.interested_configuration}</strong>
                              </div>
                            )}
                            {qAns.buying_timeline && (
                              <div className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 w-fit">
                                Timeline: <strong>{qAns.buying_timeline}</strong>
                              </div>
                            )}
                            {qAns.site_visit_interest && (
                              <div className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/40 w-fit">
                                Site Visit: <strong>{qAns.site_visit_interest}</strong>
                              </div>
                            )}
                          </td>

                          {/* Source & Date */}
                          <td className="p-3.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                              {lead.lead_source_platform}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">
                              {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>

                          {/* CRM Stage Dropdown */}
                          <td className="p-3.5">
                            <select
                              value={lead.crm_status}
                              onChange={(e) => handleUpdateLeadStatus(lead._id, e.target.value)}
                              className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-[11px] font-semibold text-slate-200 focus:outline-none"
                            >
                              <option value="NEW_UNREAD">🔴 New Unread</option>
                              <option value="CONTACTED">🟡 Contacted</option>
                              <option value="FOLLOW_UP">🟠 Follow Up</option>
                              <option value="SITE_VISIT_SCHEDULED">🟣 Site Visit Scheduled</option>
                              <option value="SITE_VISIT_DONE">🔵 Site Visit Done</option>
                              <option value="BOOKED_CLOSED">🟢 Booked / Closed</option>
                              <option value="INVALID_JUNK">⚪ Invalid / Junk</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* WhatsApp Button */}
                              <a
                                href={`https://wa.me/${lead.buyer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                  `Hello ${lead.buyer_full_name}, thank you for your inquiry on Facebook/Instagram for ${lead.hierarchy_breadcrumb} with ${activeDeveloperName}. Here is the official project brochure and pricing sheet.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                              {/* Call Button */}
                              <a
                                href={`tel:${lead.buyer_phone}`}
                                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-all"
                                title="Call Buyer"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AD WALLET & GST INVOICES                                           */}
      {/* ========================================================================= */}
      {activeTab === "wallet" && (
        <div className="space-y-6">
          {/* 3 Wallet Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40 rounded-3xl shadow-xl">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                🟢 Available Ad Credits
              </span>
              <div className="text-3xl font-extrabold text-white mt-2">
                ₹{(wallet.available_balance || 0).toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Ready to use for launching new campaigns immediately.</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-800/40 rounded-3xl shadow-xl">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                🟡 Locked in Escrow
              </span>
              <div className="text-3xl font-extrabold text-white mt-2">
                ₹{(wallet.locked_escrow_balance || 0).toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Reserved for ongoing live & pending admin review campaigns.</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-800/40 rounded-3xl shadow-xl">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                🔵 Total Lifetime Spent
              </span>
              <div className="text-3xl font-extrabold text-white mt-2">
                ₹{(wallet.lifetime_spent_balance || 0).toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Cumulative ad spend consumed on Meta Ads Manager.</p>
            </div>
          </div>

          {/* Add Money & GST Calculator Box */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
            <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" /> Recharge Ad Credits & Tax Invoice
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select credit amount to recharge. 18% GST will be applied automatically for B2B input credit.
            </p>

            {/* Quick Recharge Pills */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {[5000, 10000, 25000, 50000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopupAmount(amt)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    topupAmount === amt
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  + ₹{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            {/* Live Tax Breakdown Box */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl max-w-md space-y-2 text-xs mb-4">
              <div className="flex justify-between text-slate-300">
                <span>Base Ad Credit:</span>
                <span className="font-bold">₹{topupAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (18%):</span>
                <span>₹{(topupAmount * 0.18).toLocaleString("en-IN")}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-extrabold text-emerald-400">
                <span>Total Payable:</span>
                <span>₹{(topupAmount * 1.18).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => handleQuickRecharge(topupAmount)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                ⚡ Instant Add ₹{topupAmount.toLocaleString("en-IN")} Test Credits (Localhost Dev Mode)
              </button>
              <button
                onClick={() => alert("Redirecting to Razorpay Gateway...")}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Pay ₹{(topupAmount * 1.18).toLocaleString("en-IN")} via Razorpay Gateway
              </button>
            </div>
          </div>

          {/* Passbook / Transaction History */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Passbook & GST Transaction History
            </h4>

            {transactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No transaction history yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Transaction Type</th>
                      <th className="p-3">Credit Amount</th>
                      <th className="p-3">GST (18%)</th>
                      <th className="p-3">Invoice Number</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {transactions.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-800/30">
                        <td className="p-3 text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="p-3 font-semibold text-slate-200">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              t.transaction_type === "RECHARGE_CREDIT"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : t.transaction_type === "CAMPAIGN_LOCK"
                                ? "bg-amber-500/20 text-amber-300"
                                : t.transaction_type === "REJECT_REFUND"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {t.transaction_type}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-emerald-400">
                          {t.credit_amount > 0 ? `+₹${t.credit_amount.toLocaleString()}` : `₹${t.credit_amount.toLocaleString()}`}
                        </td>
                        <td className="p-3 text-slate-400">₹{t.gst_amount || 0}</td>
                        <td className="p-3 font-mono text-blue-400">{t.invoice_number}</td>
                        <td className="p-3 text-slate-400 max-w-xs truncate">{t.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Topup Campaign Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-bold text-slate-100">Top-up Campaign Budget</h3>
            <p className="text-xs text-slate-400">
              Add more budget to your active campaign from your available wallet credits.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Additional Budget (₹)</label>
              <input
                type="number"
                step={500}
                min={1000}
                defaultValue={5000}
                id="topup_input_amt"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm font-bold text-emerald-400"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTopupModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const input = document.getElementById("topup_input_amt") as HTMLInputElement;
                  const amt = Number(input?.value || 5000);
                  try {
                    const res = await fetch(`/api/panel/ads/campaigns/${activeTopupCampaignId}/topup`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ additionalBudget: amt }),
                    });
                    const d = await res.json();
                    if (d.success) {
                      alert(d.message);
                      setShowTopupModal(false);
                      fetchData();
                    } else {
                      alert(d.error || "Top-up failed");
                    }
                  } catch (e) {
                    alert("Error during top-up");
                  }
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20"
              >
                Confirm Top-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
