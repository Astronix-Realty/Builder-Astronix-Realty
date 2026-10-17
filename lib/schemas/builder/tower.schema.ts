import { z } from "zod"

export const floorBreakdownSchema = z.object({
  id: z.string(),
  floorType: z.enum([
    "parking",
    "podium",
    "refuge",
    "residential",
    "terrace",
    "gym",
    "clubhouse",
  ]),
  fromFloor: z.string(),
  toFloor: z.string(),
  description: z.string().optional(),
})

export const towerStepSchema = z.object({
  name: z.string().min(1, "Tower name is required"),
  towerNumber: z.string().optional(),
  totalFloorsNum: z.number().min(1, "Must have at least 1 floor"),
  totalFloors: z.string().optional(),
  unitsPerFloor: z.string().default("4"),
  totalLifts: z.string().default("2"),
  liftsConfiguration: z.string().optional(),
  constructionStatus: z.enum(["under-construction", "ready-to-move"]).default("under-construction"),
  launchDate: z.string().optional(),
  possessionDate: z.string().optional(),
  viewType: z.string().optional(),
  towerType: z.enum(["residential", "commercial", "mixed"]).default("residential"),
  heroImage: z.string().optional(),
  typicalFloorPlanImage: z.string().optional(),
  refugeFloorPlanImage: z.string().optional(),
  reraNumber: z.string().optional(),
  reraCertificateUrl: z.string().optional(),
  floorsBreakdown: z.array(floorBreakdownSchema).default([]),
})

export type TowerFormValues = z.infer<typeof towerStepSchema>
