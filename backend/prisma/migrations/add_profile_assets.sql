-- Create profile_assets table for storing photos and resumes
CREATE TABLE IF NOT EXISTS profile_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('photo', 'resume')),
  file_name VARCHAR(255),
  mime_type VARCHAR(100),
  file_data TEXT NOT NULL, -- Base64 encoded data
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, asset_type)
);

CREATE INDEX idx_profile_assets_user_id ON profile_assets(user_id);
CREATE INDEX idx_profile_assets_type ON profile_assets(user_id, asset_type);

-- Add comment
COMMENT ON TABLE profile_assets IS 'Stores user profile photos and resumes as base64 encoded data';
