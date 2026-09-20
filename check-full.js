const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty').then(async () => {
    const db = mongoose.connection.db;
    const p = await db.collection('properties').findOne({name: 'Townships Green', isDeleted: {$ne: true}});
    console.log(JSON.stringify(p, null, 2));
    setTimeout(() => process.exit(0), 1000);
});
