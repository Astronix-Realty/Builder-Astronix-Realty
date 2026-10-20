const mongoose = require("mongoose");
const uri = "mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty";

mongoose.connect(uri).then(async () => {
  const Property = mongoose.connection.collection("properties");
  const allProps = await Property.find({ parentId: null }).toArray();
  for (const p of allProps) {
    console.log("=== PROPERTY:", p.name, "ID:", p._id, "role:", p.role, "type:", p.type, "===");
    const keys = Object.keys(p.details || {});
    const devKeys = keys.filter(k => /develop|builder|logo|company|brand|about/i.test(k));
    console.log("Relevant details keys:", devKeys);
    for (const k of devKeys) {
      console.log(`  ${k}:`, p.details[k]);
    }
    // Also check if details.township has builder/developer
    if (p.details?.township) {
      console.log("  township keys:", Object.keys(p.details.township).filter(k => /develop|builder|logo|company|brand|about/i.test(k)));
      console.log("  township.developerName:", p.details.township.developerName);
      console.log("  township.developerLogo:", p.details.township.developerLogo);
    }
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
