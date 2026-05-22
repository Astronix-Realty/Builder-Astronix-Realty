const fs = require('fs');
const path = require('path');

function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findRouteFiles(fullPath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const routes = findRouteFiles(path.join(__dirname, '../app/api'));
console.log('Total routes:', routes.length);

const missingRBAC = [];
const missingOwnership = [];

for (const route of routes) {
  const content = fs.readFileSync(route, 'utf-8');
  if (!content.includes('checkRBAC')) {
    missingRBAC.push(route.split('\\app\\api\\')[1]);
  }
  if (!content.includes('getOwnershipQuery')) {
    missingOwnership.push(route.split('\\app\\api\\')[1]);
  }
}

console.log('\n--- Missing checkRBAC ---');
console.log(missingRBAC.join('\n'));

console.log('\n--- Missing getOwnershipQuery ---');
console.log(missingOwnership.join('\n'));
