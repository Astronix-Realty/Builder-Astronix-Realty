const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});

async function verifyAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Verification...");

  const rootProperties = await mongoose.connection.db.collection('properties').find({
    parentId: null,
    isDeleted: false,
    status: { $in: ["published", "active", "pending", "draft"] }
  }).toArray();

  for (const rootProp of rootProperties) {
    const rootId = rootProp._id.toString();
    const rootProjects = rootProp?.details?.projects || [];
    const rootTowers = rootProp?.details?.towers || [];
    const rootEmbeddedUnits = rootProp?.details?.generatedUnits || [];

    console.log(`\n========================================================================`);
    console.log(`Property: [${rootProp._id}] "${rootProp.name}" (type: ${rootProp.type}, status: ${rootProp.status}, role: ${rootProp.role})`);
    
    // Check child projects
    const dbProjects = await mongoose.connection.db.collection('properties').find({
      parentId: rootProp._id,
      isDeleted: false,
      status: { $nin: ["draft", "rejected"] },
      type: "project"
    }).toArray();

    console.log(`- Active DB child projects count: ${dbProjects.length}`);
    for (const p of dbProjects) {
      const towers = await mongoose.connection.db.collection('properties').find({
        parentId: p._id,
        isDeleted: false,
        status: { $nin: ["draft", "rejected"] },
        type: "tower"
      }).toArray();
      console.log(`   Project "${p.name}" [${p._id}] -> ${towers.length} towers: ${towers.map(t => `"${t.name}" [${t._id}]`).join(', ')}`);
    }

    console.log(`- Total embedded units: ${rootEmbeddedUnits.length}`);
  }

  process.exit(0);
}

verifyAll().catch(console.error);
