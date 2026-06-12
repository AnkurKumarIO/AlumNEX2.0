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

    // Return booked slot start times for the next 14 days so the frontend
    // can hide already-taken slots from the picker
    const now = new Date();
    const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const bookedSlots = await prisma.bookedSlot.findMany({
      where: {
        alumni_id: id,
        status: { in: ['BOOKED'] },
        slot_start: { gte: now, lte: twoWeeksOut },
      },
      select: { slot_start: true, slot_end: true },
    });

    res.json({
      availability,
      max_interviews_per_week: user?.max_interviews_per_week || 3,
      booked_slots: bookedSlots.map(s => ({
        slot_start: s.slot_start.toISOString(),
        slot_end: s.slot_end.toISOString(),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /alumni/:id/availability — batch update
router.post('/:id/availability', authenticate, verifyRole('ALUMNI'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Alumni Routes] POST /availability - User:', req.user?.userId, 'Target:', id);
    
    if (req.user.userId !== id) {
      console.log('[Alumni Routes] Unauthorized: user mismatch');
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { slots } = req.body; // Array of { day_of_week, start_time, end_time, slot_duration, buffer_time }
    console.log('[Alumni Routes] Received slots:', JSON.stringify(slots));
    
    if (!Array.isArray(slots)) {
      console.log('[Alumni Routes] Error: slots is not an array');
      return res.status(400).json({ error: 'Invalid slots data' });
    }

    // AGGRESSIVE FIX: Use individual transactions with raw SQL
    // Step 1: Force delete ALL existing slots using raw SQL with explicit COMMIT
    console.log('[Alumni Routes] 🔥 FORCE DELETING with raw SQL...');
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM alumni_availabilities WHERE alumni_id = '${id}'`);
      console.log('[Alumni Routes] ✓ Force delete completed');
    } catch (delErr) {
      console.error('[Alumni Routes] ❌ Delete failed:', delErr.message);
      // Continue anyway - maybe no rows exist
    }

    // Step 2: If no slots to create, return early
    if (slots.length === 0) {
      console.log('[Alumni Routes] No slots to create (empty array)');
      return res.json({ success: true, count: 0 });
    }

    // Step 3: Insert each slot individually using raw SQL to avoid Prisma transaction issues
    console.log('[Alumni Routes] 🔥 Inserting', slots.length, 'slots with raw SQL...');
    let insertedCount = 0;
    
    for (const slot of slots) {
      try {
        const dayLower = slot.day_of_week.toLowerCase();
        const bufferTime = slot.buffer_time !== undefined ? slot.buffer_time : 15;
        await prisma.$executeRawUnsafe(`
          INSERT INTO alumni_availabilities (id, alumni_id, day_of_week, start_time, end_time, slot_duration, buffer_time, created_at)
          VALUES (gen_random_uuid(), '${id}', '${dayLower}', '${slot.start_time}', '${slot.end_time}', ${slot.slot_duration || 60}, ${bufferTime}, NOW())
        `);
        insertedCount++;
        console.log('[Alumni Routes] ✓ Inserted slot:', dayLower, slot.start_time);
      } catch (insertErr) {
        console.error('[Alumni Routes] ❌ Failed to insert slot:', insertErr.message);
      }
    }

    console.log('[Alumni Routes] 🎉 Final count:', insertedCount, '/', slots.length);
    res.json({ success: true, count: insertedCount });
  } catch (err) {
    console.error('[Alumni Routes] ❌ FATAL ERROR:', err.message);
    console.error('[Alumni Routes] Stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
});

// POST /alumni/:id/settings
router.post('/:id/settings', authenticate, verifyRole('ALUMNI'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Alumni Routes] POST /settings - User:', req.user?.userId, 'Target:', id);
    
    if (req.user.userId !== id) {
      console.log('[Alumni Routes] Unauthorized: user mismatch');
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { max_interviews_per_week } = req.body;
    console.log('[Alumni Routes] Setting max_interviews_per_week:', max_interviews_per_week);
    
    await prisma.user.update({
      where: { id },
      data: { max_interviews_per_week }
    });
    
    console.log('[Alumni Routes] Settings updated successfully');
    res.json({ success: true });
  } catch (err) {
    console.error('[Alumni Routes] Error saving settings:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
