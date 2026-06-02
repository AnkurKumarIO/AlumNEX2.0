# 🔧 MISSING DEPENDENCY FIX - node-cron

## ❌ Error

```
Error: Cannot find module 'node-cron'
```

## 🎯 Problem

The `node-cron` package is listed in `backend/package.json` but not installed in `node_modules`.

This can happen when:
- `node_modules` was deleted or corrupted
- `npm install` wasn't run after pulling latest code
- Package installation was interrupted

---

## ✅ SOLUTION

### Option 1: Reinstall Dependencies (Recommended)

Open a **NEW terminal** (separate from the one running `npm run dev`):

```bash
# Navigate to backend folder
cd backend

# Remove node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Clean npm cache
npm cache clean --force

# Reinstall all dependencies
npm install

# Go back to root and restart
cd ..
npm run dev
```

---

### Option 2: Quick Install (If Option 1 doesn't work)

```bash
# In backend folder
cd backend
npm install node-cron --save
cd ..
npm run dev
```

---

### Option 3: Manual Commands (Step by Step)

**Step 1:** Stop the current dev server
- Press `Ctrl + C` in the terminal running `npm run dev`
- Type `Y` and press Enter to confirm

**Step 2:** Navigate to backend
```bash
cd backend
```

**Step 3:** Install missing package
```bash
npm install
```

**Step 4:** Go back to root
```bash
cd ..
```

**Step 5:** Start dev server again
```bash
npm run dev
```

---

## 🧪 VERIFY FIX

After running the commands above, you should see:

```
✅ Supabase client initialised.
✅ Groq Primary AI connected
✅ Groq Resume-Specific AI connected
✅ Gmail API configured and ready
🚀 Reminder Service started
🚀 AlumNEX Backend running on http://localhost:5001
```

**No more error about 'node-cron'!** ✅

---

## 🎯 WHY THIS HAPPENED

The `node-cron` package is used by `backend/services/mentorshipCron.js` for scheduled tasks (like sending reminders).

It's already listed in your `package.json`:
```json
"dependencies": {
  "node-cron": "^4.2.1",
  ...
}
```

But it wasn't installed in `node_modules`, likely because:
1. You pulled new code that added this dependency
2. `npm install` wasn't run after pulling
3. Previous installation was interrupted

---

## 📋 PREVENTION

**After pulling new code, always run:**
```bash
cd backend
npm install
cd ../frontend
npm install
cd ..
```

Or use a single command from root:
```bash
npm install --prefix backend && npm install --prefix frontend
```

---

## 🚀 QUICK FIX (Copy-Paste)

**Stop current server (Ctrl+C), then run:**

```bash
cd backend
npm install
cd ..
npm run dev
```

**That's it!** Backend should start without errors. ✅

---

## 💡 ALTERNATIVE: Comment Out Cron (Not Recommended)

If you're in a hurry and don't need the cron job, you can temporarily disable it:

**File:** `backend/server.js`

Find this line (around line 111):
```javascript
require('./services/mentorshipCron');
```

Comment it out:
```javascript
// require('./services/mentorshipCron'); // Temporarily disabled
```

**Note:** This will disable scheduled reminder features. Only use as last resort.

---

## ✅ STATUS

Once you run `npm install` in the backend folder, the error will be resolved and your server will start normally.

**Next:** Test your password change feature and alumni portal UI fixes! 🎉
