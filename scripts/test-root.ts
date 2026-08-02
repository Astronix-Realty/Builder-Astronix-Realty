import dbConnect from '../lib/db';
import Property from '../models/Property';

async function testRoot() {
  await dbConnect();
  
  const propertyId = "6a244af26a591ac2a1c82414";
  const userId = "6a2449be6a591ac2a1c823e5";
  
  const ownershipQuery = {
    role: { $ne: 'mandate' },
    $or: [
      { builderId: userId },
      { accountId: userId },
      { builderId: userId }
    ]
  };

  const rootProperty = await Property.findOne({
    _id: propertyId,
    ...ownershipQuery,
    isDeleted: false,
  }).lean();
  
  if (rootProperty) {
    console.log("Found root property:", rootProperty.name);
  } else {
    console.log("NOT FOUND! Query:", JSON.stringify({
      _id: propertyId,
      ...ownershipQuery,
      isDeleted: false,
    }, null, 2));
    
    // Check what fields don't match
    const p = await Property.findById(propertyId).lean() as any;
    console.log("Actual doc:", {
      _id: p._id,
      builderId: p.builderId,
      accountId: p.accountId,
      role: p.role,
      isDeleted: p.isDeleted
    });
  }
  process.exit(0);
}
testRoot();
