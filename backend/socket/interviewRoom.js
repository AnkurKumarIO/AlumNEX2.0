const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = (io) => {
  const ns = io.of('/interview');

  // Track who is in each room: Map<roomId, Map<socketId, userId>>
  const rooms = new Map();

  ns.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── Room management ──────────────────────────────────────────────────
    socket.on('join-room', async (roomId, userId) => {
      socket.join(roomId);
      socket.data = { roomId, userId };

      // Track membership
      if (!rooms.has(roomId)) rooms.set(roomId, new Map());
      const members = rooms.get(roomId);
      members.set(socket.id, userId);

      console.log(`[${roomId}] ${userId} joined (${members.size} in room)`);

      // Tell the joiner about everyone already in the room
      const existingUsers = [];
      for (const [sid, uid] of members.entries()) {
        if (sid !== socket.id) existingUsers.push(uid);
      }
      if (existingUsers.length > 0) {
        socket.emit('room-users', existingUsers);
      }

      // Tell existing members about the new joiner
      socket.to(roomId).emit('user-connected', userId);

      // When both users are present, create a "meeting live" notification
      if (members.size === 2) {
        try {
          const roomIdParts = roomId.match(/room-([a-z0-9]+)/i);
          if (roomIdParts && roomIdParts[1]) {
            const request = await prisma.interviewRequest.findFirst({
              where: { room_id: roomId },
              select: { request_id: true, student_id: true, alumni_id: true, student: { select: { name: true } }, alumni: { select: { name: true } } }
            });

            if (request) {
              const meetingLiveNotifs = [
                {
                  user_id: request.student_id,
                  type: 'MEETING_LIVE',
                  title: 'Interview is Live! 🎥',
                  message: `Your interview with ${request.alumni?.name || 'the alumni'} is starting now!`,
                  request_id: request.request_id,
                },
                {
                  user_id: request.alumni_id,
                  type: 'MEETING_LIVE',
                  title: 'Interview is Live! 🎥',
                  message: `Your interview with ${request.student?.name || 'the student'} is starting now!`,
                  request_id: request.request_id,
                }
              ];

              for (const notif of meetingLiveNotifs) {
                await prisma.notification.create({ data: notif });
              }
              console.log(`[${roomId}] Meeting live notifications created for both parties`);
            }
          }
        } catch (error) {
          console.error(`[${roomId}] Error creating meeting live notifications:`, error);
        }
      }

      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId);
        const m = rooms.get(roomId);
        if (m) {
          m.delete(socket.id);
          if (m.size === 0) rooms.delete(roomId);
        }
        console.log(`[${roomId}] ${userId} disconnected`);
      });
    });

    // ── WebRTC signaling ─────────────────────────────────────────────────
    socket.on('offer',         (roomId, d) => socket.to(roomId).emit('offer', d));
    socket.on('answer',        (roomId, d) => socket.to(roomId).emit('answer', d));
    socket.on('ice-candidate', (roomId, d) => socket.to(roomId).emit('ice-candidate', d));

    // ── Chat relay ───────────────────────────────────────────────────────
    socket.on('chat_message', (roomId, msg) => {
      socket.to(roomId).emit('chat_message', msg);
    });

    // ── Hand raise ───────────────────────────────────────────────────────
    socket.on('hand_raised', (roomId, userId) => {
      socket.to(roomId).emit('hand_raised', userId);
    });

    // ── Session ended — notify other participants ────────────────────────
    socket.on('session_ended', (roomId, userId) => {
      socket.to(roomId).emit('session_ended', userId);
      console.log(`[${roomId}] Session ended by ${userId}`);
    });
  });
};
