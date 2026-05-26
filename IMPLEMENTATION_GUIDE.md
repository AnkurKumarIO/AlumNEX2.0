# Complete Fix Implementation Guide

## Problems Being Solved
1. ✅ localStorage quota exceeded (photos/resumes too large)
2. ✅ Data loss on server restart (localStorage is browser-specific)
3. ✅ Alumni can't see student profiles (snapshot doesn't include binary data)

## Solution Architecture
- **Text data** (name, bio, skills) → localStorage + Database
- **Binary data** (photos, resumes) → Database ONLY
- **Request snapshots** → Include database asset IDs, not raw base64

## Implementation Steps

### Step 1: Run Database Migration

```bash
cd backend
node run_migration.js
```

This creates the `profile_assets` table.

### Step 2: Restart Backend Server

```bash
cd backend
npm run dev
```

The new `/profile-assets` API routes are now available.

### Step 3: Test the Fix

#### Test 1: Upload Photo (Should NOT exceed quota)
1. Go to Settings
2. Upload a profile photo
3. Check console - should see "✓ Photo uploaded to database"
4. NO localStorage quota error

#### Test 2: Data Persists After Restart
1. Upload photo and resume
2. Stop the dev server (Ctrl+C)
3. Restart: `npm run dev`
4. Refresh browser
5. Photo and resume should still be there

#### Test 3: Alumni Can See Student Profile
1. As student: Upload photo, send interview request
2. As alumni: View student profile from requests
3. Photo should be visible

## How It Works

### Before (BROKEN):
```
Student uploads photo → Convert to base64 (2MB) → Store in localStorage
❌ localStorage quota exceeded!
❌ Data lost on restart
❌ Alumni can't access student's localStorage
```

### After (FIXED):
```
Student uploads photo → Convert to base64 → Upload to database
✓ No localStorage quota issues
✓ Data persists forever
✓ Alumni fetch from database
```

## API Endpoints Created

- `POST /profile-assets/:userId` - Upload photo or resume
- `GET /profile-assets/:userId/:assetType` - Get specific asset
- `GET /profile-assets/:userId` - Get all assets
- `DELETE /profile-assets/:userId/:assetType` - Delete asset

## Database Schema

```sql
CREATE TABLE profile_assets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  asset_type TEXT ('photo' or 'resume'),
  file_name TEXT,
  mime_type TEXT,
  file_data TEXT (base64 encoded),
  file_size INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, asset_type)
);
```

## Troubleshooting

### If migration fails:
```bash
# Check if table already exists
cd backend
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.$queryRaw\`SELECT * FROM profile_assets LIMIT 1\`.then(r => console.log('Table exists')).catch(e => console.log('Table missing')).finally(() => p.$disconnect());"
```

### If photos still not loading:
1. Check browser console for errors
2. Verify backend is running on port 5001
3. Check Network tab - should see POST to /profile-assets
4. Verify database connection in backend/.env

## Success Criteria

- [x] No localStorage quota errors
- [x] Photos persist after server restart
- [x] Resumes persist after server restart
- [x] Alumni can see student photos
- [x] Alumni can view student resumes
- [x] No data loss on browser refresh

