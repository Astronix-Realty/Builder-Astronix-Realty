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

export interface ConnectivityItem {
  id: string
  title: string            // "International Airport"
  type: "airport" | "railway" | "metro" | "highway" | "hospital" | "school" | "mall" | "it-park" | "bus" | "custom"
  distanceKm: string       // "18 KM"
  duration: string         // "25 Mins"
  icon?: string
  customType?: string
}

export interface FaqItem {
  id: string
  question: string         // "When is possession?"
  answer: string           // "December 2026"
}

export interface TestimonialItem {
  id: string
  name: string             // "Rupesh Prasad"
  role: string             // "Tower A Resident"
  message: string          // "Quality of construction is truly impressive."
  rating: number           // 5  (1–5 stars)
  avatarUrl?: string       // Photo URL
}

export interface GroupBuyingConfig {
  enabled: boolean
  currentCount: number     // "248 buyers interested"
  targetCount: number      // "500 target"
  discountLabel: string    // "Extra 2% off on group booking"
}

export interface AmenityItem {
  id: string
  title: string
  description?: string
  category: "social" | "recreation" | "community" | "green" | "security" | "general"
  image?: string
}

export interface EcoFeature {
  id: string
  title: string
  description: string
  icon?: string
  image?: string
}

export interface VideoGalleryItem {
  id: string
  title: string
  landscapeUrl: string
  shortUrl: string
  thumbnail?: string
  duration?: string         // "3:45"
  type?: "walkthrough" | "aerial" | "interior" | "clubhouse" | "landscape" | "short"
}

export interface ReraPhase {
  id: string
  phaseName: string         // "Phase 1 – Skyline Tower"
  reraNumber: string        // "PRM/KA/RERA/1251/..."
  validUntil?: string       // "2027-12-31"
}

export interface MasterPlanHighlight {
  id: string
  label: string             // "Club House"
  color?: string            // "#2BB673"
}

export interface DevelopmentPhase {
  id: string
  title: string             // "Phase 1 Launch"
  description: string
  date: string              // "March 2024"
  status: "planned" | "in-progress" | "delivered"
}

export interface RoomDimension {
  id: string
  roomName: string          // "Living Room"
  length: string            // "15"
  width: string             // "12"
  unit?: "ft" | "m"
}

export interface VastuItem {
  id: string
  element: string           // "Main Entrance"
  direction: string         // "North-East"
  facing?: string           // "East" (Facing direction of the door, user, or object)
  status?: "excellent" | "good" | "neutral" | "avoid"
}

export interface MoveInItem {
  id: string
  item: string              // "Modular Kitchen"
  included: boolean
}

export interface FloorBreakdown {
  id: string
  floorType: "parking" | "podium" | "refuge" | "residential" | "terrace" | "gym" | "clubhouse"
  fromFloor: string         // "B2" or "1"
  toFloor: string           // "B1" or "20"
  description: string
}

export interface FacingPremium {
  north: string
  south: string
  east: string
  west: string
  "north-east": string
  "north-west": string
  "south-east": string
  "south-west": string
}

export interface ApfDetail {
  id: string
  bankName: string
  apfNumber: string
  certificateUrl: string
}

// ─────────────────────────────────────────
// SECTION 1: COMMON INHERITED DATA
// (Township mein enter karo → sabhi pages inherit karte hain)
// ─────────────────────────────────────────

export interface CommonInheritedData {
  // ── DEVELOPER / BUILDER ──────────────────
  builderName: string           // "Astronix Realty"
  builderLogo: string           // URL
  builderTagline?: string       // "Building Dreams Since 2005"
  builderPhone: string          // "+91 86572 25993"
  builderWhatsapp: string       // "918657225993"
  builderEmail?: string
  builderWebsite?: string
  builderEstYear?: string       // "2005"
  builderProjects?: string      // "25+"
  constructionStatus?: "under-construction" | "ready-to-move"

  // ── LOCATION ─────────────────────────────
  city: string                  // Main City (e.g. Mumbai)
  district: string              // District (e.g. Thane)
  subCity: string               // Sub City / Taluka (e.g. Dombivali)
  state: string                 // "Maharashtra"
  country: string               // "India"
  pincode: string
  village?: string
  nearbyLandmark: string        // "Near Viviana Mall"

  // ── GOOGLE MAPS ──────────────────────────
  googleMapLink: string         // Full Google Maps URL
  googlePlusCode: string        // "+QR5, Thane"
  gmbProfileCode?: string       // Google Business embed code
  coordinates?: {
    lat: string
    lng: string
  }
  gmbReviews?: any[]            // Selected 3 reviews for visitor panel
  allGmbReviews?: any[]         // All fetched reviews from GMB profile


  // ── CONNECTIVITY ─────────────────────────
  // (Airport, Railway, Metro, Hospital, School, Mall, IT Park)
  connectivity: ConnectivityItem[]

  // ── AMENITIES ────────────────────────────
  // (Social, Recreation, Community, Green, Security, General)
  amenities: AmenityItem[]

  // ── ECO / SUSTAINABILITY ─────────────────
  ecoFeatures: EcoFeature[]
  greenCoverPercentage: string  // "40"

  // ── MEDIA ────────────────────────────────
  landscapeVideoUrl: string     // Landscape video tour
  shortVideoUrl: string         // Short/Vertical video tour
  videoGallery: VideoGalleryItem[]

  // ── LEGAL & TRUST ────────────────────────
  reraNumber: string            // Main RERA number
  reraCertificateUrl: string    // URL to RERA certificate
  ocNumber: string              // Occupancy Certificate number
  ocCertificateUrl: string      // URL to OC certificate
  legalTrustScore: string       // "100"
  legalTrustDescription: string // "Clear Marketable Title with OC Received"
  ccNumber: string              // Commencement Certificate number
  ccStatus: string              // "CC Received" / "CC Applied"
  ccCertificateUrl: string      // URL to CC certificate
  apfDetails: ApfDetail[]       // Multi-bank APF approvals
  approvals: string             // "PMRDA / Municipal Corporation Approved"
  approvedBanks: string[]       // ["HDFC", "SBI", "ICICI"]
  groupBuying: GroupBuyingConfig
}

// ─────────────────────────────────────────
// SECTION 2: TOWNSHIP SPECIFIC DATA
// (Only Township page pe unique data)
// ─────────────────────────────────────────

export interface TownshipData extends CommonInheritedData {
  id: string

  // ── HERO ─────────────────────────────────
  name: string                  // "Greenfield Township"
  tagType: string               // "Integrated Township"
  heroImage: string
  heroLocation: string          // "Off Ghodbunder Road, Thane"
  galleryImages: string[]       // Multiple property photos

  // ── PRICING (Hero mein dikhta hai) ───────
  priceRangeMin: number         // 5000000 (₹50L)
  priceRangeMax: number         // 50000000 (₹5Cr)
  priceLabel: string            // "₹50L – ₹5 Cr" (override auto)

  // ── ABOUT ────────────────────────────────
  description: string           // Main description / short tagline
  visionStatement: string       // "A place where nature meets luxury"
  aboutImageUrl: string         // Image in About section (left side)

  // ── KEY STATISTICS ───────────────────────
  totalArea: string             // "100"
  areaUnit: "acres" | "sqft" | "hectares"
  projectCount: number          // 5  (auto-count or manual)
  totalTowers: number           // Auto-calculated
  totalUnits: number            // Auto-calculated
  totalFamilies: number         // 2000 (auto-calculated from towers)
  launchDate: string            // "January 2022"
  possessionDate: string        // "December 2026"


  // ── MASTER PLAN ──────────────────────────
  masterplanImage: string       // Master plan image URL
  masterPlanScale: string       // "1:500"
  masterPlanDescription?: string
  masterPlanHighlights: MasterPlanHighlight[]

  // ── DEVELOPMENT TIMELINE ─────────────────
  developmentTimeline: DevelopmentPhase[]

  // ── LEGAL (TOWNSHIP-WIDE) ────────────────
  reraPhases: ReraPhase[]       // Multiple RERA phases
  brochureLink: string

  // ── FAQ ──────────────────────────────────
  faqs: FaqItem[]               // Expandable Q&A — FAQ section

  // ── TESTIMONIALS ─────────────────────────
  testimonials: TestimonialItem[]  // Resident Stories section

  // ── CALCULATED (auto) ───────────────────
  // totalFamilies auto-calculated from child towers
}

// ─────────────────────────────────────────
// SECTION 3: PROJECT SPECIFIC DATA
// (Only Project page pe unique data)
// ─────────────────────────────────────────

export interface ProjectData {
  id: string
  parentTownshipId?: string     // Which township it belongs to

  // ── HERO ─────────────────────────────────
  name: string                  // "Skyline Residences"
  tagType: string               // "Premium Residential"
  heroImage: string
  heroLocation: string          // "Tower A, B & C"
  galleryImages: string[]

  // ── ABOUT ────────────────────────────────
  description: string           // Main description / short tagline
  visionStatement: string       // Detailed vision/about text
  aboutImageUrl: string         // Image in About section (left side)

  // ── KEY STATISTICS ───────────────────────
  totalArea: string             // "5" (acres for this project)
  areaUnit: "acres" | "sqft" | "hectares"
  launchDate: string            // "January 2024"
  possessionDate: string        // "December 2026"
  constructionStatus: "pre-launch" | "under-construction" | "ready-to-move"
  totalFamilies: number         // 500 (auto from towers)

  // ── BHK CONFIGURATION ────────────────────
  bhkConfigs: string[]          // ["2BHK", "3BHK", "4BHK"]

  // ── PRICING ──────────────────────────────
  priceRangeMin: number         // 5000000 (auto from units)
  priceRangeMax: number         // 15000000 (auto from units)
  priceLabel?: string           // "₹50L – ₹1.5Cr" (custom display)

  // ── LEGAL (PROJECT-SPECIFIC) ─────────────
  reraNumber: string            // Project-level RERA
  reraCertificateUrl: string    // RERA certificate PDF/image link
  ccNumber: string
  ccStatus: string
  ccCertificateUrl: string
  ocNumber: string
  ocCertificateUrl: string
  apfDetails: ApfDetail[]
  approvalStatus: string
  legalTrustScore: string
  legalTrustDescription: string

  // ── MEDIA (Project-specific, overrides township) ──
  landscapeVideoUrl?: string
  shortVideoUrl?: string
  videoGallery?: VideoGalleryItem[]

  // ── ECO (Optional override) ──────────────
  ecoFeatures?: EcoFeature[]
  greenCoverPercentage?: string

  // ── AMENITIES (Optional override) ────────
  amenities?: AmenityItem[]

  // ── MASTER PLAN (Project-specific) ───────
  masterplanImage?: string
  masterPlanDescription?: string
  brochureLink?: string
  masterPlanHighlights?: MasterPlanHighlight[]

  // ── AUTO-CALCULATED ──────────────────────
  totalTowers: number           // count from children
  totalUnits: number            // count from children
}

// ─────────────────────────────────────────
// SECTION 4: TOWER SPECIFIC DATA
// (Only Tower page pe unique data)
// ─────────────────────────────────────────

export interface TowerData {
  id: string
  projectId: string             // Parent project
  parentProjectId?: string

  // ── HERO ─────────────────────────────────
  name: string                  // "Tower A – Skyline"
  heroImage: string
  galleryImages: string[]
  description: string
  visionStatement: string       // Detailed about text
  aboutImageUrl: string         // About section image
  videoGallery?: VideoGalleryItem[]

  // ── STRUCTURE (Key Stats) ────────────────
  totalFloors: string           // "G + 24" or "25"
  totalFloorsNum: number        // 24 (numeric for calculations)
  unitsPerFloor: string         // "4"
  totalLifts: string            // "3"
  liftsConfiguration: string    // "3 High-Speed + 1 Service Lift"
  constructionStatus: "under-construction" | "ready-to-move"
  launchDate: string
  possessionDate: string

  // ── TOWER CHARACTER ──────────────────────
  viewType: string              // "3-Side Open"
  towerType: "residential" | "commercial" | "mixed"
  parkingLevels: string         // "2 Basement Levels"
  lobbyDetails: string          // "Double-height Grand Lobby"

  // ── FLOOR BREAKDOWN ──────────────────────
  floorsBreakdown: FloorBreakdown[]

  // ── TOWER-SPECIFIC AMENITIES ─────────────
  towerAmenities: AmenityItem[]

  // ── FLOOR PLAN IMAGES ────────────────────
  typicalFloorPlanImage: string   // Typical floor layout
  refugeFloorPlanImage?: string   // Refuge floor
  floorPlanDescription?: string
  brochureLink?: string

  // ── LEGAL (TOWER-SPECIFIC) ────────────────
  reraNumber: string
  reraCertificateUrl?: string
  ccNumber?: string
  ccStatus?: string
  ccCertificateUrl?: string
  ocNumber?: string
  ocCertificateUrl?: string

  // ── AUTO-CALCULATED ──────────────────────
  totalUnits: number            // totalFloorsNum × unitsPerFloor
  priceRangeMin: number
  priceRangeMax: number
  priceLabel?: string           // "₹50L – ₹1.5Cr" (custom display)
}

// ─────────────────────────────────────────
// SECTION 5: UNIT CONFIGURATION
// (Unit page pe — each BHK type)
// ─────────────────────────────────────────

export interface UnitConfiguration {
  id: string
  type: "1BHK" | "2BHK" | "3BHK" | "4BHK" | "5BHK" | "studio" | "penthouse" | "duplex" | "shop" | "office" | "showroom"

  // ── AREAS ────────────────────────────────
  carpetArea: number            // 850 sqft
  builtUpArea: number           // 1020 sqft
  superBuiltUpArea: number      // 1200 sqft
  loadingFactor: number         // 40 (%)  auto: (SBUA-carpet)/carpet*100

  // ── PRICING ──────────────────────────────
  basePrice: number             // 7500000
  ratePerSqft: number           // auto: basePrice / carpetArea
  parkingCharges: number        // 500000
  gstPercentage: number         // 5
  gstAmount: number             // GST in ₹
  stampDutyPercentage: number   // 5
  stampDutyAmount: number       // Stamp Duty in ₹
  registrationCharges: number   // 30000
  maintenancePerSqft: number    // 3.5
  maintenanceType: "monthly" | "quarterly" | "annually"
  otherCharges: number          // PLC, EDC etc
  allInclusivePrice: number     // Total package price
  totalTaxes: number            // GST + Stamp Duty amount

  // ── FACING PREMIUM ───────────────────────
  facingPremiums: FacingPremium

  // ── UNIT DETAILS ─────────────────────────
  facing: string                // "East"
  tagline?: string              // "A tagline for the unit"
  description?: string          // "About this variant"
  balconyCount: number          // 2
  bathroomCount: number         // 2
  servantRoom: boolean
  studyRoom: boolean
  poojaRoom: boolean
  dryBalcony: boolean

  // ── SPECIFICATIONS ───────────────────────
  flooringType: string          // "Italian Marble" / "Vitrified Tiles"
  wallFinish: string            // "2-Coat OBD Paint"
  ceilingHeight: string         // "10 feet"
  furnishingStatus: "unfurnished" | "semi-furnished" | "fully-furnished"
  viewType: string              // "Garden View" / "Pool View" / "City View"
  overrideDefaultSpecs?: boolean // If true, use local specs instead of tower defaults

  // ── ROOM DIMENSIONS ──────────────────────
  roomDimensions: RoomDimension[]

  // ── VASTU ────────────────────────────────
  vastuAnalysis: VastuItem[]

  // ── MOVE-IN CHECKLIST ────────────────────
  moveInChecklist: MoveInItem[]

  // ── FLOOR PLAN IMAGES ────────────────────
  floorPlanImage2D: string      // 2D layout image
  floorPlanImage3D?: string     // 3D isometric (optional)
  heroImage?: string            // Unit interior photo
  galleryImages?: string[]      // Multiple unit photos

  // ── RERA ─────────────────────────────────
  reraNumber?: string           // Unit-type RERA

  // ── COUNT PER FLOOR ──────────────────────
  countPerFloor: number         // How many of this type per floor

  // ── OVERRIDE FLAGS ────────────────────────
  isRateOverridden?: boolean    // If true, global base rate changes won't affect this unit

  // ── COMMERCIAL & SPECIAL FIELDS ──────────
  frontage?: string             // "15 Ft"
  depth?: string                // "40 Ft"
  mezzanineArea?: string        // "200 Sqft"
  privateTerraceArea?: number   // 500
}

export interface UnitLayoutSlot {
  id: string
  slotNumber: string            // "01", "02", "03"
  configId: string              // Maps to UnitConfiguration.id
  typeOverride?: string         // "1BHK", "2BHK"
  facingOverride?: string       // "East", "West"
  areaOverride?: number         // 860 instead of 850
  priceOverride?: number        // Override base price
  status?: "available" | "sold" | "reserved" | "blocked"
  viewOverride?: string         // "Pool View", "City View" etc.
  vastuOverride?: string        // "Vastu Compliant", "North Entrance" etc.
  carpetAreaOverride?: number   // Custom carpet area for this specific unit
  unitTypeOverride?: string     // Custom type (e.g. "Studio", "Shop")
  vastuDetails?: {
    mainEntrance?: string;
    poojaRoom?: string;
    kitchen?: string;
    masterBedroom?: string;
    bedroom2?: string;
    bedroom3?: string;
    bedroom4?: string;
    bedroom5?: string;
    bathrooms?: string;
    brahmasthan?: string;
    shapeAndCuts?: string;
    balconyAndWindows?: string;
  }
}

export interface FloorGroup {
  id: string
  name: string                  // "Standard Residential Floors"
  floorRange: string            // "1-10, 12-18"
  floors: number[]               // [1,2,3,4,5,6,7,8,9,10,12,13,14,15,16,17,18]
  layout: UnitLayoutSlot[]
  floorOverrides?: Record<string, UnitLayoutSlot[]> // Map floor number (string) -> custom layout slots
  groupTypes: Array<'basement' | 'ground' | 'podium' | 'typical' | 'refuge' | 'amenity' | 'parking' | 'other'>
  description?: string
  floorRise?: number            // Optional group-specific floor rise (₹/floor)
  floorPlanUrl?: string         // Group-specific floor plan image URL
  // For non-residential types
  parkingCapacity?: string      // "150 Cars"
  carSlots?: number
  bikeSlots?: number
  evSlots?: number
  carParkingPrice?: string
  bikeParkingPrice?: string
  parkingType?: string          // "Open", "Covered", "Mechanical"
  amenities?: string            // "Gym, Pool, Lounge"
  utilityInfo?: string          // "Pump Room, Transformer"
}

// ─────────────────────────────────────────
// SECTION 6: UNIT TEMPLATE (Per Tower)
// (Pricing rules + all configurations for a tower)
// ─────────────────────────────────────────

export interface UnitTemplate {
  towerId: string               // Which tower this belongs to

  // ── PRICING RULES ────────────────────────
  baseRatePerSqft: string       // "5500" (₹/sqft base rate)
  floorRisePerFloor: number     // 50000 (₹ per floor above ground)
  gstPercentage: string         // "5"
  stampDutyPercentage: string   // "5"
  registrationCharges: string   // "30000"
  parkingCharges: string        // "500000"
  maintenancePerSqft: string    // "3.5"
  maintenanceType: "monthly" | "quarterly" | "annually"
  loadingFactor: string         // "40" (%)
  otherChargesAmount?: string
  otherChargesType?: "none" | "rs" | "percentage" | "stamp_duty_percentage"
  otherChargesName?: string
  basePrice?: string
  ratePerSqft?: string

  // ── FACING PREMIUMS ──────────────────────
  facingPremiums: FacingPremium

  // ── UNIT CONFIGURATIONS ──────────────────
  configurations: UnitConfiguration[]

  // ── INVENTORY MAPPING ────────────────────
  floorGroups: FloorGroup[]

  // ── COMMON UNIT SPECS (Defaults) ────────
  defaultFlooringType?: string
  defaultWallFinish?: string
  defaultCeilingHeight?: string
  defaultFurnishingStatus?: "unfurnished" | "semi-furnished" | "fully-furnished"

  // ── KEY UNIT SPECIFICATIONS ─────────────
  defaultBalconyRailing?: string
  defaultWindows?: string
  defaultMainDoor?: string
  defaultInternalDoors?: string

  // ── BATHROOM & KITCHEN ──────────────────
  defaultKitchenPlatform?: string
  defaultKitchenFittings?: string
  defaultBathroomCpFittings?: string
  defaultSanitaryware?: string

  // ── ELECTRICAL & AUTOMATION ─────────────
  defaultWiringSwitches?: string
  defaultPowerBackup?: string
  defaultSmartHomeProvisions?: string

  // ── EXTRA VALUE ADD-ONS ─────────────────
  defaultPlasterPaint?: string
  defaultFireSafety?: string
  defaultVastuCompliance?: string

  // ── LEGAL & STATUS ──────────────────────
  possessionDate?: string       // "Dec 2026"
  constructionStatus?: string   // "Slab 15 Completed"
  reraNumber?: string
  ccStatus?: "received" | "applied" | "not-available"

  approvedBanks: string[]       // Banks for home loans
  floorPlan2DUrl?: string
  floorPlan3DUrl?: string
  galleryImages: string[]
  videoGallery: VideoGalleryItem[]
  heroImage?: string
}

// ─────────────────────────────────────────
// WIZARD STATE (Main State)
// ─────────────────────────────────────────

// WizardState is defined below (near the bottom) with full legacy compat fields.
// See the WizardState export further down in this file.

export const defaultConnectivity: ConnectivityItem[] = [
  { id: "conn-1", title: "International Airport", type: "airport", distanceKm: "18", duration: "45 Mins" },
  { id: "conn-2", title: "Central Railway Station", type: "railway", distanceKm: "5", duration: "15 Mins" },
  { id: "conn-3", title: "Upcoming Metro Station", type: "metro", distanceKm: "1.5", duration: "5 Mins" },
]

export const defaultAmenities: AmenityItem[] = [
  { id: "am-0", title: "Party Lawn", category: "social" },
  { id: "am-1", title: "Swimming Pool", category: "recreation" },
  { id: "am-2", title: "Clubhouse", category: "community" },
  { id: "am-3", title: "24/7 Security", category: "security" },
  { id: "am-4", title: "Landscaped Gardens", category: "green" },
]

export const defaultEcoFeatures: EcoFeature[] = [
  { id: "eco-1", title: "Rainwater Harvesting", description: "Advanced groundwater recharge system", icon: "droplet", image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800" },
  { id: "eco-2", title: "Solar Power", description: "Solar panels for common area lighting", icon: "sun", image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800" },
  { id: "eco-3", title: "Waste Management", description: "In-house organic waste composting", icon: "recycle", image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800" },
]

export const defaultFaqs: FaqItem[] = [
  { id: "faq-1", question: "When is the expected possession?", answer: "The project is expected to be delivered by December 2026." },
  { id: "faq-2", question: "Are there any hidden charges?", answer: "No, all pricing is transparent. Maintenance and parking charges are upfront." },
]

export const defaultApfDetails: ApfDetail[] = [
  { id: "apf-1", bankName: "SBI", apfNumber: "SBI/APF/1029", certificateUrl: "" },
  { id: "apf-2", bankName: "HDFC", apfNumber: "HDFC/APF/2290", certificateUrl: "" },
]

export const defaultMasterPlan: MasterPlanHighlight[] = [
  { id: "mp-1", label: "Grand Entrance", color: "#F5A623" },
  { id: "mp-2", label: "Central Park", color: "#2BB673" },
  { id: "mp-3", label: "Clubhouse", color: "#1A3C8C" },
]

export const defaultTimeline: DevelopmentPhase[] = [
  { id: "dp-1", title: "Project Launch", description: "Initial phase booking started", date: "Jan 2024", status: "delivered" },
  { id: "dp-2", title: "Plinth Level", description: "Foundation work completed", date: "Jun 2024", status: "in-progress" },
  { id: "dp-3", title: "Slab Casting", description: "Top floor slab completion", date: "Dec 2025", status: "planned" },
  { id: "dp-4", title: "Occupancy", description: "Handover and possession", date: "Dec 2026", status: "planned" },
]

export const defaultTestimonials: TestimonialItem[] = [
  { id: "test-1", name: "Ramesh Kumar", role: "Resident", message: "Amazing construction quality and timely delivery.", rating: 5 },
]

export const defaultReraPhases: ReraPhase[] = [
  { id: "rera-1", phaseName: "Phase 1 - Towers A & B", reraNumber: "P521000XXXXX", validUntil: "2027-12-31" },
]

export const defaultTowerAmenities: AmenityItem[] = [
  { id: "ta-0", title: "Sky Lounge", category: "social" },
  { id: "ta-1", title: "Double Height Lobby", category: "general" },
  { id: "ta-2", title: "High-Speed Elevators", category: "general" },
]

export const defaultVideoGallery: VideoGalleryItem[] = []


// ─────────────────────────────────────────
// DEFAULT INITIAL VALUES
// ─────────────────────────────────────────

export const initialCommonData: CommonInheritedData = {
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
  coordinates: { lat: "", lng: "" },

  // Connectivity
  connectivity: defaultConnectivity.map(c => ({ ...c })),

  // Amenities
  amenities: defaultAmenities.map(c => ({ ...c })),

  // Eco
  ecoFeatures: defaultEcoFeatures.map(c => ({ ...c })),
  greenCoverPercentage: "",

  // Media
  landscapeVideoUrl: "",
  shortVideoUrl: "",
  videoGallery: defaultVideoGallery.map(c => ({ ...c })),

  // Legal
  reraNumber: "",
  reraCertificateUrl: "",
  ocNumber: "",
  ocCertificateUrl: "",
  legalTrustScore: "100",
  legalTrustDescription: "Clear Marketable Title with OC Received",
  ccNumber: "",
  ccStatus: "",
  ccCertificateUrl: "",
  apfDetails: defaultApfDetails.map(c => ({ ...c })),
  approvals: "",
  approvedBanks: ["SBI", "HDFC", "ICICI"],
  groupBuying: {
    enabled: false,
    currentCount: 0,
    targetCount: 500,
    discountLabel: "Extra 2% off on group booking",
  },
}

export const initialTownshipData: TownshipData = {
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
  masterPlanHighlights: defaultMasterPlan.map(c => ({ ...c })),

  // Timeline
  developmentTimeline: defaultTimeline.map(c => ({ ...c })),

  // Legal
  reraPhases: defaultReraPhases.map(c => ({ ...c })),
  brochureLink: "",

  // FAQ
  faqs: defaultFaqs.map(c => ({ ...c })),

  // Testimonials
  testimonials: defaultTestimonials.map(c => ({ ...c })),
}

export const createInitialProject = (parentTownshipIdOrIndex: string | number, indexOrTownshipId?: number | string): ProjectData => {
  const parentTownshipId = typeof parentTownshipIdOrIndex === "string" ? parentTownshipIdOrIndex : (indexOrTownshipId as string | undefined)
  const index = typeof parentTownshipIdOrIndex === "number" ? parentTownshipIdOrIndex : (indexOrTownshipId as number) || 0
  return ({
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
    bhkConfigs: ["2BHK", "3BHK"],

    // Pricing (auto)
    priceRangeMin: 0,
    priceRangeMax: 0,

    // Legal
    reraNumber: "",
    reraCertificateUrl: "",
    ccNumber: "",
    ccStatus: "",
    ccCertificateUrl: "",
    ocNumber: "",
    ocCertificateUrl: "",
    apfDetails: defaultApfDetails.map(c => ({ ...c })),
    approvalStatus: "approved",
    legalTrustScore: "",
    legalTrustDescription: "",

    // Media override
    landscapeVideoUrl: "",
    shortVideoUrl: "",
    videoGallery: defaultVideoGallery.map(c => ({ ...c })),

    // Eco override
    ecoFeatures: defaultEcoFeatures.map(c => ({ ...c })),
    greenCoverPercentage: "",

    // Amenities override
    amenities: defaultAmenities.map(c => ({ ...c })),

    // Master Plan
    masterplanImage: "",
    masterPlanDescription: "",
    brochureLink: "",
    masterPlanHighlights: [],

    // Auto
    totalTowers: 0,
    totalUnits: 0,
  })
}

export const createInitialTower = (index: number, projectId: string): TowerData => ({
  id: `tower-${projectId}-${index}`,
  projectId,
  parentProjectId: projectId,

  // Identity
  name: "",
  heroImage: "",
  galleryImages: [],
  videoGallery: [],
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
  ccCertificateUrl: "",
  ocNumber: "",
  ocCertificateUrl: "",

  // Floor Breakdown
  floorsBreakdown: [
    { id: "1", floorType: "parking", fromFloor: "B2", toFloor: "B1", description: "Basement Parking" },
    { id: "2", floorType: "podium", fromFloor: "G", toFloor: "G", description: "Grand Lobby & Amenities" },
    { id: "3", floorType: "residential", fromFloor: "1", toFloor: "20", description: "Residential Floors" },
  ],

  // Tower Amenities
  towerAmenities: defaultTowerAmenities.map(c => ({ ...c })),

  // Floor Plans
  typicalFloorPlanImage: "",
  refugeFloorPlanImage: "",
  floorPlanDescription: "",
  brochureLink: "",

  // Auto
  totalUnits: 0,
  priceRangeMin: 0,
  priceRangeMax: 0,
})

export const getDefaultRoomDimensionsForType = (type: string): RoomDimension[] => {
  let rooms: { name: string; length: string; width: string }[] = [];

  switch (type) {
    case "1BHK":
      rooms = [
        { name: "Living + Dining", length: "14", width: "10" },
        { name: "Master Bedroom", length: "12", width: "10" },
        { name: "Kitchen", length: "8", width: "7" },
        { name: "Master Washroom", length: "7", width: "5" },
        { name: "Balcony 1", length: "10", width: "4" },
      ];
      break;
    case "2BHK":
      rooms = [
        { name: "Living Room", length: "16", width: "12" },
        { name: "Dining Area", length: "10", width: "9" },
        { name: "Master Bedroom", length: "13", width: "11" },
        { name: "Bedroom 2", length: "11", width: "10" },
        { name: "Kitchen", length: "10", width: "8" },
        { name: "Master Washroom", length: "7", width: "5" },
        { name: "Common Washroom", length: "6", width: "5" },
        { name: "Balcony 1", length: "10", width: "4" },
        { name: "Balcony 2", length: "8", width: "4" },
      ];
      break;
    case "3BHK":
      rooms = [
        { name: "Living Room", length: "18", width: "13" },
        { name: "Dining Area", length: "11", width: "10" },
        { name: "Master Bedroom", length: "14", width: "12" },
        { name: "Bedroom 2", length: "12", width: "11" },
        { name: "Bedroom 3", length: "11", width: "10" },
        { name: "Kitchen", length: "11", width: "9" },
        { name: "Master Washroom", length: "8", width: "5" },
        { name: "Washroom 2", length: "7", width: "5" },
        { name: "Common Washroom", length: "7", width: "5" },
        { name: "Balcony 1", length: "12", width: "5" },
        { name: "Balcony 2", length: "10", width: "4" },
      ];
      break;
    case "4BHK":
      rooms = [
        { name: "Living Room", length: "22", width: "15" },
        { name: "Dining Area", length: "13", width: "11" },
        { name: "Master Suite", length: "16", width: "14" },
        { name: "Bedroom 2", length: "13", width: "12" },
        { name: "Bedroom 3", length: "12", width: "11" },
        { name: "Bedroom 4", length: "12", width: "10" },
        { name: "Kitchen + Utility", length: "13", width: "10" },
        { name: "Master Washroom", length: "9", width: "6" },
        { name: "Washroom 2", length: "8", width: "5" },
        { name: "Washroom 3", length: "7", width: "5" },
        { name: "Balcony 1", length: "14", width: "6" },
        { name: "Balcony 2", length: "12", width: "5" },
      ];
      break;
    case "5BHK":
    case "penthouse":
    case "duplex":
      rooms = [
        { name: "Grand Living Room", length: "24", width: "16" },
        { name: "Dining Room", length: "14", width: "12" },
        { name: "Master Suite", length: "18", width: "14" },
        { name: "Bedroom 2", length: "14", width: "12" },
        { name: "Bedroom 3", length: "13", width: "12" },
        { name: "Bedroom 4", length: "12", width: "11" },
        { name: "Bedroom 5", length: "12", width: "10" },
        { name: "Chef's Kitchen", length: "14", width: "10" },
        { name: "Master Washroom", length: "10", width: "7" },
        { name: "Washroom 2", length: "8", width: "6" },
        { name: "Servant Room", length: "9", width: "7" },
        { name: "Private Terrace / Balcony", length: "16", width: "8" },
      ];
      break;
    case "studio":
      rooms = [
        { name: "Living + Bed Area", length: "16", width: "12" },
        { name: "Kitchenette", length: "7", width: "6" },
        { name: "Washroom", length: "7", width: "5" },
        { name: "Balcony", length: "8", width: "4" },
      ];
      break;
    case "shop":
    case "office":
    case "showroom":
      rooms = [
        { name: "Main Hall / Working Area", length: "20", width: "15" },
        { name: "Reception", length: "10", width: "8" },
        { name: "Pantry", length: "8", width: "6" },
        { name: "Washroom", length: "6", width: "5" },
      ];
      break;
    default:
      rooms = [
        { name: "Living + Dining", length: "18", width: "12" },
        { name: "Master Bedroom", length: "13", width: "11" },
        { name: "Bedroom 2", length: "11", width: "10" },
        { name: "Kitchen", length: "10", width: "8" },
        { name: "Balcony 1", length: "10", width: "4" },
      ];
  }

  return rooms.map((r, index) => ({
    id: `room-${Date.now()}-${index}-${Math.random().toString(36).substring(7)}`,
    roomName: r.name,
    length: r.length,
    width: r.width,
    unit: "ft",
  }));
}

export const defaultRoomDimensions: RoomDimension[] = [
  { id: "1", roomName: "Living + Dining", length: "18", width: "12", unit: "ft" },
  { id: "2", roomName: "Master Bedroom", length: "13", width: "11", unit: "ft" },
  { id: "3", roomName: "Bedroom 2", length: "11", width: "10", unit: "ft" },
  { id: "4", roomName: "Kitchen", length: "10", width: "8", unit: "ft" },
  { id: "5", roomName: "Balcony 1", length: "10", width: "4", unit: "ft" },
]

export const defaultVastu: VastuItem[] = [
  { id: "1", element: "Main Entrance", direction: "North-East", status: "excellent" },
  { id: "2", element: "Kitchen", direction: "South-East", status: "excellent" },
  { id: "3", element: "Master Bedroom", direction: "South-West", status: "good" },
  { id: "4", element: "Washrooms", direction: "North-West", status: "neutral" },
  { id: "5", element: "Sunlight", direction: "East Open", status: "excellent" },
]

const defaultMoveIn: MoveInItem[] = [
  { id: "1", item: "Modular Kitchen with Loft", included: true },
  { id: "2", item: "Wardrobes in all Bedrooms", included: true },
  { id: "3", item: "CP Fittings (Jaquar/Kohler)", included: true },
  { id: "4", item: "Electrical Fittings & Switches", included: true },
  { id: "5", item: "Air Conditioners", included: false },
  { id: "6", item: "Geyser / Water Heater", included: false },
]

const defaultFacingPremiums: FacingPremium = {
  north: "0",
  south: "0",
  east: "2",
  west: "0",
  "north-east": "3",
  "north-west": "1",
  "south-east": "2",
  "south-west": "0",
}

export const createDefaultUnitConfig = (type: UnitConfiguration["type"], carpetArea: number, basePrice: number, countPerFloor: number): UnitConfiguration => ({
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
  gstAmount: Math.round(basePrice * 0.05),
  stampDutyPercentage: 7,
  stampDutyAmount: Math.round(basePrice * 0.07),
  registrationCharges: 30000,
  maintenancePerSqft: 3.5,
  maintenanceType: "monthly",
  otherCharges: 0,
  allInclusivePrice: Math.round(basePrice + (basePrice * 0.12) + 30000 + 500000),
  totalTaxes: Math.round((basePrice * 0.12) + 30000 + 500000),
  facingPremiums: { ...defaultFacingPremiums },
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
  roomDimensions: getDefaultRoomDimensionsForType(type),
  vastuAnalysis: defaultVastu.map(v => ({ ...v, id: Math.random().toString(36).substring(7) })),
  moveInChecklist: defaultMoveIn.map(m => ({ ...m, id: Math.random().toString(36).substring(7) })),
  floorPlanImage2D: "",
  floorPlanImage3D: "",
  heroImage: "",
  galleryImages: [],
  reraNumber: "",
  countPerFloor,
})

export const createInitialUnitTemplate = (towerId: string): UnitTemplate => ({
  towerId,
  baseRatePerSqft: "",
  floorRisePerFloor: 0,
  gstPercentage: "",
  stampDutyPercentage: "",
  registrationCharges: "",
  parkingCharges: "",
  maintenancePerSqft: "",
  maintenanceType: "monthly",
  loadingFactor: "",
  facingPremiums: { ...defaultFacingPremiums },
  configurations: [],
  approvedBanks: ["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank"],
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
  defaultVastuCompliance: "",
})

// Legacy alias for backward compatibility
export type { TownshipData as TownshipDataLegacy }
export type ProjectTemplate = Pick<ProjectData, "name" | "tagType" | "constructionStatus" | "bhkConfigs">
export type TowerTemplate = Pick<TowerData, "totalFloors" | "unitsPerFloor" | "liftsConfiguration" | "constructionStatus">

export interface TowerUnitConfig extends Partial<UnitTemplate> {
  towerId: string
  configurations: UnitConfiguration[]
  floorGroups: FloorGroup[]
  basePrice?: string
  ratePerSqft?: string
  facingPremiums?: FacingPremium
}

// Legacy WizardState for backward compatibility with existing code
export interface LegacyWizardState {
  currentStep: number
  township: TownshipData
  projectTemplate?: any
  projects: ProjectData[]
  towers: TowerData[]
  towerTemplate?: any
  unitTemplate?: any
  towerUnitConfigs?: any[]
  generatedProjects: any[]
  generatedTowers: any[]
  generatedUnits: any[]
  unitTemplates?: UnitTemplate[] | { [towerId: string]: UnitTemplate }
}

// ─────────────────────────────────────────
// LEGACY TYPES (for backward compat with app/builder/page.tsx and old forms)
// ─────────────────────────────────────────



export interface GeneratedUnit {
  id: string
  towerId: string
  projectId?: string
  floor: number
  floorNumber: number
  unit?: number
  unitNumber?: string // For compatibility
  type?: string
  configuration: string
  carpetArea: number
  builtUpArea?: number
  superBuiltUpArea?: number
  facing: string
  price: number
  ratePerSqft?: number
  status: "available" | "sold" | "reserved"
  reraNumber?: string
  area?: number
}

export interface GeneratedTower {
  id: string
  projectId: string
  name: string
  totalFloors: number
  totalUnits: number
  configuration?: string
  unitTypes?: string[]
  reraNumber?: string
  unitsPerFloor?: number
}

// WizardState (the full one used in app/builder/page.tsx)
export interface WizardState {
  currentStep: number
  flowType?: "township" | "project" | "tower"
  township: TownshipData
  projects: ProjectData[]
  selectedProjectId?: string | null
  towers: TowerData[]
  selectedTowerId?: string | null
  unitTemplates?: UnitTemplate[] | { [towerId: string]: UnitTemplate }
  generatedProjects: any[]
  generatedTowers: GeneratedTower[]
  generatedUnits: GeneratedUnit[]
  // Legacy fields
  projectTemplate?: any
  towerTemplate?: any
  unitTemplate?: any
  towerUnitConfigs: any[]
}

// ─────────────────────────────────────────
// INITIAL VALUE EXPORTS
// ─────────────────────────────────────────

// initialTownshipData is exported above (line 503)
// see also: initialProjectTemplate, initialTowerTemplate, initialUnitTemplate below

export const initialProjectTemplate: Partial<ProjectData> = {
  name: "",
  tagType: "Premium Residential",
  constructionStatus: "under-construction",
  bhkConfigs: ["2BHK", "3BHK"],
}

export const initialTowerTemplate: Partial<TowerData> = {
  totalFloors: "G + 20",
  unitsPerFloor: "",
  liftsConfiguration: "",
  constructionStatus: "under-construction",
}

export const initialUnitTemplate = (towerId: string): UnitTemplate => createInitialUnitTemplate(towerId)

