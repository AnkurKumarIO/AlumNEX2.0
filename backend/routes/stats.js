const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, verifyRole } = require('../lib/authMiddleware');

// Protected administrative routes (require TNP role)
const tnpOnly = [authenticate, verifyRole('TNP')];

// GET /stats/platform — TNP dashboard overview stats
router.get('/platform', async (req, res) => {
  try {
    const [totalStudents, activeMentors, mockInterviews, scheduledRequests] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', verification_status: 'VERIFIED' } }),
      prisma.user.count({ where: { role: 'ALUMNI',  verification_status: 'VERIFIED' } }),
      prisma.interviewRecord.count(),
      prisma.interviewRequest.count({ where: { status: 'SLOT_BOOKED' } }),
    ]);

    res.json({
      total_students:  totalStudents,
      active_mentors:  activeMentors,
      mock_interviews: mockInterviews,
      scheduled_today: scheduledRequests,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/interviews?userId= — interview records for a student
router.get('/interviews', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const data = await prisma.interviewRecord.findMany({
      where: { student_id: userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/mentorship — mentorship-focused analytics for TNP
router.get('/mentorship', async (req, res) => {
  try {
    const [sessionsCompleted, sessionsPending, activeMentors, totalStudents] = await Promise.all([
      prisma.interviewRecord.count(),
      prisma.interviewRequest.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'ALUMNI',  verification_status: 'VERIFIED' } }),
      prisma.user.count({ where: { role: 'STUDENT', verification_status: 'VERIFIED' } }),
    ]);

    res.json({
      sessions_completed: sessionsCompleted,
      sessions_pending:   sessionsPending,
      active_mentors:     activeMentors,
      total_students:     totalStudents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/directory — full user directory for TNP Admin (students + alumni)
router.get('/directory', tnpOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['STUDENT', 'ALUMNI'] },
        verification_status: 'VERIFIED',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        username: true,
        department: true,
        profile_data: true,
        is_banned: true,
        createdAt: true,
        updatedAt: true,
        // Include relation counts for interview activity
        _count: {
          select: {
            sent_requests: true,
            received_requests: true,
            student_interviews: true,
            alumni_interviews: true,
            student_sessions: true,
            alumni_sessions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const students = [];
    const alumni   = [];

    for (const u of users) {
      let profile = {};
      try { profile = JSON.parse(u.profile_data || '{}'); } catch {}

      const base = {
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        department: u.department,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        is_banned: u.is_banned,
        profile,
      };

      if (u.role === 'STUDENT') {
        students.push({
          ...base,
          rollNo:    profile.rollNo    || profile.username || u.username || '',
          college:   profile.college   || '',
          year:      profile.year      || '',
          cgpa:      profile.cgpa      || '',
          skills:    profile.skills    || [],
          sessions:  u._count.sent_requests,
          interviews: u._count.student_interviews,
        });
      } else {
        alumni.push({
          ...base,
          company:   profile.company   || '',
          jobTitle:  profile.jobTitle  || '',
          batchYear: profile.batchYear || '',
          linkedin:  profile.linkedin  || '',
          sessions:  u._count.received_requests,
          interviews: u._count.alumni_interviews,
          averageRating: profile.averageRating || null,
          totalRatings:  profile.totalRatings  || 0,
        });
      }
    }

    res.json({ students, alumni });
  } catch (err) {
    console.error('Directory fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/directory/user/:id — single user detail for TNP drill-down
router.get('/directory/user/:id', tnpOnly, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        sent_requests:      { orderBy: { createdAt: 'desc' } },
        received_requests:  { orderBy: { createdAt: 'desc' } },
        student_interviews: { orderBy: { createdAt: 'desc' }, include: { student: true, alumni: true } },
        alumni_interviews:  { orderBy: { createdAt: 'desc' }, include: { student: true, alumni: true } },
        student_sessions:   { orderBy: { createdAt: 'desc' } },
        alumni_sessions:    { orderBy: { createdAt: 'desc' } },
        profile_assets:     true
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profile = {};
    try { profile = JSON.parse(user.profile_data || '{}'); } catch {}

    // Combine sessions into a unified list
    const sessions = user.role === 'STUDENT' ? user.student_sessions : user.alumni_sessions;
    const interviews = user.role === 'STUDENT' ? user.student_interviews : user.alumni_interviews;

    res.json({
      ...user,
      profile_data: profile,
      unified_sessions: sessions,
      unified_interviews: interviews
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/recent-activity — live activity for TNP notification bell
router.get('/recent-activity', async (req, res) => {
  try {
    // Pull latest notifications (all users) for TNP admin overview
    // Prefer TNP-targeted notifications; exclude personal student/alumni ones
    // that have a matching TNP notification for the same request.
    const allNotifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        user: { select: { name: true, role: true } },
      },
    });

    // Find the TNP user so we can identify TNP-targeted notifications
    const tnpUser = await prisma.user.findFirst({ where: { role: 'TNP' }, select: { id: true } }).catch(() => null);
    const tnpUserId = tnpUser?.id || 'tnp-001'; // fallback to hardcoded ID

    // Collect request_ids that have a TNP-specific notification
    const tnpNotifRequestIds = new Set(
      allNotifications
        .filter(n => n.user_id === tnpUserId && n.request_id)
        .map(n => n.request_id)
    );

    // Filter: keep only TNP-targeted notifications + non-request system ones.
    // For slot/meeting events, ONLY show the TNP-specific notification (not personal student/alumni ones).
    const notifications = allNotifications.filter(n => {
      // Always show TNP-targeted notifications
      if (n.user_id === tnpUserId) return true;
      // Show general system notifications (no request_id)
      if (!n.request_id) return true;
      // Drop all personal student/alumni slot/meeting notifications — TNP has its own
      if (n.type === 'SLOT_BOOKED' || n.type === 'SLOT_BOOKED_ALUMNI' ||
          n.type === 'MEETING_LIVE' || n.type === 'ACCEPTED' || n.type === 'DECLINED') {
        return false;
      }
      // Show NEW_REQUEST notifications (alumni receives these — useful for TNP overview)
      return true;
    }).slice(0, 20);

    // Also pull latest registration events
    const recentUsers = await prisma.user.findMany({
      where: { role: { in: ['STUDENT', 'ALUMNI'] } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, role: true, department: true, createdAt: true },
    });

    const activity = [];

    // Map notifications to activity items
    for (const n of notifications) {
      const iconMap = {
        NEW_REQUEST: 'mail', ACCEPTED: 'check_circle', DECLINED: 'cancel',
        SLOT_BOOKED: 'event_available', SLOT_BOOKED_ALUMNI: 'event_available',
        MEETING_LIVE: 'videocam',
      };
      const colorMap = {
        NEW_REQUEST: '#c3c0ff', ACCEPTED: '#4edea3', DECLINED: '#ffb4ab',
        SLOT_BOOKED: '#ffb95f', SLOT_BOOKED_ALUMNI: '#ffb95f',
        MEETING_LIVE: '#60a5fa',
      };
      activity.push({
        id: n.id,
        icon: iconMap[n.type] || 'notifications',
        color: colorMap[n.type] || '#c7c4d8',
        title: n.title,
        desc: n.message,
        time: n.createdAt,
        category: n.type?.includes('SLOT') || n.type?.includes('MEETING') ? 'Interview' : 'Mentorship',
      });
    }

    // Map recent registrations
    for (const u of recentUsers) {
      activity.push({
        id: `reg-${u.id}`,
        icon: u.role === 'STUDENT' ? 'school' : 'person_add',
        color: u.role === 'STUDENT' ? '#60a5fa' : '#4edea3',
        title: `New ${u.role === 'STUDENT' ? 'Student' : 'Alumni Mentor'} Registered`,
        desc: `${u.name} (${u.department || 'General'}) account created.`,
        time: u.createdAt,
        category: u.role === 'STUDENT' ? 'Student' : 'Alumni',
      });
    }

    // Sort all by time and return top 20
    activity.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json(activity.slice(0, 20));
  } catch (err) {
    console.error('Recent activity error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/analytics — full analytics data for the TNP Analytics tab
router.get('/analytics', tnpOnly, async (req, res) => {
  try {
    const now = new Date();

    // ── 1. KPI counts ────────────────────────────────────────────────────────
    const [
      sessionsCompleted,
      sessionsPending,
      activeMentors,
      totalStudents,
    ] = await Promise.all([
      prisma.sessionFeedback.count(),
      prisma.interviewRequest.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'ALUMNI',  verification_status: 'VERIFIED' } }),
      prisma.user.count({ where: { role: 'STUDENT', verification_status: 'VERIFIED' } }),
    ]);

    // Avg rating from session feedback
    const allRatings = await prisma.sessionFeedback.findMany({
      where: { student_rating: { not: null } },
      select: { student_rating: true },
    });
    const avgRating = allRatings.length
      ? Math.round((allRatings.reduce((s, r) => s + (r.student_rating || 0), 0) / allRatings.length) * 10) / 10
      : null;

    // Completion rate = completed sessions / total requests
    const totalRequests = await prisma.interviewRequest.count();
    const completionRate = totalRequests > 0
      ? Math.round((sessionsCompleted / totalRequests) * 100)
      : 0;

    // ── 2. Weekly session volume (last 8 weeks) ───────────────────────────────
    const weeklySessions = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7 - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const count = await prisma.sessionFeedback.count({
        where: { createdAt: { gte: weekStart, lt: weekEnd } },
      });

      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      weeklySessions.push({ week: label, sessions: count });
    }

    // ── 3. Domain demand — top topics from interview requests ────────────────
    const requests = await prisma.interviewRequest.findMany({
      select: { topic: true },
    });
    const topicCounts = {};
    for (const r of requests) {
      const t = (r.topic || 'General').trim();
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    }
    const totalTopics = requests.length || 1;
    const domainData = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([domain, sessions]) => ({
        domain,
        sessions,
        pct: Math.round((sessions / totalTopics) * 100),
      }));

    // ── 4. Top mentors by sessions + rating ──────────────────────────────────
    const alumniUsers = await prisma.user.findMany({
      where: { role: 'ALUMNI', verification_status: 'VERIFIED' },
      select: {
        id: true, name: true, profile_data: true, department: true,
        _count: { select: { received_requests: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const feedbackRows = await prisma.sessionFeedback.findMany({
      where: { student_rating: { not: null } },
      select: { alumni_id: true, student_rating: true },
    });
    const ratingMap = {};
    const ratingCount = {};
    for (const f of feedbackRows) {
      if (!f.alumni_id) continue;
      ratingMap[f.alumni_id] = (ratingMap[f.alumni_id] || 0) + f.student_rating;
      ratingCount[f.alumni_id] = (ratingCount[f.alumni_id] || 0) + 1;
    }

    const topMentors = alumniUsers
      .map(u => {
        let profile = {};
        try { profile = JSON.parse(u.profile_data || '{}'); } catch {}
        const sessions = u._count.received_requests;
        const avgR = ratingCount[u.id]
          ? Math.round((ratingMap[u.id] / ratingCount[u.id]) * 10) / 10
          : null;
        return {
          id: u.id,
          name: u.name,
          company: profile.company || u.department || 'Alumni',
          sessions,
          rating: avgR,
          domain: (profile.skills || [])[0] || profile.jobTitle || 'General',
        };
      })
      .filter(m => m.sessions > 0 || m.rating !== null)
      .sort((a, b) => (b.sessions - a.sessions) || ((b.rating || 0) - (a.rating || 0)))
      .slice(0, 10);

    // ── 5. Rating distribution ────────────────────────────────────────────────
    const ratingDist = [5, 4, 3, 2, 1].map(star => {
      const count = feedbackRows.filter(f => f.student_rating === star).length;
      return {
        stars: `${star} ★`,
        count,
        pct: allRatings.length > 0 ? Math.round((count / allRatings.length) * 100) : 0,
      };
    });

    // ── 6. Student progress groups ────────────────────────────────────────────
    const studentUsers = await prisma.user.findMany({
      where: { role: 'STUDENT', verification_status: 'VERIFIED' },
      select: {
        id: true,
        _count: { select: { sent_requests: true } },
      },
    });

    const progressGroups = { '0': 0, '1-2': 0, '3-5': 0, '6-10': 0, '10+': 0 };
    for (const s of studentUsers) {
      const n = s._count.sent_requests;
      if (n === 0)       progressGroups['0']++;
      else if (n <= 2)   progressGroups['1-2']++;
      else if (n <= 5)   progressGroups['3-5']++;
      else if (n <= 10)  progressGroups['6-10']++;
      else               progressGroups['10+']++;
    }

    const studentProgress = [
      { range: '0 sessions',    count: progressGroups['0'],    color: '#ffb4ab' },
      { range: '1–2 sessions',  count: progressGroups['1-2'],  color: '#ffb95f' },
      { range: '3–5 sessions',  count: progressGroups['3-5'],  color: '#c3c0ff' },
      { range: '6–10 sessions', count: progressGroups['6-10'], color: '#60a5fa' },
      { range: '10+ sessions',  count: progressGroups['10+'],  color: '#4edea3' },
    ];

    res.json({
      kpis: {
        sessions_this_month: sessionsCompleted,
        active_mentors: activeMentors,
        avg_rating: avgRating,
        completion_rate: completionRate,
        total_reviews: allRatings.length,
      },
      weekly_sessions: weeklySessions,
      domain_data: domainData,
      top_mentors: topMentors,
      rating_dist: ratingDist,
      student_progress: studentProgress,
      totals: { students: totalStudents, pending: sessionsPending },
    });
  } catch (err) {
    console.error('[Analytics] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/pending-users — list of users waiting for verification
router.get('/pending-users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        verification_status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/live-sessions — list all currently active interview rooms
router.get('/live-sessions', tnpOnly, async (req, res) => {
  try {
    const liveSessions = await prisma.interviewRequest.findMany({
      where: {
        status: { in: ['SLOT_BOOKED', 'MEETING_LIVE'] },
        scheduled_time: {
          // Heuristic: scheduled within last 2 hours or next 30 mins
          gte: new Date(Date.now() - 2 * 60 * 60 * 1000),
          lte: new Date(Date.now() + 30 * 60 * 1000),
        }
      },
      include: {
        student: { select: { name: true, email: true } },
        alumni:  { select: { name: true, email: true, department: true } },
      },
      orderBy: { scheduled_time: 'asc' }
    });
    res.json(liveSessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /stats/verify/:id — verify or reject user
router.patch('/verify/:id', async (req, res) => {
  try {
    const { status } = req.body; // 'VERIFIED' or 'REJECTED'
    if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required.' });
    }
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { verification_status: status },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

