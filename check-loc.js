const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty').then(async () => {
    const db = mongoose.connection.db;
    const properties = await db.collection('properties').find({isDeleted: {$ne: true}}).toArray();
    properties.forEach(p => console.log(p.name, JSON.stringify(p.location)));
    setTimeout(() => process.exit(0), 1000);
});
