import { HierarchyPropertyInfo } from "@/components/PropertyHierarchyModal"

export interface Property {
  id: string
  townshipName: string
  name?: string
  projects: number
  towers: number
  units: number
  location: string
  status: "published" | "pending" | "draft" | "rejected" | "archived" | "completed"
  totalValue: number
  createdDate: string
  updatedAt?: string
  rejectionReason?: string | null
  flowType?: string
  thumbnail?: string
  searchBlob?: string
  reraNumber?: string
  groupBuying?: {
    enabled?: boolean
    discountLabel?: string
    targetCount?: number
    startDate?: string
    endDate?: string
  }
}

export interface DashboardProfile {
  companyName: string
  developerName: string
  fullName?: string
  email: string
  phone: string
  address: string
  description: string
  reraNumber: string
  website: string
  logo?: string
  establishedYear?: string
  tagline?: string
  state?: string
  reraCertificate?: string
  operatingCities?: string
  experience?: string
  aboutCompany?: string
  specialization?: string
  panNumber?: string
  aadharNumber?: string
  preferredAreas?: string
  visionHighlights?: { title: string; subtitle: string; icon: string }[]
  awards?: { year: string; title: string; org: string }[]
  overviewImage?: string
  coverImage?: string
}

export type DashboardTab =
  | "bills"
  | "properties"
  | "inventory"
  | "crm"
  | "crm2"
  | "chat"
  | "documents"
  | "offers"
  | "blog"
  | "settings"
  | "team"
  | "feedback"

export type PropertyFilter = "published" | "pending" | "draft" | "rejected"

export type ActiveSettingsTab = "profile" | "preferences"
