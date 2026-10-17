import { z } from "zod"
import {
  connectivityItemSchema,
  amenityItemSchema,
  ecoFeatureSchema,
} from "./township.schema"

export const projectStepSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  phaseName: z.string().optional(),
  tagType: z.string().default("Residential Project"),
  constructionStatus: z.enum([
    "pre-launch",
    "under-construction",
    "ready-to-move",
  ]).default("under-construction"),
  bhkConfigs: z.array(z.string()).default([]),
  totalArea: z.string().optional(),
  areaUnit: z.enum(["acres", "sqft", "hectares"]).default("acres"),
  launchDate: z.string().optional(),
  possessionDate: z.string().optional(),
  hasSingleRera: z.boolean().default(true),
  reraNumber: z.string().optional(),
  reraCertificateUrl: z.string().optional(),
  heroImage: z.string().optional(),
  galleryImages: z.array(z.string()).default([]),
  amenities: z.array(amenityItemSchema).optional(),
  connectivity: z.array(connectivityItemSchema).optional(),
  ecoFeatures: z.array(ecoFeatureSchema).optional(),
})

export type ProjectFormValues = z.infer<typeof projectStepSchema>
