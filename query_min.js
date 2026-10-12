const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://builder-astronix-realty:ankit2001rupeshprasadbuilder@savebuilderproperty.kwkw4r8.mongodb.net/builder_astronix_realty?appName=saveBuilderProperty', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false, collection: 'properties' }));
    const p = await Property.findOne({ name: /Nayantara/i });
    if(p) {
      const pObj = p.toObject();
      const units = pObj.details.generatedUnits || [];
      let minPrice = Infinity;
      let minUnit = null;
      for (const u of units) {
          const builtUp = Number(u.builtUpArea || (u.carpetArea || u.area ? Math.round((u.carpetArea || u.area) * 1.2) : 0));
          const rate = Number(u.ratePerSqft || 0);
          let baseP = 0;
          if (builtUp > 0 && rate > 0) {
              baseP = builtUp * rate;
          } else {
              baseP = Number(u.basePrice || u.price || 0);
          }
          if (baseP > 0 && baseP < minPrice) {
              minPrice = baseP;
              minUnit = u;
          }
      }
      console.log('Min Unit:', minUnit);
      console.log('Min Price:', minPrice);
    }
    process.exit(0);
  });
