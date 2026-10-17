import { z } from "zod"

export const unitConfigSchema = z.object({
  id: z.string(),
  type: z.enum([
    "1BHK",
    "2BHK",
    "3BHK",
    "4BHK",
    "5BHK",
    "studio",
    "penthouse",
    "duplex",
    "shop",
    "office",
    "showroom",
  ]),
  carpetArea: z.number().positive("Carpet area must be greater than 0"),
  builtUpArea: z.number().optional(),
  superBuiltUpArea: z.number().optional(),
  loadingFactor: z.number().optional(),
  basePrice: z.number().min(0, "Base price cannot be negative"),
  ratePerSqft: z.number().optional(),
  parkingCharges: z.number().default(0),
  gstPercentage: z.number().default(5),
  stampDutyPercentage: z.number().default(5),
  registrationCharges: z.number().default(30000),
  facingDirection: z.string().optional(),
  floorPlan2DUrl: z.string().optional(),
})

export const unitStepSchema = z.object({
  configurations: z.array(unitConfigSchema).min(1, "At least one unit configuration is required"),
})

export type UnitConfigFormValues = z.infer<typeof unitConfigSchema>
export type UnitStepFormValues = z.infer<typeof unitStepSchema>
