const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty');
const schema = new mongoose.Schema({}, { strict: false });
const Property = mongoose.model('Property', schema, 'properties');

async function run() {
  const p = await Property.findOne({ name: { $regex: /Skyline/i } }).lean();
  if (p) {
     const generatedUnits = p.details?.generatedUnits || p.generatedUnits;
     if (generatedUnits) {
         console.log('generatedUnits sample unit numbers:');
         console.log(generatedUnits.slice(0, 10).map(u => ({ unitNumber: u.unitNumber, slug: u.slug, price: u.price, allInclusivePrice: u.allInclusivePrice })));
         
         const unit102 = generatedUnits.find(u => String(u.unitNumber).includes('102') || String(u.slug).includes('102'));
         console.log('Unit 102 details:', unit102 ? { unitNumber: unit102.unitNumber, price: unit102.price, allInclusivePrice: unit102.allInclusivePrice, slug: unit102.slug } : 'Not found');
     }
  }
  mongoose.disconnect();
}
run();
