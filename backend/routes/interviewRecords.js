const express = require('express');
const router  = express.Router();
const prisma = require('../lib/prisma');

// PATCH /interview-records/:id
// Updates alumni_feedback, student_score, and/or transcript on an interview record.
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { alumni_feedback, student_score, transcript } = req.body;

  try {
    const updates = {};
    if (alumni_feedback !== undefined) updates.alumni_feedback = alumni_feedback;
    if (student_score   !== undefined) updates.student_score   = parseFloat(student_score);
    if (transcript      !== undefined) updates.transcript      = transcript;

    const record = await prisma.interviewRecord.update({
      where: { interview_id: id },
      data: updates,
    });

    res.json(record);
  } catch (err) {
    console.error('PATCH /interview-records/:id error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// POST /interview-records — create a new interview record
router.post('/', async (req, res) => {
  const { student_id, alumni_id, transcript, student_score, alumni_feedback, ai_action_items } = req.body;

  if (!student_id || !alumni_id) {
    return res.status(400).json({ error: 'student_id and alumni_id are required.' });
  }

  try {
    const record = await prisma.interviewRecord.create({
      data: {
        student_id,
        alumni_id,
        transcript:      transcript      || null,
        student_score:   student_score   ? parseFloat(student_score) : null,
        alumni_feedback: alumni_feedback || null,
        ai_action_items: ai_action_items ? JSON.stringify(ai_action_items) : null,
      },
    });

    res.json(record);
  } catch (err) {
    console.error('POST /interview-records error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /interview-records?studentId=&alumniId=
router.get('/', async (req, res) => {
  try {
    const { studentId, alumniId } = req.query;
    const where = {};
    if (studentId) where.student_id = studentId;
    if (alumniId)  where.alumni_id  = alumniId;

    const records = await prisma.interviewRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
