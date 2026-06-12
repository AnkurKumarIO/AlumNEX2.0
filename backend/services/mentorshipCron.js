const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { notify } = require('../lib/notify');
const { getWeekStart } = require('../lib/timeUtils');

async function promoteWaitingStudent(alumniId) {
  const weekStart = getWeekStart();

  // 1. Check if alumni still has capacity
  const alumni = await prisma.user.findUnique({
    where: { id: alumniId },
    include: {
      received_requests: {
        where: {
          status: { in: ['ACCEPTED', 'SLOT_BOOKED'] },
          createdAt: { gte: weekStart }
        }
      }
    }
  });

  if (!alumni) return;
  const maxInterviews = alumni.max_interviews_per_week || 3;
  const currentAccepted = alumni.received_requests.length;

  if (currentAccepted < maxInterviews) {
    // 2. Find first WAITING request
    const firstWaiting = await prisma.interviewRequest.findFirst({
      where: {
        alumni_id: alumniId,
        status: 'WAITING',
        createdAt: { gte: weekStart }
      },
      orderBy: { createdAt: 'asc' },
      include: { student: true }
    });

    if (firstWaiting) {
      // Promote to PENDING
      await prisma.interviewRequest.update({
        where: { request_id: firstWaiting.request_id },
        data: { status: 'PENDING' }
      });

      // Notify alumni
      const notification = await notify({
        user_id: alumniId,
        type: 'NEW_REQUEST',
        title: 'Slot Opened Up! 🟢',
        message: `${firstWaiting.student?.name || 'A student'} was promoted from the waiting list.`,
        request_id: firstWaiting.request_id
      });

      // Notify student
      await notify({
        user_id: firstWaiting.student_id,
        type: 'PROMOTED',
        title: 'Good news! You are off the waitlist! 🚀',
        message: `A slot opened up with ${alumni.name}. Your request is now pending.`,
        request_id: firstWaiting.request_id
      });
    }
  }
}

async function detectNoShows() {
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

  const overdueSlots = await prisma.bookedSlot.findMany({
    where: {
      slot_end: { lt: thirtyMinsAgo },
      status: 'BOOKED',
    }
  });

  for (const slot of overdueSlots) {
    // Check if session feedback exists (marking it as completed)
    const feedback = await prisma.sessionFeedback.findUnique({
      where: { room_id: slot.request_id }
    });

    if (!feedback) {
      // Mark as NO_SHOW
      await prisma.bookedSlot.update({ where: { id: slot.id }, data: { status: 'NO_SHOW' } });
      await prisma.interviewRequest.update({
        where: { request_id: slot.request_id },
        data: { status: 'NO_SHOW' }
      });

      // Penalize student: -2 tokens next week logic (handled in reset job)
      // Actually, we can store penalty in User for next week
      // For now, let's just mark it.

      // Promote next WAITING student
      await promoteWaitingStudent(slot.alumni_id);
    } else {
      // Mark as COMPLETED
      await prisma.bookedSlot.update({ where: { id: slot.id }, data: { status: 'COMPLETED' } });
      await prisma.interviewRequest.update({
        where: { request_id: slot.request_id },
        data: { status: 'COMPLETED' }
      });
    }
  }
}

async function grantBonusTokens() {
  const weekStart = getWeekStart();

  // Find students who used all 5, had 0 interviews done, and all were declined
  const trackers = await prisma.weeklyRequestTracker.findMany({
    where: {
      week_start: weekStart,
      tokens_used: { gte: 5 },
      bonus_granted: false,
      interviews_done: 0
    },
    include: { student: { include: { sent_requests: { where: { createdAt: { gte: weekStart } } } } } }
  });

  for (const tracker of trackers) {
    const declinedCount = tracker.student.sent_requests.filter(r => r.status === 'DECLINED').length;
    if (declinedCount >= 5) {
      await prisma.weeklyRequestTracker.update({
        where: { id: tracker.id },
        data: { bonus_granted: true }
      });

      await notify({
        user_id: tracker.student_id,
        type: 'SYSTEM',
        title: '3 Bonus Tokens Granted 🎁',
        message: 'All your requests were declined this week. We\'ve added 3 bonus tokens so you can keep trying!'
      });
    }
  }
}

async function weeklyReset() {
  const weekStart = getWeekStart();

  // 1. Reset tokens for everyone
  // Handle no-show penalty: -2 tokens (min 2)
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' } });

  for (const student of students) {
    // Check if they had NO_SHOW last week
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const noShows = await prisma.bookedSlot.count({
      where: {
        student_id: student.id,
        status: 'NO_SHOW',
        slot_start: { gte: lastWeekStart, lt: weekStart }
      }
    });

    const baseTokens = 5;
    const penalty = noShows > 0 ? 2 : 0;
    const startingTokens = Math.max(2, baseTokens - penalty);

    await prisma.user.update({
      where: { id: student.id },
      data: {
        weekly_request_tokens: startingTokens,
        tokens_reset_at: new Date()
      }
    });

    // Create fresh tracker
    await prisma.weeklyRequestTracker.upsert({
      where: { student_id_week_start: { student_id: student.id, week_start: weekStart } },
      update: {},
      create: { student_id: student.id, week_start: weekStart, tokens_used: 0 }
    });
  }
}

/**
 * Deletes AlumniAvailability records for days that have already passed
 * in the current week. Runs once daily at midnight.
 *
 * e.g. if today is Wednesday, any slots set for monday or tuesday this
 * week are stale — delete them so they don't roll over to next week.
 */
async function clearExpiredAvailability() {
  try {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // All days strictly before today in the week are expired
    const expiredDays = days.filter((_, i) => i < todayIndex);

    if (expiredDays.length === 0) {
      // It's Sunday (start of week) — nothing to expire yet
      return;
    }

    const result = await prisma.alumniAvailability.deleteMany({
      where: { day_of_week: { in: expiredDays } }
    });

    if (result.count > 0) {
      console.log(`[ClearExpiredAvailability] Deleted ${result.count} stale slot(s) for days: ${expiredDays.join(', ')}`);
    }
  } catch (err) {
    console.error('[ClearExpiredAvailability] Error:', err.message);
  }
}

// Every 15 mins: No-show detection
cron.schedule('*/15 * * * *', detectNoShows);

// Every hour: Bonus token grant check
cron.schedule('0 * * * *', grantBonusTokens);

// Every Monday at 00:00 IST (roughly)
// 0 0 * * 1 is Monday midnight.
cron.schedule('0 0 * * 1', weeklyReset);

// Daily at midnight: remove availability slots for days already passed this week
cron.schedule('0 0 * * *', clearExpiredAvailability);
// Also run once on startup to clean up any slots that expired while server was down
clearExpiredAvailability();

console.log('📅 Mentorship System Cron Jobs Initialized');

module.exports = { detectNoShows, grantBonusTokens, weeklyReset, promoteWaitingStudent, clearExpiredAvailability };
