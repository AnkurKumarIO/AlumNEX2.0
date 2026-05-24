const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { createGoogleMeetLink, generateJitsiFallback } = require('../services/googleMeetService');

// GET /requests?alumniId=&studentId=&roomId=
router.get('/', async (req, res) => {
  try {
    const { alumniId, studentId, roomId } = req.query;
    const where = {};
    if (alumniId)  where.alumni_id = alumniId;
    if (studentId) where.student_id = studentId;
    if (roomId)    where.room_id = roomId;

    const data = await prisma.interviewRequest.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true, profile_data: true }
        },
        alumni: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Flatten names and parse profile_data for easy frontend use
    const result = (data || []).map(r => ({
      ...r,
      id:           r.request_id, // Alias for frontend compat
      student_name: r.student?.name || '',
      alumni_name:  r.alumni?.name   || '',
      student_profile_snapshot: r.student_profile_snapshot ? JSON.parse(r.student_profile_snapshot) : (r.student?.profile_data ? JSON.parse(r.student.profile_data) : null),
    }));

    res.json(result);
  } catch (err) {
    console.error('Fetch requests error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /requests — student sends a request
router.post('/', async (req, res) => {
  try {
    const { studentId, alumniId, topic, message, studentProfileSnapshot } = req.body;
    if (!studentId || !alumniId) return res.status(400).json({ error: 'studentId and alumniId are required.' });

    const request = await prisma.interviewRequest.create({
      data: {
        student_id: studentId,
        alumni_id: alumniId,
        topic: topic || 'Mock Interview',
        message: message || '',
        student_profile_snapshot: studentProfileSnapshot ? JSON.stringify(studentProfileSnapshot) : null,
        status: 'PENDING',
      },
      include: { student: true, alumni: true }
    });

    // Notify alumni of new request
    const notification = await prisma.notification.create({
      data: {
        user_id: alumniId,
        type: 'NEW_REQUEST',
        title: 'New Interview Request! 📬',
        message: `${request.student?.name || 'A student'} requested an interview for ${topic || 'Mock Interview'}.`,
        request_id: request.request_id,
      }
    });

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.of('/notifications').to(alumniId).emit('notification', notification);
      // Also emit new_request so AlumniDashboard can prepend without a full re-fetch
      io.of('/notifications').to(alumniId).emit('new_request', {
        id:            request.request_id,
        studentName:   request.student?.name || '',
        studentId:     request.student_id,
        alumniName:    request.alumni?.name || '',
        alumniId:      request.alumni_id,
        topic:         request.topic,
        message:       request.message || '',
        status:        'pending',
        scheduledTime: null,
        roomId:        null,
        createdAt:     request.createdAt,
        studentProfile: request.student_profile_snapshot
          ? JSON.parse(request.student_profile_snapshot)
          : (request.student?.profile_data
              ? (typeof request.student.profile_data === 'string'
                  ? JSON.parse(request.student.profile_data)
                  : request.student.profile_data)
              : null),
      });
    }

    res.json({ ...request, id: request.request_id });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /requests/:id — update status (accept, book slot, decline)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scheduledTime, roomId } = req.body;

    const updates = { status };
    if (scheduledTime) {
      updates.scheduled_time = new Date(scheduledTime);

      // If a real meet URL was already provided by the client, use it.
      // Otherwise generate one now on the backend using the alumni's Google token.
      if (roomId && roomId.startsWith('http')) {
        updates.room_id = roomId;
      } else {
        // Look up the alumni's Google refresh token to create a real Meet link
        const requestRecord = await prisma.interviewRequest.findUnique({
          where: { request_id: id },
          include: { alumni: { select: { google_refresh_token: true, name: true } } },
        });

        let meetLink = null;

        if (requestRecord?.alumni?.google_refresh_token) {
          try {
            const endTime = new Date(new Date(scheduledTime).getTime() + 60 * 60 * 1000).toISOString();
            meetLink = await createGoogleMeetLink(
              requestRecord.alumni.google_refresh_token,
              id,
              `AlumNEX Interview — ${requestRecord.alumni.name || 'Alumni'}`,
              scheduledTime,
              endTime
            );
            console.log(`[Requests] Created Google Meet for slot booking (alumni token): ${meetLink}`);
          } catch (err) {
            console.error(`[Requests] Google Meet creation failed for alumni token:`, err.message);
          }
        }

        // Try platform-wide token as fallback
        if (!meetLink && process.env.GOOGLE_REFRESH_TOKEN) {
          try {
            const endTime = new Date(new Date(scheduledTime).getTime() + 60 * 60 * 1000).toISOString();
            meetLink = await createGoogleMeetLink(
              process.env.GOOGLE_REFRESH_TOKEN,
              id,
              `AlumNEX Interview`,
              scheduledTime,
              endTime
            );
            console.log(`[Requests] Created Google Meet using platform token: ${meetLink}`);
          } catch (err) {
            console.error(`[Requests] Platform Google Meet creation failed:`, err.message);
          }
        }

        // Last resort: Jitsi
        if (!meetLink) {
          meetLink = generateJitsiFallback(id);
          console.log(`[Requests] Using Jitsi fallback for room ${id}: ${meetLink}`);
        }

        updates.room_id = meetLink;
      }
    }

    const request = await prisma.interviewRequest.update({
      where: { request_id: id },
      data: updates,
      include: { student: true, alumni: true }
    });

    // Push notifications to both student and alumni
    const notificationsToCreate = [];

    if (status === 'ACCEPTED') {
      // Notify student that alumni accepted
      notificationsToCreate.push({
        user_id: request.student_id,
        type: 'ACCEPTED',
        title: 'Interview Request Accepted! 🎉',
        message: `${request.alumni?.name || 'The alumni'} has accepted your request. Waiting for slot confirmation.`,
        request_id: id,
      });
    } else if (status === 'SLOT_BOOKED') {
      const formatted = new Date(scheduledTime).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      const meetLinkStored = request.room_id || '';
      const meetInfo = meetLinkStored.startsWith('http') ? ` Join: ${meetLinkStored}` : '';

      // Notify student of confirmed slot
      notificationsToCreate.push({
        user_id: request.student_id,
        type: 'SLOT_BOOKED',
        title: 'Interview Slot Confirmed! 📅',
        message: `Your interview with ${request.alumni?.name || 'the alumni'} is scheduled for ${formatted}.${meetInfo}`,
        request_id: id,
      });

      // Notify alumni of confirmed slot
      notificationsToCreate.push({
        user_id: request.alumni_id,
        type: 'SLOT_BOOKED_ALUMNI',
        title: 'Interview Slot Confirmed! 📅',
        message: `Your interview with ${request.student?.name || 'the student'} is scheduled for ${formatted}.${meetInfo}`,
        request_id: id,
      });

      // Notify TNP coordinator — show both student and alumni names
      try {
        const tnpUser = await prisma.user.findFirst({ where: { role: 'TNP' }, select: { id: true } });
        const tnpId = tnpUser?.id || 'tnp-001'; // fallback to hardcoded ID if not in DB yet
        notificationsToCreate.push({
          user_id: tnpId,
          type: 'SLOT_BOOKED',
          title: `Session Booked: ${request.student?.name || 'Student'} ↔ ${request.alumni?.name || 'Alumni'}`,
          message: `${request.student?.name || 'A student'} booked a "${request.topic || 'Mock Interview'}" session with ${request.alumni?.name || 'an alumni'} on ${formatted}.`,
          request_id: id,
        });
      } catch (tnpErr) {
        console.warn('[Notify TNP] Could not find TNP user:', tnpErr.message);
      }
    } else if (status === 'DECLINED') {
      // Notify student of decline
      notificationsToCreate.push({
        user_id: request.student_id,
        type: 'DECLINED',
        title: 'Interview Request Update',
        message: `${request.alumni?.name || 'The alumni'} declined your request. Try another mentor.`,
        request_id: id,
      });
    }

    // Create all notifications
    const io = req.app.get('io');
    for (const notifPayload of notificationsToCreate) {
      const createdNotif = await prisma.notification.create({
        data: notifPayload
      });
      // Emit real-time notification — include room_id in the socket payload
      // so the student's dashboard can show the correct Join Now link immediately.
      // (The DB Notification record doesn't have a room_id column, but the socket
      //  payload can carry extra fields that the frontend reads from state.)
      if (io) {
        io.of('/notifications').to(notifPayload.user_id).emit('notification', {
          ...createdNotif,
          room_id: request.room_id || null,
        });
      }
    }

    res.json({ ...request, id: request.request_id });
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
