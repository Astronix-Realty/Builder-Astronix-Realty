const fs = require('fs');
const path = require('path');
const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
};
const files = walk('d:/Astronix Realty/Builder-Astronix-Realty/app/api');
files.forEach(f => {
  if(f.endsWith('.ts')) {
    let content = fs.readFileSync(f, 'utf8');
    let newContent = content.replace(/isDeleted:\s*false/g, 'isDeleted: { $ne: true }');
    if (content !== newContent) {
      fs.writeFileSync(f, newContent);
      console.log('Updated', f);
    }
  }
});
console.log('Done');
