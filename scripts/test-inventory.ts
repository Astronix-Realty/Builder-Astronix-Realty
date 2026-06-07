import dbConnect from '../lib/db';
import Property from '../models/Property';
import Unit from '../models/Unit';

async function buildHierarchy(
  rootProperty: any,
  rootId: string,
  ownershipQuery: Record<string, any>
): Promise<{ projects: any[]; towers: any[]; units: any[] }> {
  // Mocking the function logic directly based on app/api/inventory/[propertyId]/route.ts
  const projects: any[] = [];
  const towers: any[] = [];
  let allUnits: any[] = [];

  const projectDocs = await Property.find({
    parentId: rootProperty._id,
    isDeleted: false,
    status: { $nin: ["draft", "rejected"] },
    type: "project",
    ...ownershipQuery
  }).select("_id name details").lean() as any[];

  console.log("projectDocs length:", projectDocs.length);

  const embeddedProjects = (rootProperty.details?.projects || []).map((p: any) => ({
    _id: p.id,
    name: p.name || "Untitled Project",
    details: { towers: p.towers || [] },
    isEmbedded: true
  }));

  const validProjectDocs = projectDocs.length > 0 ? projectDocs : embeddedProjects;
  console.log("validProjectDocs length:", validProjectDocs.length);

  for (const proj of validProjectDocs) {
    const projIdStr = proj._id.toString();

    let towerDocs = await Property.find({
      parentId: proj._id,
      isDeleted: false,
      status: { $nin: ["draft", "rejected"] },
      type: "tower",
      ...ownershipQuery
    }).select("_id name details").lean() as any[];
    
    console.log(`towerDocs for project ${proj.name}:`, towerDocs.length);

    if (towerDocs.length === 0 && proj.details?.towers) {
      towerDocs = proj.details.towers.map((t: any) => {
        const fullTower = (rootProperty.details?.towers || []).find((rt: any) => rt.id === t.id) || t;
        return {
          _id: t.id,
          name: t.name || "Untitled Tower",
          details: fullTower,
          isEmbedded: true
        };
      });
    }

    console.log(`After embedded fallback, towerDocs length:`, towerDocs.length);

    const embeddedTowerNames = new Set(
      (rootProperty.details?.towers || []).map((t: any) => t.name?.trim().toLowerCase()).filter(Boolean)
    );
    const hasEmbeddedList = embeddedTowerNames.size > 0;
    console.log("hasEmbeddedList:", hasEmbeddedList, embeddedTowerNames);

    const validTowerDocs = towerDocs.filter((tower: any) => {
      const towerName = (tower.name || "").trim();
      const isUntitled = !towerName || towerName.toLowerCase().startsWith("untitled");
      if (hasEmbeddedList) {
        return embeddedTowerNames.has(towerName.toLowerCase());
      }
      return !isUntitled;
    });

    console.log("validTowerDocs length:", validTowerDocs.length);

    for (const tower of validTowerDocs) {
      towers.push({
        _id: tower._id.toString(),
        name: tower.name || "Unnamed Tower",
        projectId: projIdStr,
      });
    }

    projects.push({
      _id: projIdStr,
      name: proj.name || "Unnamed Project",
      towerCount: towerDocs.length,
      unitCount: 0,
    });
  }

  return { projects, towers, units: allUnits };
}

async function testInventory() {
  try {
    await dbConnect();
    const propertyId = "6a244af26a591ac2a1c82414";
    const ownershipQuery = {}; // bypassing for test

    const rootProperty = await Property.findOne({
      _id: propertyId,
      isDeleted: false,
    }).lean() as any;

    if (!rootProperty) {
      console.log("Root property not found!");
      return;
    }

    console.log("Root Property found:", rootProperty.name);
    const { projects, towers } = await buildHierarchy(rootProperty, propertyId, ownershipQuery);
    
    console.log("FINAL TOWERS:", towers);

  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

testInventory();
