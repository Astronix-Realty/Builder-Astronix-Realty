const mongoose = require('mongoose');
const uri = 'mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty';
async function run() {
  await mongoose.connect(uri);
  const Lead = mongoose.models.Lead || mongoose.model('Lead', new mongoose.Schema({}, { strict: false }), 'leads');
  
  // Find all group pools
  const pools = await Lead.find({ isGroup: true }).lean();
  
  // Group by groupPoolKey
  const byKey = {};
  for (const p of pools) {
    if (!p.groupPoolKey) continue;
    if (!byKey[p.groupPoolKey]) byKey[p.groupPoolKey] = [];
    byKey[p.groupPoolKey].push(p);
  }

  for (const key in byKey) {
    const group = byKey[key];
    if (group.length > 1) {
      console.log('Found duplicate for key:', key, 'count:', group.length);
      // Sort by creation time (oldest first)
      group.sort((a, b) => a._id.getTimestamp() - b._id.getTimestamp());
      
      const primary = group[0];
      const duplicates = group.slice(1);
      
      let allMembers = [...(primary.mergedMembers || [])];
      let allTimelines = [...(primary.timeline || [])];
      
      for (const dup of duplicates) {
        if (dup.mergedMembers) {
           for (const m of dup.mergedMembers) {
             const exists = allMembers.find(em => em.phone === m.phone || (em.userId && em.userId === m.userId));
             if (!exists) {
               allMembers.push(m);
             }
           }
        }
        if (dup.timeline) {
           allTimelines.push(...dup.timeline);
        }
        
        console.log('Deleting duplicate:', dup._id);
        await Lead.deleteOne({ _id: dup._id });
      }
      
      allTimelines.sort((a,b) => new Date(b.date) - new Date(a.date));
      
      await Lead.updateOne({ _id: primary._id }, {
         $set: {
           mergedMembers: allMembers,
           timeline: allTimelines,
           groupSize: allMembers.length
         }
      });
      console.log('Merged into primary:', primary._id, 'New size:', allMembers.length);
    }
  }
  
  console.log('Done');
  process.exit(0);
}
run().catch(console.error);
