# AlumNEX AI - Audit Report & Security Assessment

This document outlines the bugs, security vulnerabilities, and UI/UX issues identified during the repository-wide audit.

## 1. Security Vulnerabilities

### 1.1 Plaintext Password Storage
- **Issue:** User passwords are stored in the database without any hashing or encryption. The code even contains comments explicitly stating this: `// Save plain text password in Prisma for reference/admin use`.
- **Location:** `backend/routes/auth.js`, `backend/routes/register.js`.
- **Risk:** High. If the database is compromised, all user credentials and their cleartext passwords are exposed.
- **Correction:** Implement `bcryptjs` to hash passwords before saving them in the `prisma.user` table and use `bcrypt.compare` during login. Remove the "plaintext password" column or repurpose it.

### 1.2 Predictable Default Passwords
- **Issue:** The bulk registration system generates passwords using the pattern `Username@AlumNEX`.
- **Location:** `backend/routes/register.js` (`generatePassword` function).
- **Risk:** Medium. Since usernames follow a standard pattern (Roll Number), an attacker can easily guess the initial password for any newly registered user.
- **Correction:** Generate truly random temporary passwords or implement an email-based "Set your password" flow.

### 1.3 Hardcoded JWT Secret
- **Issue:** The application uses a hardcoded fallback secret (`alumnex_secret_2026`) if `JWT_SECRET` is not provided in environment variables.
- **Location:** `backend/routes/auth.js`.
- **Risk:** High. Known secrets allow attackers to forge valid authentication tokens.
- **Correction:** Remove the fallback. Throw an error during server startup if `JWT_SECRET` is missing.

### 1.4 Missing Route Protection (Authorization)
- **Issue:** Multiple sensitive API routes, including bulk registration and administrative stats, lack the `authenticate` middleware.
- **Location:**
    - `backend/routes/users.js` (bulk delete, profile updates)
    - `backend/routes/stats.js` (platform-wide analytics, user verification)
    - `backend/routes/alumni.js` (directory list)
    - `backend/routes/requests.js` (interview request management)
    - `backend/routes/register.js` (bulk student/alumni registration)
- **Risk:** High. Unauthorized users can perform administrative actions, such as registering hundreds of fake users, deleting the entire user database, or viewing private student/alumni data.
- **Correction:** Apply the `authenticate` middleware to all routes except standard login and self-registration. Implement role-based access control (RBAC) to ensure only TNP admins can access `/stats`, `/register/bulk-*`, and `/users/bulk`.

### 1.5 Hardcoded Admin Credentials
- **Issue:** TNP Coordinator login relies on hardcoded strings (`admin` / `tnp_secure_123`) when environment variables are missing.
- **Location:** `backend/routes/auth.js`.
- **Risk:** Medium. Predictable credentials are a security risk in production environments.
- **Correction:** Move all admin credentials to a secure database table or strictly environment-only variables.

---

## 2. Functional Bugs & Logic Issues

### 2.1 Mock Data Masking (Fail-Silently)
- **Issue:** The frontend uses a `callOrMock` wrapper. If the backend is down or takes >3 seconds to respond, it automatically serves dummy data.
- **Location:** `frontend/src/api.js`.
- **Impact:** Users may think their actions (like saving a profile) succeeded when they actually failed. It also makes debugging backend connectivity issues extremely difficult.
- **Correction:** Remove `callOrMock`. Implement proper error handling and retry logic. Show clear "Backend Connection Error" messages to the user.

### 2.2 Artificial Delays in AI Services
- **Issue:** `aiService.js` and `api.js` use `setTimeout` to simulate "thinking" time for mock responses.
- **Location:** `backend/services/aiService.js`, `frontend/src/api.js`.
- **Impact:** Artificially slows down the user experience.
- **Correction:** Remove artificial delays. Mock data should return instantly in development, and production should rely on the actual API performance.

### 2.3 LocalStorage Fallback for Ratings
- **Issue:** If a candidate is not found in the Prisma DB during rating submission, the backend returns success but logs a warning that data is only stored in `localStorage`.
- **Location:** `backend/routes/users.js` (`POST /:id/rating`).
- **Impact:** Permanent loss of feedback data if the student clears their browser cache.
- **Correction:** Ensure all valid candidates are persisted in Prisma before allowing ratings. The backend should return a 404 error if a user record is missing, rather than a "silent success."

### 2.4 Unintentional Data Overwrites
- **Issue:** The `PATCH /users/:id/profile` route merges incoming data into the `profile_data` JSON blob. However, if multiple tabs are open or concurrent updates happen, the "read-merge-write" pattern lacks atomic protection (locking).
- **Location:** `backend/routes/users.js`.
- **Impact:** Potential data loss where the last write wins, overwriting changes from other sessions.
- **Correction:** Use database-level JSON merges (if supported by the DB) or implement optimistic locking with a version column.

---

## 3. UI/UX & Responsiveness

### 3.1 Portal Card Truncation on Mobile
- **Issue:** At 375px width (mobile), the text inside the Student/Alumni/TNP portal cards is truncated or overflows, making the labels unreadable.
- **Location:** `frontend/src/pages/LandingPage.jsx`.
- **Correction:** Use `flex-wrap` and adjust font sizes for small screens using Tailwind's `sm:` and `md:` prefixes.

### 3.2 Accessibility (A11y) Gaps
- **Issue:** Missing `aria-label` on icons and buttons. Form inputs lack associated `<label>` tags in several dashboard modals.
- **Location:** Throughout `frontend/src/components/`.
- **Correction:** Add ARIA attributes and ensure all interactive elements have descriptive labels for screen readers.

### 3.3 Missing Loading States
- **Issue:** Some dashboard components (like `AlumniDiscovery`) show an empty screen or mock data while waiting for real API responses without a clear spinner or skeleton.
- **Correction:** Implement a consistent `SkeletonLoader` component for all data-driven sections.

---

## 4. Performance & Architecture

### 4.1 Synchronous File Processing
- **Issue:** Large resume PDFs are processed synchronously in the AI analysis route.
- **Risk:** Can block the Node.js event loop for other users.
- **Correction:** Use a worker queue (like `bullmq`) for CPU-intensive document analysis.

### 4.2 Redundant Prisma Queries
- **Issue:** The `/stats/platform` and `/stats/analytics` routes perform many independent `prisma.count()` queries sequentially.
- **Correction:** Group these using `Promise.all` (partially implemented, but can be optimized further).

### 4.3 Database Sync Inconsistency
- **Issue:** The app uses Supabase for Authentication but Prisma (SQLite/PostgreSQL) for user metadata. There is no automated sync/webhook to ensure a user deleted in Supabase is removed from Prisma, or vice versa.
- **Location:** `backend/routes/users.js` tries to handle this manually in a `bulk` delete, but it's not exhaustive.
- **Risk:** "Orphaned" users in Prisma that cannot log in, or Supabase users with no profile data.
- **Correction:** Implement Supabase Webhooks to trigger Prisma updates on Auth events.
