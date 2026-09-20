require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false }), 'properties');
    const props = await Property.find({
        $or: [
            { 'groupBuying.currentCount': { $gt: 0 } },
            { 'details.groupBuying.currentCount': { $gt: 0 } },
            { 'groupBuying.enabled': true },
            { 'details.groupBuying.enabled': true }
        ]
    }).lean();
    console.log('Found:', props.length);
    props.forEach(p => {
        console.log(`- [${p._id}] "${p.name || p.title}" (${p.slug}):`);
        console.log('   groupBuying:', p.groupBuying);
        console.log('   details.groupBuying:', p.details?.groupBuying);
    });
    process.exit(0);
}
run().catch(console.error);
