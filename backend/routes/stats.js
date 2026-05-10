const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

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
router.get('/directory', async (req, res) => {
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
router.get('/directory/user/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        sent_requests:      { orderBy: { createdAt: 'desc' }, take: 10 },
        received_requests:  { orderBy: { createdAt: 'desc' }, take: 10 },
        student_interviews: { orderBy: { createdAt: 'desc' }, take: 10 },
        alumni_interviews:  { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profile = {};
    try { profile = JSON.parse(user.profile_data || '{}'); } catch {}

    res.json({ ...user, profile_data: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/recent-activity — live activity for TNP notification bell
router.get('/recent-activity', async (req, res) => {
  try {
    // Pull latest notifications (all users) for TNP admin overview
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { name: true, role: true } },
      },
    });

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

module.exports = router;
