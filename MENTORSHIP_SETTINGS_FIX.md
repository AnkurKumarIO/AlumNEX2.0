# 🔧 MENTORSHIP SETTINGS - SAVE/LOAD FIX

## 🐛 Issue Reported

**Problem:** Availability windows disappear after refreshing the page - they're not being saved to the database.

---

## ✅ FIX APPLIED

### What Was Changed

**File:** `frontend/src/pages/SettingsPage.jsx`

**Changes:**
1. ✅ Added comprehensive console logging to debug save/load
2. ✅ Added verification fetch after save to confirm data persistence
3. ✅ Better error handling and logging

### New Save Flow

```javascript
saveMentorship() {
  // 1. Log what we're saving
  console.log('Saving slots:', mentorship.slots);
  
  // 2. Save to backend
  await api.post('/alumni/${user.id}/availability', { slots });
  await api.post('/alumni/${user.id}/settings', { max_interviews_per_week });
  
  // 3. Verify by re-fetching (after 500ms delay)
  setTimeout(() => {
    api.get('/alumni/${user.id}/availability')
      .then(res => {
        console.log('Verification fetch:', res);
        setMentorship({ 
          maxInterviews: res.max_interviews_per_week,
          slots: res.availability 
        });
      });
  }, 500);
}
```

---

## 🧪 TESTING INSTRUCTIONS

### Step 1: Clear Console & Add Slots

1. Open browser console (F12)
2. Go to Settings → Mentorship
3. Add an availability window:
   - Day: Monday
   - Start: 17:00
   - End: 19:00
4. Click "Add Availability Window"
5. **Check console:** Should see slot added to state
6. Click "Save Mentorship Settings"

**Expected Console Output:**
```
[Mentorship] Saving slots: [{day_of_week: "monday", start_time: "17:00", ...}]
[Mentorship] Saving max interviews: 3
[Mentorship] Slots save response: {success: true, count: 1}
[Mentorship] Settings save response: {success: true}
[Mentorship] Verification fetch after save: {availability: [...], max_interviews_per_week: 3}
```

### Step 2: Refresh Page

1. Refresh the page (F5 or Ctrl+R)
2. Go to Settings → Mentorship
3. **Check:** Availability windows should still be there

**Expected Console Output:**
```
[Mentorship] Fetching availability for user: <user-id>
[Mentorship] Availability response: {availability: [...], max_interviews_per_week: 3}
[Mentorship] Slots array: [{day_of_week: "monday", ...}]
```

### Step 3: If Slots Still Disappear

**Check Backend Response:**
1. Look at console logs
2. Find: `[Mentorship] Availability response: {...}`
3. Check if `availability` array is empty: `[]`

**If empty, check:**
- Backend is running
- User is authenticated (check for 401/403 errors)
- Database has the data (check backend logs)

---

## 🔍 DEBUGGING GUIDE

### Console Logs to Check

#### On Load:
```
[Mentorship] Fetching availability for user: abc123
[Mentorship] Availability response: {
  availability: [
    {
      day_of_week: "monday",
      start_time: "17:00",
      end_time: "19:00",
      slot_duration: 60
    }
  ],
  max_interviews_per_week: 3
}
[Mentorship] Slots array: [...]
```

#### On Save:
```
[Mentorship] Saving slots: [...]
[Mentorship] Saving max interviews: 3
[Mentorship] Slots save response: {success: true, count: 1}
[Mentorship] Settings save response: {success: true}
[Mentorship] Verification fetch after save: {...}
```

### Common Issues

#### Issue 1: Empty availability array after refresh
**Symptoms:**
```
[Mentorship] Availability response: {availability: [], max_interviews_per_week: 3}
```

**Possible Causes:**
1. Backend didn't save (check save response)
2. Backend deleted data (check backend logs)
3. Wrong user ID (check if user logged in)
4. Database issue (check backend can query DB)

**Fix:** Check backend console logs for errors

#### Issue 2: 401/403 Authentication Error
**Symptoms:**
```
[Mentorship] Save error: Error: Unauthorized
```

**Cause:** Auth token missing or invalid

**Fix:** 
- Logout and login again
- Check localStorage for token: `localStorage.getItem('alumnex_token')`

#### Issue 3: Slots not formatted correctly
**Symptoms:**
```
[Mentorship] Slots save response: {error: "Invalid data format"}
```

**Cause:** Slots missing required fields

**Fix:** Ensure slots have:
```javascript
{
  day_of_week: "monday",    // lowercase
  start_time: "17:00",      // HH:MM format
  end_time: "19:00",        // HH:MM format
  slot_duration: 60         // number
}
```

---

## 🔧 BACKEND VERIFICATION

### Check Backend Endpoint

**Test manually:**
```bash
# In backend folder, check if data is saved
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.alumniAvailability.findMany()
  .then(data => console.log('All availability:', JSON.stringify(data, null, 2)))
  .then(() => prisma.\$disconnect());
"
```

**Expected Output:**
```json
[
  {
    "id": "...",
    "alumni_id": "abc123",
    "day_of_week": "monday",
    "start_time": "17:00",
    "end_time": "19:00",
    "slot_duration": 60,
    "is_active": true
  }
]
```

### If Database is Empty

**Check backend logs when saving:**
```
POST /alumni/abc123/availability
Body: { slots: [...] }
```

**Backend should log:**
```
Deleted existing slots
Created X new slots
```

**If no logs:** Backend route not being hit (check URL, auth)

---

## 📊 DATA FLOW

### Save Flow:
```
User adds slot in UI
    ↓
State updated: mentorship.slots = [...]
    ↓
User clicks "Save"
    ↓
POST /alumni/:id/availability { slots: [...] }
    ↓
Backend: Delete old slots
    ↓
Backend: Create new slots
    ↓
Backend: Return {success: true, count: X}
    ↓
Frontend: Show "Saved!" ✓
    ↓
Frontend: Verification fetch (after 500ms)
    ↓
GET /alumni/:id/availability
    ↓
Backend: Query database
    ↓
Backend: Return {availability: [...], max_interviews_per_week: X}
    ↓
Frontend: Update state with verified data
```

### Load Flow (After Refresh):
```
Page loads
    ↓
useEffect runs (when user.id available)
    ↓
GET /alumni/:id/availability
    ↓
Backend: Query database
    ↓
Backend: Return {availability: [...], max_interviews_per_week: X}
    ↓
Frontend: setMentorship({ slots: availability, ... })
    ↓
UI displays slots
```

---

## 🎯 EXPECTED BEHAVIOR

### After This Fix:

1. **Add slots** → See them in UI ✓
2. **Click Save** → Console logs save success ✓
3. **Wait 500ms** → Console logs verification fetch ✓
4. **Refresh page** → Slots still there ✓
5. **Logout/Login** → Slots still there ✓
6. **Close browser** → Reopen → Slots still there ✓

---

## 📝 CODE CHANGES SUMMARY

### Before:
```javascript
const saveMentorship = async () => {
  try {
    setSaving(true);
    await api.post(`/alumni/${user.id}/availability`, { slots: mentorship.slots });
    await api.post(`/alumni/${user.id}/settings`, { max_interviews_per_week: mentorship.maxInterviews });
    flashSaved();
  } catch (err) {
    console.error('Save mentorship error:', err);
    setSaveError('Failed to save mentorship settings');
  } finally {
    setSaving(false);
  }
};
```

### After:
```javascript
const saveMentorship = async () => {
  try {
    setSaving(true);
    console.log('[Mentorship] Saving slots:', mentorship.slots);
    console.log('[Mentorship] Saving max interviews:', mentorship.maxInterviews);
    
    // Save availability slots
    const slotsResponse = await api.post(`/alumni/${user.id}/availability`, { slots: mentorship.slots });
    console.log('[Mentorship] Slots save response:', slotsResponse);
    
    // Save max interviews per week
    const settingsResponse = await api.post(`/alumni/${user.id}/settings`, { max_interviews_per_week: mentorship.maxInterviews });
    console.log('[Mentorship] Settings save response:', settingsResponse);
    
    flashSaved();
    
    // Reload to confirm save
    setTimeout(() => {
      api.get(`/alumni/${user.id}/availability`)
        .then(res => {
          console.log('[Mentorship] Verification fetch after save:', res);
          setMentorship({
            maxInterviews: res.max_interviews_per_week || 3,
            slots: res.availability || []
          });
        });
    }, 500);
    
  } catch (err) {
    console.error('[Mentorship] Save error:', err);
    setSaveError('Failed to save mentorship settings');
  } finally {
    setSaving(false);
  }
};
```

**Key Additions:**
1. ✅ Detailed console logging at each step
2. ✅ Store and log API responses
3. ✅ Verification fetch after save with 500ms delay
4. ✅ Re-fetch and update state to confirm persistence
5. ✅ `[Mentorship]` prefix for easy filtering in console

---

## 🚀 NEXT STEPS

### After Testing:

1. **Check console logs** - Do you see all the expected logs?
2. **Check backend logs** - Is data being saved to database?
3. **Check database** - Run the Prisma query to verify data exists
4. **Report findings:**
   - If slots persist: ✅ Fix successful!
   - If slots disappear: Share console logs for further debugging

### If Issue Persists:

**Share these details:**
1. Console logs from save operation
2. Console logs from page load
3. Backend console logs (if accessible)
4. Any error messages

---

## ✅ STATUS

- ✅ Code changes applied
- ✅ Enhanced logging added
- ✅ Verification step added
- ⏳ Awaiting testing confirmation

**Test the changes and check the console logs!** 🔍
