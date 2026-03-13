module.exports = [
"[project]/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "formatArea",
    ()=>formatArea,
    "formatPrice",
    ()=>formatPrice
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function formatPrice(price) {
    if (price >= 10000000) {
        return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
        return `₹${(price / 100000).toFixed(2)} Lac`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
}
function formatArea(area) {
    return `${area.toLocaleString('en-IN')} sq.ft`;
}
}),
"[project]/lib/builder-types.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ============================================================
// BUILDER TYPES — Complete Data Architecture
// ============================================================
// COMMON DATA (Township mein enter → Project/Tower/Unit inherit)
// TOWNSHIP SPECIFIC → Only on Township page
// PROJECT SPECIFIC  → Only on Project page
// TOWER SPECIFIC    → Only on Tower page
// UNIT SPECIFIC     → Only on Unit page
// ============================================================
// ─────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────
__turbopack_context__.s([
    "createDefaultUnitConfig",
    ()=>createDefaultUnitConfig,
    "createInitialProject",
    ()=>createInitialProject,
    "createInitialTower",
    ()=>createInitialTower,
    "createInitialUnitTemplate",
    ()=>createInitialUnitTemplate,
    "defaultAmenities",
    ()=>defaultAmenities,
    "defaultApfDetails",
    ()=>defaultApfDetails,
    "defaultConnectivity",
    ()=>defaultConnectivity,
    "defaultEcoFeatures",
    ()=>defaultEcoFeatures,
    "defaultFaqs",
    ()=>defaultFaqs,
    "defaultMasterPlan",
    ()=>defaultMasterPlan,
    "defaultReraPhases",
    ()=>defaultReraPhases,
    "defaultRoomDimensions",
    ()=>defaultRoomDimensions,
    "defaultTestimonials",
    ()=>defaultTestimonials,
    "defaultTimeline",
    ()=>defaultTimeline,
    "defaultTowerAmenities",
    ()=>defaultTowerAmenities,
    "defaultVastu",
    ()=>defaultVastu,
    "defaultVideoGallery",
    ()=>defaultVideoGallery,
    "initialCommonData",
    ()=>initialCommonData,
    "initialProjectTemplate",
    ()=>initialProjectTemplate,
    "initialTowerTemplate",
    ()=>initialTowerTemplate,
    "initialTownshipData",
    ()=>initialTownshipData,
    "initialUnitTemplate",
    ()=>initialUnitTemplate
]);
const defaultConnectivity = [
    {
        id: "conn-1",
        title: "International Airport",
        type: "airport",
        distanceKm: "18",
        duration: "45 Mins"
    },
    {
        id: "conn-2",
        title: "Central Railway Station",
        type: "railway",
        distanceKm: "5",
        duration: "15 Mins"
    },
    {
        id: "conn-3",
        title: "Upcoming Metro Station",
        type: "metro",
        distanceKm: "1.5",
        duration: "5 Mins"
    }
];
const defaultAmenities = [
    {
        id: "am-1",
        title: "Swimming Pool",
        category: "recreation",
        description: "Olympic size swimming pool with kids pool"
    },
    {
        id: "am-2",
        title: "Clubhouse",
        category: "community",
        description: "State-of-the-art 50,000 sq ft clubhouse"
    },
    {
        id: "am-3",
        title: "24/7 Security",
        category: "security",
        description: "CCTV surveillance and manned security"
    },
    {
        id: "am-4",
        title: "Landscaped Gardens",
        category: "green",
        description: "Lush green parks and walking trails"
    }
];
const defaultEcoFeatures = [
    {
        id: "eco-1",
        title: "Rainwater Harvesting",
        description: "Advanced groundwater recharge system",
        icon: "droplet"
    },
    {
        id: "eco-2",
        title: "Solar Power",
        description: "Solar panels for common area lighting",
        icon: "sun"
    },
    {
        id: "eco-3",
        title: "Waste Management",
        description: "In-house organic waste composting",
        icon: "recycle"
    }
];
const defaultFaqs = [
    {
        id: "faq-1",
        question: "When is the expected possession?",
        answer: "The project is expected to be delivered by December 2026."
    },
    {
        id: "faq-2",
        question: "Are there any hidden charges?",
        answer: "No, all pricing is transparent. Maintenance and parking charges are upfront."
    }
];
const defaultApfDetails = [
    {
        id: "apf-1",
        bankName: "SBI",
        apfNumber: "SBI/APF/1029",
        certificateUrl: ""
    },
    {
        id: "apf-2",
        bankName: "HDFC",
        apfNumber: "HDFC/APF/2290",
        certificateUrl: ""
    }
];
const defaultMasterPlan = [
    {
        id: "mp-1",
        label: "Grand Entrance",
        color: "#F5A623"
    },
    {
        id: "mp-2",
        label: "Central Park",
        color: "#2BB673"
    },
    {
        id: "mp-3",
        label: "Clubhouse",
        color: "#1A3C8C"
    }
];
const defaultTimeline = [
    {
        id: "dp-1",
        title: "Project Launch",
        description: "Initial phase booking started",
        date: "Jan 2024",
        status: "delivered"
    },
    {
        id: "dp-2",
        title: "Plinth Level",
        description: "Foundation work completed",
        date: "Jun 2024",
        status: "in-progress"
    },
    {
        id: "dp-3",
        title: "Slab Casting",
        description: "Top floor slab completion",
        date: "Dec 2025",
        status: "planned"
    },
    {
        id: "dp-4",
        title: "Occupancy",
        description: "Handover and possession",
        date: "Dec 2026",
        status: "planned"
    }
];
const defaultTestimonials = [
    {
        id: "test-1",
        name: "Ramesh Kumar",
        role: "Resident",
        message: "Amazing construction quality and timely delivery.",
        rating: 5
    }
];
const defaultReraPhases = [
    {
        id: "rera-1",
        phaseName: "Phase 1 - Towers A & B",
        reraNumber: "P521000XXXXX",
        validUntil: "2027-12-31"
    }
];
const defaultTowerAmenities = [
    {
        id: "ta-1",
        title: "Double Height Lobby",
        description: "Grand entrance lobby with waiting area"
    },
    {
        id: "ta-2",
        title: "High-Speed Elevators",
        description: "3 Passenger and 1 Service lift"
    }
];
const defaultVideoGallery = [];
const initialCommonData = {
    // Builder
    builderName: "Astronix Realty",
    builderLogo: "",
    builderTagline: "",
    builderPhone: "+91 86572 25993",
    builderWhatsapp: "918657225993",
    builderEmail: "",
    builderWebsite: "",
    builderEstYear: "",
    builderProjects: "",
    constructionStatus: "under-construction",
    // Location
    city: "",
    district: "",
    subCity: "",
    state: "",
    country: "India",
    pincode: "",
    village: "",
    nearbyLandmark: "",
    // Google Maps
    googleMapLink: "",
    googlePlusCode: "",
    gmbProfileCode: "",
    coordinates: {
        lat: "",
        lng: ""
    },
    // Connectivity
    connectivity: defaultConnectivity.map((c)=>({
            ...c
        })),
    // Amenities
    amenities: defaultAmenities.map((c)=>({
            ...c
        })),
    // Eco
    ecoFeatures: defaultEcoFeatures.map((c)=>({
            ...c
        })),
    greenCoverPercentage: "",
    // Media
    landscapeVideoUrl: "",
    shortVideoUrl: "",
    videoGallery: defaultVideoGallery.map((c)=>({
            ...c
        })),
    // Legal
    reraNumber: "",
    reraCertificateUrl: "",
    ocNumber: "",
    ocCertificateUrl: "",
    legalTrustScore: "100",
    legalTrustDescription: "Clear Marketable Title with OC Received",
    ccNumber: "",
    ccStatus: "",
    apfDetails: defaultApfDetails.map((c)=>({
            ...c
        })),
    approvals: "",
    approvedBanks: [
        "SBI",
        "HDFC",
        "ICICI"
    ],
    groupBuying: {
        enabled: false,
        currentCount: 0,
        targetCount: 500,
        discountLabel: "Extra 2% off on group booking"
    }
};
const initialTownshipData = {
    id: `township-${Date.now()}`,
    // Spread common data
    ...initialCommonData,
    // Township Identity
    name: "",
    tagType: "Integrated Township",
    heroImage: "",
    heroLocation: "",
    galleryImages: [],
    // Pricing
    priceRangeMin: 0,
    priceRangeMax: 0,
    priceLabel: "",
    // About
    description: "",
    visionStatement: "",
    aboutImageUrl: "",
    // Stats
    totalArea: "",
    areaUnit: "acres",
    projectCount: 0,
    totalTowers: 0,
    totalUnits: 0,
    totalFamilies: 0,
    launchDate: "",
    possessionDate: "",
    // Master Plan
    masterplanImage: "",
    masterPlanScale: "1:500",
    masterPlanDescription: "",
    masterPlanHighlights: defaultMasterPlan.map((c)=>({
            ...c
        })),
    // Timeline
    developmentTimeline: defaultTimeline.map((c)=>({
            ...c
        })),
    // Legal
    reraPhases: defaultReraPhases.map((c)=>({
            ...c
        })),
    brochureLink: "",
    // FAQ
    faqs: defaultFaqs.map((c)=>({
            ...c
        })),
    // Testimonials
    testimonials: defaultTestimonials.map((c)=>({
            ...c
        }))
};
const createInitialProject = (parentTownshipIdOrIndex, indexOrTownshipId)=>{
    const parentTownshipId = typeof parentTownshipIdOrIndex === "string" ? parentTownshipIdOrIndex : indexOrTownshipId;
    const index = typeof parentTownshipIdOrIndex === "number" ? parentTownshipIdOrIndex : indexOrTownshipId || 0;
    return {
        id: `project-${Date.now()}-${index}`,
        parentTownshipId: parentTownshipId,
        // Identity
        name: "",
        tagType: "Residential Project",
        heroImage: "",
        heroLocation: "",
        galleryImages: [],
        // About
        description: "",
        visionStatement: "",
        aboutImageUrl: "",
        // Stats
        totalArea: "",
        areaUnit: "acres",
        launchDate: "",
        possessionDate: "",
        constructionStatus: "under-construction",
        totalFamilies: 0,
        // BHK
        bhkConfigs: [
            "2BHK",
            "3BHK"
        ],
        // Pricing (auto)
        priceRangeMin: 0,
        priceRangeMax: 0,
        // Legal
        reraNumber: "",
        reraCertificateUrl: "",
        ccNumber: "",
        ccStatus: "",
        ocNumber: "",
        ocCertificateUrl: "",
        apfDetails: defaultApfDetails.map((c)=>({
                ...c
            })),
        approvalStatus: "approved",
        legalTrustScore: "",
        legalTrustDescription: "",
        // Media override
        landscapeVideoUrl: "",
        shortVideoUrl: "",
        videoGallery: defaultVideoGallery.map((c)=>({
                ...c
            })),
        // Eco override
        ecoFeatures: defaultEcoFeatures.map((c)=>({
                ...c
            })),
        greenCoverPercentage: "",
        // Amenities override
        amenities: defaultAmenities.map((c)=>({
                ...c
            })),
        // Auto
        totalTowers: 0,
        totalUnits: 0
    };
};
const createInitialTower = (index, projectId)=>({
        id: `tower-${projectId}-${index}`,
        projectId,
        parentProjectId: projectId,
        // Identity
        name: "",
        heroImage: "",
        galleryImages: [],
        description: "",
        visionStatement: "",
        aboutImageUrl: "",
        // Structure
        totalFloors: "G + 20",
        totalFloorsNum: 20,
        unitsPerFloor: "4",
        totalLifts: "3",
        liftsConfiguration: "3 High-Speed Lifts + 1 Service Lift",
        constructionStatus: "under-construction",
        launchDate: "",
        possessionDate: "",
        // Character
        viewType: "3-Side Open",
        towerType: "residential",
        parkingLevels: "2 Basement Levels",
        lobbyDetails: "",
        reraNumber: "",
        reraCertificateUrl: "",
        ccNumber: "",
        ccStatus: "",
        ocNumber: "",
        ocCertificateUrl: "",
        // Floor Breakdown
        floorsBreakdown: [
            {
                id: "1",
                floorType: "parking",
                fromFloor: "B2",
                toFloor: "B1",
                description: "Basement Parking"
            },
            {
                id: "2",
                floorType: "podium",
                fromFloor: "G",
                toFloor: "G",
                description: "Grand Lobby & Amenities"
            },
            {
                id: "3",
                floorType: "residential",
                fromFloor: "1",
                toFloor: "20",
                description: "Residential Floors"
            }
        ],
        // Tower Amenities
        towerAmenities: defaultTowerAmenities.map((c)=>({
                ...c
            })),
        // Floor Plans
        typicalFloorPlanImage: "",
        refugeFloorPlanImage: "",
        // Auto
        totalUnits: 0,
        priceRangeMin: 0,
        priceRangeMax: 0
    });
const defaultRoomDimensions = [
    {
        id: "1",
        roomName: "Living + Dining",
        length: "18",
        width: "12",
        unit: "ft"
    },
    {
        id: "2",
        roomName: "Master Bedroom",
        length: "13",
        width: "11",
        unit: "ft"
    },
    {
        id: "3",
        roomName: "Bedroom 2",
        length: "11",
        width: "10",
        unit: "ft"
    },
    {
        id: "4",
        roomName: "Kitchen",
        length: "10",
        width: "8",
        unit: "ft"
    },
    {
        id: "5",
        roomName: "Balcony 1",
        length: "10",
        width: "4",
        unit: "ft"
    }
];
const defaultVastu = [
    {
        id: "1",
        element: "Main Entrance",
        direction: "North-East",
        status: "excellent"
    },
    {
        id: "2",
        element: "Kitchen",
        direction: "South-East",
        status: "excellent"
    },
    {
        id: "3",
        element: "Master Bedroom",
        direction: "South-West",
        status: "good"
    },
    {
        id: "4",
        element: "Washrooms",
        direction: "North-West",
        status: "neutral"
    },
    {
        id: "5",
        element: "Sunlight",
        direction: "East Open",
        status: "excellent"
    }
];
const defaultMoveIn = [
    {
        id: "1",
        item: "Modular Kitchen with Loft",
        included: true
    },
    {
        id: "2",
        item: "Wardrobes in all Bedrooms",
        included: true
    },
    {
        id: "3",
        item: "CP Fittings (Jaquar/Kohler)",
        included: true
    },
    {
        id: "4",
        item: "Electrical Fittings & Switches",
        included: true
    },
    {
        id: "5",
        item: "Air Conditioners",
        included: false
    },
    {
        id: "6",
        item: "Geyser / Water Heater",
        included: false
    }
];
const defaultFacingPremiums = {
    north: "0",
    south: "0",
    east: "2",
    west: "0",
    "north-east": "3",
    "north-west": "1",
    "south-east": "2",
    "south-west": "0"
};
const createDefaultUnitConfig = (type, carpetArea, basePrice, countPerFloor)=>({
        id: `unit-${type}-${Date.now()}`,
        type,
        carpetArea,
        builtUpArea: Math.round(carpetArea * 1.2),
        superBuiltUpArea: Math.round(carpetArea * 1.4),
        loadingFactor: 40,
        basePrice,
        ratePerSqft: Math.round(basePrice / carpetArea),
        parkingCharges: 500000,
        gstPercentage: 5,
        stampDutyPercentage: 5,
        registrationCharges: 30000,
        maintenancePerSqft: 3.5,
        maintenanceType: "monthly",
        otherCharges: 0,
        facingPremiums: {
            ...defaultFacingPremiums
        },
        facing: "East",
        balconyCount: 2,
        bathroomCount: type === "2BHK" ? 2 : 3,
        servantRoom: false,
        studyRoom: false,
        poojaRoom: true,
        dryBalcony: true,
        flooringType: "Vitrified Tiles (800x800)",
        wallFinish: "2-Coat OBD Premium Paint",
        ceilingHeight: "10",
        furnishingStatus: "unfurnished",
        viewType: "Garden View",
        roomDimensions: defaultRoomDimensions.map((r)=>({
                ...r,
                id: Math.random().toString(36).substring(7)
            })),
        vastuAnalysis: defaultVastu.map((v)=>({
                ...v,
                id: Math.random().toString(36).substring(7)
            })),
        moveInChecklist: defaultMoveIn.map((m)=>({
                ...m,
                id: Math.random().toString(36).substring(7)
            })),
        floorPlanImage2D: "",
        floorPlanImage3D: "",
        heroImage: "",
        galleryImages: [],
        reraNumber: "",
        countPerFloor
    });
const createInitialUnitTemplate = (towerId)=>({
        towerId,
        baseRatePerSqft: "5500",
        floorRisePerFloor: 50000,
        gstPercentage: "5",
        stampDutyPercentage: "5",
        registrationCharges: "30000",
        parkingCharges: "500000",
        maintenancePerSqft: "3.5",
        maintenanceType: "monthly",
        facingPremiums: {
            ...defaultFacingPremiums
        },
        configurations: [
            {
                id: "default-2bhk",
                type: "2BHK",
                carpetArea: 850,
                builtUpArea: 1020,
                superBuiltUpArea: 1190,
                loadingFactor: 40,
                basePrice: 5500000,
                ratePerSqft: 6470,
                parkingCharges: 500000,
                gstPercentage: 5,
                stampDutyPercentage: 5,
                registrationCharges: 30000,
                maintenancePerSqft: 3.5,
                maintenanceType: "monthly",
                otherCharges: 0,
                facingPremiums: {
                    ...defaultFacingPremiums
                },
                facing: "East",
                balconyCount: 2,
                bathroomCount: 2,
                servantRoom: false,
                studyRoom: false,
                poojaRoom: true,
                dryBalcony: true,
                flooringType: "Vitrified Tiles (800x800)",
                wallFinish: "2-Coat OBD Premium Paint",
                ceilingHeight: "10",
                furnishingStatus: "unfurnished",
                viewType: "Garden View",
                roomDimensions: [
                    ...defaultRoomDimensions
                ],
                vastuAnalysis: [
                    ...defaultVastu
                ],
                moveInChecklist: [
                    ...defaultMoveIn
                ],
                countPerFloor: 4,
                floorPlanImage2D: "",
                floorPlanImage3D: "",
                heroImage: "",
                galleryImages: [],
                reraNumber: ""
            }
        ],
        approvedBanks: [
            "HDFC Bank",
            "SBI",
            "ICICI Bank",
            "Axis Bank"
        ],
        floorPlan2DUrl: "",
        floorPlan3DUrl: "",
        galleryImages: [],
        videoGallery: [],
        heroImage: "",
        floorGroups: [],
        defaultBalconyRailing: "",
        defaultWindows: "",
        defaultMainDoor: "",
        defaultInternalDoors: "",
        defaultKitchenPlatform: "",
        defaultKitchenFittings: "",
        defaultBathroomCpFittings: "",
        defaultSanitaryware: "",
        defaultWiringSwitches: "",
        defaultPowerBackup: "",
        defaultSmartHomeProvisions: "",
        defaultPlasterPaint: "",
        defaultFireSafety: "",
        defaultVastuCompliance: ""
    });
const initialProjectTemplate = {
    name: "",
    tagType: "Premium Residential",
    constructionStatus: "under-construction",
    bhkConfigs: [
        "2BHK",
        "3BHK"
    ]
};
const initialTowerTemplate = {
    totalFloors: "G + 20",
    unitsPerFloor: "4",
    liftsConfiguration: "3 High-Speed Lifts + 1 Service Lift",
    constructionStatus: "under-construction"
};
const initialUnitTemplate = (towerId)=>createInitialUnitTemplate(towerId);
}),
"[project]/lib/algorithms/vastu/vastuAlgorithm.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getVastuDetails",
    ()=>getVastuDetails
]);
const getVastuDetails = (room, dir, facing = "")=>{
    if (!room || !dir) return {
        status: "neutral",
        score: 0.5,
        note: "Please select both room and direction for analysis."
    };
    if (dir === "N/A") return {
        status: "neutral",
        score: 0.5,
        note: "Not available in this unit. (Ignored in scoring)"
    };
    const r = room.toLowerCase();
    const d = dir.toLowerCase();
    const f = facing.toLowerCase() === 'none' ? '' : facing.toLowerCase();
    // 1. MAIN ENTRANCE
    if (r === 'main entrance' || r === 'cash / reception') {
        let score = 1.0;
        let status = 'excellent';
        let note = r === 'main entrance' ? "Highly auspicious. Attracts wealth and positive energy." : "Highly auspicious for cash flow.";
        if ([
            'north',
            'east',
            'north-east'
        ].includes(d)) {} else if ([
            'west',
            'north-west'
        ].includes(d)) {
            status = 'good';
            score = 0.75;
            note = "Generally favorable, brings stability and steady progress.";
        } else {
            status = 'avoid';
            score = 0.0;
            note = "Not recommended. May cause struggles. Requires Vastu remedies.";
        }
        if (f) {
            if ([
                'east',
                'north',
                'north-east'
            ].includes(f)) note += " Opening towards North/East is perfect.";
            else {
                score -= 0.3;
                note += " Opening direction is not ideal.";
            }
        }
        if (score <= 0.3) status = 'avoid';
        else if (score < 0.8) status = 'good';
        return {
            status,
            score,
            note
        };
    }
    // 2. KITCHEN
    if (r === 'kitchen' || r === 'pantry') {
        let score = 1.0;
        let status = 'excellent';
        let note = "Perfect 'Agni' (Fire) zone. Brings health and prosperity.";
        if (d === 'south-east') {} else if (d === 'north-west') {
            status = 'good';
            score = 0.8;
            note = "Secondary favorable zone for fire element.";
        } else if ([
            'north-east',
            'south-west',
            'center'
        ].includes(d)) {
            return {
                status: 'avoid',
                score: 0.0,
                note: "Highly detrimental. Can cause severe health and financial drains."
            };
        } else {
            status = 'neutral';
            score = 0.5;
            note = "Average placement. Keep stove facing east while cooking.";
        }
        if (f) {
            if ([
                'east'
            ].includes(f)) note += " Cooking facing East is highly auspicious.";
            else {
                score -= 0.2;
                note += " Cook should ideally face East.";
            }
        }
        if (score <= 0) status = 'avoid';
        else if (score < 0.8) status = 'good';
        return {
            status,
            score,
            note
        };
    }
    // BED HEADBOARD
    if (r.includes('headboard')) {
        if ([
            'south',
            'west'
        ].includes(d)) return {
            status: 'excellent',
            score: 1.0,
            note: "Deep rest and longevity. Aligns with Earth's magnetic field."
        };
        if ([
            'east'
        ].includes(d)) return {
            status: 'good',
            score: 0.8,
            note: "Good for students and unmarried children."
        };
        if ([
            'north'
        ].includes(d)) return {
            status: 'avoid',
            score: 0.0,
            note: "Never sleep with head towards North. Causes sleep disorders."
        };
        return {
            status: 'neutral',
            score: 0.5,
            note: "South or West is the best."
        };
    }
    // 3. MASTER BEDROOM
    if (r === 'master bedroom') {
        let score = 1.0;
        let status = 'excellent';
        let note = "Ideal zone of strength/stability for the head of family.";
        if (d === 'south-west') {} else if ([
            'south',
            'west'
        ].includes(d)) {
            status = 'good';
            score = 0.75;
            note = "Good alternative, promotes peace.";
        } else if ([
            'north-east',
            'south-east'
        ].includes(d)) {
            return {
                status: 'avoid',
                score: 0.0,
                note: "Avoid here. Represents water/fire clashes leading to unrest."
            };
        } else {
            status = 'neutral';
            score = 0.5;
            note = "Acceptable placement.";
        }
        if (f) {
            if ([
                'south',
                'west'
            ].includes(f)) note += " Sleeping with head towards South/West ensures deep rest.";
            else if (f === 'north') {
                score = 0.0;
                status = 'avoid';
                note += " NEVER sleep with head towards North.";
            }
        }
        if (score <= 0) status = 'avoid';
        else if (score < 0.8) status = 'good';
        return {
            status,
            score,
            note
        };
    }
    // BEDROOMS (KIDS, GUEST, BEDROOM 4/5, SERVANT)
    if (r.includes('kids') || r.includes('guest') || r.includes('bedroom 4') || r.includes('bedroom 5') || r.includes('servant') || r.includes('study room') || r.includes('workspace')) {
        let score = 1.0;
        let status = 'excellent';
        let note = "Perfect for movement and growth.";
        if ([
            'north-west',
            'west'
        ].includes(d)) {} else if ([
            'south',
            'east'
        ].includes(d)) {
            status = 'good';
            score = 0.75;
            note = "Favorable, keeps the mind active.";
        } else if (d === 'south-west') {
            return {
                status: 'avoid',
                score: 0.0,
                note: "Reserved for Master Bedroom ideally. Secondary room."
            };
        } else {
            status = 'neutral';
            score = 0.5;
            note = "Acceptable layout.";
        }
        if (f) {
            if ([
                'south',
                'west'
            ].includes(f)) note += " Bed towards South/West ensures deep rest.";
            else if (f === 'north') {
                score = 0.0;
                status = 'avoid';
                note += " NEVER sleep with head towards North.";
            }
        }
        if (score <= 0) status = 'avoid';
        else if (score < 0.8) status = 'good';
        return {
            status,
            score,
            note
        };
    }
    // 4. POOJA ROOM
    if (r === 'pooja room') {
        let score = 1.0;
        let status = 'excellent';
        let note = "Divine 'Ishan' corner. Maximizes spiritual energy.";
        if ([
            'north-east',
            'east',
            'north'
        ].includes(d)) {} else if ([
            'south',
            'south-west'
        ].includes(d)) {
            return {
                status: 'avoid',
                score: 0.0,
                note: "Inauspicious for worship. Strongly avoid."
            };
        } else {
            status = 'neutral';
            score = 0.5;
            note = "Acceptable placement.";
        }
        if (f) {
            if ([
                'east',
                'west'
            ].includes(f)) note += " Idols facing East or West is auspicious.";
            else {
                score -= 0.2;
                note += " Worshipper should ideally face East or North.";
            }
        }
        if (score <= 0.3) status = 'avoid';
        else if (score < 0.8) status = 'good';
        return {
            status,
            score,
            note
        };
    }
    // 5. WASHROOMS
    if (r.includes('washroom')) {
        let score = 1.0;
        let status = 'excellent';
        let note = "Ideal zone for disposal of waste energies.";
        if ([
            'north-west',
            'west',
            'south-south-west'
        ].includes(d)) {} else if (r.includes('attached washroom') && d === 'south') {
            status = 'good';
            score = 0.8;
            note = "Acceptable for attached baths.";
        } else if ([
            'north-east',
            'south-west',
            'center'
        ].includes(d)) {
            return {
                status: 'avoid',
                score: 0.0,
                note: "Severe Vastu Dosha. Contaminates wealth and health zones."
            };
        } else {
            status = 'neutral';
            score = 0.5;
            note = "Acceptable placement.";
        }
        if (f) {
            if ([
                'north',
                'south'
            ].includes(f)) note += " Toilet seat (Commode) facing North or South is correct.";
            else {
                score -= 0.3;
                note += " Toilet seat MUST face North or South.";
            }
        }
        if (score <= 0.3) status = 'avoid';
        else if (score < 0.8) status = 'good';
        return {
            status,
            score,
            note
        };
    }
    // BALCONY / SUNLIGHT / WINDOWS
    if (r.includes('balcony') || r.includes('window') || r.includes('sunlight')) {
        if ([
            'north',
            'east',
            'north-east'
        ].includes(d)) return {
            status: 'excellent',
            score: 1.0,
            note: "Welcomes positive morning rays and magnetic energy."
        };
        if (d === 'west') return {
            status: 'good',
            score: 0.75,
            note: "Good for evening light."
        };
        if ([
            'south',
            'south-west'
        ].includes(d)) return {
            status: 'avoid',
            score: 0.2,
            note: "Brings harsh afternoon heat. Close with heavy curtains."
        };
        return {
            status: 'neutral',
            score: 0.5,
            note: "Standard setup."
        };
    }
    // LIVING / DINING ROOM
    if ([
        'living room',
        'dining room'
    ].includes(r)) {
        if ([
            'north',
            'east',
            'north-east',
            'north-west'
        ].includes(d) || r === 'dining room' && d === 'west') return {
            status: 'excellent',
            score: 1.0,
            note: "Excellent for socializing and gathering positive energy."
        };
        if ([
            'south',
            'south-west'
        ].includes(d)) return {
            status: 'avoid',
            score: 0.2,
            note: "Makes guests stay too long / domineering."
        };
        return {
            status: 'neutral',
            score: 0.5,
            note: "Keep heavy furniture in West/South."
        };
    }
    // SAFE / LOCKER
    if (r === 'safe / locker') {
        let score = 1.0;
        let status = 'excellent';
        let note = "Earth element stabilizes wealth.";
        if ([
            'south-west',
            'south'
        ].includes(d)) {} else if ([
            'west'
        ].includes(d)) {
            status = 'good';
            score = 0.8;
            note = "Good for financial gains.";
        } else if ([
            'north-east',
            'north-west',
            'center'
        ].includes(d)) {
            return {
                status: 'avoid',
                score: 0.0,
                note: "Wealth will not accumulate here."
            };
        } else {
            status = 'neutral';
            score = 0.5;
            note = "Acceptable placement.";
        }
        if (f) {
            if (f === 'north') note += " Opening towards North (Kuber's direction) is perfect.";
            else {
                score -= 0.3;
                note += " Must open towards North.";
            }
        }
        if (score <= 0.3) status = 'avoid';
        else if (score < 0.8) status = 'good';
        return {
            status,
            score,
            note
        };
    }
    // STUDY TABLE
    if (r === 'study table') {
        let score = 1.0;
        let status = 'excellent';
        let note = "Enhances concentration, memory, and clear thinking.";
        if ([
            'east',
            'north',
            'north-east'
        ].includes(d)) {} else if ([
            'west'
        ].includes(d)) {
            status = 'good';
            score = 0.75;
            note = "Acceptable for older students.";
        } else if ([
            'south',
            'south-west'
        ].includes(d)) {
            return {
                status: 'avoid',
                score: 0.0,
                note: "Reduces focus, causes lethargy."
            };
        } else {
            status = 'neutral';
            score = 0.5;
            note = "Acceptable placement.";
        }
        if (f) {
            if ([
                'east',
                'north'
            ].includes(f)) note += " Facing East or North while studying is best.";
            else {
                score -= 0.2;
                note += " Should ideally face East/North.";
            }
        }
        if (score <= 0.3) status = 'avoid';
        else if (score < 0.8) status = 'good';
        return {
            status,
            score,
            note
        };
    }
    return {
        status: 'neutral',
        score: 0.5,
        note: "General acceptable placement."
    };
};
}),
"[project]/app/builder/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BuilderPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$progress$2d$bar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/builder/progress-bar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$projects$2d$form$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/builder/projects-form.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$towers$2d$form$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/builder/towers-form.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$units$2d$form$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/builder/units-form.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$wizard$2d$summary$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/builder/wizard-summary.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-ssr] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/building-2.js [app-ssr] (ecmascript) <export default as Building2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/save.js [app-ssr] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-ssr] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layers.js [app-ssr] (ecmascript) <export default as Layers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutGrid$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-grid.js [app-ssr] (ecmascript) <export default as LayoutGrid>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$builder$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/builder-types.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$forms$2f$township$2d$flow$2d$form$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/builder/forms/township-flow-form.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$forms$2f$project$2d$flow$2d$form$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/builder/forms/project-flow-form.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$forms$2f$tower$2d$flow$2d$form$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/builder/forms/tower-flow-form.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
const ALL_STEPS = [
    {
        id: 1,
        name: "Township",
        description: "Basic details & location"
    },
    {
        id: 2,
        name: "Projects",
        description: "Individual project details"
    },
    {
        id: 3,
        name: "Towers",
        description: "Buildings & structure"
    },
    {
        id: 4,
        name: "Units",
        description: "Tower-wise configurations & pricing"
    }
];
// Get steps based on flow type
const getStepsForFlow = (flowType)=>{
    let steps = ALL_STEPS;
    if (flowType === "project") {
        steps = ALL_STEPS.slice(1); // Projects, Towers, Units
    } else if (flowType === "tower") {
        steps = ALL_STEPS.slice(2); // Towers, Units
    }
    // Return new objects with re-mapped IDs (1, 2, 3...)
    return steps.map((step, index)=>({
            ...step,
            id: index + 1
        }));
};
// Get step offset based on flow type (for mapping display step to actual step)
const getStepOffset = (flowType)=>{
    switch(flowType){
        case "township":
            return 0;
        case "project":
            return 1 // Skip step 1 (Township)
            ;
        case "tower":
            return 2 // Skip steps 1 & 2 (Township & Projects)
            ;
        default:
            return 0;
    }
};
function BuilderContent() {
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const flowType = searchParams.get("flow") || "township";
    const STEPS = getStepsForFlow(flowType);
    const stepOffset = getStepOffset(flowType);
    const getInitialState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const baseState = {
            currentStep: 1 + stepOffset,
            township: {
                ...__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$builder$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["initialTownshipData"],
                id: `township-${Date.now()}` // Ensure unique ID per session
            },
            projectTemplate: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$builder$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["initialProjectTemplate"],
            projects: [],
            towers: [],
            towerTemplate: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$builder$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["initialTowerTemplate"],
            unitTemplate: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$builder$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["initialUnitTemplate"])("global"),
            towerUnitConfigs: [],
            generatedProjects: [],
            generatedTowers: [],
            generatedUnits: []
        };
        // For project flow, create a default project
        if (flowType === "project") {
            const defaultProject = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$builder$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createInitialProject"])(1);
            defaultProject.totalTowers = 1;
            baseState.projects = [
                defaultProject
            ];
        }
        if (flowType === "tower") {
            const standaloneTower = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$builder$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createInitialTower"])(0, "standalone");
            standaloneTower.id = "tower-standalone-1"; // Ensure unique ID
            standaloneTower.name = "Tower A";
            baseState.towers = [
                standaloneTower
            ];
        }
        return baseState;
    }, [
        flowType,
        stepOffset
    ]);
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>getInitialState());
    const [isComplete, setIsComplete] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isCreating, setIsCreating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Sub-navigation state for Tabs
    const [activeProjectIdx, setActiveProjectIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [activeTowerIdx, setActiveTowerIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [activeUnitTowerId, setActiveUnitTowerId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("global");
    const [activeUnitProjectId, setActiveUnitProjectId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("all");
    // Load data if editing
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const editId = searchParams.get("edit");
        if (editId) {
            // Search in properties first
            const properties = JSON.parse(localStorage.getItem("properties") || "[]");
            const property = properties.find((p)=>p.id === editId);
            if (property) {
                setState(property.data);
                console.log("Loaded property:", property);
                return;
            }
            // Search in drafts
            const drafts = JSON.parse(localStorage.getItem("propertyDrafts") || "[]");
            const draft = drafts.find((d)=>d.id === editId);
            if (draft) {
                setState(draft.data);
                console.log("Loaded draft:", draft);
            }
        }
    }, [
        searchParams
    ]);
    // Theme management
    const [theme, setTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("system");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Load saved theme
        const savedTheme = localStorage.getItem("theme") || "system";
        setTheme(savedTheme);
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Apply theme class
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
        // Save to local storage
        localStorage.setItem("theme", theme);
    }, [
        theme
    ]);
    // Reset state when flow type changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setState(getInitialState());
        setIsComplete(false);
        setIsCreating(false);
    }, [
        flowType,
        getInitialState
    ]);
    // ── Auto-add projects when township.projectCount increases ────────────────
    // NOTE: We only ADD projects here, never remove them.
    // Removal is handled by the ProjectsForm's remove button.
    // This way, manually added projects are never wiped by this effect.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (flowType !== "township") return;
        const currentCount = state.projects.length;
        const targetCount = state.township.projectCount;
        if (targetCount > currentCount) {
            const newProjects = Array.from({
                length: targetCount - currentCount
            }, (_, i)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$builder$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createInitialProject"])(currentCount + i + 1));
            setState((prev)=>({
                    ...prev,
                    projects: [
                        ...prev.projects,
                        ...newProjects
                    ]
                }));
        }
    // ⛔ Deliberately NOT cutting projects when targetCount < currentCount
    // ProjectsForm remove button handles deletion directly.
    }, [
        state.township.projectCount,
        flowType,
        state.projects.length
    ]);
    // ── Tower sync useEffect DISABLED ──────────────────────────────────────────
    // Reason: Towers are now fully manually managed via TowersForm (Step 3).
    // The old effect was overwriting manually added towers by resetting to
    // project.totalTowers count (default 0), causing "tower add nahi hota" bug.
    // Tower counts are kept in sync via the updateTowers callback below.
    const { unitTemplate, towers, towerUnitConfigs } = state;
    const generatedTowers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return towers.map((tower)=>{
            const floors = Number.parseInt(tower.totalFloors.replace(/\D/g, "")) || 20;
            const unitsPerFloor = Number.parseInt(tower.unitsPerFloor) || 4;
            return {
                id: tower.id,
                projectId: tower.projectId,
                name: tower.name || `Tower ${tower.id.split("-").pop()?.toUpperCase()}`,
                reraNumber: tower.reraNumber,
                totalFloors: floors,
                unitsPerFloor,
                totalUnits: floors * unitsPerFloor
            };
        });
    }, [
        towers
    ]);
    const generatedUnits = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const units = [];
        const facings = [
            "north",
            "south",
            "east",
            "west",
            "north-east",
            "north-west",
            "south-east",
            "south-west"
        ];
        generatedTowers.forEach((tower)=>{
            const towerConfig = towerUnitConfigs.find((c)=>c.towerId === tower.id);
            const configs = towerConfig?.configurations || unitTemplate.configurations;
            const basePrice = towerConfig?.basePrice ? Number.parseFloat(towerConfig.basePrice) : Number.parseFloat(unitTemplate.basePrice);
            const ratePerSqft = towerConfig?.ratePerSqft ? Number.parseFloat(towerConfig.ratePerSqft) : Number.parseFloat(unitTemplate.ratePerSqft);
            const facingPremiums = towerConfig?.facingPremiums || unitTemplate.facingPremiums;
            let unitNumber = 0;
            for(let floor = 1; floor <= tower.totalFloors; floor++){
                configs.forEach((config)=>{
                    for(let i = 0; i < config.countPerFloor; i++){
                        unitNumber++;
                        const facing = facings[(unitNumber - 1) % facings.length];
                        const carpetArea = config.carpetArea || 0;
                        let finalPrice = carpetArea * ratePerSqft || basePrice;
                        const floorRiseStart = 5;
                        if (floor >= floorRiseStart) {
                            const floorDiff = floor - floorRiseStart;
                            const risePercent = 0.5 / 100;
                            finalPrice = finalPrice * (1 + floorDiff * risePercent);
                        }
                        const facingPremium = Number.parseFloat(facingPremiums[facing]) / 100;
                        finalPrice = finalPrice * (1 + facingPremium);
                        units.push({
                            id: `unit-${tower.id}-${floor}-${unitNumber}`,
                            towerId: tower.id,
                            unitNumber: `${tower.name.replace("Tower ", "")}-${floor}${String(unitNumber % 100).padStart(2, "0")}`,
                            floor,
                            floorNumber: floor,
                            configuration: config.type,
                            carpetArea,
                            area: carpetArea,
                            price: Math.round(finalPrice),
                            facing,
                            status: "available"
                        });
                    }
                });
            }
        });
        return units;
    }, [
        unitTemplate,
        generatedTowers,
        towerUnitConfigs
    ]);
    // Ensure towerUnitConfigs are populated for all towers
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const missingConfigTowerIds = state.towers.map((t)=>t.id).filter((id)=>!state.towerUnitConfigs.some((c)=>c.towerId === id));
        if (missingConfigTowerIds.length > 0) {
            console.log("Populating default configs for:", missingConfigTowerIds);
            const newConfigs = missingConfigTowerIds.map((towerId)=>({
                    towerId,
                    configurations: [
                        ...state.unitTemplate.configurations
                    ],
                    basePrice: state.unitTemplate.basePrice,
                    ratePerSqft: state.unitTemplate.ratePerSqft,
                    facingPremiums: {
                        ...state.unitTemplate.facingPremiums
                    }
                }));
            setState((prev)=>({
                    ...prev,
                    towerUnitConfigs: [
                        ...prev.towerUnitConfigs,
                        ...newConfigs
                    ]
                }));
        }
    }, [
        state.towers,
        state.towerUnitConfigs,
        state.unitTemplate
    ]);
    const updateState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((key, value)=>{
        setState((prev)=>({
                ...prev,
                [key]: value
            }));
    }, []);
    const updateProjects = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((projects)=>{
        // Also sync township.projectCount so summary is accurate
        setState((prev)=>({
                ...prev,
                projects,
                township: {
                    ...prev.township,
                    projectCount: projects.length
                }
            }));
    }, []);
    const updateTowers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((towers)=>{
        // Also sync each project's totalTowers count from actual towers array
        setState((prev)=>{
            const updatedProjects = prev.projects.map((p)=>({
                    ...p,
                    totalTowers: towers.filter((t)=>t.projectId === p.id).length
                }));
            return {
                ...prev,
                towers,
                projects: updatedProjects
            };
        });
    }, []);
    // ── Auto-sync township counts ──────────────────────────────────────────
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const towersCount = state.towers.length;
        const unitsCount = generatedUnits.length;
        const projectsCount = state.projects.length;
        // totalFamilies is typically same as totalUnits for initial estimation
        const familiesCount = unitsCount;
        if (state.township.projectCount !== projectsCount || state.township.totalTowers !== towersCount || state.township.totalUnits !== unitsCount || state.township.totalFamilies !== familiesCount) {
            setState((prev)=>({
                    ...prev,
                    township: {
                        ...prev.township,
                        projectCount: projectsCount,
                        totalTowers: towersCount,
                        totalUnits: unitsCount,
                        totalFamilies: familiesCount
                    }
                }));
        }
    }, [
        state.projects.length,
        state.towers.length,
        generatedUnits.length,
        state.township.projectCount,
        state.township.totalTowers,
        state.township.totalUnits,
        state.township.totalFamilies
    ]);
    const handleAddProject = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const newProject = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$builder$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createInitialProject"])(state.township.name, state.projects.length);
        const next = [
            ...state.projects,
            newProject
        ];
        updateProjects(next);
        setActiveProjectIdx(next.length - 1);
    }, [
        state.projects,
        state.township.name,
        updateProjects
    ]);
    const handleAddTower = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((projectId)=>{
        const projectTowers = state.towers.filter((t)=>t.projectId === projectId);
        const newTower = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$builder$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createInitialTower"])(projectTowers.length, projectId);
        const next = [
            ...state.towers,
            newTower
        ];
        updateTowers(next);
        setActiveTowerIdx(next.filter((t)=>t.projectId === projectId).length - 1);
    }, [
        state.towers,
        updateTowers
    ]);
    const handleCloneTower = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((towerId)=>{
        const originalTower = state.towers.find((t)=>t.id === towerId);
        if (!originalTower) return;
        const newTowerId = `tower-${crypto.randomUUID()}`;
        const clonedTower = {
            ...originalTower,
            id: newTowerId,
            name: `${originalTower.name} (Copy)`
        };
        // Clone units as well
        const originalConfig = state.towerUnitConfigs.find((c)=>c.towerId === towerId);
        let newConfigs = state.towerUnitConfigs;
        if (originalConfig) {
            newConfigs = [
                ...state.towerUnitConfigs,
                {
                    ...originalConfig,
                    towerId: newTowerId
                }
            ];
        }
        setState((prev)=>({
                ...prev,
                towers: [
                    ...prev.towers,
                    clonedTower
                ],
                towerUnitConfigs: newConfigs
            }));
        const projectTowers = [
            ...state.towers,
            clonedTower
        ].filter((t)=>t.projectId === originalTower.projectId);
        setActiveTowerIdx(projectTowers.length - 1);
    }, [
        state.towers,
        state.towerUnitConfigs
    ]);
    const handleCloneProject = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((projectId)=>{
        const originalProject = state.projects.find((p)=>p.id === projectId);
        if (!originalProject) return;
        const newProjectId = `proj-${crypto.randomUUID()}`;
        const clonedProject = {
            ...originalProject,
            id: newProjectId,
            name: `${originalProject.name} (Copy)`
        };
        // Clone towers of this project
        const projectTowers = state.towers.filter((t)=>t.projectId === projectId);
        const clonedTowers = projectTowers.map((tower)=>{
            const newTowerId = `tower-${crypto.randomUUID()}`;
            return {
                ...tower,
                id: newTowerId,
                projectId: newProjectId
            };
        });
        // Clone units of those towers
        const clonedConfigs = projectTowers.flatMap((tower)=>{
            const originalConfig = state.towerUnitConfigs.find((c)=>c.towerId === tower.id);
            if (originalConfig) {
                // Find the new tower id for this tower
                const newTowerId = clonedTowers.find((ct)=>ct.name === tower.name)?.id // names might not be unique but here they are same
                ;
                // Actually better to map them safely
                return [] // We'll do it better below
                ;
            }
            return [];
        });
        // Correct way to clone nested structure
        const towerConfigsToAdd = [];
        const finalClonedTowers = projectTowers.map((tower)=>{
            const newTowerId = `tower-${crypto.randomUUID()}`;
            const originalConfig = state.towerUnitConfigs.find((c)=>c.towerId === tower.id);
            if (originalConfig) {
                towerConfigsToAdd.push({
                    ...originalConfig,
                    towerId: newTowerId
                });
            }
            return {
                ...tower,
                id: newTowerId,
                projectId: newProjectId
            };
        });
        setState((prev)=>({
                ...prev,
                projects: [
                    ...prev.projects,
                    clonedProject
                ],
                towers: [
                    ...prev.towers,
                    ...finalClonedTowers
                ],
                towerUnitConfigs: [
                    ...prev.towerUnitConfigs,
                    ...towerConfigsToAdd
                ]
            }));
        setActiveProjectIdx(state.projects.length);
    }, [
        state.projects,
        state.towers,
        state.towerUnitConfigs
    ]);
    const maxStep = 4 // Units step is always 4
    ;
    const minStep = 1 + stepOffset // Min step based on flow
    ;
    const validateStep = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        // ⚠️ Validation temporarily disabled — enable before production
        return true;
    }, []);
    const nextStep = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!validateStep()) return;
        setState((prev)=>({
                ...prev,
                currentStep: Math.min(prev.currentStep + 1, maxStep + 1),
                generatedTowers,
                generatedUnits
            }));
    }, [
        generatedTowers,
        generatedUnits,
        maxStep,
        validateStep
    ]);
    const prevStep = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setState((prev)=>({
                ...prev,
                currentStep: Math.max(prev.currentStep - 1, minStep)
            }));
    }, [
        minStep
    ]);
    const handleSaveDraft = async ()=>{
        try {
            setIsCreating(true);
            const draftData = {
                id: state.township?.id || state.projects[0]?.id || state.towers[0]?.id || `draft-${Date.now()}`,
                flowType,
                status: "draft",
                data: {
                    ...state,
                    generatedTowers,
                    generatedUnits
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const existingDrafts = JSON.parse(localStorage.getItem("propertyDrafts") || "[]");
            const draftIndex = existingDrafts.findIndex((d)=>d.id === draftData.id);
            if (draftIndex >= 0) {
                existingDrafts[draftIndex] = draftData;
            } else {
                existingDrafts.push(draftData);
            }
            localStorage.setItem("propertyDrafts", JSON.stringify(existingDrafts));
            await new Promise((resolve)=>setTimeout(resolve, 1000));
            setIsCreating(false);
            window.location.href = "/builder-dashboard?tab=properties&filter=drafts";
        } catch (error) {
            console.error("Error saving draft:", error);
            setIsCreating(false);
            alert("Failed to save draft. Please try again.");
        }
    };
    const handleCreate = async ()=>{
        try {
            setIsCreating(true);
            const propertyData = {
                id: state.township?.id || state.projects[0]?.id || state.towers[0]?.id || `property-${Date.now()}`,
                flowType,
                status: "published",
                data: {
                    ...state,
                    generatedTowers,
                    generatedUnits
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const existingProperties = JSON.parse(localStorage.getItem("properties") || "[]");
            const propertyIndex = existingProperties.findIndex((p)=>p.id === propertyData.id);
            if (propertyIndex >= 0) {
                existingProperties[propertyIndex] = propertyData;
            } else {
                existingProperties.push(propertyData);
            }
            localStorage.setItem("properties", JSON.stringify(existingProperties));
            const existingDrafts = JSON.parse(localStorage.getItem("propertyDrafts") || "[]");
            const updatedDrafts = existingDrafts.filter((d)=>d.id !== propertyData.id);
            localStorage.setItem("propertyDrafts", JSON.stringify(updatedDrafts));
            await new Promise((resolve)=>setTimeout(resolve, 2000));
            setIsCreating(false);
            setIsComplete(true);
            setTimeout(()=>{
                window.location.href = "/builder-dashboard?tab=properties&filter=published";
            }, 1500);
        } catch (error) {
            console.error("Error creating property:", error);
            setIsCreating(false);
            alert("Failed to create property. Please try again.");
        }
    };
    const totalEntities = 1 + state.projects.length + generatedTowers.length + generatedUnits.length;
    const displayStepIndex = state.currentStep - 1 - stepOffset;
    const isReviewStep = state.currentStep > maxStep;
    const getFlowTitle = ()=>{
        switch(flowType){
            case "township":
                return "Township Builder";
            case "project":
                return "Project Builder";
            case "tower":
                return "Tower Builder";
            default:
                return "Property Builder";
        }
    };
    if (isComplete) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-background flex items-center justify-center p-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center max-w-md",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                            className: "h-8 w-8 text-green-600"
                        }, void 0, false, {
                            fileName: "[project]/app/builder/page.tsx",
                            lineNumber: 559,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/builder/page.tsx",
                        lineNumber: 558,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-2xl font-bold mb-2",
                        children: "Properties Created Successfully!"
                    }, void 0, false, {
                        fileName: "[project]/app/builder/page.tsx",
                        lineNumber: 561,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-muted-foreground mb-6",
                        children: [
                            totalEntities.toLocaleString(),
                            " properties have been created and are ready for use."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/builder/page.tsx",
                        lineNumber: 562,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-3 justify-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/builder-dashboard?tab=properties&filter=published",
                                className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium",
                                children: "Go to Dashboard"
                            }, void 0, false, {
                                fileName: "[project]/app/builder/page.tsx",
                                lineNumber: 566,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>window.location.reload(),
                                className: "px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors font-medium",
                                children: "Create Another"
                            }, void 0, false, {
                                fileName: "[project]/app/builder/page.tsx",
                                lineNumber: 567,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/builder/page.tsx",
                        lineNumber: 565,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/builder/page.tsx",
                lineNumber: 557,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/builder/page.tsx",
            lineNumber: 556,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-background text-foreground flex flex-col",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "sticky top-0 z-50 border-b bg-white dark:bg-slate-900 shadow-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "container max-w-7xl mx-auto px-4 md:px-6 py-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col md:flex-row md:items-center gap-4 justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/10 text-white shrink-0",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__["Building2"], {
                                                className: "w-5 h-5"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 587,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 586,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "min-w-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                    className: "font-bold text-base md:text-lg text-slate-900 dark:text-white truncate",
                                                    children: getFlowTitle()
                                                }, void 0, false, {
                                                    fileName: "[project]/app/builder/page.tsx",
                                                    lineNumber: 590,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold leading-none",
                                                    children: flowType === "township" ? "Mega Township" : "Standalone Property"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/builder/page.tsx",
                                                    lineNumber: 593,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 589,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/builder/page.tsx",
                                    lineNumber: 585,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1 max-w-2xl px-0 md:px-8",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$progress$2d$bar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProgressBar"], {
                                        steps: [
                                            ...STEPS,
                                            {
                                                id: STEPS.length + 1,
                                                name: "Review",
                                                description: "Review"
                                            }
                                        ],
                                        currentStep: displayStepIndex + 1
                                    }, void 0, false, {
                                        fileName: "[project]/app/builder/page.tsx",
                                        lineNumber: 600,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/builder/page.tsx",
                                    lineNumber: 599,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3 justify-end shrink-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "hidden lg:block text-right border-r pr-4 border-slate-200 dark:border-slate-800",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] text-muted-foreground font-bold uppercase mb-0.5",
                                                    children: "Current Phase"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/builder/page.tsx",
                                                    lineNumber: 608,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm font-black text-[#1A3C8C] dark:text-blue-400",
                                                    children: isReviewStep ? "Final Review" : STEPS[displayStepIndex]?.name
                                                }, void 0, false, {
                                                    fileName: "[project]/app/builder/page.tsx",
                                                    lineNumber: 609,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 607,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: handleSaveDraft,
                                            disabled: isCreating,
                                            className: "p-2.5 rounded-xl bg-slate-100/50 border border-slate-200 text-slate-600 hover:bg-white hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all group",
                                            title: "Save Draft",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                                className: "w-4 h-4 group-hover:scale-110 transition-transform"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 619,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 613,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/builder/page.tsx",
                                    lineNumber: 606,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/builder/page.tsx",
                            lineNumber: 584,
                            columnNumber: 11
                        }, this),
                        state.currentStep >= 2 && state.currentStep <= 4 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-hide",
                            children: [
                                state.currentStep === 2 && flowType === "township" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutGrid$3e$__["LayoutGrid"], {
                                            className: "w-4 h-4 text-slate-400 ml-1 mr-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 630,
                                            columnNumber: 19
                                        }, this),
                                        state.projects.map((p, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setActiveProjectIdx(i),
                                                className: `px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${activeProjectIdx === i ? "bg-[#1A3C8C] text-white border-[#1A3C8C] shadow-md shadow-blue-500/10" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `w-1.5 h-1.5 rounded-full ${p.name && p.reraNumber ? "bg-emerald-400" : "bg-orange-400"}`
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/builder/page.tsx",
                                                        lineNumber: 640,
                                                        columnNumber: 23
                                                    }, this),
                                                    p.name || `Project ${i + 1}`
                                                ]
                                            }, p.id, true, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 632,
                                                columnNumber: 21
                                            }, this)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: handleAddProject,
                                            className: "px-3 py-1.5 rounded-full text-xs font-bold text-emerald-600 border border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-all flex items-center gap-1.5 whitespace-nowrap",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                    className: "w-3.5 h-3.5"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/builder/page.tsx",
                                                    lineNumber: 648,
                                                    columnNumber: 21
                                                }, this),
                                                " Add Project"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 644,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true),
                                state.currentStep === 3 && (flowType === "township" || flowType === "project") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutGrid$3e$__["LayoutGrid"], {
                                            className: "w-4 h-4 text-slate-400 ml-1 mr-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 656,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            className: "bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-lg px-2 py-1 outline-none text-slate-700",
                                            value: activeProjectIdx,
                                            onChange: (e)=>{
                                                setActiveProjectIdx(Number(e.target.value));
                                                setActiveTowerIdx(0);
                                            },
                                            children: state.projects.map((p, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: i,
                                                    children: p.name || `Project ${i + 1}`
                                                }, p.id, false, {
                                                    fileName: "[project]/app/builder/page.tsx",
                                                    lineNumber: 667,
                                                    columnNumber: 23
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 658,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-px h-4 bg-slate-200 mx-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 670,
                                            columnNumber: 19
                                        }, this),
                                        state.towers.filter((t)=>t.projectId === state.projects[activeProjectIdx]?.id).map((t, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setActiveTowerIdx(i),
                                                className: `px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${activeTowerIdx === i ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`,
                                                children: t.name || `Tower ${i + 1}`
                                            }, t.id, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 673,
                                                columnNumber: 21
                                            }, this)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>handleAddTower(state.projects[activeProjectIdx].id),
                                            className: "px-3 py-1.5 rounded-full text-xs font-bold text-emerald-600 border border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-all flex items-center gap-1.5 whitespace-nowrap",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                    className: "w-3.5 h-3.5"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/builder/page.tsx",
                                                    lineNumber: 688,
                                                    columnNumber: 21
                                                }, this),
                                                " Add Tower"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 684,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true),
                                state.currentStep === 4 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__["Layers"], {
                                            className: "w-4 h-4 text-slate-400 ml-1 mr-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 696,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                setActiveUnitProjectId("all");
                                                setActiveUnitTowerId("global");
                                            },
                                            className: `px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${activeUnitTowerId === "global" ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/10" : "bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-slate-50"}`,
                                            children: "Global Pricing"
                                        }, void 0, false, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 697,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-px h-4 bg-slate-200 mx-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 706,
                                            columnNumber: 19
                                        }, this),
                                        state.projects.map((p, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    setActiveUnitProjectId(p.id);
                                                    const pt = state.towers.filter((t)=>t.projectId === p.id);
                                                    if (pt.length > 0) setActiveUnitTowerId(pt[0].id);
                                                },
                                                className: `px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${activeUnitProjectId === p.id && activeUnitTowerId !== "global" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`,
                                                children: p.name || `P${i + 1}`
                                            }, p.id, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 709,
                                                columnNumber: 21
                                            }, this)),
                                        activeUnitProjectId !== "all" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "w-px h-4 bg-slate-200 mx-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/builder/page.tsx",
                                                    lineNumber: 727,
                                                    columnNumber: 23
                                                }, this),
                                                state.towers.filter((t)=>t.projectId === activeUnitProjectId).map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setActiveUnitTowerId(t.id),
                                                        className: `px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${activeUnitTowerId === t.id ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50"}`,
                                                        children: t.name || "Tower"
                                                    }, t.id, false, {
                                                        fileName: "[project]/app/builder/page.tsx",
                                                        lineNumber: 729,
                                                        columnNumber: 25
                                                    }, this))
                                            ]
                                        }, void 0, true)
                                    ]
                                }, void 0, true)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/builder/page.tsx",
                            lineNumber: 626,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/builder/page.tsx",
                    lineNumber: 582,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/builder/page.tsx",
                lineNumber: 581,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "container max-w-7xl mx-auto px-4 md:px-6 py-8 flex-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-6 md:mb-10 space-y-2 md:space-y-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed",
                            children: [
                                state.currentStep === 2 && `Configure ${flowType === "township" ? state.township.projectCount || 0 : state.projects.length} individual projects`,
                                state.currentStep === 3 && `Add towers and building details for ${state.projects.length || 0} projects`,
                                state.currentStep === 4 && `Customize unit configurations and pricing for each of ${state.towers.length || 0} towers`,
                                isReviewStep && `Review all ${totalEntities.toLocaleString()} entities before creating`
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/builder/page.tsx",
                            lineNumber: 754,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/builder/page.tsx",
                        lineNumber: 750,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-8 min-h-[50vh] pb-24",
                        children: [
                            flowType === "township" && state.currentStep === 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$forms$2f$township$2d$flow$2d$form$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TownshipFlowForm"], {
                                data: state.township,
                                onChange: (data)=>updateState("township", data)
                            }, void 0, false, {
                                fileName: "[project]/app/builder/page.tsx",
                                lineNumber: 767,
                                columnNumber: 13
                            }, this),
                            flowType === "project" && state.currentStep === 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$forms$2f$project$2d$flow$2d$form$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProjectFlowForm"], {
                                data: state.projects[0],
                                onChange: (data)=>{
                                    const updated = [
                                        ...state.projects
                                    ];
                                    updated[0] = data;
                                    setState((prev)=>({
                                            ...prev,
                                            projects: updated
                                        }));
                                },
                                townshipData: state.township,
                                onTownshipChange: (data)=>updateState("township", data),
                                showCommonData: true
                            }, void 0, false, {
                                fileName: "[project]/app/builder/page.tsx",
                                lineNumber: 774,
                                columnNumber: 13
                            }, this),
                            flowType === "tower" && state.currentStep === 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$forms$2f$tower$2d$flow$2d$form$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TowerFlowForm"], {
                                data: state.towers[0],
                                onChange: (data)=>{
                                    const updated = [
                                        ...state.towers
                                    ];
                                    updated[0] = data;
                                    setState((prev)=>({
                                            ...prev,
                                            towers: updated
                                        }));
                                },
                                townshipData: state.township,
                                onTownshipChange: (data)=>updateState("township", data),
                                showCommonData: true
                            }, void 0, false, {
                                fileName: "[project]/app/builder/page.tsx",
                                lineNumber: 788,
                                columnNumber: 13
                            }, this),
                            flowType === "township" && state.currentStep === 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$projects$2d$form$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProjectsForm"], {
                                township: state.township,
                                projects: state.projects,
                                onChange: updateProjects,
                                onCloneProject: handleCloneProject,
                                activeIdx: activeProjectIdx,
                                setActiveIdx: setActiveProjectIdx,
                                isWizardMode: true
                            }, void 0, false, {
                                fileName: "[project]/app/builder/page.tsx",
                                lineNumber: 802,
                                columnNumber: 13
                            }, this),
                            (flowType === "township" || flowType === "project") && state.currentStep === 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$towers$2d$form$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TowersForm"], {
                                projects: state.projects,
                                towers: state.towers,
                                onTowersChange: updateTowers,
                                onCloneTower: handleCloneTower,
                                activeProjectIdx: activeProjectIdx,
                                setActiveProjectIdx: setActiveProjectIdx,
                                activeTowerIdx: activeTowerIdx,
                                setActiveTowerIdx: setActiveTowerIdx
                            }, void 0, false, {
                                fileName: "[project]/app/builder/page.tsx",
                                lineNumber: 814,
                                columnNumber: 13
                            }, this),
                            state.currentStep === 4 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$units$2d$form$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UnitsForm"], {
                                towers: generatedTowers,
                                data: state.unitTemplate,
                                onChange: (data)=>updateState("unitTemplate", data),
                                towerConfigs: state.towerUnitConfigs,
                                onTowerConfigsChange: (configs)=>updateState("towerUnitConfigs", configs),
                                activeTowerId: activeUnitTowerId,
                                setActiveTowerId: setActiveUnitTowerId,
                                activeProjectId: activeUnitProjectId,
                                setActiveProjectId: setActiveUnitProjectId
                            }, void 0, false, {
                                fileName: "[project]/app/builder/page.tsx",
                                lineNumber: 827,
                                columnNumber: 13
                            }, this),
                            isReviewStep && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$builder$2f$wizard$2d$summary$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WizardSummary"], {
                                state: {
                                    ...state,
                                    generatedProjects: state.projects,
                                    generatedTowers,
                                    generatedUnits
                                },
                                flowType: flowType
                            }, void 0, false, {
                                fileName: "[project]/app/builder/page.tsx",
                                lineNumber: 841,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/builder/page.tsx",
                        lineNumber: 765,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/builder/page.tsx",
                lineNumber: 749,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "container max-w-7xl mx-auto px-4 md:px-6 py-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between gap-3 md:gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    if (confirm("Are you sure you want to cancel? Unsaved changes will be lost.")) {
                                        window.location.href = "/builder-dashboard";
                                    }
                                },
                                disabled: isCreating,
                                className: "px-3 py-2 md:px-6 border border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors font-medium text-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "hidden md:inline",
                                        children: "Cancel"
                                    }, void 0, false, {
                                        fileName: "[project]/app/builder/page.tsx",
                                        lineNumber: 864,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "md:hidden flex items-center gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                className: "h-4 w-4"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 865,
                                                columnNumber: 67
                                            }, this),
                                            " Cancel"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/builder/page.tsx",
                                        lineNumber: 865,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/builder/page.tsx",
                                lineNumber: 855,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "hidden md:flex flex-col items-center gap-3 flex-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-muted-foreground",
                                        children: [
                                            "Step ",
                                            displayStepIndex + 1,
                                            " of ",
                                            STEPS.length + 1
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/builder/page.tsx",
                                        lineNumber: 870,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 rounded-full",
                                            style: {
                                                width: `${(displayStepIndex + 1) / (STEPS.length + 1) * 100}%`
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/app/builder/page.tsx",
                                            lineNumber: 874,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/builder/page.tsx",
                                        lineNumber: 873,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/builder/page.tsx",
                                lineNumber: 869,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 md:gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleSaveDraft,
                                        disabled: isCreating,
                                        className: "px-3 md:px-6 py-2 flex items-center gap-2 bg-transparent border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm",
                                        title: "Save as Draft",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                                className: "h-4 w-4"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 890,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "hidden md:inline",
                                                children: isCreating ? "Saving..." : "Save Draft"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 891,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/builder/page.tsx",
                                        lineNumber: 884,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: prevStep,
                                        disabled: state.currentStep === minStep,
                                        className: "px-3 md:px-6 py-2 flex items-center gap-2 bg-transparent border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-foreground text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                                className: "h-4 w-4"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 900,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "hidden sm:inline",
                                                children: "Back"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 901,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/builder/page.tsx",
                                        lineNumber: 895,
                                        columnNumber: 15
                                    }, this),
                                    !isReviewStep ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: nextStep,
                                        className: "px-4 md:px-6 py-2 flex items-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "hidden sm:inline",
                                                children: state.currentStep === maxStep ? "Review" : "Next"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 910,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "sm:hidden",
                                                children: "Next"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 911,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                className: "h-4 w-4"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 912,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/builder/page.tsx",
                                        lineNumber: 906,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleCreate,
                                        disabled: isCreating,
                                        className: "px-4 md:px-8 py-2 flex items-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm",
                                        children: [
                                            isCreating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "hidden md:inline",
                                                children: "Creating..."
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 920,
                                                columnNumber: 33
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "hidden md:inline",
                                                children: "Create All"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 920,
                                                columnNumber: 89
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "md:hidden",
                                                children: isCreating ? "..." : "Create"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 921,
                                                columnNumber: 19
                                            }, this),
                                            !isCreating && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                                className: "h-4 w-4"
                                            }, void 0, false, {
                                                fileName: "[project]/app/builder/page.tsx",
                                                lineNumber: 922,
                                                columnNumber: 35
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/builder/page.tsx",
                                        lineNumber: 915,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/builder/page.tsx",
                                lineNumber: 882,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/builder/page.tsx",
                        lineNumber: 852,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/builder/page.tsx",
                    lineNumber: 851,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/builder/page.tsx",
                lineNumber: 850,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/builder/page.tsx",
        lineNumber: 575,
        columnNumber: 5
    }, this);
}
function BuilderPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex h-screen items-center justify-center",
            children: "Loading Wizard..."
        }, void 0, false, {
            fileName: "[project]/app/builder/page.tsx",
            lineNumber: 934,
            columnNumber: 25
        }, void 0),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BuilderContent, {}, void 0, false, {
            fileName: "[project]/app/builder/page.tsx",
            lineNumber: 935,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/builder/page.tsx",
        lineNumber: 934,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_a43af712._.js.map