const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false, collection: 'properties' }));
    const p = await Property.findOne({ name: /Nayantara/i });
    if(p) {
      const pObj = p.toObject();
      const units = pObj.details.generatedUnits || [];
      console.log('generatedUnits count:', units.length);
      if(units.length > 0) {
         console.log('First unit builtUpArea:', units[0].builtUpArea);
         console.log('First unit carpetArea:', units[0].carpetArea);
         console.log('First unit ratePerSqft:', units[0].ratePerSqft);
         console.log('First unit allInclusivePrice:', units[0].allInclusivePrice);
         console.log('First unit basePrice:', units[0].basePrice);
      }
    } else {
      console.log('Property not found');
    }
    process.exit(0);
  });
