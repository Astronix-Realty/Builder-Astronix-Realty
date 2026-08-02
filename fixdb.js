const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const result = await mongoose.connection.db.collection('leads').updateOne(
        { name: /Lodha Bellissimo Investors Group/ },
        { $set: { isGroup: true, groupSize: 4 } }
    );
    console.log('Update result:', result);
    process.exit(0);
}).catch(console.error);
