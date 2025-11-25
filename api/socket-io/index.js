const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');

const prisma = require('../services/connect-db');
const { NODE_ENV, COOKIE_SECRET } = require('../utils/config');
const { isAuthenticated } = require('../middlewares/auth');
const logger = require('../utils/logger');

let ioInstance; // Exported io instance for use in controllers if needed

const setupSocketServer = (server) => {
  const isDev = NODE_ENV === 'development';

  const options = isDev
    ? {
        cors: {
          origin: 'http://localhost:3000',
          optionsSuccessStatus: 200,
          methods: ['GET', 'POST'],
          credentials: true,
        },
      }
    : {};

  const io = new Server(server, options);
  ioInstance = io; // Store io instance

  const wrap = (middleware) => (socket, next) =>
    middleware(socket.request, {}, next);

  io.use(wrap(cookieParser(COOKIE_SECRET)));

  io.use(
    wrap((req, res, next) => {
      req.get = (header) => req.headers[header.toLowerCase()];
      next();
    })
  );

  io.use(wrap(isAuthenticated));

  io.on('connection', (socket) => {
    logger.info(`New connection: ${socket.id}`);

    // Join personal room using userId for direct messages & notifications
    socket.join(socket.request.userId);

    // Listen for joinChannels event to join user to multiple channel rooms
    socket.on('joinChannels', (channelIds) => {
      // channelIds assumed to be an array of channel IDs the client is member of
      channelIds.forEach((channelId) => {
        socket.join(`channel_${channelId}`);
      });
    });

    // Existing new notification event
    socket.on('new notification', ({ to }) => {
      io.sockets.in(to).emit('new notification', { notification: true });
    });

    // Existing new direct message event
    socket.on('new message', async ({ chatId }) => {
      const chatParticipatedIn = await prisma.chat.findUnique({
        where: {
          id: chatId,
        },
      });
      const chat = await prisma.chat.findFirst({
        where: {
          userId: chatParticipatedIn.participantId,
          participantId: chatParticipatedIn.userId,
        },
      });
      io.sockets.in(chat.userId).emit('new message', { chatId: String(chat.id) });
    });

    // Channel message could also be emitted here if desired:
    // However, preferred to emit from sendMessage controller to avoid duplicate DB calls

    socket.on('disconnect', () => {
      logger.info('user disconnected', socket.id);
    });
  });
};

module.exports = {
  setupSocketServer,
  get io() {
    return ioInstance;
  },
};
