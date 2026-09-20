require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false }), 'properties');
    const props = await Property.find({}, { title: 1, name: 1, slug: 1, level: 1, 'groupBuying.enabled': 1, 'details.groupBuying.enabled': 1 }).lean();
    console.log(JSON.stringify(props, null, 2));
    process.exit(0);
}
run().catch(console.error);
