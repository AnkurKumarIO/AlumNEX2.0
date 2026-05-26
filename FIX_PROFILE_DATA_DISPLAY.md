# Fix: Profile Data (CGPA, Skills, Bio) Not Showing in Alumni Portal

## Problem
Student's profile picture and resume are showing correctly in the alumni portal, but text data (CGPA, skills, bio, etc.) is not displaying.

## Root Cause
When `sendRequest()` creates the snapshot:
1. It reads from database `profile_data` field (which may be a JSON string)
2. localStorage has placeholder values (`'__stored_in_database__'`) instead of actual data
3. The merge wasn't parsing the JSON string correctly

## Solution Applied

Updated `frontend/src/interviewRequests.js` in the `sendRequest()` function:

### Changes Made:

1. **Parse JSON string from database:**
```javascript
let dbProfile = user?.profile_data || {};

// Parse if it's a JSON string
if (typeof dbProfile === 'string') {
  try {
    dbProfile = JSON.parse(dbProfile);
  } catch (e) {
    console.warn('[sendRequest] Failed to parse DB profile_data:', e);
    dbProfile = {};
  }
}
```

2. **Merge localStorage profile data:**
```javascript
// Also merge with localStorage profile (has latest text data)
try {
  const localProfile = JSON.parse(localStorage.getItem('alumnex_profile') || '{}');
  if (Object.keys(localProfile).length > 0) {
    console.log('[sendRequest] Merging localStorage profile data');
    mergedStudentProfile = { 
      ...(mergedStudentProfile || {}), 
      ...localProfile,
      // Don't overwrite with placeholder values
      photoPreview: mergedStudentProfile?.photoPreview || localProfile.photoPreview,
      resumeUrl: mergedStudentProfile?.resumeUrl || localProfile.resumeUrl,
    };
  }
} catch (localErr) {
  console.warn('[sendRequest] Could not read localStorage profile:', localErr);
}
```

3. **Added detailed logging:**
```javascript
console.log('[sendRequest] Final snapshot profile data:', {
  bio: !!mergedStudentProfile?.bio,
  skills: mergedStudentProfile?.skills?.length || 0,
  cgpa: !!mergedStudentProfile?.cgpa,
  linkedin: !!mergedStudentProfile?.linkedin,
  github: !!mergedStudentProfile?.github,
});
```

## Testing Steps

### Test 1: Verify Profile Data in Snapshot
1. As student, open browser console
2. Fill out profile in Settings (bio, skills, CGPA, etc.)
3. Click "Save Changes"
4. Go to Directory and send an interview request
5. **Check console logs:**
   - Should see: `[sendRequest] DB profile fetched, keys: X` (where X > 0)
   - Should see: `[sendRequest] Merging localStorage profile data`
   - Should see: `[sendRequest] Final snapshot profile data: { bio: true, skills: 3, cgpa: true, ... }`

### Test 2: Alumni Views Complete Profile
1. Login as alumni
2. Go to "Interview Requests" tab
3. Click "View Profile" on the student's request
4. **Expected:**
   - ✅ Photo displays
   - ✅ Resume displays
   - ✅ Bio displays
   - ✅ Skills display
   - ✅ CGPA displays
   - ✅ LinkedIn/GitHub links display

### Test 3: Verify Old Requests
**Note:** Old requests sent BEFORE this fix won't have the complete data. Students need to send NEW requests after:
1. Updating their profile in Settings
2. This fix being deployed

## Data Flow

```
┌─────────────────────────────────────────┐
│  Student Fills Profile in Settings      │
│  ├─ Bio, Skills, CGPA, etc.             │
│  └─ Clicks "Save Changes"               │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Data Saved to Two Places:              │
│  ├─ Database: profile_data (JSON)       │
│  └─ localStorage: alumnex_profile        │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Student Sends Interview Request        │
│  sendRequest() creates snapshot:        │
│  ├─ Read DB profile_data (parse JSON)   │
│  ├─ Merge localStorage data             │
│  ├─ Fetch photo from database           │
│  └─ Fetch resume from database          │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Request Stored with Complete Snapshot  │
│  student_profile_snapshot: {            │
│    bio: "...",                           │
│    skills: ["React", "Node", "Python"],  │
│    cgpa: "8.5",                          │
│    photoPreview: "data:image/...",       │
│    resumeUrl: "data:application/..."     │
│  }                                       │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Alumni Views Profile                    │
│  StudentFullProfileModal displays:       │
│  ├─ Photo (from snapshot)                │
│  ├─ Resume (from snapshot)               │
│  ├─ Bio (from snapshot)                  │
│  ├─ Skills (from snapshot)               │
│  └─ CGPA (from snapshot)                 │
└─────────────────────────────────────────┘
```

## Troubleshooting

### If profile data still not showing:

1. **Check if student saved profile:**
   - Student must click "Save Changes" in Settings
   - Check console for: `[SettingsPage] Saved via backend ✓`

2. **Check if snapshot includes data:**
   - When sending request, check console for:
   - `[sendRequest] Final snapshot profile data: { bio: true, skills: 3, ... }`
   - If all values are `false` or `0`, profile wasn't saved properly

3. **Send a NEW request:**
   - Old requests don't have the complete snapshot
   - Student must send a NEW request after updating profile

4. **Check database:**
   ```bash
   cd backend
   node -e "
   const {PrismaClient} = require('@prisma/client');
   const p = new PrismaClient();
   p.user.findFirst({ where: { role: 'STUDENT' } }).then(u => {
     console.log('Profile data type:', typeof u.profile_data);
     console.log('Profile data:', u.profile_data);
   }).finally(() => p.\$disconnect());
   "
   ```
   - Should show profile_data as JSON string or object with bio, skills, etc.

### If localStorage has placeholder values:

This is expected! After the fix:
- localStorage stores: `photoPreview: '__stored_in_database__'`
- But sendRequest() fetches real data from database
- The merge prioritizes database values over placeholders

## Success Criteria

- [x] Code updated in `interviewRequests.js`
- [ ] Student fills profile in Settings
- [ ] Student sends NEW interview request
- [ ] Alumni can see complete profile (photo, resume, bio, skills, CGPA)
- [ ] Console logs show profile data being merged correctly

## Files Modified

- ✅ `frontend/src/interviewRequests.js` - Fixed profile data merging in `sendRequest()`

## Next Steps

1. Refresh the browser to load the updated code
2. As student: Update profile in Settings and save
3. As student: Send a NEW interview request to an alumni
4. As alumni: View the student's profile
5. Verify all data displays correctly

---

**Status:** ✅ Fix applied, ready for testing
**Action Required:** Student must send NEW request after updating profile
