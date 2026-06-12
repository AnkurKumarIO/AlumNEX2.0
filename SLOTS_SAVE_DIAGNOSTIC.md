# Slots Not Saving - Complete Diagnostic Guide

## ✅ Position Fixed
- Requirements checklist is now **back at the bottom** (in the sidebar)
- Design kept as is (clean purple theme)

---

## 🔍 Debugging Slots Save Issue

### What You Need to Do:

1. **Open Browser DevTools** (F12)
2. Go to **Console** tab
3. Go to Settings → Mentorship
4. Add ONE slot (e.g., Monday 17:00-19:00)
5. Click "Save Mentorship Settings"
6. **COPY ALL the console logs** that appear
7. **Share them with me**

### Expected Console Output:

You should see something like this:

```
[Mentorship] === SAVE STARTED ===
[Mentorship] User ID: abc-123-xyz
[Mentorship] Saving slots: [
  {
    "day_of_week": "monday",
    "start_time": "17:00",
    "end_time": "19:00",
    "slot_duration": 60
  }
]
[Mentorship] Saving max interviews: 3
[Mentorship] API Base URL: http://localhost:5001
[Mentorship] Auth Token exists: true
[Mentorship] Token preview: eyJhbGciOiJIUzI1NiIs...
[Mentorship] Calling POST /alumni/abc-123-xyz/availability
[Mentorship] ✓ Slots save response: {success: true, count: 1}
[Mentorship] Calling POST /alumni/abc-123-xyz/settings
[Mentorship] ✓ Settings save response: {success: true}
[Mentorship] === SAVE COMPLETED ===
[Mentorship] Verifying save in 500ms...
[Mentorship] === VERIFICATION FETCH ===
[Mentorship] Verification response: {availability: [...], max_interviews_per_week: 3}
[Mentorship] Slots count: 1
[Mentorship] Max interviews: 3
[Mentorship] ✓ Verification successful - slots persisted
```

### If You See These Errors:

#### Error 1: "NO AUTH TOKEN FOUND"
```
[Mentorship] ❌ NO AUTH TOKEN FOUND - This will fail!
```
**Fix**: 
1. Logout
2. Clear browser cache (Ctrl+Shift+Delete)
3. Login again
4. Try saving again

#### Error 2: "Unauthorized" or 403 Error
```
[Mentorship] Response status: 403
[Mentorship] Response data: {error: "Unauthorized"}
```
**Fix**: Same as Error 1 - token is invalid or expired

#### Error 3: Network Error / Failed to Fetch
```
[Mentorship] Error message: Failed to fetch
```
**Fix**: Backend is not running or wrong URL
1. Check backend terminal - should show "Server running on port 5001"
2. Verify `.env` has `VITE_API_URL=http://localhost:5001`

#### Error 4: Save Succeeds But Verification Shows 0 Slots
```
[Mentorship] ✓ Slots save response: {success: true, count: 1}
[Mentorship] ⚠️ WARNING: No slots returned after save!
[Mentorship] Slots count: 0
```
**Fix**: Database write succeeded but read failed - check backend console

---

## Backend Console Logs

You should also check the **backend terminal** for these logs:

```
[Alumni Routes] POST /availability - User: abc-123 Target: abc-123
[Alumni Routes] Received slots: [{"day_of_week":"monday",...}]
[Alumni Routes] Cleared existing slots
[Alumni Routes] Created slots: 1
```

### If Backend Shows:
- **Nothing** → Request not reaching backend (check network)
- **"Unauthorized: user mismatch"** → Token user ≠ URL user
- **Prisma error** → Database connection issue

---

## Quick Test Commands

### Test 1: Check Authentication
Open browser console and run:
```javascript
console.log('Token:', localStorage.getItem('alumnex_token'));
```
Should show a long string starting with `eyJ...`

### Test 2: Check User ID
```javascript
console.log('User:', JSON.parse(localStorage.getItem('alumnex_user')));
```
Should show your user object with `id` field

### Test 3: Manual API Test
```javascript
fetch('http://localhost:5001/alumni/' + JSON.parse(localStorage.getItem('alumnex_user')).id + '/availability', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('alumnex_token')
  }
})
.then(r => r.json())
.then(console.log)
```
Should return your current availability slots

### Test 4: Manual Save Test
```javascript
fetch('http://localhost:5001/alumni/' + JSON.parse(localStorage.getItem('alumnex_user')).id + '/availability', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('alumnex_token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    slots: [{
      day_of_week: 'monday',
      start_time: '17:00',
      end_time: '19:00',
      slot_duration: 60
    }]
  })
})
.then(r => r.json())
.then(console.log)
```
Should return `{success: true, count: 1}`

---

## Most Common Issues (90% of cases)

### 1. Auth Token Missing or Expired
**How to identify**: Console shows "NO AUTH TOKEN FOUND" or 403 error

**Solution**:
```bash
# In browser console:
localStorage.clear()
# Then logout and login again
```

### 2. Backend Not Running
**How to identify**: "Failed to fetch" error

**Solution**:
```bash
cd backend
npm run dev
```

### 3. Wrong API URL
**How to identify**: Logs show different URL than expected

**Solution**: Check `frontend/.env`:
```
VITE_API_URL=http://localhost:5001
```

---

## What to Share

Please provide:

1. **Frontend Console Logs** (the full output from the save attempt)
2. **Backend Console Logs** (if you see anything related to `/availability`)
3. **Network Tab** (if possible, screenshot of the request/response)
4. **Results of Test Commands** above

This will help identify exactly where the save is failing! 🔍
