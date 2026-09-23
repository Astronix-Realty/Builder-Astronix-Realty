const mongoose = require('mongoose');
const uri = 'mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty';
async function run() {
  await mongoose.connect(uri);
  const Lead = mongoose.models.Lead || mongoose.model('Lead', new mongoose.Schema({}, { strict: false }), 'leads');
  const leads = await Lead.find({ isGroup: true, name: /Mahakali Residency/i }).lean();
  console.log('Found', leads.length, 'leads');
  leads.forEach(l => {
    console.log('ID:', l._id);
    console.log('Name:', l.name);
    console.log('groupPoolKey:', l.groupPoolKey);
    console.log('poolRootPropertyId:', l.poolRootPropertyId);
    console.log('poolRootPropertyName:', l.poolRootPropertyName);
    console.log('groupSize:', l.groupSize);
    console.log('---');
  });
  process.exit(0);
}
run().catch(console.error);