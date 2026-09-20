require('dotenv').config({path: '.env.local'});
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const props = await mongoose.connection.db.collection('properties').find({ isDeleted: { $ne: true } }).toArray();
  const counts = {};
  props.forEach(p => counts[p.name] = (counts[p.name] || 0) + 1);
  console.log(counts);
  process.exit(0);
});
