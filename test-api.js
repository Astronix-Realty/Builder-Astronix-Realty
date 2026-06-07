const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty');

mongoose.connection.on('connected', async () => {
  const Property = mongoose.connection.collection('properties');
  const doc = await Property.findOne({'details.towers': { $exists: true, $ne: [] }});
  if (doc) {
    console.log('Fetching inventory for property:', doc._id.toString());
    const res = await fetch(`http://localhost:3000/api/inventory/${doc._id.toString()}`);
    if (res.ok) {
      const data = await res.json();
      console.log('Towers API Response:');
      console.log(JSON.stringify(data.towers, null, 2));
    } else {
      console.log('API Request failed:', res.status, await res.text());
    }
  } else {
    console.log('No property found');
  }
  process.exit(0);
});
