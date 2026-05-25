import mongoose from "mongoose";
import dbConnect from "./lib/db";
import Property from "./models/Property";
import { aggregateTownshipCounts, aggregateProjectCounts, aggregateTowerCounts } from "./lib/services/hierarchy-sync";

async function run() {
  await dbConnect();
  
  const properties = await Property.find({ parentId: null, isDeleted: false });
  console.log(`Found ${properties.length} root properties to sync.`);
  
  for (const prop of properties) {
    console.log(`Syncing ${prop.name} (${prop.type})...`);
    if (prop.type === "township") {
      await aggregateTownshipCounts(prop._id);
    } else if (prop.type === "project") {
      await aggregateProjectCounts(prop._id);
    } else if (prop.type === "tower") {
      await aggregateTowerCounts(prop._id);
    }
  }
  
  console.log("Done syncing all properties.");
  process.exit(0);
}

run().catch(console.error);
