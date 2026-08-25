const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});

async function cleanupDuplicates() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Inventory Cleanup...");

  const rootProperties = await mongoose.connection.db.collection('properties').find({
    parentId: null,
    isDeleted: false
  }).toArray();

  console.log(`Analyzing ${rootProperties.length} root properties...`);

  for (const rootProp of rootProperties) {
    if (rootProp.type === "township") {
      const definedProjects = rootProp.details?.projects || [];
      const definedTowers = rootProp.details?.towers || [];

      console.log(`\nProcessing Township: [${rootProp._id}] "${rootProp.name}"`);
      console.log(`Defined projects: ${definedProjects.map(p => `"${p.name}" (${p.id})`).join(', ')}`);

      // Find all child project docs
      const dbProjects = await mongoose.connection.db.collection('properties').find({
        parentId: rootProp._id,
        isDeleted: false,
        type: "project"
      }).sort({ updatedAt: -1 }).toArray();

      console.log(`Found ${dbProjects.length} child project docs in DB.`);

      // For each project name, keep only the latest 1 document, mark others isDeleted = true
      const seenProjectNames = new Set();
      const keptProjectIds = new Set();

      for (const projDoc of dbProjects) {
        const normName = (projDoc.name || "").trim().toLowerCase();
        if (!seenProjectNames.has(normName)) {
          seenProjectNames.add(normName);
          keptProjectIds.add(projDoc._id.toString());
          console.log(`  [KEEP] Project doc [${projDoc._id}] "${projDoc.name}"`);
        } else {
          console.log(`  [PRUNE DUPLICATE] Project doc [${projDoc._id}] "${projDoc.name}"`);
          await mongoose.connection.db.collection('properties').updateOne(
            { _id: projDoc._id },
            { $set: { isDeleted: true, updatedAt: new Date() } }
          );
          // Also prune its child towers
          const childTowers = await mongoose.connection.db.collection('properties').find({
            parentId: projDoc._id
          }).toArray();
          for (const ct of childTowers) {
            console.log(`    [PRUNE CHILD TOWER] Tower doc [${ct._id}] "${ct.name}"`);
            await mongoose.connection.db.collection('properties').updateOne(
              { _id: ct._id },
              { $set: { isDeleted: true, updatedAt: new Date() } }
            );
          }
        }
      }

      // For kept projects, check their child towers and prune duplicate towers per tower name
      for (const projId of keptProjectIds) {
        const dbTowers = await mongoose.connection.db.collection('properties').find({
          parentId: new mongoose.Types.ObjectId(projId),
          isDeleted: false,
          type: "tower"
        }).sort({ updatedAt: -1 }).toArray();

        const seenTowerNames = new Set();
        for (const towDoc of dbTowers) {
          const normName = (towDoc.name || "").trim().toLowerCase();
          if (!seenTowerNames.has(normName)) {
            seenTowerNames.add(normName);
            console.log(`    [KEEP] Tower doc [${towDoc._id}] "${towDoc.name}" under project [${projId}]`);
          } else {
            console.log(`    [PRUNE DUPLICATE] Tower doc [${towDoc._id}] "${towDoc.name}" under project [${projId}]`);
            await mongoose.connection.db.collection('properties').updateOne(
              { _id: towDoc._id },
              { $set: { isDeleted: true, updatedAt: new Date() } }
            );
          }
        }
      }
    }
  }

  console.log("\nCleanup finished successfully!");
  process.exit(0);
}

cleanupDuplicates().catch(e => {
  console.error(e);
  process.exit(1);
});
