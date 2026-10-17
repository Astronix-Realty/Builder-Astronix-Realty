import { z } from "zod"

export const connectivityItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Place name is required"),
  type: z.enum([
    "airport",
    "railway",
    "metro",
    "highway",
    "hospital",
    "school",
    "mall",
    "it-park",
    "bus",
    "custom",
  ]),
  distanceKm: z.string().min(1, "Distance is required"),
  duration: z.string().min(1, "Travel duration is required"),
  icon: z.string().optional(),
  customType: z.string().optional(),
})

export const amenityItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Amenity title is required"),
  description: z.string().optional(),
  category: z.enum([
    "social",
    "recreation",
    "community",
    "green",
    "security",
    "general",
  ]),
  image: z.string().optional(),
})

export const ecoFeatureSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Feature title is required"),
  description: z.string(),
  icon: z.string().optional(),
  image: z.string().optional(),
})

export const reraPhaseSchema = z.object({
  id: z.string(),
  phaseName: z.string().min(1, "Phase name is required"),
  reraNumber: z.string().min(5, "Valid RERA number required"),
  validUntil: z.string().optional(),
})

export const townshipStepSchema = z.object({
  name: z.string().min(2, "Township name must be at least 2 characters"),
  tagType: z.string().default("Integrated Township"),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  district: z.string().optional(),
  subCity: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits").optional().or(z.literal("")),
  nearbyLandmark: z.string().optional(),
  heroImage: z.string().optional(),
  galleryImages: z.array(z.string()).default([]),
  reraNumber: z.string().optional(),
  reraCertificateUrl: z.string().optional(),
  totalArea: z.string().optional(),
  areaUnit: z.enum(["acres", "sqft", "hectares"]).default("acres"),
  connectivity: z.array(connectivityItemSchema).default([]),
  amenities: z.array(amenityItemSchema).default([]),
  ecoFeatures: z.array(ecoFeatureSchema).default([]),
  reraPhases: z.array(reraPhaseSchema).default([]),
})

export type TownshipFormValues = z.infer<typeof townshipStepSchema>
