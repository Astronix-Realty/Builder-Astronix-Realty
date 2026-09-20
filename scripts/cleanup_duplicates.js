require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const properties = await db.collection('properties').find({ status: { $in: ['published', 'active'] } }).toArray();
  const nameMap = {};
  for (const p of properties) {
    // Only care about root nodes
    if (!p.parentId || p.parentId === null) {
        if (!nameMap[p.name]) nameMap[p.name] = [];
        nameMap[p.name].push(p._id);
    }
  }
  for (const name in nameMap) {
    if (nameMap[name].length > 1) {
      console.log('Duplicate Root Property:', name, nameMap[name]);
      const ids = nameMap[name].sort((a, b) => a.toString().localeCompare(b.toString()));
      const toKeep = ids[0];
      const toDelete = ids.slice(1);
      
      console.log('Keeping', toKeep, 'deleting', toDelete.join(', '));
      const childDocs = await db.collection('properties').find({ parentId: { $in: toDelete.map(id => id.toString()) } }).toArray();
      const allToDeleteIds = [...toDelete, ...childDocs.map(d => d._id)];
      const childDocs2 = await db.collection('properties').find({ parentId: { $in: childDocs.map(id => id._id.toString()) } }).toArray();
      allToDeleteIds.push(...childDocs2.map(d => d._id));
      const childDocs3 = await db.collection('properties').find({ parentId: { $in: childDocs2.map(id => id._id.toString()) } }).toArray();
      allToDeleteIds.push(...childDocs3.map(d => d._id));
      
      console.log('Deleting a total of', allToDeleteIds.length, 'properties...');
      const result = await db.collection('properties').deleteMany({ _id: { $in: allToDeleteIds } });
      console.log('Deleted', result.deletedCount, 'documents.');
    }
  }
  
  console.log('Cleanup complete');
  process.exit(0);
});
