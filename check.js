const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty').then(async () => {
    const db = mongoose.connection.db;
    const properties = await db.collection('properties').find({isDeleted: {$ne: true}}).toArray();
    let puneProps = 0;
    properties.forEach(p => {
        if (p.location && p.location.coordinates && p.location.coordinates.lat === 18.5204) {
            puneProps++;
            console.log('Pune Property:', p.name, p._id.toString());
            // Update to Dombivli
            db.collection('properties').updateOne({_id: p._id}, {$set: {'location.coordinates.lat': 19.2183, 'location.coordinates.lng': 73.0867}});
        }
    });
    console.log('Total Pune props found & updated:', puneProps);
    setTimeout(() => process.exit(0), 1000);
});
