import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in environment variables.");
  process.exit(1);
}

// Minimal Property Schema for Migration
const PropertySchema = new mongoose.Schema({
  status: { type: String },
  isActive: { type: Boolean },
  details: { type: mongoose.Schema.Types.Mixed },
}, { strict: false });

const UnitSchema = new mongoose.Schema({
  status: { type: String },
  isActive: { type: Boolean },
}, { strict: false });

const Property = mongoose.models.Property || mongoose.model('Property', PropertySchema);
const Unit = mongoose.models.Unit || mongoose.model('Unit', UnitSchema);

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    console.log("--- Starting Migration: Property Approval System ---");
    
    // Migrate 'active' properties to 'published' + 'isActive: true'
    console.log("Migrating Properties...");
    const propResult = await Property.updateMany(
      { status: 'active' },
      { 
        $set: { 
          status: 'published',
          isActive: true
        } 
      }
    );
    console.log(`Properties migrated: ${propResult.modifiedCount} updated out of ${propResult.matchedCount} matched.`);

    // Migrate Units if any are 'active' instead of 'available' or need isActive synced
    console.log("Migrating Units...");
    const unitResult = await Unit.updateMany(
      { status: 'active' },
      { 
        $set: { 
          status: 'published',
          isActive: true
        } 
      }
    );
    console.log(`Units (active->published) migrated: ${unitResult.modifiedCount} updated out of ${unitResult.matchedCount} matched.`);

    // Wait, the regular Unit statuses are usually 'available', 'booked', 'sold'. 
    // Do we need to set isActive: true for available units? Yes, if they belong to a published property.
    // Let's set isActive: true for all non-draft units to be safe.
    const unitAvailabilityResult = await Unit.updateMany(
      { status: { $nin: ['draft', 'pending', 'rejected'] } },
      { 
        $set: { isActive: true } 
      }
    );
    console.log(`Units set to active (overall): ${unitAvailabilityResult.modifiedCount} updated.`);

    console.log("--- Migration Completed Successfully ---");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
