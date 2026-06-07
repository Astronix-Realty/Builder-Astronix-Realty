const fs = require('fs');
const towerDetails = {
  "totalFloors": "G + 20",
  "totalFloorsNum": 20,
  "unitsPerFloor": "4"
};

function deriveFloorCount(towerDetails, towerUnitConfigs, towerId) {
  // 1. Direct numeric field (most reliable)
  if (towerDetails?.totalFloorsNum && Number(towerDetails.totalFloorsNum) > 0) {
    return Number(towerDetails.totalFloorsNum);
  }

  // 2. Parse totalFloors string — handles "G + 25", "G+30", "25", "B2 + 25" etc.
  if (towerDetails?.totalFloors) {
    const numMatches = String(towerDetails.totalFloors).match(/\d+/g);
    if (numMatches && numMatches.length > 0) {
      const parsed = parseInt(numMatches[numMatches.length - 1]);
      if (parsed > 0) return parsed;
    }
  }
  
  // 3. Derive from floorGroups (most accurate for wizard-configured towers)
  const config = (towerUnitConfigs || []).find((c) =>
    c.towerId === towerId ||
    c.towerId === towerDetails?.id
  );
  const floorGroups = config?.floorGroups || towerDetails?.floorGroups || [];
  if (Array.isArray(floorGroups) && floorGroups.length > 0) {
    const allFloors = floorGroups.flatMap((g) => g.floors || []).filter((f) => f > 0);
    if (allFloors.length > 0) {
      return Math.max(...allFloors);
    }
  }

  // 4. Fallback: totalUnits ÷ unitsPerFloor
  const totalUnits = Number(towerDetails?.totalUnits) || 0;
  const unitsPerFloor = Number(towerDetails?.unitsPerFloor) || parseInt(String(towerDetails?.unitsPerFloor || "")) || 0;
  if (totalUnits > 0 && unitsPerFloor > 0) {
    return Math.round(totalUnits / unitsPerFloor);
  }

  return 0;
}

console.log('Derived floors:', deriveFloorCount(towerDetails, [], 'tower-123'));
