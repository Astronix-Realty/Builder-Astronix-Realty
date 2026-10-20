require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false }));
  const Unit = mongoose.model('Unit', new mongoose.Schema({}, { strict: false }));

  const root = await Property.findOne({ name: 'Green Valley' }).lean();
  const rootId = root._id.toString();

  const childProjects = await Property.find({ parentId: root._id, isDeleted: { $ne: true } }).lean();
  const childProjectIds = childProjects.map(p => p._id);
  const combinedProjectIds = [root._id, ...childProjectIds];

  const childTowers = await Property.find({ parentId: { $in: combinedProjectIds }, isDeleted: { $ne: true } }).lean();
  console.log('childProjects count:', childProjects.length);
  console.log('childTowers count:', childTowers.length);

  childTowers.forEach(t => console.log('childTower:', t._id, t.name, 'parentId:', t.parentId));

  process.exit(0);
});
