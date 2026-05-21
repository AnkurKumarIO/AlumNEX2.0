const fs = require('fs');
fs.writeFileSync('scratch_test.txt', 'Node executed successfully at ' + new Date().toISOString());
console.log('File written!');
