import React from "react"
import {
  Droplets, Sun, Recycle, Leaf, BadgeCheck, ShieldCheck,
  Wind, Zap, Building, CheckCircle2, Sprout
} from "lucide-react"
import {
  ECO_CATEGORY_IMAGE_MAP,
  resolveEcoCategoryMapping,
  isCustomEcoImage,
  EcoImageMapping,
  ECO_IMAGE_PROFILES,
  EcoImageProfile,
  validateImageAgainstProfile
} from "@/lib/ecoCategoryResolver"

export {
  ECO_CATEGORY_IMAGE_MAP,
  resolveEcoCategoryMapping,
  isCustomEcoImage,
  ECO_IMAGE_PROFILES,
  validateImageAgainstProfile
}
export type { EcoImageMapping, EcoImageProfile }

export interface EcoCategoryPreset {
  id: string
  label: string
  title: string
  description: string
  iconKey: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  defaultImage: string
}

// Map Lucide icons for preset objects
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  droplets: Droplets,
  sun: Sun,
  recycle: Recycle,
  leaf: Leaf,
  badge: BadgeCheck,
  zap: Zap,
  wind: Wind,
  sprout: Sprout,
  building: Building,
  shield: ShieldCheck,
  check: CheckCircle2
}

/**
 * Generate PRESET_ECO_CATEGORIES dynamically from all 24 strongly-typed registry categories
 */
export const PRESET_ECO_CATEGORIES: Record<string, EcoCategoryPreset> = (
  Object.entries(ECO_CATEGORY_IMAGE_MAP) as [string, EcoImageMapping][]
).reduce((acc, [key, item]) => {
  acc[key] = {
    id: item.id,
    label: item.label,
    title: item.label,
    description: item.defaultDescription,
    iconKey: item.iconKey,
    icon: ICON_MAP[item.iconKey] || Leaf,
    color: item.color,
    defaultImage: item.image
  }
  return acc
}, {} as Record<string, EcoCategoryPreset>)

/**
 * Backwards compatible resolver wrapper
 */
export function resolveCategoryKey(item: { icon?: string; title?: string; description?: string }): string {
  const mapped = resolveEcoCategoryMapping(item.title || item.description, item.icon)
  return mapped.id
}

/**
 * Backwards compatible default image resolver
 */
export function getEcoCategoryDefaultImage(textInput: string): string {
  const mapped = resolveEcoCategoryMapping(textInput)
  return mapped.image
}
