module.exports = (io) => {
  const ns = io.of('/notifications');

  ns.on('connection', (socket) => {
    console.log(`Socket connected to /notifications: ${socket.id}`);

    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`User ${userId} joined notification room: ${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected from /notifications: ${socket.id}`);
    });
  });

  return ns;
};
