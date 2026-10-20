require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false }));
  const prop = await Property.findOne({ name: 'Green Valley' }).lean();
  console.log('details.projects:', JSON.stringify(prop.details?.projects, null, 2));
  console.log('details.towers:', JSON.stringify(prop.details?.towers, null, 2));

  // Also check child projects
  const childProjects = await Property.find({ parentId: prop._id }).lean();
  childProjects.forEach(cp => {
    console.log(`Child Project: ${cp.name} (${cp._id}):`);
    console.log('  details.generatedUnits length:', cp.details?.generatedUnits?.length);
    if (cp.details?.generatedUnits?.length > 0) {
      console.log('  sample unit:', cp.details.generatedUnits[0]);
    }
  });

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
