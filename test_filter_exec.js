const { fetchAndNormalizeProperties, deduplicateProperties, executePropertyFilters, computeFacetCounts } = require('d:/Astronix Realty/Visitor-Astronix-Realty/src/lib/listing-engine/listing-engine-core.ts');

// We can test via the API directly
async function test() {
  const r = await fetch('http://localhost:3002/api/discovery?limit=100&section=all');
  const data = await r.json();
  const properties = data.properties;

  console.log("Raw properties from discovery:", properties.length);
  properties.forEach(p => {
    console.log(`- ${p.title} | level: ${p.level} | city: ${p.location?.city} | area: ${p.location?.area} | parentId: ${p.parentId}`);
  });

  // Test with city = '' (All MMR)
  const allFilters = {
    level: 'All',
    projectType: 'All',
    propertyType: 'All',
    bedrooms: 'All',
    priceRange: [0, 5000000000],
    carpetArea: 'All',
    city: '',
    verifiedOnly: true,
    possession: 'All',
    builder: 'All',
    groupBuyingOnly: false,
    featuredOnly: false,
    offersOnly: false,
    amenities: [],
  };

  const { matchesPropertyFilters } = require('d:/Astronix Realty/Visitor-Astronix-Realty/src/lib/listing-engine/listing-filter-engine.ts');

  const matchesAll = properties.filter(p => matchesPropertyFilters(p, allFilters));
  console.log("\nMatches with city='':", matchesAll.length);
  matchesAll.forEach(p => console.log(`  * ${p.title} (${p.level}) in ${p.location?.city}`));

  // Test with city = 'Dombivli'
  const dombivliFilters = { ...allFilters, city: 'Dombivli' };
  const matchesDombivli = properties.filter(p => matchesPropertyFilters(p, dombivliFilters));
  console.log("\nMatches with city='Dombivli':", matchesDombivli.length);
  matchesDombivli.forEach(p => console.log(`  * ${p.title} (${p.level}) in ${p.location?.city}`));

  // Test without verifiedOnly
  const unverifiedFilters = { ...allFilters, verifiedOnly: false };
  const matchesUnverified = properties.filter(p => matchesPropertyFilters(p, unverifiedFilters));
  console.log("\nMatches without verifiedOnly:", matchesUnverified.length);
  matchesUnverified.forEach(p => console.log(`  * ${p.title} (${p.level})`));
}

test().catch(console.error);
