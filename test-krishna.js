const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty');

mongoose.connection.on('connected', async () => {
  const Property = mongoose.connection.collection('properties');
  // Find a property that has "Krishna Dham" in its details.towers or as a standalone tower
  const doc = await Property.findOne({'details.towers.name': 'Krishna Dham'});
  if (doc) {
    const tower = doc.details.towers.find(t => t.name === 'Krishna Dham');
    console.log("Found embedded tower in property:", doc._id);
    console.log(JSON.stringify(tower, null, 2));
  } else {
    const standalone = await Property.findOne({name: 'Krishna Dham'});
    if (standalone) {
       console.log("Found standalone tower:");
       console.log(JSON.stringify(standalone.details, null, 2));
    } else {
       console.log("Krishna Dham not found");
    }
  }
  process.exit(0);
});
