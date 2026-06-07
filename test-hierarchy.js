const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty');

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

mongoose.connection.on('connected', async () => {
  const Property = mongoose.connection.collection('properties');
  const rootProperty = await Property.findOne({ 'details.towers.name': 'Krishna Dham' });

  if (rootProperty) {
    console.log("Root Property ID:", rootProperty._id.toString());
    const towerDocs = rootProperty.details.towers.map(t => ({
      _id: t.id,
      name: t.name,
      details: t,
      isEmbedded: true
    }));

    for (const tower of towerDocs) {
      const towerIdStr = tower._id.toString();
      const derivedFloors = deriveFloorCount(tower.details, rootProperty.details?.towerUnitConfigs || [], towerIdStr);
      console.log(`Tower ${tower.name}:`);
      console.log(`  derivedFloors = ${derivedFloors}`);
      console.log(`  totalFloorsNum = ${tower.details.totalFloorsNum}`);
      console.log(`  totalFloors = ${tower.details.totalFloors}`);
    }
  }
  process.exit(0);
});
