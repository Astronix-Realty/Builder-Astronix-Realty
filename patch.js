const fs = require('fs');
let content = fs.readFileSync('components/builder/forms/unit-flow-form.tsx', 'utf8');

// Replace standard additions
content = content.replace(/ \+ \(config\.parkingCharges \?\? 0\) \+ \(config\.bikeParkingCharges \?\? 0\)/g, '');
content = content.replace(/ \+ park \+ \(config\.bikeParkingCharges \?\? 0\)/g, '');
content = content.replace(/ \+ \(config\.parkingCharges \?\? 0\) \+ bikePark/g, '');
content = content.replace(/ \+ parkAmt \+ bikeAmt/g, '');

// Replace the UI breakdown components
content = content.replace(/<span>Car Park.*?<\/span>[\s\n]*<span.*?>\+<\/span>[\s\n]*<span>Bike Park.*?<\/span>[\s\n]*<span.*?>\+<\/span>[\s\n]*/g, '');

fs.writeFileSync('components/builder/forms/unit-flow-form.tsx', content);
console.log("Replaced successfully!");
