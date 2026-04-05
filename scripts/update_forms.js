const fs = require('fs');
const path = require('path');

const files = [
  'components/builder/forms/township-flow-form.tsx',
  'components/builder/forms/project-flow-form.tsx',
  'components/builder/forms/tower-flow-form.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Find Part A
  const partAStart = content.indexOf('<PartCollapse id="part-a"');
  if (partAStart === -1) return;
  const partACloseStr = '      </PartCollapse>';
  const partAEnd = content.indexOf(partACloseStr, partAStart) + partACloseStr.length;
  
  const partAStr = content.substring(partAStart, partAEnd);

  // Find Part B
  const partBStart = content.indexOf('<PartCollapse id="part-b"');
  if (partBStart === -1) return;
  const partBCloseStr = '      </PartCollapse>';
  let partBEnd = content.indexOf(partBCloseStr, partBStart) + partBCloseStr.length;
  
  const partBStr = content.substring(partBStart, partBEnd);

  console.log(`File: ${file}`);
  console.log(`Part A matches: ${partAStart} to ${partAEnd}`);
  console.log(`Part B matches: ${partBStart} to ${partBEnd}`);

  let newPartAStr = partBStr; // The Entity-Specific Data becomes part-a
  newPartAStr = newPartAStr.replace('<PartCollapse id="part-b"', '<PartCollapse id="part-a"');
  
  let newPartBStr = partAStr; // The Common Inherited Data becomes part-b
  newPartBStr = newPartBStr.replace('<PartCollapse id="part-a"', '<PartCollapse id="part-b"');
  
  // Custom standalone condition handling for project and tower
  if (file.includes('project-flow') || file.includes('tower-flow')) {
    // The previous Part A (Common Inherited Data) had the wrapper:
    // {(showCommonData && townshipData) && (
    //   <>
    //     <PartCollapse id="part-a" ...>
    //     ...
    //     </PartCollapse>
    //   </>
    // )}
    
    // So if we extract from `<PartCollapse`, we missed the outer condition.
    // Let's do a more robust string replacement for these files.
  }
});
