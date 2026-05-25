const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('Creating profile_assets table...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS profile_assets (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        asset_type TEXT NOT NULL CHECK (asset_type IN ('photo', 'resume')),
        file_name TEXT,
        mime_type TEXT,
        file_data TEXT NOT NULL,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(user_id, asset_type)
      );
    `);
    
    console.log('Creating indexes...');
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_profile_assets_user_id ON profile_assets(user_id);
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_profile_assets_type ON profile_assets(user_id, asset_type);
    `);
    
    console.log('✓ Migration completed successfully!');
    console.log('✓ profile_assets table created');
    console.log('✓ Indexes created');
    
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
