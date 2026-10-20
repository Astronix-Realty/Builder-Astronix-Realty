require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false }));
  const Unit = mongoose.model('Unit', new mongoose.Schema({}, { strict: false }));

  const prop = await Property.findOne({ name: 'Green Valley' }).lean();
  console.log('details.projects:', prop.details?.projects?.length);
  console.log('details.towers:', prop.details?.towers?.length);
  console.log('details.units:', prop.details?.units?.length);

  const childProjects = await Property.find({ parentId: prop._id }).lean();
  console.log('childProjects:', childProjects.map(c => ({ id: c._id, name: c.name, type: c.type, status: c.status })));
  
  const childProjectIds = childProjects.map(c => c._id);
  const childTowers = await Property.find({ parentId: { $in: childProjectIds } }).lean();
  console.log('childTowers count under projects:', childTowers.length);
  childTowers.forEach(t => console.log('Tower under proj:', t._id, t.name, t.type, t.parentId));

  const allRelatedTowers = await Property.find({
    $or: [
      { parentId: prop._id },
      { parentId: { $in: childProjectIds } },
      { 'details.townshipId': prop._id.toString() }
    ],
    type: 'tower'
  }).lean();
  console.log('allRelatedTowers with type tower:', allRelatedTowers.length);

  // Check units under towers or projects or township
  const towerIds = childTowers.map(t => t._id);
  const allUnitSearchIds = [prop._id, ...childProjectIds, ...towerIds];
  const allUnits = await Unit.find({
    $or: [
      { propertyId: { $in: allUnitSearchIds } },
      { townshipId: { $in: allUnitSearchIds } },
      { projectId: { $in: allUnitSearchIds } },
      { towerId: { $in: allUnitSearchIds } },
      { parentId: { $in: allUnitSearchIds } }
    ]
  }).lean();
  console.log('Total Units found anywhere for Green Valley:', allUnits.length);

  // Check embedded towers inside childProjects or details
  childProjects.forEach(cp => {
    console.log(`ChildProject ${cp.name} details keys:`, Object.keys(cp.details || {}));
    if (cp.details?.towers) console.log(`  cp.details.towers:`, cp.details.towers.length);
  });

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
