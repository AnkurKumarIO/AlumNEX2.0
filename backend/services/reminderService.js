const prisma = require('../lib/prisma');
const { notify } = require('../lib/notify');

/**
 * Scans the database for interview requests that are scheduled to start
 * within the next 6 minutes and haven't had a reminder sent yet.
 */
async function sendUpcomingReminders(io) {
  try {
    const now = new Date();
    const sixMinutesFromNow = new Date(now.getTime() + 6 * 60 * 1000);
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);

    // Find SLOT_BOOKED requests starting soon
    // Note: We don't have a 'reminder_sent' column, so we check if a
    // REMINDER notification already exists for this request_id to avoid spam.
    const upcoming = await prisma.interviewRequest.findMany({
      where: {
        status: 'SLOT_BOOKED',
        scheduled_time: {
          gte: oneMinuteAgo,
          lte: sixMinutesFromNow,
        },
      },
      include: {
        student: { select: { id: true, name: true } },
        alumni: { select: { id: true, name: true } },
      },
    });

    for (const req of upcoming) {
      // Check if student already got a reminder for this request
      const existingNotif = await prisma.notification.findFirst({
        where: {
          user_id: req.student_id,
          request_id: req.request_id,
          type: 'REMINDER',
        },
      });

      if (!existingNotif) {
        console.log(`[ReminderService] Sending reminder for request ${req.request_id} starting at ${req.scheduled_time}`);

        // Notify Student
        const studentNotif = await notify({
          user_id: req.student_id,
          type: 'REMINDER',
          title: 'Interview Starting Soon! ⏳',
          message: `Your interview with ${req.alumni?.name || 'the alumni'} starts in 5 minutes. Get ready!`,
          request_id: req.request_id,
          room_id: req.room_id,
        });

        // Notify Alumni
        const alumniNotif = await notify({
          user_id: req.alumni_id,
          type: 'REMINDER',
          title: 'Upcoming Interview 📅',
          message: `Your interview with ${req.student?.name || 'the student'} starts in 5 minutes.`,
          request_id: req.request_id,
          room_id: req.room_id,
        });

        if (io) {
          io.of('/notifications').to(req.student_id).emit('notification', {
            ...studentNotif,
            room_id: req.room_id,
          });
          io.of('/notifications').to(req.alumni_id).emit('notification', {
            ...alumniNotif,
            room_id: req.room_id,
          });
        }
      }
    }
  } catch (err) {
    console.error('[ReminderService] Error scanning reminders:', err.message);
  }
}

/**
 * Starts the reminder background interval.
 */
function startReminderService(io) {
  console.log('🚀 Reminder Service started (checking every minute)');
  // Check every 60 seconds
  setInterval(() => sendUpcomingReminders(io), 60000);
  // Also run once immediately on start
  sendUpcomingReminders(io);
}

module.exports = { startReminderService };
