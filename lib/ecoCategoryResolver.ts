import React from "react"
import {
  Droplets, Sun, Recycle, Leaf, BadgeCheck, ShieldCheck,
  Wind, Zap, Building, CheckCircle2, Sprout, Car, Lightbulb,
  Sparkles, Layers, Layers3, Cpu, Activity, Cpu as CpuIcon
} from "lucide-react"

export type EcoImageMapping = {
  id: string
  label: string
  title?: string
  keywords: string[]
  exactPhrases: string[]
  image: string // Unsplash/CDN high-res URL of exact physical infrastructure
  defaultDescription: string
  iconKey: string
  color: string
}

export type EcoImageProfile = {
  id: string
  category: string
  searchQueries: string[]
  requiredVisuals: string[]
  forbiddenVisuals: string[]
  image: string
}

/**
 * Centralized Search Profiles for Category-to-Infrastructure Photo Resolution
 * Includes positive required visuals and negative forbidden visual filters
 */
export const ECO_IMAGE_PROFILES: Record<string, EcoImageProfile> = {
  stormwater_management: {
    id: "stormwater_management",
    category: "Stormwater Management",
    searchQueries: [
      "stormwater drainage infrastructure bioswale",
      "urban stormwater management drainage system",
      "rain garden stormwater runoff infrastructure",
      "sustainable urban drainage system"
    ],
    requiredVisuals: ["stormwater drainage", "runoff management", "bioswale", "rain garden", "sustainable drainage"],
    forbiddenVisuals: ["mosque", "temple", "building architecture", "faucet", "lake", "waterfall", "swimming pool"],
    image: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80"
  },

  groundwater_recharge_pits: {
    id: "groundwater_recharge_pits",
    category: "Groundwater Recharge Pits",
    searchQueries: [
      "groundwater recharge pit infrastructure",
      "rainwater recharge pit recharge well",
      "groundwater infiltration pit",
      "aquifer recharge civil engineering"
    ],
    requiredVisuals: ["recharge pit", "recharge well", "infiltration structure", "groundwater recharge"],
    forbiddenVisuals: ["faucet", "tap", "drinking water", "bathroom", "water glass", "water tank", "lake"],
    image: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=1200&q=80"
  },

  recycling_resource_reuse: {
    id: "recycling_resource_reuse",
    category: "Recycling & Resource Reuse",
    searchQueries: [
      "recycling material recovery facility",
      "recyclable materials sorting recycling process",
      "resource reuse circular economy materials",
      "recycled construction materials reuse"
    ],
    requiredVisuals: ["recycling process", "material recovery", "recyclable materials", "resource reuse", "circular economy"],
    forbiddenVisuals: ["garbage dump", "landfill", "trash pile", "generic waste bin", "composting", "greenery"],
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80"
  }
}

/**
 * Validates an image URL or query string against forbidden negative visual filters for a profile.
 * Returns false if forbidden visual terms are found.
 */
export function validateImageAgainstProfile(urlOrMetadata: string, categoryId: string): boolean {
  if (!urlOrMetadata || !categoryId) return true
  const profile = ECO_IMAGE_PROFILES[categoryId]
  if (!profile || !profile.forbiddenVisuals) return true

  const lowerInput = urlOrMetadata.toLowerCase()
  for (const forbidden of profile.forbiddenVisuals) {
    if (lowerInput.includes(forbidden.toLowerCase())) {
      return false
    }
  }
  return true
}

/**
 * Strongly-typed Centralized Registry of 24 distinct Eco Features
 * Each category maps strictly to its exact physical infrastructure photography URL
 */
export const ECO_CATEGORY_IMAGE_MAP: Record<string, EcoImageMapping> = {
  // --- WATER & DRAINAGE (5 Categories) ---
  rainwater_harvesting: {
    id: "rainwater_harvesting",
    label: "Rainwater Harvesting System",
    keywords: ["rainwater", "harvesting", "rain barrel", "rain catchment", "percolation"],
    exactPhrases: ["rainwater harvesting", "rain water harvesting", "rain catchment"],
    image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800",
    defaultDescription: "Scientific rooftop rainwater harvesting & underground collection tanks.",
    iconKey: "droplets",
    color: "text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800"
  },
  groundwater_recharge_pits: {
    id: "groundwater_recharge_pits",
    label: "Groundwater Recharge Pits",
    keywords: ["groundwater recharge", "recharge pit", "recharge well", "aquifer recharge", "infiltration pit", "percolation pit", "aquifer", "borewell"],
    exactPhrases: ["groundwater recharge pits", "groundwater recharge pit", "groundwater recharge", "recharge pit"],
    image: ECO_IMAGE_PROFILES.groundwater_recharge_pits.image,
    defaultDescription: "Aquifer recharge pits to replenish underground water tables naturally.",
    iconKey: "droplets",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
  },
  groundwater_recharge: {
    id: "groundwater_recharge_pits",
    label: "Groundwater Recharge Pits",
    keywords: ["groundwater recharge", "recharge pit", "recharge well", "aquifer recharge", "infiltration pit"],
    exactPhrases: ["groundwater recharge pits", "groundwater recharge pit", "groundwater recharge", "recharge pit"],
    image: ECO_IMAGE_PROFILES.groundwater_recharge_pits.image,
    defaultDescription: "Aquifer recharge pits to replenish underground water tables naturally.",
    iconKey: "droplets",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
  },
  greywater_recycling: {
    id: "greywater_recycling",
    label: "Greywater Recycling System",
    keywords: ["greywater", "grey water", "recycling", "treatment plant", "stp"],
    exactPhrases: ["greywater recycling", "grey water recycling", "water treatment"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    defaultDescription: "Dual-plumbing greywater recycling plant for flushing and landscape irrigation.",
    iconKey: "droplets",
    color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800"
  },
  sewage_treatment: {
    id: "sewage_treatment",
    label: "Sewage Treatment Plant (STP)",
    keywords: ["sewage", "treatment", "stp", "effluent", "wastewater"],
    exactPhrases: ["sewage treatment", "sewage treatment plant", "stp plant", "wastewater treatment"],
    image: "https://images.unsplash.com/photo-1617155093730-a8bf47be792d?w=800",
    defaultDescription: "In-house modern Sewage Treatment Plant (STP) with zero liquid discharge (ZLD).",
    iconKey: "droplets",
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800"
  },
  stormwater_management: {
    id: "stormwater_management",
    label: "Stormwater Management",
    keywords: ["stormwater", "bioswale", "rain garden", "sustainable drainage", "urban drainage", "storm water", "runoff"],
    exactPhrases: ["stormwater management", "storm water management"],
    image: ECO_IMAGE_PROFILES.stormwater_management.image,
    defaultDescription: "Permeable pavements and bio-swale channels for flood-free stormwater drainage.",
    iconKey: "droplets",
    color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800"
  },

  // --- WASTE & RECYCLING (3 Categories) ---
  waste_management_composting: {
    id: "waste_management_composting",
    label: "Organic Waste Composting",
    keywords: ["composting", "compost", "organic waste", "owc", "bio waste"],
    exactPhrases: ["organic waste composting", "waste management composting", "organic waste convertor"],
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800",
    defaultDescription: "In-house Organic Waste Convertor (OWC) transforming kitchen waste into rich fertilizer.",
    iconKey: "recycle",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
  },
  waste_segregation: {
    id: "waste_segregation",
    label: "Waste Segregation at Source",
    keywords: ["segregation", "garbage", "trash bins", "sorting", "dry waste", "wet waste"],
    exactPhrases: ["waste segregation", "source segregation", "color coded bins"],
    image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800",
    defaultDescription: "Color-coded 3-bin waste segregation system at source for dry, wet, and e-waste.",
    iconKey: "recycle",
    color: "text-green-600 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800"
  },
  recycling_resource_reuse: {
    id: "recycling_resource_reuse",
    label: "Recycling & Resource Reuse",
    keywords: ["recycling", "resource reuse", "material reuse", "recovered materials", "material recovery", "circular economy", "upcycling"],
    exactPhrases: ["recycling & resource reuse", "recycling and resource reuse", "resource reuse", "recycling and reuse"],
    image: ECO_IMAGE_PROFILES.recycling_resource_reuse.image,
    defaultDescription: "Dedicated material recovery facility for 100% recycling of plastic, paper & metal.",
    iconKey: "recycle",
    color: "text-lime-600 bg-lime-50 dark:bg-lime-950/40 border-lime-200 dark:border-lime-800"
  },
  recycling_reuse: {
    id: "recycling_resource_reuse",
    label: "Recycling & Resource Reuse",
    keywords: ["recycling", "resource reuse", "material reuse", "recovered materials", "material recovery"],
    exactPhrases: ["recycling & resource reuse", "recycling and resource reuse", "resource reuse", "recycling and reuse"],
    image: ECO_IMAGE_PROFILES.recycling_resource_reuse.image,
    defaultDescription: "Dedicated material recovery facility for 100% recycling of plastic, paper & metal.",
    iconKey: "recycle",
    color: "text-lime-600 bg-lime-50 dark:bg-lime-950/40 border-lime-200 dark:border-lime-800"
  },

  // --- ENERGY & MOBILITY (2 Categories) ---
  solar_energy: {
    id: "solar_energy",
    label: "Solar Energy Generation",
    keywords: ["solar", "solar panel", "photovoltaic", "solar roof", "renewable energy"],
    exactPhrases: ["solar energy", "solar panels", "solar power generation"],
    image: "https://images.unsplash.com/photo-1592833159155-c62df1b65634?w=800",
    defaultDescription: "Rooftop solar photovoltaic panel grid supplying 100% clean power for common areas.",
    iconKey: "sun",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
  },
  ev_charging_infrastructure: {
    id: "ev_charging_infrastructure",
    label: "EV Charging Infrastructure",
    keywords: ["ev charging station", "electric vehicle charging", "charging station", "ev charger", "ev charging"],
    exactPhrases: ["ev charging infrastructure", "ev charging", "electric vehicle charging infrastructure"],
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800",
    defaultDescription: "High-speed electric vehicle (EV) charging stations integrated into resident parking bays.",
    iconKey: "zap",
    color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800"
  },
  ev_charging: {
    id: "ev_charging_infrastructure",
    label: "EV Charging Infrastructure",
    keywords: ["ev charging station", "electric vehicle charging", "charging station", "ev charger", "ev charging"],
    exactPhrases: ["ev charging infrastructure", "ev charging", "electric vehicle charging infrastructure"],
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800",
    defaultDescription: "High-speed electric vehicle (EV) charging stations integrated into resident parking bays.",
    iconKey: "zap",
    color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800"
  },

  // --- GREEN COVER & ARCHITECTURE (6 Categories) ---
  green_roof: {
    id: "green_roof",
    label: "Green Roof Infrastructure",
    keywords: ["green roof", "roof garden", "rooftop garden", "eco roof", "roof vegetation"],
    exactPhrases: ["green roof", "rooftop garden", "roof garden"],
    image: "https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=800",
    defaultDescription: "Insulated intensive green roof gardens reducing heat island effect and urban thermal load.",
    iconKey: "leaf",
    color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
  },
  vertical_garden: {
    id: "vertical_garden",
    label: "Vertical Garden & Living Walls",
    title: "Vertical Garden & Living Walls",
    keywords: ["vertical garden", "green wall", "living wall", "vertical greenery", "facade garden"],
    exactPhrases: ["vertical garden", "living wall", "green wall", "vertical greenery"],
    image: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800",
    defaultDescription: "Hydroponic vertical green walls purifying ambient air and boosting aesthetic biophilia.",
    iconKey: "leaf",
    color: "text-green-700 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800"
  },
  green_landscaping: {
    id: "green_landscaping",
    label: "Green Landscaping & Parks",
    keywords: ["landscaping", "lawn", "parks", "greenery", "gardens", "open space"],
    exactPhrases: ["green landscaping", "landscaped garden", "central park"],
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800",
    defaultDescription: "Extensive lush native landscaping with 60%+ open green spaces and oxygen parks.",
    iconKey: "leaf",
    color: "text-lime-700 bg-lime-50 dark:bg-lime-950/40 border-lime-200 dark:border-lime-800"
  },
  biodiversity: {
    id: "biodiversity",
    label: "Biodiversity & Native Flora",
    keywords: ["biodiversity", "native plants", "butterfly garden", "flora", "fauna", "habitat"],
    exactPhrases: ["biodiversity park", "native plantation", "habitat conservation"],
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800",
    defaultDescription: "Preserved natural ecological habitats promoting local biodiversity, birds & pollinators.",
    iconKey: "sprout",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
  },
  urban_farming: {
    id: "urban_farming",
    label: "Urban & Community Farming",
    keywords: ["urban farming", "community farm", "organic garden", "hydroponics", "kitchen garden"],
    exactPhrases: ["urban farming", "community farming", "organic gardening"],
    image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800",
    defaultDescription: "Dedicated community organic farming beds and hydroponic zones for residents.",
    iconKey: "sprout",
    color: "text-green-600 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800"
  },
  tree_plantation: {
    id: "tree_plantation",
    label: "Miyawaki Tree Plantation",
    keywords: ["tree plantation", "miyawaki", "trees", "afforestation", "dense forest"],
    exactPhrases: ["tree plantation", "miyawaki forest", "dense plantation"],
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
    defaultDescription: "Dense Miyawaki urban forest plantation with 1000+ native shade and fruit trees.",
    iconKey: "sprout",
    color: "text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
  },

  // --- INDOOR ENVIRONMENT & CLIMATE (3 Categories) ---
  natural_ventilation: {
    id: "natural_ventilation",
    label: "Natural Cross Ventilation",
    keywords: ["ventilation", "cross ventilation", "fresh air", "breeze", "wind scoops"],
    exactPhrases: ["natural ventilation", "cross ventilation", "fresh air circulation"],
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
    defaultDescription: "Architecturally optimized building orientation ensuring 100% natural cross-ventilation.",
    iconKey: "wind",
    color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800"
  },
  daylight_optimization: {
    id: "daylight_optimization",
    label: "Daylight Optimization",
    keywords: ["daylight", "sunlight", "skylight", "glazing", "natural light", "fenestration"],
    exactPhrases: ["daylight optimization", "natural daylighting", "sunlit spaces"],
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800",
    defaultDescription: "High-performance glass facades & atrium skylights delivering 80%+ natural daylight.",
    iconKey: "sun",
    color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
  },
  passive_cooling: {
    id: "passive_cooling",
    label: "Passive Cooling Architecture",
    keywords: ["passive cooling", "thermal mass", "shading", "louvers", "insulation", "cool roof"],
    exactPhrases: ["passive cooling", "thermal insulation", "shading louvers"],
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    defaultDescription: "Thermal insulation, terracotta louvers and cool roofs reducing indoor temperature by 4°C.",
    iconKey: "wind",
    color: "text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800"
  },

  // --- EFFICIENCY & SMART MANAGEMENT (3 Categories) ---
  energy_efficiency: {
    id: "energy_efficiency",
    label: "Energy Efficient Lighting & HVAC",
    keywords: ["energy efficiency", "led", "inverter hvac", "star rated", "bldc fans"],
    exactPhrases: ["energy efficiency", "led lighting", "energy efficient appliances"],
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    defaultDescription: "100% LED fixtures, sensor-based common lighting and 5-star inverter HVAC systems.",
    iconKey: "zap",
    color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800"
  },
  smart_energy_management: {
    id: "smart_energy_management",
    label: "Smart Energy Grid & Metering",
    keywords: ["smart energy", "smart grid", "smart meter", "energy dashboard", "submetering"],
    exactPhrases: ["smart energy management", "smart metering", "energy monitoring"],
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800",
    defaultDescription: "IoT smart sub-meters and real-time digital dashboard to track & optimize energy consumption.",
    iconKey: "building",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
  },
  smart_water_management: {
    id: "smart_water_management",
    label: "Smart Water Metering & Leak Detection",
    keywords: ["smart water", "water meter", "leak detection", "ultrasonic meter", "water telemetry"],
    exactPhrases: ["smart water management", "water leak detection", "ultrasonic water metering"],
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
    defaultDescription: "Ultrasonic smart water meters with automated mobile app leak alerts for zero water wastage.",
    iconKey: "droplets",
    color: "text-sky-700 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800"
  },

  // --- MATERIALS & CERTIFICATION (2 Categories) ---
  sustainable_materials: {
    id: "sustainable_materials",
    label: "Sustainable & Eco Materials",
    keywords: ["sustainable materials", "aac blocks", "low voc", "flyash", "bamboo", "recycled steel"],
    exactPhrases: ["sustainable materials", "eco friendly materials", "low voc paints"],
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800",
    defaultDescription: "Constructed using fly-ash AAC blocks, low-VOC eco paints, and responsibly sourced bamboo.",
    iconKey: "check",
    color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
  },
  green_building: {
    id: "green_building",
    label: "IGBC / LEED Green Building Certified",
    keywords: ["igbc", "leed", "green building", "certified", "gold rating", "platinum rating"],
    exactPhrases: ["green building", "igbc certified", "leed certified", "green architecture"],
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
    defaultDescription: "Certified IGBC / LEED Green Building rated for high environmental performance & efficiency.",
    iconKey: "badge",
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800"
  }
}

/**
 * Set of all pre-validated default preset category image URLs.
 */
export const PRESET_ECO_IMAGE_URLS = new Set<string>(
  Object.values(ECO_CATEGORY_IMAGE_MAP).map(item => item.image)
)

/**
 * Checks whether an image URL is a user-customized photo or a category default preset.
 * Returns true IF the imageUrl is non-empty AND is NOT one of the 24 pre-validated category preset images.
 */
export function isCustomEcoImage(imageUrl?: string | null): boolean {
  if (!imageUrl || !imageUrl.trim()) return false
  const trimmed = imageUrl.trim()
  if (PRESET_ECO_IMAGE_URLS.has(trimmed)) return false
  return !Object.values(ECO_CATEGORY_IMAGE_MAP).some(item => item.image === trimmed)
}

/**
 * Priority Resolution Engine for Sustainability Categories
 * Matches input against the 24 categories in strict priority order:
 * 1. Exact Category ID match
 * 2. Exact Category Label match
 * 3. Exact Title match
 * 4. Exact multi-word phrase match
 * 5. Specific semantic phrase/keyword (ranked by length/specificity score)
 * 6. Safe fallback image
 */
export function resolveEcoCategoryMapping(textInput?: string, iconInput?: string): EcoImageMapping {
  const icon = (iconInput || "").trim()
  const text = (textInput || "").toLowerCase().trim()

  // 1. Direct Category ID match (icon or text matches exact ID)
  if (icon && ECO_CATEGORY_IMAGE_MAP[icon]) {
    return ECO_CATEGORY_IMAGE_MAP[icon]
  }
  if (text && ECO_CATEGORY_IMAGE_MAP[text]) {
    return ECO_CATEGORY_IMAGE_MAP[text]
  }

  // 2. Exact Category Label / Title match
  for (const item of Object.values(ECO_CATEGORY_IMAGE_MAP)) {
    if (text === item.label.toLowerCase().trim() || (item.title && text === item.title.toLowerCase().trim())) {
      return item
    }
  }

  // 3. Exact Multi-Word Phrase Match
  for (const item of Object.values(ECO_CATEGORY_IMAGE_MAP)) {
    for (const phrase of item.exactPhrases) {
      if (text.includes(phrase.toLowerCase())) {
        return item
      }
    }
  }

  // 4. Keyword Specificity Ranking (longer/more specific keyword matches win)
  let bestMatch: EcoImageMapping | null = null
  let maxScore = 0

  for (const item of Object.values(ECO_CATEGORY_IMAGE_MAP)) {
    for (const kw of item.keywords) {
      const kwLower = kw.toLowerCase()
      if (text.includes(kwLower) || icon.toLowerCase().includes(kwLower)) {
        // Specificity score based on keyword length
        const score = kwLower.length
        if (score > maxScore) {
          maxScore = score
          bestMatch = item
        }
      }
    }
  }

  if (bestMatch) {
    return bestMatch
  }

  // 5. Safe Fallback
  return ECO_CATEGORY_IMAGE_MAP.rainwater_harvesting
}
