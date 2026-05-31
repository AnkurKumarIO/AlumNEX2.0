const { execSync } = require('child_process');

let dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  try {
    const u = new URL(dbUrl);
    // Convert transaction pooler port 6543 to session pooler port 5432
    if (u.port === '6543') {
      u.port = '5432';
      u.searchParams.delete('pgbouncer');
      u.searchParams.delete('connection_limit');
      process.env.DIRECT_URL = u.toString();
      console.log('Constructed DIRECT_URL for migrations using IPv4-compatible Session Pooler on port 5432.');
    }
  } catch (e) {
    console.warn('Failed to parse DATABASE_URL to construct DIRECT_URL:', e.message);
  }
}

console.log('Running prisma migrate deploy...');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exit(1);
}
