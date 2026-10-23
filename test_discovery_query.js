const mongoose = require('mongoose');

const BUILDER_MONGODB_URI = "mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty";

async function test() {
  const conn = await mongoose.createConnection(BUILDER_MONGODB_URI).asPromise();
  const PropertyModel = conn.model('Property', new mongoose.Schema({}, { strict: false }), 'properties');

  const rawProps = await PropertyModel.find(
    {
      isDeleted: { $ne: true },
      status: { $in: ['published', 'approved', 'active'] },
    }
  ).lean();

  console.log(`Matching rawProps count: ${rawProps.length}`);
  rawProps.forEach(p => {
    console.log(`\nID: ${p._id}`);
    console.log(`Name: ${p.name || p.title}`);
    console.log(`Level: ${p.level}`);
    console.log(`Type: ${p.type}`);
    console.log(`ParentId: ${p.parentId}`);
    console.log(`City: ${p.location?.city || p.details?.township?.city || p.details?.location?.city}`);
  });

  await conn.close();
}

test().catch(console.error);
