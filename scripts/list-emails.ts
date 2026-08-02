import dbConnect from '../lib/db';
import User from '../models/User';
import Builder from '../models/Builder';
import Mandate from '../models/Mandate';

async function listRegisteredEmails() {
  try {
    await dbConnect();
    
    const users = await User.find({}, 'email role').lean();
    const builders = await Builder.find({}, 'email').lean();
    const mandates = await Mandate.find({}, 'email').lean();
    
    console.log("=== Registered Users (Main User Collection) ===");
    users.forEach((u: any) => console.log(`- ${u.email} (Role: ${u.role})`));
    
    console.log("\n=== Registered Builders (Builder Collection) ===");
    builders.forEach((b: any) => console.log(`- ${b.email}`));
    
    console.log("\n=== Registered Mandates (Mandate Collection) ===");
    mandates.forEach((m: any) => console.log(`- ${m.email}`));
    
    process.exit(0);
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
}

listRegisteredEmails();
