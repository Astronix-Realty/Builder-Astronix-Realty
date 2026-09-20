const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty').then(async () => {
    const db = mongoose.connection.db;
    const properties = await db.collection('properties').find({isDeleted: {$ne: true}}).toArray();
    console.log('Total properties:', properties.length);
    const groups = {};
    properties.forEach(p => {
        const key = p.name + '|' + (p.builderId ? p.builderId.toString() : '');
        if(!groups[key]) groups[key] = [];
        groups[key].push(p);
    });
    
    let deletedCount = 0;
    for(const k in groups) {
        if(groups[k].length > 1) {
            console.log('Duplicate found:', k, 'count:', groups[k].length);
            // Sort by createdAt descending, keep the first one, delete the rest
            groups[k].sort((a, b) => b.createdAt - a.createdAt);
            const toDelete = groups[k].slice(1);
            for(const doc of toDelete) {
                console.log('Deleting duplicate:', doc._id.toString());
                // Instead of deleting, just set isDeleted to true to be safe
                await db.collection('properties').updateOne({_id: doc._id}, {$set: {isDeleted: true}});
                deletedCount++;
            }
        }
    }
    console.log('Deleted duplicates count:', deletedCount);
    process.exit(0);
});
