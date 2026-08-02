import dbConnect from '../lib/db';
import Property from '../models/Property';

async function debugTowers() {
  await dbConnect();
  const rootProperty = await Property.findById("6a244af26a591ac2a1c82414").lean() as any;
  console.log("Root Property type:", rootProperty.type, "status:", rootProperty.status);
  
  const projectDocs = await Property.find({ parentId: rootProperty._id }).lean();
  console.log(`Found ${projectDocs.length} child project docs in DB.`);
  projectDocs.forEach(p => console.log(`Project: ${p.name}, Status: ${p.status}`));

  const towerDocs = await Property.find({ parentId: { $in: projectDocs.map(p => p._id) } }).lean();
  console.log(`Found ${towerDocs.length} child tower docs in DB.`);
  towerDocs.forEach(t => console.log(`Tower: ${t.name}, Status: ${t.status}`));

  console.log("\nEmbedded data in rootProperty:");
  console.log("details.projects:", rootProperty.details?.projects?.map((p: any) => p.name));
  console.log("details.towers:", rootProperty.details?.towers?.map((t: any) => t.name));

  process.exit(0);
}
debugTowers();
