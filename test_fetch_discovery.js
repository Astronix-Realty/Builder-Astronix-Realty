async function run() {
  const r = await fetch('http://localhost:3002/api/discovery?limit=100&section=all');
  const data = await r.json();
  console.log('Success:', data.success);
  console.log('TotalCount:', data.totalCount);
  console.log('Properties length:', data.properties ? data.properties.length : 0);
  if (data.properties) {
    data.properties.forEach(p => console.log(' -', p.title || p.name, '| Level:', p.level, '| ParentId:', p.parentId, '| City:', p.location?.city));
  }
}
run().catch(console.error);
