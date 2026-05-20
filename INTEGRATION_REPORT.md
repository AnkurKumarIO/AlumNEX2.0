# AlumNEX Integration & Bug Report (Dry Run)

This report summarizes the current state of the AlumNEX platform, its integrations, and identified issues.

## 1. System Integrations

### Database & Storage
- **Prisma (PostgreSQL):** Primary application database for managing users, interview requests, notifications, and activity logs.
- **Supabase:** Used for user authentication (Auth) and as a secondary data layer for some frontend components.

### Authentication & Authorization
- **Supabase Auth:** Primary auth provider for Students and Alumni.
- **Custom TNP Auth:** Environment-variable based authentication for the Training & Placement coordinator.
- **Google OAuth2:** Allows Alumni to sync calendars and generate Google Meet links.
- **JWT (JsonWebToken):** Used for session management across the backend.

### AI Integration (7-Agent Architecture)
- **Groq Cloud:** High-speed inference using `llama-3.3-70b-versatile` for Resume Analysis, Socratic Hinting, and Post-Interview Analytics.
- **OpenAI:** Used for Vision-based OCR (scanned resumes) and as a fallback for text analysis.
- **Hugging Face:** Secondary fallback for text extraction and analysis.

### Communication & Real-time
- **Socket.io:** Handles real-time signaling for WebRTC, chat messages, and live AI coaching hints.
- **Google Meet API:** Programmatic creation of interview rooms.
- **Metered.ca:** Provides TURN/STUN infrastructure for reliable WebRTC connections.

### Email Delivery
- **Gmail API (Primary):** OAuth2-based delivery for welcome emails and notifications.
- **Nodemailer (SMTP):** Secondary fallback.
- **Resend API:** Tertiary fallback for onboarding emails.

---

## 2. Identified Bugs & Technical Debt

### Backend Issues
1. **Missing Routes:** Frontend `api.js` attempts to call `POST /auth/student/verify`, but this endpoint is missing in `backend/routes/auth.js`.
2. **Auth Sync Vulnerability:** In `backend/routes/register.js`, users are created in Supabase Auth first, then Prisma. A failure in the Prisma step leaves the system in an inconsistent state (Auth user exists without a DB profile).
3. **OCR Error Propagation:** If OCR fails for a scanned PDF, the system occasionally proceeds with empty text, resulting in generic "Mock" analysis results that may confuse users.
4. **Environment Variable Reliance:** Several critical features (Gmail, Google Meet) lack robust "Degraded Mode" UI when keys are missing; they simply log warnings to the console.

### Frontend Issues
5. **Impure Renders (Lint Error):** `Date.now()` is called during the render phase in `TNPDashboard.jsx` and `AlumniDiscovery.jsx`, violating React's purity rules and potentially causing UI flickers.
6. **Hook Rule Violations:** `useEffect` and `useCallback` are called conditionally in `Dashboard.jsx` and `ResumeAnalyzer.jsx`, which can lead to unpredictable application crashes.
7. **Inconsistent Data Fetching:** The app uses three different patterns for data: direct `fetch` in `api.js`, direct Supabase client calls in `lib/db.js`, and `BroadcastChannel` in `realtimeSync.js`. This makes state management difficult to track.
8. **Hardcoded Production URL:** The `.env` file defaults to a production Vercel/Render URL for `VITE_API_URL`, often causing CORS issues during local development for new contributors.

### General Debt
9. **Dead Code:** Registration pages (Student/Alumni) are still present in the source but redirected to login, increasing bundle size and developer confusion.
10. **Native Dependencies:** The `canvas` and `pdf-img-convert` dependencies require specific system libraries (pixman, cairo) which are missing in the current environment, disabling scanned PDF support.

---

## 3. Proposed Fixes & Implementation Plan

### Phase 1: Stability & Purity (Immediate)
- **Fix 5 & 6 (React Rules):** Move all `useEffect` and `useCallback` hooks to the top level of components in `Dashboard.jsx` and `ResumeAnalyzer.jsx`. Wrap `Date.now()` calculations in `useMemo` or update them via a `setInterval` inside a `useEffect` to avoid impure renders.
- **Fix 8 (Environment Config):** Update `frontend/.env` to default to `http://localhost:5001` and add a `vite.config.js` proxy configuration to handle CORS during development.

### Phase 2: API & Auth Integrity
- **Fix 1 (Missing Route):** Implement `POST /auth/student/verify` in `backend/routes/auth.js`. This route will use Agent 4 (`verifyDocument`) to validate student IDs and update the `verification_status` in the database.
- **Fix 2 (Atomic Registration):** Wrap the user creation logic in `backend/routes/register.js` with a try/catch block that performs a "manual rollback" (deleting the Supabase Auth user) if the subsequent Prisma DB write fails.
- **Fix 9 (Cleanup):** Delete the deprecated `StudentRegistration.jsx` and `AlumniRegistration.jsx` files to reduce technical debt and bundle size.

### Phase 3: Feature Robustness
- **Fix 3 (OCR UX):** Update `backend/routes/aiRoutes.js` to return a clear "Text Extraction Failed" error instead of generic results when a scanned PDF cannot be read.
- **Fix 4 (Degraded Mode):** Implement a `GET /platform-config/status` endpoint that the frontend can query on load to gracefully hide or disable features (like Google Meet) if the required API keys are missing.
- **Fix 7 (Data Layer Refactor):** Consolidate all fetching logic into `api.js`. Deprecate direct Supabase calls from the UI components to ensure consistent mock/real behavior.

### Phase 4: Environment & DevOps
- **Fix 10 (Build Fix):** Create a `Dockerfile` or a setup script that installs the necessary system libraries (`libcairo2-dev`, `libpango1.0-dev`, etc.) required for the `canvas` dependency, ensuring the PDF OCR pipeline works in production.
