import { UnitConfiguration } from "@/lib/builder-types"

export const VASTU_STATUS = ["excellent", "good", "neutral", "avoid"] as const

export const FACINGS = [
    "North",
    "South",
    "East",
    "West",
    "North-East",
    "North-West",
    "South-East",
    "South-West"
] as const

export const VIEW_TYPES = [
    "Garden View",
    "Pool View",
    "City View",
    "Road Facing",
    "Park View",
    "Mountain View",
    "Sea View",
    "Open View"
] as const

export const BHK_OPTIONS: UnitConfiguration["type"][] = [
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
    "showroom"
]

export const STANDARD_BHK_TYPES = [
    "1RK",
    "1BHK",
    "1.5BHK",
    "2BHK",
    "2.5BHK",
    "3BHK",
    "3.5BHK",
    "4BHK",
    "4.5BHK",
    "5BHK",
    "6BHK",
    "STUDIO",
    "DUPLEX",
    "PENTHOUSE",
    "VILLA",
    "PLOT",
    "SHOPS",
    "OFFICE",
    "SHOWROOM"
]
