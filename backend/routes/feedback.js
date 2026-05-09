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
    const { roomId, studentId, alumniId, studentName, alumniName, topic, meetLink, role, rating, feedback } = req.body;

    if (!roomId || !studentId || !alumniId || !role) {
      return res.status(400).json({ error: 'roomId, studentId, alumniId, and role are required' });
    }

    // Find existing session feedback for this room
    let session = await prisma.sessionFeedback.findFirst({
      where: { room_id: roomId },
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

module.exports = router;
