# AlumNEX Mentorship System — Implementation Plan

> Based on current codebase at `AlumNEX2.0/` and the new requirements discussed.
> This document covers every feature, the DB changes, backend routes, and frontend changes needed.

---

## 1. PROBLEM SUMMARY (Current vs Target)

| Area | Current | Target |
|------|---------|--------|
| Student requests | Unlimited, no cap | Max 5/week, smart refill |
| Alumni availability | Not defined | Alumni sets weekly time slots |
| Slot booking | Alumni picks any time | Student picks from alumni's slots |
| Alumni capacity | Unlimited accepts | Alumni sets max interviews/week |
| No-show handling | Nothing | Waiting list + auto-notify |
| Request overflow | Alumni sees all | Stop sending once alumni is full |

---

## 2. CORE CONCEPTS

### 2A. Student Weekly Request Budget
- Each student gets **5 request tokens per week** (Mon 00:00 → Sun 23:59 IST)
- A token is **consumed** when a request is sent
- A token is **NOT refunded** if alumni declines (discourages spam)
- **Exception:** If a student has 0 accepted interviews that week AND all 5 were declined → grant +3 bonus tokens (so they can still get at least 1 interview)
- Token count resets every Monday at midnight

### 2B. Alumni Availability Slots
- Alumni defines recurring weekly windows: e.g. "Saturday 5–7 PM, Sunday 9–10 PM"
- Alumni also sets **max interviews per week** (e.g. 3)
- Students see these windows on the alumni card in discovery
- Student picks a specific 30-min or 1-hr slot within that window
- Alumni does NOT manually pick the time anymore — they just confirm or decline

### 2C. Alumni Capacity Cap
- Once alumni has accepted `max_interviews_per_week` requests → their card shows "Fully Booked This Week"
- New requests are NOT sent to a fully booked alumni (frontend blocks it)
- Requests already pending when alumni hits cap → go to **Waiting List**

### 2D. Waiting List
- If alumni is at capacity, student's request status = `WAITING`
- If a booked student cancels or no-shows → first WAITING student gets auto-notified
- Alumni can also manually promote from waiting list

### 2E. No-Show Handling
- If interview time passes and no `COMPLETED` record exists → system marks as `NO_SHOW` after 30 min
- No-show student loses 2 tokens from next week's budget
- Alumni slot opens up → next WAITING student is auto-promoted

---

## 3. DATABASE CHANGES

### 3A. New columns on `users` table

```sql
-- Add to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS
  weekly_request_tokens    int     NOT NULL DEFAULT 5;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS
  tokens_reset_at          timestamptz;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS
  max_interviews_per_week  int     DEFAULT 3;   -- alumni only

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS
  availability_slots       jsonb;               -- alumni only
-- Format: [{ day: "saturday", start: "17:00", end: "19:00", duration_mins: 60 }]
```

### 3B. New table: `weekly_request_tracker`

```sql
CREATE TABLE IF NOT EXISTS public.weekly_request_tracker (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start      date NOT NULL,          -- Monday of the week (IST)
  tokens_used     int  NOT NULL DEFAULT 0,
  bonus_granted   boolean NOT NULL DEFAULT false,
  interviews_done int  NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, week_start)
);
```

### 3C. New status values on `interview_requests`

```sql
-- Extend the status check constraint
ALTER TABLE public.interview_requests
  DROP CONSTRAINT IF EXISTS interview_requests_status_check;

ALTER TABLE public.interview_requests
  ADD CONSTRAINT interview_requests_status_check
  CHECK (status IN (
    'PENDING',
    'ACCEPTED',
    'SLOT_BOOKED',
    'DECLINED',
    'WAITING',       -- NEW: alumni at capacity
    'CANCELLED',     -- NEW: student cancelled
    'NO_SHOW',       -- NEW: student didn't join
    'COMPLETED'      -- NEW: interview done
  ));
```

### 3D. New table: `alumni_availability`

```sql
CREATE TABLE IF NOT EXISTS public.alumni_availability (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumni_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week     text NOT NULL,   -- 'monday','tuesday',...,'sunday'
  start_time      time NOT NULL,   -- e.g. 17:00
  end_time        time NOT NULL,   -- e.g. 19:00
  slot_duration   int  NOT NULL DEFAULT 60,  -- minutes per interview
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(alumni_id, day_of_week, start_time)
);
```

### 3E. New table: `booked_slots`

```sql
-- Tracks which specific time slot a student has booked
CREATE TABLE IF NOT EXISTS public.booked_slots (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id      uuid NOT NULL REFERENCES public.interview_requests(request_id) ON DELETE CASCADE,
  alumni_id       uuid NOT NULL REFERENCES public.users(id),
  student_id      uuid NOT NULL REFERENCES public.users(id),
  slot_start      timestamptz NOT NULL,
  slot_end        timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'BOOKED'
                  CHECK (status IN ('BOOKED','COMPLETED','NO_SHOW','CANCELLED')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

---

## 4. BACKEND ROUTES (New / Modified)

### 4A. Token Management

```js
// GET /requests/tokens/:studentId
// Returns current week's token balance for a student
router.get('/tokens/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const weekStart = getWeekStart(); // Monday 00:00 IST

  let tracker = await prisma.weeklyRequestTracker.findUnique({
    where: { student_id_week_start: { student_id: studentId, week_start: weekStart } }
  });

  if (!tracker) {
    // First request this week — create fresh tracker
    tracker = await prisma.weeklyRequestTracker.create({
      data: { student_id: studentId, week_start: weekStart, tokens_used: 0 }
    });
  }

  const MAX_TOKENS = 5;
  const bonus = tracker.bonus_granted ? 3 : 0;
  const remaining = Math.max(0, MAX_TOKENS + bonus - tracker.tokens_used);

  res.json({ remaining, used: tracker.tokens_used, max: MAX_TOKENS + bonus, weekStart });
});
```

### 4B. Send Request (with token check)

```js
// POST /requests  (modified)
// Before creating request, check token balance
router.post('/', async (req, res) => {
  const { studentId, alumniId, topic, message, studentProfileSnapshot } = req.body;
  const weekStart = getWeekStart();

  // 1. Check token balance
  const tracker = await getOrCreateTracker(studentId, weekStart);
  const MAX = 5 + (tracker.bonus_granted ? 3 : 0);
  if (tracker.tokens_used >= MAX) {
    return res.status(429).json({
      error: 'weekly_limit_reached',
      message: 'You have used all 5 request tokens for this week. Tokens reset every Monday.',
      resetsAt: getNextMonday(),
    });
  }

  // 2. Check alumni capacity
  const alumniAccepted = await countAcceptedThisWeek(alumniId);
  const alumni = await prisma.user.findUnique({ where: { id: alumniId } });
  const maxInterviews = alumni.max_interviews_per_week || 3;

  const status = alumniAccepted >= maxInterviews ? 'WAITING' : 'PENDING';

  // 3. Create request
  const request = await prisma.interviewRequest.create({
    data: { student_id: studentId, alumni_id: alumniId, topic, message,
            student_profile_snapshot: studentProfileSnapshot, status }
  });

  // 4. Consume token
  await prisma.weeklyRequestTracker.update({
    where: { student_id_week_start: { student_id: studentId, week_start: weekStart } },
    data: { tokens_used: { increment: 1 } }
  });

  // 5. Notify alumni (only if PENDING, not WAITING)
  if (status === 'PENDING') {
    await createNotification({ userId: alumniId, type: 'NEW_REQUEST', ... });
  }

  res.json({ ...request, status });
});
```

### 4C. Alumni Availability CRUD

```js
// GET  /alumni/:id/availability  — public, shown on discovery card
// POST /alumni/:id/availability  — alumni sets their slots
// PUT  /alumni/:id/availability/:slotId  — update a slot
// DELETE /alumni/:id/availability/:slotId

// POST /alumni/:id/settings  — set max_interviews_per_week
router.post('/:id/settings', async (req, res) => {
  const { maxInterviewsPerWeek } = req.body;
  await prisma.user.update({
    where: { id: req.params.id },
    data: { max_interviews_per_week: maxInterviewsPerWeek }
  });
  res.json({ success: true });
});
```

### 4D. Slot Booking (student picks from alumni's window)

```js
// POST /requests/:id/book-slot
// Student picks a specific time within alumni's availability window
router.post('/:id/book-slot', async (req, res) => {
  const { slotStart, slotEnd } = req.body;  // chosen by student
  const request = await prisma.interviewRequest.findUnique({ where: { request_id: req.params.id } });

  // Validate: slotStart must fall within alumni's availability window
  const isValid = await validateSlotAgainstAvailability(request.alumni_id, slotStart, slotEnd);
  if (!isValid) return res.status(400).json({ error: 'Slot outside alumni availability window' });

  // Check no conflict with existing booked_slots
  const conflict = await checkSlotConflict(request.alumni_id, slotStart, slotEnd);
  if (conflict) return res.status(409).json({ error: 'Slot already taken' });

  // Book it
  await prisma.bookedSlot.create({
    data: { request_id: req.params.id, alumni_id: request.alumni_id,
            student_id: request.student_id, slot_start: slotStart, slot_end: slotEnd }
  });

  await prisma.interviewRequest.update({
    where: { request_id: req.params.id },
    data: { status: 'SLOT_BOOKED', scheduled_time: slotStart }
  });

  // Notify both parties
  await notifyBothParties(request, slotStart);
  res.json({ success: true, slotStart, slotEnd });
});
```

### 4E. No-Show Detection (cron job)

```js
// Run every 15 minutes via a cron or Supabase Edge Function
async function detectNoShows() {
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

  const overdueSlots = await prisma.bookedSlot.findMany({
    where: {
      slot_end: { lt: thirtyMinsAgo },
      status: 'BOOKED',
    },
    include: { request: true }
  });

  for (const slot of overdueSlots) {
    // Check if interview_record exists with COMPLETED status
    const record = await prisma.interviewRecord.findFirst({
      where: { request_id: slot.request_id, status: 'COMPLETED' }
    });

    if (!record) {
      // Mark as NO_SHOW
      await prisma.bookedSlot.update({ where: { id: slot.id }, data: { status: 'NO_SHOW' } });
      await prisma.interviewRequest.update({
        where: { request_id: slot.request_id }, data: { status: 'NO_SHOW' }
      });

      // Penalise student: -2 tokens next week
      await penaliseStudent(slot.student_id);

      // Promote next WAITING student
      await promoteWaitingStudent(slot.alumni_id);
    }
  }
}
```

### 4F. Bonus Token Grant

```js
// Called at end of week (Sunday 23:59) or on next Monday's first request
async function checkAndGrantBonusTokens(studentId) {
  const weekStart = getWeekStart();
  const tracker = await getOrCreateTracker(studentId, weekStart);

  if (tracker.bonus_granted) return; // already granted
  if (tracker.interviews_done > 0) return; // had at least one interview

  // Count how many of their 5 requests were declined
  const declined = await prisma.interviewRequest.count({
    where: {
      student_id: studentId,
      status: 'DECLINED',
      created_at: { gte: weekStart }
    }
  });

  if (declined >= 5 && tracker.tokens_used >= 5) {
    // All 5 used, all declined, no interview → grant 3 bonus tokens
    await prisma.weeklyRequestTracker.update({
      where: { student_id_week_start: { student_id: studentId, week_start: weekStart } },
      data: { bonus_granted: true }
    });
    await createNotification({
      userId: studentId,
      type: 'SYSTEM',
      title: '3 Bonus Tokens Granted 🎁',
      message: 'All your requests were declined this week. We\'ve added 3 bonus tokens so you can keep trying!'
    });
  }
}
```

---

## 5. FRONTEND CHANGES

### 5A. Alumni Discovery Card — Show Availability

```jsx
// In AlumniDiscovery.jsx — add to each alumni card
function AvailabilityBadge({ availability, maxInterviews, acceptedThisWeek }) {
  const isFullyBooked = acceptedThisWeek >= maxInterviews;
  const nextSlot = getNextAvailableSlot(availability); // compute from availability array

  if (isFullyBooked) {
    return (
      <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
                    borderRadius: 8, padding: '0.4rem 0.75rem', fontSize: '0.7rem', color: '#ffb4ab' }}>
        🔴 Fully Booked This Week
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(78,222,163,0.08)', border: '1px solid rgba(78,222,163,0.2)',
                  borderRadius: 8, padding: '0.4rem 0.75rem', fontSize: '0.7rem', color: '#4edea3' }}>
      🟢 Next: {nextSlot}  •  {maxInterviews - acceptedThisWeek} slots left
    </div>
  );
}
```

### 5B. Student Token Counter (Dashboard)

```jsx
// In Dashboard.jsx — show in the Pipeline section
function TokenCounter({ remaining, max, resetsAt }) {
  return (
    <div style={{ background: '#131b2e', borderRadius: 12, padding: '1rem', border: '1px solid rgba(195,192,255,0.15)' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#c7c4d8', marginBottom: 6 }}>
        Weekly Request Tokens
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} style={{
            width: 28, height: 28, borderRadius: 6,
            background: i < remaining ? 'rgba(195,192,255,0.2)' : 'rgba(70,69,85,0.2)',
            border: `1px solid ${i < remaining ? 'rgba(195,192,255,0.4)' : 'rgba(70,69,85,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', color: i < remaining ? '#c3c0ff' : '#464555'
          }}>
            {i < remaining ? '●' : '○'}
          </div>
        ))}
      </div>
      <div style={{ fontSize: '0.7rem', color: '#c7c4d8' }}>
        {remaining}/{max} tokens left · Resets {formatDate(resetsAt)}
      </div>
    </div>
  );
}
```

### 5C. Slot Picker Modal (Student books from alumni's window)

```jsx
// New component: SlotPickerModal.jsx
// Shown when student clicks "Book Interview" on an alumni card
function SlotPickerModal({ alumni, onBook, onClose }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const slots = generateSlotsFromAvailability(alumni.availability); // expand recurring windows into actual dates

  return (
    <div style={{ /* modal overlay */ }}>
      <h3>Pick a time with {alumni.name}</h3>
      <p style={{ color: '#c7c4d8', fontSize: '0.8rem' }}>
        {alumni.name} is available at these times. Pick one that works for you.
      </p>

      {/* Group by date */}
      {groupByDate(slots).map(({ date, times }) => (
        <div key={date}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c7c4d8', marginBottom: 6 }}>{date}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {times.map(slot => (
              <button
                key={slot.start}
                onClick={() => setSelectedSlot(slot)}
                disabled={slot.taken}
                style={{
                  padding: '0.4rem 0.875rem',
                  background: selectedSlot?.start === slot.start
                    ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)'
                    : slot.taken ? '#222a3d' : 'rgba(195,192,255,0.08)',
                  color: slot.taken ? '#464555' : selectedSlot?.start === slot.start ? '#1d00a5' : '#c3c0ff',
                  border: `1px solid ${slot.taken ? 'rgba(70,69,85,0.2)' : 'rgba(195,192,255,0.3)'}`,
                  borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                  cursor: slot.taken ? 'not-allowed' : 'pointer'
                }}
              >
                {formatTime(slot.start)} – {formatTime(slot.end)}
                {slot.taken && ' (Taken)'}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={() => onBook(selectedSlot)}
        disabled={!selectedSlot}
        style={{ /* confirm button */ }}
      >
        Confirm Slot
      </button>
    </div>
  );
}
```

### 5D. Alumni Settings — Availability + Capacity

```jsx
// New section in SettingsPage.jsx for ALUMNI role
function AlumniAvailabilitySettings({ user }) {
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const [slots, setSlots] = useState([]);
  const [maxInterviews, setMaxInterviews] = useState(3);

  return (
    <div>
      <h3>My Availability</h3>
      <p style={{ color: '#c7c4d8', fontSize: '0.8rem' }}>
        Set the days and times you're available for mock interviews.
        Students will only be able to book within these windows.
      </p>

      {DAYS.map(day => (
        <DaySlotRow
          key={day}
          day={day}
          slots={slots.filter(s => s.day_of_week === day.toLowerCase())}
          onAdd={(start, end) => addSlot(day, start, end)}
          onRemove={(slotId) => removeSlot(slotId)}
        />
      ))}

      <div style={{ marginTop: '1.5rem' }}>
        <label>Max interviews per week</label>
        <select value={maxInterviews} onChange={e => setMaxInterviews(Number(e.target.value))}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <p style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>
          Once you've accepted this many interviews, your profile shows "Fully Booked" for the week.
          We'll still receive more requests than this limit so you have options to choose from.
        </p>
      </div>

      <button onClick={saveAvailability}>Save Availability</button>
    </div>
  );
}
```

### 5E. Waiting List UI (Alumni Dashboard)

```jsx
// In AlumniDashboard.jsx — add a "Waiting" tab alongside "Pending"
function WaitingListSection({ waitingRequests, onPromote }) {
  return (
    <div>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', marginBottom: 8 }}>
        Waiting List ({waitingRequests.length})
      </div>
      <p style={{ fontSize: '0.75rem', color: '#c7c4d8', marginBottom: '1rem' }}>
        These students are waiting for a slot to open up. If someone cancels, the first student here gets auto-notified.
        You can also manually promote someone.
      </p>
      {waitingRequests.map(req => (
        <div key={req.id} style={{ /* card */ }}>
          <span>{req.studentName}</span>
          <button onClick={() => onPromote(req.id)}>Promote to Pending</button>
        </div>
      ))}
    </div>
  );
}
```

---

## 6. FLOW DIAGRAMS

### 6A. Student Sends a Request

```
Student clicks "Book Interview" on alumni card
  │
  ├─ Check: tokens_remaining > 0?
  │     NO  → Show "No tokens left. Resets Monday." modal
  │     YES → Open SlotPickerModal
  │
  ├─ Student picks a time slot from alumni's availability window
  │
  ├─ Check: alumni.accepted_this_week >= alumni.max_interviews_per_week?
  │     YES → status = WAITING  → "You're on the waiting list"
  │     NO  → status = PENDING  → "Request sent!"
  │
  └─ Consume 1 token from student's weekly budget
```

### 6B. Alumni Accepts a Request

```
Alumni sees PENDING request in dashboard
  │
  ├─ Alumni clicks "Accept"
  │     → status = ACCEPTED
  │     → Student notified: "Your request was accepted! Pick a slot."
  │
  ├─ Student picks final slot (within alumni's window)
  │     → status = SLOT_BOOKED
  │     → Both get calendar notification
  │
  └─ If alumni is now at max_interviews_per_week:
       → All remaining PENDING requests → WAITING
       → Alumni card shows "Fully Booked"
```

### 6C. No-Show / Cancellation

```
Interview time passes (slot_end + 30 min)
  │
  ├─ Check: interview_record with COMPLETED status exists?
  │     YES → All good, mark slot COMPLETED
  │     NO  → Mark as NO_SHOW
  │           → Student loses 2 tokens next week
  │           → Alumni slot opens up
  │           → First WAITING student gets notified: "A slot opened up!"
  │
  └─ Student cancels before interview:
       → status = CANCELLED
       → Token NOT refunded (prevents gaming)
       → Alumni slot opens → WAITING student promoted
```

### 6D. Bonus Token Grant

```
Every Monday at 00:00 IST (or on first action of the week):
  │
  ├─ For each student:
  │     tokens_used = 5 AND interviews_done = 0 AND all_declined = true?
  │         YES → Grant 3 bonus tokens + notify student
  │         NO  → Reset to fresh 5 tokens for new week
  │
  └─ Penalty check:
       Had a NO_SHOW last week?
           YES → Start with 3 tokens instead of 5 this week
```

---

## 7. ALUMNI AVAILABILITY — HOW SLOTS WORK

### The Problem You Raised
> "We use Google Meet which depends on the person when they want to end — how to tackle?"

### Solution: Soft Time Blocks + Alumni Awareness

1. **Alumni sets a window** (e.g. Saturday 5–7 PM = 2 hours)
2. **System divides it into slots** based on `slot_duration` (e.g. 60 min = 2 slots: 5–6 PM, 6–7 PM)
3. **Student books one slot** — they know the expected end time
4. **Google Meet has no hard cutoff** — alumni is trusted to end on time
5. **Buffer time** — system adds 15 min buffer between slots automatically
6. **Alumni dashboard shows** their next slot countdown so they're aware

```
Alumni sets: Saturday 5:00 PM – 7:00 PM, 60 min slots
System generates:
  Slot 1: 5:00 PM – 6:00 PM  [OPEN]
  Slot 2: 6:15 PM – 7:15 PM  [OPEN]  ← 15 min buffer added

Student books Slot 1 → Slot 1 becomes [BOOKED]
Another student books Slot 2 → Slot 2 becomes [BOOKED]
```

### Reschedule Flow (Already Exists — Keep It)
- Alumni can still reschedule within their own availability window
- Student gets notified of the new time
- If student can't make it → they can cancel (token not refunded)

---

## 8. HOW MANY REQUESTS TO SEND TO ALUMNI?

### Your Question
> "We should send more requests than alumni will accept so they have options — but stop when they're full?"

### Answer: Overflow Buffer = 2x capacity

```
alumni.max_interviews_per_week = 3
→ Accept up to 3 PENDING requests at a time
→ Allow up to 6 total requests (3 PENDING + 3 WAITING)
→ Once 6 requests exist → block new requests to this alumni this week
→ Show "Fully Booked" on alumni card
```

This gives alumni:
- Enough options to choose from (not just 3 requests for 3 slots)
- Protection from being spammed (hard cap at 2x)
- A waiting list that auto-fills if someone drops out

---

## 9. PRIORITY ORDER FOR IMPLEMENTATION

### Phase 1 — Core Limits (1–2 days)
1. Add `weekly_request_tracker` table to Supabase
2. Add token check in `POST /requests` backend route
3. Show token counter on student dashboard
4. Block "Book Interview" button when tokens = 0

### Phase 2 — Alumni Availability (2–3 days)
1. Add `alumni_availability` table
2. Add availability CRUD routes
3. Add availability settings UI in alumni settings
4. Show availability on alumni discovery card

### Phase 3 — Student Slot Picker (2 days)
1. Build `SlotPickerModal` component
2. Add `POST /requests/:id/book-slot` route
3. Add `booked_slots` table
4. Replace alumni-picks-time with student-picks-time flow

### Phase 4 — Waiting List (1–2 days)
1. Add `WAITING` status to requests
2. Show waiting list in alumni dashboard
3. Auto-promote on cancellation/no-show

### Phase 5 — No-Show Detection (1 day)
1. Add cron job (Supabase Edge Function or backend interval)
2. Mark NO_SHOW after 30 min past slot_end
3. Penalise student tokens
4. Auto-promote waiting student

### Phase 6 — Bonus Tokens (1 day)
1. Add bonus token grant logic
2. Weekly reset cron
3. Notify student of bonus

---

## 10. WHAT GOOD MENTORSHIP PLATFORMS DO (Reference)

| Platform | Feature | How AlumNEX Should Do It |
|----------|---------|--------------------------|
| Topmate | Mentor sets price + slots, mentee books | Alumni sets slots, student picks → ✅ Phase 2-3 |
| ADPList | Mentor sets weekly capacity | `max_interviews_per_week` → ✅ Phase 1 |
| Calendly | Invitee picks from available slots | `SlotPickerModal` → ✅ Phase 3 |
| MentorCruise | Waitlist when mentor is full | `WAITING` status → ✅ Phase 4 |
| Lunchclub | Auto-match + auto-schedule | Future: AI-suggested slots |

---

## 11. SUMMARY OF NEW DB TABLES

```
weekly_request_tracker  — tracks student's weekly token usage
alumni_availability     — alumni's recurring weekly windows
booked_slots            — specific time slots that are booked
```

## 12. SUMMARY OF MODIFIED DB COLUMNS

```
users.weekly_request_tokens     — current token balance (default 5)
users.tokens_reset_at           — when tokens were last reset
users.max_interviews_per_week   — alumni capacity setting
users.availability_slots        — legacy jsonb (replaced by alumni_availability table)
interview_requests.status       — add WAITING, CANCELLED, NO_SHOW, COMPLETED
```

---

*This plan is designed to be implemented incrementally. Start with Phase 1 (token limits) as it has the most immediate impact on preventing abuse, then move to Phase 2-3 (availability + slot picker) which improves the alumni experience.*
