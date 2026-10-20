import mongoose from "mongoose";
import dbConnect from "../lib/db";
import Property from "../models/Property";
import User from "../models/User";

async function main() {
  await dbConnect();
  const users = await User.find({ isDeleted: { $ne: true } }).select("_id name email role builderId status").lean();
  console.log("=== USERS ===");
  console.log(JSON.stringify(users, null, 2));

  const props = await Property.find({ parentId: null, isDeleted: { $ne: true } })
    .select("_id name townshipName status builderId accountId createdBy role flowType type")
    .lean();
  console.log("=== ROOT PROPERTIES ===");
  console.log(JSON.stringify(props, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
