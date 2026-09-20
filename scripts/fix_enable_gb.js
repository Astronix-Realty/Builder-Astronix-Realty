require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false }), 'properties');
    
    // Find all properties with currentCount > 0
    const props = await Property.find({
        $or: [
            { 'groupBuying.currentCount': { $gt: 0 } },
            { 'details.groupBuying.currentCount': { $gt: 0 } },
            { slug: 'tower-a-197594-2d078efc' }
        ]
    });

    console.log(`Found ${props.length} properties to enable group buying for:`);
    for (const p of props) {
        const count = p.groupBuying?.currentCount || p.details?.groupBuying?.currentCount || 3;
        const discountLabel = p.groupBuying?.discountLabel || p.details?.groupBuying?.discountLabel || 'Extra 2% off on group booking';
        const targetCount = p.groupBuying?.targetCount || p.details?.groupBuying?.targetCount || 500;

        await Property.updateOne(
            { _id: p._id },
            {
                $set: {
                    'groupBuying.enabled': true,
                    'groupBuying.currentCount': count,
                    'groupBuying.discountLabel': discountLabel,
                    'groupBuying.targetCount': targetCount,
                    'details.groupBuying.enabled': true,
                    'details.groupBuying.currentCount': count,
                    'details.groupBuying.discountLabel': discountLabel,
                    'details.groupBuying.targetCount': targetCount
                }
            }
        );
        console.log(`Updated [${p._id}] "${p.name || p.title}" (${p.slug}) with count: ${count}`);
    }

    process.exit(0);
}

run().catch(console.error);
