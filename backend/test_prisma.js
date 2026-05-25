const fs = require('fs');
const prisma = require('./lib/prisma');
fs.writeFileSync('prisma_test.txt', Object.keys(prisma).join('\n'));
