const mongoose = require('mongoose');

const BUILDER_MONGODB_URI = "mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty";

async function check() {
  console.log("Connecting to Builder DB...");
  const conn = await mongoose.createConnection(BUILDER_MONGODB_URI).asPromise();
  console.log("Connected!");

  const properties = await conn.collection('properties').find({}).toArray();
  console.log(`Total properties in DB: ${properties.length}`);
  
  properties.forEach((p, idx) => {
    console.log(`\n--- Property #${idx + 1} ---`);
    console.log(`ID: ${p._id}`);
    console.log(`Name: ${p.name || p.title}`);
    console.log(`Status: ${p.status}`);
    console.log(`Level: ${p.level || p.type}`);
    console.log(`FlowType: ${p.flowType || p.details?.type || p.details?.flowType}`);
    console.log(`City: ${p.location?.city || p.details?.township?.city || p.details?.location?.city}`);
    console.log(`IsDeleted: ${p.isDeleted}`);
    console.log(`ParentId: ${p.parentId}`);
  });

  await conn.close();
}

check().catch(console.error);
