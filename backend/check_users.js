const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  console.log('--- USERS IN DATABASE ---');
  users.forEach(u => {
    console.log(`ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | Password set: ${!!u.password}`);
  });
  console.log('-------------------------');
}

run().catch(console.error).finally(() => prisma.$disconnect());
