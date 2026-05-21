# AlumNEX Audit Report (Dry Run)

This report details the integrations and identified issues of the AlumNEX platform. As per the latest architectural shift, **Student and Alumni self-registration and self-verification are no longer part of the project.** All user accounts are now managed exclusively by the Training & Placement (TNP) coordinator via bulk upload.

## 1. System Integrations

### Database & Storage
- **Prisma (PostgreSQL):** Main database for application state (Users, Requests, Notifications, Activity).
- **Supabase:** Used for Authentication and secondary data storage/real-time synchronization in some frontend modules.

### Authentication (TNP-Controlled)
- **Supabase Auth (Admin-Only):** Backend uses the Service Role Key to programmatically create and manage users. Students/Alumni can only log in; they cannot sign up.
- **TNP Auth:** Secured via environment variables (`TNP_USERNAME`, `TNP_PASSWORD`).
- **Google OAuth2:** Alumni integration for calendar syncing and Google Meet room generation.

### AI Agents (Powered by Groq)
- **Agent 1 (Resume Analyzer):** Extracts skills and generates ATS scores from student resumes.
- **Agent 2 (Socratic Whisperer):** Provides real-time coaching hints to Alumni during interviews via Socket.io.
- **Agent 3 (Interview Analytics):** Generates post-session performance reports.
- **Agent 5 (Profile Summarizer):** Briefs Alumni on Student backgrounds before sessions.
- **Agent 6 & 7 (Live Speech/Fact Checker):** Real-time feedback during mock interviews.

### Communication
- **Socket.io:** Real-time relay for chat, WebRTC signaling, and AI coaching.
- **Google Meet & Jitsi:** Video conferencing integration.
- **Gmail/SMTP/Resend:** Multi-layered email delivery for distributing generated passwords to users.

---

## 2. Identified Bugs & Technical Debt

### Obsolete Features (Must be Removed)
1. **Residual Auth Pages:** `StudentAuth.jsx`, `StudentRegistration.jsx`, and `AlumniRegistration.jsx` still exist in the codebase. Although `App.jsx` redirects some, `StudentAuth` is still reachable and references a non-existent `studentVerify` backend logic.
2. **Mock-Heavy `api.js`:** The frontend `api.js` contains a `studentVerify` function that references a dead backend route. It also defaults to mock behavior if the backend is slightly slow, leading to "false positives" where users think they are connected to a DB when they are not.

### Logic & Performance Bugs
3. **Auth Sync Vulnerability:** `backend/routes/register.js` creates users in Supabase Auth before Prisma. If Prisma fails (e.g., due to a duplicate username or DB timeout), the Supabase account remains "orphaned" without a database profile, preventing re-registration with that email.
4. **Impure React Renders:** `TNPDashboard.jsx`, `AlumniDiscovery.jsx`, and others call `Date.now()` during the render phase. This causes unnecessary re-renders and violates React's purity rules, potentially leading to inconsistent UI states.
5. **Conditional Hook Violations:** `Dashboard.jsx` and `ResumeAnalyzer.jsx` contain hooks (`useEffect`, `useCallback`) called inside conditional blocks or after early returns, which can cause React to throw errors and crash the UI.
6. **CORS/Environment Mismatch:** `frontend/.env` defaults to a production URL, causing immediate CORS failures for local developers unless they manually edit the file.
7. **Socket.io Connection Leak:** In `GoogleMeetInterviewRoom.jsx`, the socket connection is initialized on every re-render instead of being memoized or handled in a clean `useEffect` lifecycle, leading to multiple concurrent connections.

### Technical Debt
8. **Native Dependency Build Failure:** The `canvas` dependency (required for PDF-to-Image OCR) fails to compile in many environments because of missing system headers (`pixman`, `cairo`), breaking Agent 1's ability to read scanned PDFs.
9. **Inconsistent Data Layer:** The frontend fetches data using three different methods: `fetch` in `api.js`, direct `supabase-js` calls in `lib/db.js`, and `BroadcastChannel` in `realtimeSync.js`. This makes auditing data flow and debugging sync issues extremely difficult.

---

## 3. Final Summary of Proposed Fixes

### Immediate Priorities
- **Cleanup:** Delete `StudentAuth.jsx`, `StudentRegistration.jsx`, and `AlumniRegistration.jsx`. Remove their respective routes from `App.jsx`.
- **Backend Atomic Ops:** Implement a rollback mechanism in `register.js` to delete the Supabase Auth user if Prisma insertion fails.
- **React Purity:** Refactor components to move `Date.now()` into `useMemo` or state updates.
- **Hook Fixes:** Move all hooks to the top level of the components.

### Structural Improvements
- **Standardize Fetching:** Move all logic from `lib/db.js` into `api.js` to ensure a single source of truth for backend interaction.
- **Build Pipeline:** Add a system-level dependency check or a Docker environment to handle native `canvas` requirements.
