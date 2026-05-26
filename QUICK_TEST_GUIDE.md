# 🚀 Quick Test Guide - 5 Minute Verification

## Servers Running ✅
- Backend: http://localhost:5001
- Frontend: http://localhost:5173

---

## Test Flow (5 minutes)

### Step 1: Student Uploads Photo (1 min)
```
1. Open http://localhost:5173
2. Login as student
3. Click "Settings" in sidebar
4. Click "Upload Photo" button
5. Select any image file
6. Click "Save Changes"
```

**✅ Success if:**
- No "quota exceeded" error
- Console shows: `✓ Photo uploaded to database`
- Photo appears in preview

---

### Step 2: Student Uploads Resume (1 min)
```
1. Still in Settings
2. Click "Upload Resume" button
3. Select a PDF file
4. Click "Save Changes"
```

**✅ Success if:**
- No errors
- Console shows: `✓ Resume uploaded to database`
- Resume name appears

---

### Step 3: Verify Persistence (1 min)
```
1. Refresh the page (F5)
2. Login again
3. Go to "My Profile" tab
```

**✅ Success if:**
- Photo is still visible
- Resume is still there
- No need to re-upload

---

### Step 4: Send Interview Request (1 min)
```
1. Click "Directory" in sidebar
2. Find an alumni
3. Click "Book Session"
4. Fill form and click "Send Request"
```

**✅ Success if:**
- Request sent successfully
- No errors in console

---

### Step 5: Alumni Views Profile (1 min)
```
1. Logout
2. Login as alumni
3. Click "Interview Requests" tab
4. Click "View Profile" on the student's request
```

**✅ Success if:**
- Student's photo is visible in modal
- Student's resume has "View" button
- Clicking "View" opens PDF

---

## Quick Verification Commands

### Check Database
```bash
cd backend
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.profileAsset.findMany().then(a => console.log('Assets:', a.length)).finally(() => p.\$disconnect());"
```

**Expected:** `Assets: 2` (or more)

### Check localStorage
Open browser console:
```javascript
JSON.parse(localStorage.getItem('alumnex_profile')).photoPreview
```

**Expected:** `"__stored_in_database__"` (not a long base64 string)

---

## Common Issues

### "Asset not found"
→ Student needs to re-upload photo after this fix

### Photo not showing for alumni
→ Student must send a NEW request after uploading

### Quota error still happening
→ Clear localStorage: `localStorage.clear()` then refresh

---

## Success Criteria

- [x] No localStorage quota errors
- [x] Photo persists after refresh
- [x] Resume persists after refresh
- [x] Alumni can see student photo
- [x] Alumni can view student resume
- [x] Database contains assets
- [x] localStorage has placeholders only

---

**All tests passing?** ✅ Fix is complete and working!
**Any test failing?** Check IMPLEMENTATION_COMPLETE.md for troubleshooting
