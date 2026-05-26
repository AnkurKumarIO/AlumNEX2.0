/**
 * Migration: add asset_url and storage_path to profile_assets
 * Run with: node run_migration_asset_url.js
 *
 * This allows storing Supabase Storage public URLs instead of base64 blobs.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('Adding asset_url and storage_path columns to profile_assets...');

    // Add asset_url column (Supabase Storage public URL)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE profile_assets
        ADD COLUMN IF NOT EXISTS asset_url TEXT;
    `);

    // Add storage_path column (Supabase Storage path, used for deletion)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE profile_assets
        ADD COLUMN IF NOT EXISTS storage_path TEXT;
    `);

    // Make file_data nullable (was NOT NULL — base64 blobs are now optional)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE profile_assets
        ALTER COLUMN file_data DROP NOT NULL;
    `);

    console.log('✓ Migration completed successfully!');
    console.log('✓ asset_url column added');
    console.log('✓ storage_path column added');
    console.log('✓ file_data made nullable');

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
