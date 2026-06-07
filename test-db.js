const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty');

mongoose.connection.on('connected', async () => {
  const Property = mongoose.connection.collection('properties');
  const doc = await Property.findOne({'details.towers': { $exists: true, $ne: [] }});
  if (doc) {
    console.log(JSON.stringify(doc.details.towers[0], null, 2));
    if (doc.details.towerUnitConfigs) {
      console.log('TOWER UNIT CONFIG:');
      console.log(JSON.stringify(doc.details.towerUnitConfigs[0], null, 2));
    }
  } else {
    console.log('No property found with details.towers');
  }
  process.exit(0);
});
