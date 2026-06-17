const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

/**
 * POST /feedback
 * Create or update session feedback.
 * Body: { roomId, studentId, alumniId, studentName, alumniName, topic, meetLink, role, rating, feedback }
 * role = 'STUDENT' | 'ALUMNI' — determines which rating/feedback fields to set
 */
router.post('/', async (req, res) => {
  try {
    let { roomId, studentId, alumniId, studentName, alumniName, topic, meetLink, role, rating, feedback } = req.body;

    if (!roomId || !role) {
      return res.status(400).json({ error: 'roomId and role are required' });
    }

    // ── Auto-resolve studentId/alumniId from the InterviewRequest record ──
    // The frontend may send display names instead of real UUIDs if it couldn't
    // find the request record (due to the roomId mismatch bug). Look it up here.
    let interviewReq = null;
    try {
      interviewReq = await prisma.interviewRequest.findFirst({
        where: {
          OR: [
            { room_id: roomId },
            { request_id: roomId },
          ],
        },
        include: {
          student: { select: { id: true, name: true } },
          alumni:  { select: { id: true, name: true } },
        },
      });

      if (interviewReq) {
        // Use authoritative IDs from the DB record
        studentId   = interviewReq.student_id;
        alumniId    = interviewReq.alumni_id;
        studentName = studentName || interviewReq.student?.name || '';
        alumniName  = alumniName  || interviewReq.alumni?.name  || '';
        topic       = topic       || interviewReq.topic         || 'Mock Interview';
      }
    } catch (lookupErr) {
      console.warn('[Feedback] InterviewRequest lookup failed:', lookupErr.message);
    }

    if (!studentId || !alumniId) {
      return res.status(400).json({ error: 'Could not resolve studentId and alumniId for this room' });
    }

    // ── Find or create SessionFeedback ──
    // roomId could be a request_id UUID — search by both fields
    let session = await prisma.sessionFeedback.findFirst({
      where: {
        OR: [
          { room_id: roomId },
          ...(interviewReq ? [{ room_id: interviewReq.room_id }] : []),
        ],
      },
    });

    if (session) {
      // Update existing — set the appropriate side's feedback
      const updateData = {};
      if (role === 'STUDENT') {
        updateData.student_rating = rating;
        updateData.student_feedback = feedback || null;
      } else {
        updateData.alumni_rating = rating;
        updateData.alumni_feedback = feedback || null;
      }
      session = await prisma.sessionFeedback.update({
        where: { id: session.id },
        data: updateData,
      });
    } else {
      // Create new session feedback
      const data = {
        room_id: roomId,
        student_id: studentId,
        alumni_id: alumniId,
        student_name: studentName || null,
        alumni_name: alumniName || null,
        topic: topic || null,
        meet_link: meetLink || null,
      };
      if (role === 'STUDENT') {
        data.student_rating = rating;
        data.student_feedback = feedback || null;
      } else {
        data.alumni_rating = rating;
        data.alumni_feedback = feedback || null;
      }
      session = await prisma.sessionFeedback.create({ data });
    }

    // Also update the associated InterviewRequest to COMPLETED status
    try {
      await prisma.interviewRequest.updateMany({
        where: {
          OR: [
            { room_id: roomId },
            { request_id: roomId },
          ],
        },
        data: { status: 'COMPLETED' }
      });
    } catch (e) {
      console.warn('[Feedback] Could not update InterviewRequest status:', e.message);
    }

    res.json({ success: true, session });
  } catch (error) {
    console.error('[Feedback] Error saving feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /feedback/user/:userId
 * Get all session feedback for a user (as student or alumni)
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await prisma.sessionFeedback.findMany({
      where: {
        OR: [
          { student_id: userId },
          { alumni_id: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sessions);
  } catch (error) {
    console.error('[Feedback] Error fetching feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /feedback/room/:roomId
 * Get session feedback for a specific room
 */
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const session = await prisma.sessionFeedback.findFirst({
      where: { room_id: roomId },
    });
    res.json(session || null);
  } catch (error) {
    console.error('[Feedback] Error fetching room feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /feedback/alumni-ratings
 * Returns average student ratings grouped by alumni_id
 * Used by AlumniDiscovery to compute impact scores
 */
router.get('/alumni-ratings', async (req, res) => {
  try {
    // ⚡ Bolt: Optimized aggregation using Prisma groupBy to offload computation to the database.
    // This avoids fetching thousands of records into memory and performing manual loops.
    const aggregations = await prisma.sessionFeedback.groupBy({
      by: ['alumni_id'],
      where: {
        student_rating: { not: null },
      },
      _avg: {
        student_rating: true,
      },
      _count: {
        student_rating: true,
      },
    });

    const result = {};
    aggregations.forEach(agg => {
      if (agg.alumni_id) {
        result[agg.alumni_id] = {
          avgRating: Math.round((agg._avg.student_rating || 0) * 100) / 100,
          totalSessions: agg._count.student_rating,
        };
      }
    });

    res.json(result);
  } catch (error) {
    console.error('[Feedback] Error computing alumni ratings:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
