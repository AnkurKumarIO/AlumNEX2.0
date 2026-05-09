const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

module.exports = router;
