-- Migration: add asset_url and storage_path columns to profile_assets
-- Allows storing Supabase Storage public URLs instead of base64 blobs

ALTER TABLE profile_assets
  ADD COLUMN IF NOT EXISTS asset_url    TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Make file_data nullable (was previously NOT NULL for base64 blobs)
ALTER TABLE profile_assets
  ALTER COLUMN file_data DROP NOT NULL;
