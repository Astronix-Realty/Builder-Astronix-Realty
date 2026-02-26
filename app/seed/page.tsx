"use client";

import { useState } from "react";
import {
    initialTownshipData,
    createInitialProject,
    createInitialTower,
    initialUnitTemplate,
    createDefaultUnitConfig,
    TownshipData,
    ProjectData,
    TowerData,
    GeneratedTower,
    GeneratedUnit,
    UnitConfiguration
} from "@/lib/builder-types";

export default function SeedPage() {
    const [status, setStatus] = useState("Click the button to generate and inject the required Township property.");

    const handleSeed = () => {
        try {
            // 1. Create Township Data
            const townshipId = `township-${Date.now()}`;
            const township: TownshipData = {
                ...initialTownshipData,
                id: townshipId,
                builderName: "Astronix Realty",
                builderLogo: "https://via.placeholder.com/150",
                builderTagline: "Building Dreams Since 2005",
                builderPhone: "+91 86572 25993",
                builderWhatsapp: "918657225993",
                builderEmail: "sales@astronixrealty.com",
                builderWebsite: "https://astronixrealty.com",
                builderEstYear: "2005",
                builderProjects: "25+",
                constructionStatus: "under-construction",
                city: "Mumbai",
                district: "Thane",
                subCity: "Dombivali",
                state: "Maharashtra",
                country: "India",
                pincode: "421201",
                village: "Sonarpada",
                nearbyLandmark: "Near Xperia Mall",
                googleMapLink: "https://maps.google.com/?q=19.2183,72.9781",
                googlePlusCode: "+QR5, Thane, Maharashtra",
                gmbProfileCode: "<iframe src='https://www.google.com/maps/embed?pb=xxx'></iframe>",
                coordinates: { lat: "19.2183", lng: "72.9781" },
                greenCoverPercentage: "40",
                landscapeVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                shortVideoUrl: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
                reraNumber: "P51700000001",
                reraCertificateUrl: "https://maharera.mahaonline.gov.in/certificate.pdf",
                ocNumber: "OC/2026/0001",
                ocCertificateUrl: "https://maharera.mahaonline.gov.in/oc.pdf",
                legalTrustScore: "100",
                legalTrustDescription: "Clear Marketable Title with CC Received",
                ccNumber: "CC/2024/0001",
                ccStatus: "CC Received",
                approvals: "TMC Approved",
                approvedBanks: ["SBI", "HDFC", "ICICI", "Axis Bank"],

                // Township specific
                name: "Astronix Grand City",
                tagType: "Integrated Megacity Township",
                heroImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600",
                heroLocation: "Dombivali East",
                galleryImages: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"],
                priceRangeMin: 5000000,
                priceRangeMax: 25000000,
                priceLabel: "₹50L – ₹2.5 Cr",
                description: "A world-class integrated township spread across 100 acres.",
                visionStatement: "To redefine urban living with nature and modern amenities.",
                aboutImageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
                totalArea: "100",
                areaUnit: "acres",
                projectCount: 2,
                totalTowers: 3,
                totalUnits: 300,
                totalFamilies: 300,
                launchDate: "Jan 2024",
                possessionDate: "Dec 2028",
                masterplanImage: "https://via.placeholder.com/1200x800.png?text=Master+Plan",
                masterPlanScale: "1:1000",
                masterPlanDescription: "Detailed layout showing all phases and amenities.",
                brochureLink: "https://example.com/brochure.pdf",
            };

            // 2. Create Projects (Project 1, Project 2)
            const p1 = createInitialProject(township.name, 0);
            p1.id = "proj-astronix-p1";
            p1.name = "Astronix Phase 1 - Alpha";
            p1.tagType = "Premium Residential";
            p1.heroImage = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600";
            p1.heroLocation = "Zone A - Township";
            p1.galleryImages = ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"];
            p1.description = "The inaugural phase of Astronix Grand City.";
            p1.visionStatement = "Crafting luxury from the ground up.";
            p1.aboutImageUrl = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800";
            p1.totalArea = "10";
            p1.areaUnit = "acres";
            p1.launchDate = "Feb 2024";
            p1.possessionDate = "Dec 2026";
            p1.totalFamilies = 100;
            p1.bhkConfigs = ["2BHK"];
            p1.reraNumber = "P11111111111";
            p1.reraCertificateUrl = "https://maharera.mahaonline.gov.in/p1.pdf";
            p1.ccNumber = "CC/P1/001";
            p1.ccStatus = "Received";
            p1.ocNumber = "";
            p1.ocCertificateUrl = "";
            p1.approvalStatus = "approved";
            p1.legalTrustScore = "100";
            p1.legalTrustDescription = "Clear Title";

            const p2 = createInitialProject(township.name, 1);
            p2.id = "proj-astronix-p2";
            p2.name = "Astronix Phase 2 - Beta";
            p2.tagType = "Luxury Residential";
            p2.heroImage = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600";
            p2.heroLocation = "Zone B - Township";
            p2.galleryImages = ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"];
            p2.description = "The premium luxury phase of the township.";
            p2.visionStatement = "Elevated living for the elite.";
            p2.aboutImageUrl = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800";
            p2.totalArea = "15";
            p2.areaUnit = "acres";
            p2.launchDate = "Jun 2024";
            p2.possessionDate = "Dec 2028";
            p2.totalFamilies = 200;
            p2.bhkConfigs = ["2BHK", "3BHK"];
            p2.reraNumber = "P22222222222";
            p2.reraCertificateUrl = "https://maharera.mahaonline.gov.in/p2.pdf";
            p2.ccNumber = "CC/P2/001";
            p2.ccStatus = "Received";
            p2.ocNumber = "";
            p2.ocCertificateUrl = "";
            p2.approvalStatus = "approved";
            p2.legalTrustScore = "100";
            p2.legalTrustDescription = "Clear Title";

            // 3. Create Towers
            // Project 1 -> 1 Tower
            const t1 = createInitialTower(0, p1.id);
            t1.id = "tower-p1-1";
            t1.name = "Tower A - Alpha";
            t1.heroImage = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800";
            t1.galleryImages = ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"];
            t1.description = "25 Storey architectural marvel.";
            t1.visionStatement = "High-rise living at its best.";
            t1.aboutImageUrl = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800";
            t1.totalFloors = "G + 25";
            t1.totalFloorsNum = 25;
            t1.unitsPerFloor = "4";
            t1.totalLifts = "4";
            t1.liftsConfiguration = "3 Passenger + 1 Service";
            t1.launchDate = "Feb 2024";
            t1.possessionDate = "Dec 2026";
            t1.viewType = "City Skyline";
            t1.towerType = "residential";
            t1.parkingLevels = "2 Basement";
            t1.lobbyDetails = "Double Height Grand Lobby";
            t1.reraNumber = "P111A";
            t1.reraCertificateUrl = "https://example.com/rera.pdf";
            t1.ccNumber = "CC/1";
            t1.ccStatus = "Received";
            t1.typicalFloorPlanImage = "https://via.placeholder.com/800";
            t1.refugeFloorPlanImage = "https://via.placeholder.com/800";

            // Project 2 -> 2 Towers
            const t2 = createInitialTower(0, p2.id);
            t2.id = "tower-p2-1";
            t2.name = "Tower B - Beta";
            t2.heroImage = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800";
            t2.galleryImages = [];
            t2.description = "Premium tower offering luxury configurations.";
            t2.visionStatement = "Refined living spaces.";
            t2.aboutImageUrl = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800";
            t2.totalFloors = "G + 25";
            t2.totalFloorsNum = 25;
            t2.unitsPerFloor = "4";
            t2.totalLifts = "4";
            t2.liftsConfiguration = "3 Passenger + 1 Service";
            t2.launchDate = "Jun 2024";
            t2.possessionDate = "Dec 2028";
            t2.viewType = "Garden View";
            t2.towerType = "residential";
            t2.parkingLevels = "3 Basement";
            t2.lobbyDetails = "Triple Height Atrium";
            t2.reraNumber = "P222B";
            t2.typicalFloorPlanImage = "https://via.placeholder.com/800";

            const t3 = createInitialTower(1, p2.id);
            t3.id = "tower-p2-2";
            t3.name = "Tower C - Gamma";
            t3.heroImage = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800";
            t3.galleryImages = [];
            t3.description = "Sister tower of Beta with identical luxury features.";
            t3.visionStatement = "Refined living spaces.";
            t3.aboutImageUrl = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800";
            t3.totalFloors = "25";
            t3.totalFloorsNum = 25;
            t3.unitsPerFloor = "4";
            t3.totalLifts = "4";
            t3.liftsConfiguration = "3 Passenger + 1 Service";
            t3.launchDate = "Jun 2024";
            t3.possessionDate = "Dec 2028";
            t3.viewType = "Pool View";
            t3.towerType = "residential";
            t3.parkingLevels = "3 Basement";
            t3.lobbyDetails = "Triple Height Atrium";
            t3.reraNumber = "P222C";
            t3.typicalFloorPlanImage = "https://via.placeholder.com/800";

            const allTowers = [t1, t2, t3];

            // 4. Create Generated Units & TowerUnitConfigs
            const towerUnitConfigs = allTowers.map(t => {
                const configBase = initialUnitTemplate(t.id);
                // Assign a 2BHK config
                const cfg2bhk = createDefaultUnitConfig("2BHK", 850, 8500000, 4);
                cfg2bhk.floorPlanImage2D = "https://via.placeholder.com/800.png?text=2BHK";
                cfg2bhk.heroImage = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800";
                cfg2bhk.description = "Spacious 2BHK with premium fittings.";
                cfg2bhk.facing = "East";

                configBase.configurations = [cfg2bhk];
                configBase.baseRatePerSqft = "10000";

                return {
                    towerId: t.id,
                    configurations: configBase.configurations,
                    floorGroups: [],
                    basePrice: "8500000",
                    ratePerSqft: "10000",
                    facingPremiums: configBase.facingPremiums
                };
            });

            const generatedTowers: GeneratedTower[] = allTowers.map(t => ({
                id: t.id,
                projectId: t.projectId,
                name: t.name,
                totalFloors: t.totalFloorsNum,
                unitsPerFloor: parseInt(t.unitsPerFloor),
                totalUnits: t.totalFloorsNum * parseInt(t.unitsPerFloor),
                reraNumber: t.reraNumber,
            }));

            const generatedUnits: GeneratedUnit[] = [];
            allTowers.forEach(t => {
                for (let floor = 1; floor <= t.totalFloorsNum; floor++) {
                    for (let u = 1; u <= parseInt(t.unitsPerFloor); u++) {
                        const basePriceStr = towerUnitConfigs.find(c => c.towerId === t.id)?.configurations[0]?.basePrice || 8500000;
                        generatedUnits.push({
                            id: `unit-${t.id}-${floor}-${u}`,
                            towerId: t.id,
                            unitNumber: `${t.name.split(' ')[0]}-${floor}${String(u).padStart(2, '0')}`,
                            floorNumber: floor,
                            floor,
                            configuration: "2BHK",
                            carpetArea: 850,
                            area: 850,
                            price: basePriceStr as number,
                            facing: "East",
                            status: "available",
                        });
                    }
                }
            });

            // Put it all together in WizardState format as saved property
            const propertyData = {
                id: townshipId,
                flowType: "township",
                status: "published",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: {
                    currentStep: 4,
                    township,
                    projects: [p1, p2],
                    towers: allTowers,
                    towerUnitConfigs,
                    generatedTowers,
                    generatedUnits,
                    unitTemplate: initialUnitTemplate("global")
                }
            };

            const existingProperties = JSON.parse(localStorage.getItem("properties") || "[]");
            existingProperties.push(propertyData);
            localStorage.setItem("properties", JSON.stringify(existingProperties));

            setStatus("Successfully seeded! You can now visit /builder-dashboard to view your property and inventory.");
        } catch (error: any) {
            console.error(error);
            setStatus("Error: " + error.message);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900">
            <h1 className="text-3xl font-bold mb-4">Astronix Data Seeder</h1>
            <p className="mb-8 text-muted-foreground max-w-lg text-center">{status}</p>
            <button
                onClick={handleSeed}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg"
            >
                Generate & Inject Township Data
            </button>
        </div>
    );
}
