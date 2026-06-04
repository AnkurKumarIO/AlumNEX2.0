const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, verifyRole } = require('../lib/authMiddleware');
const { getWeekStart } = require('../lib/timeUtils');

// GET /alumni — return all verified alumni with their profile data
router.get('/', async (req, res) => {
  try {
    const data = await prisma.user.findMany({
      where: {
        role: 'ALUMNI',
        verification_status: 'VERIFIED',
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        profile_data: true,
        max_interviews_per_week: true,
        createdAt: true,
        availability_slots: {
          where: { is_active: true }
        },
        received_requests: {
          where: {
            createdAt: { gte: getWeekStart() }
          },
          select: {
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
    });

    const result = data.map(u => ({
      ...u,
      profile_data: u.profile_data ? JSON.parse(u.profile_data) : {},
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /alumni/:id/availability
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const availability = await prisma.alumniAvailability.findMany({
      where: { alumni_id: id, is_active: true }
    });
    const user = await prisma.user.findUnique({
      where: { id },
      select: { max_interviews_per_week: true }
    });
    res.json({ availability, max_interviews_per_week: user?.max_interviews_per_week || 3 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /alumni/:id/availability — batch update
router.post('/:id/availability', authenticate, verifyRole('ALUMNI'), async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.userId !== id) return res.status(403).json({ error: 'Unauthorized' });
    const { slots } = req.body; // Array of { day_of_week, start_time, end_time, slot_duration, buffer_time }

    // Clear existing and replace (simple approach for MVP)
    await prisma.alumniAvailability.deleteMany({ where: { alumni_id: id } });

    const created = await prisma.alumniAvailability.createMany({
      data: slots.map(s => ({
        alumni_id: id,
        day_of_week: s.day_of_week.toLowerCase(),
        start_time: s.start_time,
        end_time: s.end_time,
        slot_duration: s.slot_duration || 60,
        buffer_time: s.buffer_time !== undefined ? s.buffer_time : 15,
      }))
    });

    res.json({ success: true, count: created.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /alumni/:id/settings
router.post('/:id/settings', authenticate, verifyRole('ALUMNI'), async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.userId !== id) return res.status(403).json({ error: 'Unauthorized' });
    const { max_interviews_per_week } = req.body;
    await prisma.user.update({
      where: { id },
      data: { max_interviews_per_week }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
