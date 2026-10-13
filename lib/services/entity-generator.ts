import {
  type GeneratedTower,
  type GeneratedUnit,
  type TowerData,
  type UnitTemplate,
  type TowerUnitConfig,
} from "@/lib/builder-types"

export function generateTowers({
  towers,
  towerUnitConfigs,
  unitTemplate,
}: {
  towers?: TowerData[]
  towerUnitConfigs?: TowerUnitConfig[]
  unitTemplate?: UnitTemplate
}): GeneratedTower[] {
  return (towers || []).filter(Boolean).map((tower) => {
    const towerConfig = towerUnitConfigs?.find((c) => c.towerId === tower.id)
    const floorGroups = towerConfig?.floorGroups || unitTemplate?.floorGroups || []
    
    let floors = Number.parseInt(String(tower.totalFloors || "").replace(/\D/g, ""))
    let unitsPerFloor = Number.parseInt(String(tower.unitsPerFloor || ""))

    if (!floors && floorGroups.length > 0) {
      const allFloors = floorGroups.flatMap((g: any) => g.floors || [])
      floors = allFloors.length > 0 ? Math.max(...allFloors) : 0
    }
    if (!floors) floors = 20

    if (!unitsPerFloor && floorGroups.length > 0) {
      const allLayouts = floorGroups.map((g: any) => (g.layout || []).length)
      unitsPerFloor = allLayouts.length > 0 ? Math.max(...allLayouts) : 0
    }
    if (!unitsPerFloor) unitsPerFloor = 4

    return {
      id: tower.id,
      projectId: tower.projectId,
      name: tower.name || `Tower ${tower.id?.split("-").pop()?.toUpperCase() || "N/A"}`,
      reraNumber: tower.reraNumber,
      totalFloors: floors,
      unitsPerFloor,
      totalUnits: tower.totalUnits !== undefined ? tower.totalUnits : (floors * unitsPerFloor),
    }
  })
}

export function generateUnits({
  generatedTowers,
  towerUnitConfigs,
  unitTemplate,
}: {
  generatedTowers?: GeneratedTower[]
  towerUnitConfigs?: TowerUnitConfig[]
  unitTemplate?: UnitTemplate
}): GeneratedUnit[] {
  const units: GeneratedUnit[] = []
  const facings = ["north", "south", "east", "west", "north-east", "north-west", "south-east", "south-west"]

  if (!generatedTowers || !Array.isArray(generatedTowers)) return []

  generatedTowers.forEach((tower) => {
    const towerConfig = towerUnitConfigs?.find((c) => c.towerId === tower.id)
    const floorGroups = (towerConfig?.floorGroups && towerConfig.floorGroups.length > 0) 
      ? towerConfig.floorGroups 
      : (unitTemplate?.floorGroups || [])
    const configs = (towerConfig?.configurations && towerConfig.configurations.length > 0)
      ? towerConfig.configurations
      : (unitTemplate?.configurations || [])
    const basePrice = towerConfig?.basePrice
      ? Number.parseFloat(towerConfig.basePrice)
      : Number.parseFloat(unitTemplate?.basePrice || "0")
    const ratePerSqft = towerConfig?.ratePerSqft
      ? Number.parseFloat(towerConfig.ratePerSqft)
      : Number.parseFloat(unitTemplate?.ratePerSqft || "0")
    const facingPremiums = towerConfig?.facingPremiums || unitTemplate?.facingPremiums || {}

    let unitNumber = 0
    const totalFloors = Number(tower.totalFloors) || 0
    
    if (floorGroups && floorGroups.length > 0) {
      const allFloorsSet = new Set<number>()
      floorGroups.forEach((g: any) => (g.floors || []).forEach((f: any) => allFloorsSet.add(f)))
      let allFloors = Array.from(allFloorsSet).sort((a, b) => a - b)

      allFloors.forEach(floor => {
        const group = floorGroups.find((g: any) => (g.floors || []).includes(floor))
        if (!group || !group.layout) return

        const slotsToUse = group.floorOverrides?.[floor.toString()] || group.layout;

        slotsToUse.forEach((slot: any) => {
          const config = configs.find((c: any) => c.id === slot.configId) || configs[0] || { 
            type: slot.unitTypeOverride || "Pending BHK", 
            carpetArea: slot.carpetAreaOverride || 0 
          }
          
          unitNumber++
          const facing = slot.facingOverride || facings[(unitNumber - 1) % facings.length]
          const carpetArea = slot.carpetAreaOverride || config.carpetArea || 0
          const builtUpArea = config?.builtUpArea || Math.round(carpetArea * 1.2)
          const configRate = typeof config?.ratePerSqft === "number" ? config.ratePerSqft : (Number.parseFloat(String(config?.ratePerSqft || "0")) || 0)
          const configBasePrice = typeof config?.basePrice === "number" ? config.basePrice : (Number.parseFloat(String(config?.basePrice || "0")) || 0)
          const effectiveRate = Number.parseFloat(slot.rateOverride || "0") || (ratePerSqft > 0 ? ratePerSqft : configRate)
          const effectiveBase = configBasePrice > 0 ? configBasePrice : basePrice
          let finalPrice = slot.priceOverride || (builtUpArea * effectiveRate || effectiveBase)

          const floorRiseStart = 5
          if (floor >= floorRiseStart) {
            const floorDiff = floor - floorRiseStart
            const risePercent = 0.5 / 100
            finalPrice = finalPrice * (1 + floorDiff * risePercent)
          }

          const premiumValue = facingPremiums[facing as keyof typeof facingPremiums]
          const facingPremium = (Number.parseFloat(String(premiumValue || "0")) || 0) / 100
          finalPrice = finalPrice * (1 + facingPremium)

          units.push({
            id: `unit-${tower.id}-${floor}-${slot.slotNumber}`,
            towerId: tower.id,
            projectId: tower.projectId,
            unitNumber: `${tower.name?.replace("Tower ", "") || "T"}-${floor}${slot.slotNumber.padStart(2, "0")}`,
            floor,
            floorNumber: floor,
            slotNumber: slot.slotNumber,
            slotId: slot.id,
            configId: slot.configId,
            configuration: slot.typeOverride || config?.type || "1BHK",
            carpetArea,
            area: carpetArea,
            price: Math.round(finalPrice),
            basePrice: config?.basePrice || Math.round(finalPrice),
            allInclusivePrice: config?.allInclusivePrice || Math.round(finalPrice),
            ratePerSqft: effectiveRate > 0 ? effectiveRate : (finalPrice > 0 && carpetArea > 0 ? Math.round(finalPrice / carpetArea) : 0),
            facing,
            status: slot.status || "available",
            vastuDetails: slot.vastuDetails || (config as any)?.vastuDetails || null,
            vastuAnalysis: config?.vastuAnalysis || [],
            roomDimensions: slot.roomDimensions || config?.roomDimensions || [],
            flooringType: config?.flooringType || unitTemplate?.defaultFlooringType,
            wallFinish: config?.wallFinish || unitTemplate?.defaultWallFinish,
            ceilingHeight: config?.ceilingHeight || unitTemplate?.defaultCeilingHeight,
            furnishingStatus: config?.furnishingStatus || unitTemplate?.defaultFurnishingStatus,
            viewType: config?.viewType,
            defaultBalconyRailing: unitTemplate?.defaultBalconyRailing,
            defaultWindows: unitTemplate?.defaultWindows,
            defaultMainDoor: unitTemplate?.defaultMainDoor,
            defaultInternalDoors: unitTemplate?.defaultInternalDoors,
            defaultKitchenPlatform: unitTemplate?.defaultKitchenPlatform,
            defaultKitchenFittings: unitTemplate?.defaultKitchenFittings,
            defaultBathroomCpFittings: unitTemplate?.defaultBathroomCpFittings,
            defaultSanitaryware: unitTemplate?.defaultSanitaryware,
            defaultWiringSwitches: unitTemplate?.defaultWiringSwitches,
            defaultPowerBackup: unitTemplate?.defaultPowerBackup,
            defaultSmartHomeProvisions: unitTemplate?.defaultSmartHomeProvisions,
            defaultPlasterPaint: unitTemplate?.defaultPlasterPaint,
            defaultFireSafety: unitTemplate?.defaultFireSafety,
            defaultVastuCompliance: unitTemplate?.defaultVastuCompliance,
          })
        })
      })
    } else if (Array.isArray(configs)) {
      for (let floor = 1; floor <= totalFloors; floor++) {
        configs.forEach((config: any) => {
          const countPerFloor = config?.countPerFloor || 0
          for (let i = 0; i < countPerFloor; i++) {
            unitNumber++
            const facing = facings[(unitNumber - 1) % facings.length]

            const carpetArea = config?.carpetArea || 0
            const builtUpArea = config?.builtUpArea || Math.round(carpetArea * 1.2)
            const configRate = typeof config?.ratePerSqft === "number" ? config.ratePerSqft : (Number.parseFloat(String(config?.ratePerSqft || "0")) || 0)
            const configBasePrice = typeof config?.basePrice === "number" ? config.basePrice : (Number.parseFloat(String(config?.basePrice || "0")) || 0)
            const effectiveRate = ratePerSqft > 0 ? ratePerSqft : configRate
            const effectiveBase = configBasePrice > 0 ? configBasePrice : basePrice
            let finalPrice = builtUpArea * effectiveRate || effectiveBase

            const floorRiseStart = 5
            if (floor >= floorRiseStart) {
              const floorDiff = floor - floorRiseStart
              const risePercent = 0.5 / 100
              finalPrice = finalPrice * (1 + floorDiff * risePercent)
            }

            const premiumValue = facingPremiums[facing as keyof typeof facingPremiums]
            const facingPremium = (Number.parseFloat(String(premiumValue || "0")) || 0) / 100
            finalPrice = finalPrice * (1 + facingPremium)

            units.push({
              id: `unit-${tower.id}-${floor}-${i + 1}`,
              towerId: tower.id,
              projectId: tower.projectId,
              unitNumber: `${tower.name?.replace("Tower ", "") || "T"}-${floor}${(i + 1).toString().padStart(2, "0")}`,
              floor,
              floorNumber: floor,
              configuration: config?.type || "1BHK",
              carpetArea,
              area: carpetArea,
              price: Math.round(finalPrice),
              basePrice: config?.basePrice || Math.round(finalPrice),
              allInclusivePrice: config?.allInclusivePrice || Math.round(finalPrice),
              ratePerSqft: effectiveRate > 0 ? effectiveRate : (finalPrice > 0 && carpetArea > 0 ? Math.round(finalPrice / carpetArea) : 0),
              facing,
              status: "available",
              vastuDetails: (config as any)?.vastuDetails || null,
              vastuAnalysis: config?.vastuAnalysis || [],
              roomDimensions: config?.roomDimensions || [],
              flooringType: config?.flooringType || unitTemplate?.defaultFlooringType,
              wallFinish: config?.wallFinish || unitTemplate?.defaultWallFinish,
              ceilingHeight: config?.ceilingHeight || unitTemplate?.defaultCeilingHeight,
              furnishingStatus: config?.furnishingStatus || unitTemplate?.defaultFurnishingStatus,
              viewType: config?.viewType,
              defaultBalconyRailing: unitTemplate?.defaultBalconyRailing,
              defaultWindows: unitTemplate?.defaultWindows,
              defaultMainDoor: unitTemplate?.defaultMainDoor,
              defaultInternalDoors: unitTemplate?.defaultInternalDoors,
              defaultKitchenPlatform: unitTemplate?.defaultKitchenPlatform,
              defaultKitchenFittings: unitTemplate?.defaultKitchenFittings,
              defaultBathroomCpFittings: unitTemplate?.defaultBathroomCpFittings,
              defaultSanitaryware: unitTemplate?.defaultSanitaryware,
              defaultWiringSwitches: unitTemplate?.defaultWiringSwitches,
              defaultPowerBackup: unitTemplate?.defaultPowerBackup,
              defaultSmartHomeProvisions: unitTemplate?.defaultSmartHomeProvisions,
              defaultPlasterPaint: unitTemplate?.defaultPlasterPaint,
              defaultFireSafety: unitTemplate?.defaultFireSafety,
              defaultVastuCompliance: unitTemplate?.defaultVastuCompliance,
            })
          }
        })
      }
    }
  })

  return units
}
