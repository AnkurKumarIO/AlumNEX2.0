# Test Slots Save - Diagnostic Guide

## What Changed

1. ✅ **Bigger green confirmation** - Now shows `"Mentorship settings saved! (1 slots)"` in bright green
2. ✅ **Backend uses transaction** - Delete + insert are atomic (fixes pgbouncer issue)
3. ✅ **Redirect fixed** - Should stay on Mentorship section after refresh

---

## CRITICAL: Get Console Logs

Please do this test and share the console output:

### Steps:
1. **Open DevTools** (F12)
2. Click **Console** tab
3. **Clear all logs** (trash icon)
4. Go to **Settings → Mentorship**
5. **Add ONE slot**: Monday 17:00-19:00
6. Click **"Save Mentorship Settings"**
7. **Wait 3 seconds**
8. **Copy EVERYTHING from console** and share it

### What You Should See:

If it's working correctly, you'll see:
```
[Mentorship] === SAVE STARTED ===
[Mentorship] User ID: 0094b126-a025-4912-a00e-cbfa22948776
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
[Mentorship] Calling POST /alumni/0094b126.../availability
[Mentorship] ✓ Slots save response: {success: true, count: 1}
[Mentorship] Calling POST /alumni/0094b126.../settings
[Mentorship] ✓ Settings save response: {success: true}
[Mentorship] === SAVE COMPLETED ===
[Mentorship] Verifying save in 500ms...
[Mentorship] === VERIFICATION FETCH ===
[Mentorship] Verification response: {availability: [...], max_interviews_per_week: 3}
[Mentorship] Slots count: 1
[Mentorship] Max interviews: 3
[Mentorship] ✓ Verification successful - slots persisted
```

### If You See Errors:

**Error 1: No logs at all**
- Save button isn't working
- Check if you see the green "Mentorship settings saved!" toast

**Error 2: "NO AUTH TOKEN FOUND"**
```
[Mentorship] ❌ NO AUTH TOKEN FOUND - This will fail!
```
**Solution**: Logout, clear cache, login again

**Error 3: Network error**
```
[Mentorship] Error message: Failed to fetch
```
**Solution**: Backend not running - restart it

**Error 4: Saves but verification shows 0 slots**
```
[Mentorship] ✓ Slots save response: {success: true, count: 1}
[Mentorship] ⚠️ WARNING: No slots returned after save!
[Mentorship] Slots count: 0
```
**Solution**: Database write/read issue - need backend logs

---

## Backend Logs

Also check your **backend terminal** for these logs:

```
[Alumni Routes] POST /availability - User: 0094b126... Target: 0094b126...
[Alumni Routes] Received slots: [{"day_of_week":"monday",...}]
[Alumni Routes] Cleared existing slots
[Alumni Routes] Created slots: 1
```

If you see:
- **Nothing** → Request never reached backend
- **"Unauthorized: user mismatch"** → Token problem
- **Prisma error** → Database/transaction issue

---

## Quick Checks

### Check 1: Is backend running?
Look at backend terminal - should show:
```
Server running on port 5001
```

### Check 2: Is frontend connecting to right backend?
In console, run:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5001')
```

### Check 3: Do you have a valid token?
In console, run:
```javascript
console.log('Token exists:', !!localStorage.getItem('alumnex_token'))
```

Should show `true`

---

## After Getting Logs

Once you share the console logs, I can tell you EXACTLY what's failing and how to fix it.

The most likely issues are:
1. **Token expired** - just need to re-login
2. **Backend not running** - restart with `npm run dev`
3. **Transaction still failing** - need to check backend logs
4. **Database connection issue** - Supabase/pgbouncer problem

Please share the full console output! 🔍
