const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Property = require('./models/Property').default || require('./models/Property');
  const p = await Property.findOne({ 'details.projects.name': 'Skyline' }).lean();
  console.log(JSON.stringify(p.details.towerUnitConfigs[0], null, 2));
  process.exit(0);
}).catch(console.error);
