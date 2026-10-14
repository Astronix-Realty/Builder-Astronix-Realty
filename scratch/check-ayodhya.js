require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const prop = await mongoose.connection.collection('properties').findOne({
    $or: [{ name: /ayodhya/i }, { slug: /ayodhya/i }]
  });
  if (prop) {
    console.log('Found Property:', prop.name, 'type:', prop.type, 'parentId:', prop.parentId);
    console.log('prop.amenities:', prop.amenities);
    console.log('prop.customAmenities:', prop.customAmenities);
    console.log('details.amenities:', prop.details?.amenities);
    console.log('details.customAmenities:', prop.details?.customAmenities);
    console.log('details.tower?.amenities:', prop.details?.tower?.amenities);
    console.log('details.project?.amenities:', prop.details?.project?.amenities);
    console.log('details.township?.amenities:', prop.details?.township?.amenities);
    
    if (prop.parentId) {
      const parent = await mongoose.connection.collection('properties').findOne({ _id: prop.parentId });
      console.log('Parent:', parent?.name, parent?.type);
      console.log('Parent amenities:', parent?.amenities, parent?.details?.amenities);
      console.log('Parent customAmenities:', parent?.customAmenities, parent?.details?.customAmenities);
    }
  } else {
    console.log('Not found');
  }
  await mongoose.disconnect();
}
check().catch(console.error);
