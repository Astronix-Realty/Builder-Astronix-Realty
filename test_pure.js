async function test() {
  const r = await fetch('http://localhost:3002/api/discovery?limit=100&section=all');
  const data = await r.json();
  const properties = data.properties;

  function matches(p, filters) {
    if (p.level === 'Unit') return false;
    const hasParent = p.parentId && p.parentId !== '' && p.parentId !== 'null' && p.parentId !== 'undefined';
    if (hasParent) return false;

    if (filters.level && filters.level !== 'All' && p.level !== filters.level) return false;

    if (filters.verifiedOnly && !p.rera?.isVerified && !p.verified && !p.reraNumber) return false;

    if (filters.city && filters.city !== 'All') {
      const filterLoc = filters.city.toLowerCase().trim();
      const pArea = (p.location?.area || '').toLowerCase().trim();
      const pCity = (p.location?.city || '').toLowerCase().trim();
      const pDisplay = (p.location?.displayLocation || '').toLowerCase().trim();
      const matchArea = pArea === filterLoc || pArea.includes(filterLoc);
      const matchCity = pCity === filterLoc || pCity.includes(filterLoc);
      const matchDisplay = pDisplay.includes(filterLoc);
      if (!matchArea && !matchCity && !matchDisplay) return false;
    }

    return true;
  }

  console.log("\n--- TEST: verifiedOnly: false, city: 'Dombivli' ---");
  const d = properties.filter(p => matches(p, { level: 'All', city: 'Dombivli', verifiedOnly: false }));
  d.forEach(p => console.log(`  * ${p.title} (${p.level}) in city: '${p.location?.city}', area: '${p.location?.area}', display: '${p.location?.displayLocation}'`));

  console.log("\n--- TEST: verifiedOnly: false, city: '' (ALL MMR) ---");
  const a = properties.filter(p => matches(p, { level: 'All', city: '', verifiedOnly: false }));
  a.forEach(p => console.log(`  * ${p.title} (${p.level}) in city: '${p.location?.city}', area: '${p.location?.area}', display: '${p.location?.displayLocation}'`));
}

test().catch(console.error);
