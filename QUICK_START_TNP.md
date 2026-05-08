# Quick Start — TNP Bulk Upload

## 1. Start the Backend

```bash
cd backend
npm install
node server.js
```

Expected output:
```
🚀 AlumNEX Backend running on http://localhost:5001
📡 Socket.io ready on ws://localhost:5001/interview
🗄️  Database: Supabase (PostgreSQL)
🤖 Groq AI: ✅ connected
```

---

## 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## 3. Login as TNP

1. Navigate to `http://localhost:5173/tnp/login`
2. Default credentials:
   - **Username:** `admin`
   - **Password:** `tnp_secure_123`

---

## 4. Upload Student Accounts

1. Click **"Bulk Upload"** in the sidebar
2. Select **"Students"** tab
3. Click **"Download Template"** to get the CSV format
4. Fill in the CSV:
   ```csv
   name,email,department,college,year,studentId
   Alice Johnson,alice@college.edu,Computer Science,MIT,2025,STU001
   Bob Smith,bob@college.edu,Electrical Engineering,MIT,2025,STU002
   ```
5. Drag & drop the CSV or click to browse
6. Review the preview table (errors highlighted in red)
7. Click **"Create X Accounts"**
8. **Save the generated passwords** — they're shown once and must be distributed to students

---

## 5. Upload Alumni Mentors

1. Select **"Alumni Mentors"** tab
2. Click **"Download Template"**
3. Fill in the CSV:
   ```csv
   name,email,department,company,jobTitle,batchYear
   Priya Sharma,priya@gmail.com,Computer Science,Google,Senior Engineer,2020
   Amit Joshi,amit@gmail.com,Computer Science,Microsoft,Staff Engineer,2019
   ```
4. Upload and save the generated passwords

---

## 6. Test Login

Students and alumni can now log in at:
- Students: `http://localhost:5173/student/login`
- Alumni: `http://localhost:5173/alumni/login`

Use the email and generated password from the bulk upload results.

---

## 7. View Analytics

Click **"Analytics"** in the TNP dashboard to see:
- Session trends (weekly volume)
- Top mentors (by sessions and rating)
- Student progress (engagement breakdown)
- Domain demand (most requested interview topics)

---

## 8. Monitor Activity

Click **"Activity Feed"** to see:
- Recent sessions completed
- New mentorship matches
- Bulk upload events
- System actions

---

## CSV Validation Rules

### Students
- **Required:** `name`, `email`
- **Optional:** `department`, `college`, `year`, `studentId`
- **Email format:** Must be valid (e.g., `user@domain.com`)

### Alumni
- **Required:** `name`, `email`
- **Optional:** `department`, `company`, `jobTitle`, `batchYear`
- **Email format:** Must be valid

### Limits
- Max 500 rows per upload
- Duplicate emails are skipped (not re-created)
- Invalid rows are highlighted in preview

---

## Password Distribution

**Important:** Generated passwords are shown **once** after upload. TNP must:
1. Copy the credentials table
2. Distribute passwords securely to users (email, portal, etc.)
3. Advise users to change their password after first login

**Future Enhancement:** Auto-send credentials via email integration.

---

## Troubleshooting

### "Email already exists"
- The email is already in the database
- Check if the user was uploaded in a previous batch
- User can log in with their existing credentials

### "Failed to create account"
- Check backend logs for detailed error
- Verify Supabase connection (check `.env` file)
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not just `SUPABASE_ANON_KEY`)

### "CSV is empty"
- Ensure the CSV has a header row and at least one data row
- Check for hidden characters or encoding issues
- Re-download the template and copy your data into it

---

## Environment Variables

Ensure these are set in `backend/.env`:

```env
PORT=5001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
```

**Critical:** Use `SUPABASE_SERVICE_ROLE_KEY`, not `SUPABASE_ANON_KEY` — the anon key cannot create auth users.

---

## Next Steps

1. **Test the flow:** Upload a small batch (2-3 accounts) and verify login works
2. **Distribute passwords:** Set up a secure method to send credentials to users
3. **Monitor analytics:** Check the Analytics tab after a few sessions are completed
4. **Review logs:** Use the Compliance tab to audit all TNP actions

---

## Support

For issues or questions:
- Check `/TNP_REFACTOR_SUMMARY.md` for architecture details
- Review backend logs: `backend/server.js` console output
- Inspect browser console for frontend errors
