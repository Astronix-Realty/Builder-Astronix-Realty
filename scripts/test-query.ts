import dbConnect from '../lib/db';
import Property from '../models/Property';

async function testQuery() {
  await dbConnect();
  
  const rootId = "6a244af26a591ac2a1c82414";
  const projectDocs = await Property.find({ parentId: rootId, type: "project" }).lean();
  console.log("Projects found:", projectDocs.length);

  for (const proj of projectDocs) {
    const q = {
      parentId: proj._id,
      isDeleted: false,
      status: { $nin: ["draft", "rejected"] },
      type: "tower"
    };
    const tDocs = await Property.find(q).lean();
    console.log(`Project ${proj._id} (${proj.name}) - Towers found with full query:`, tDocs.length);
  }
  
  process.exit(0);
}
testQuery();
