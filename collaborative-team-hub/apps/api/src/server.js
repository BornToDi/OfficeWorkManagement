const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const { verify } = require('./utils/jwt');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:3001', 'http://localhost:3000', 'http://localhost:3002'];
const io = new Server(server, {
  cors: {
    origin: function(origin, callback){
      // allow requests with no origin (e.g., curl, mobile clients)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS not allowed by server'));
    },
    credentials: true
  }
});
app.locals.io = io;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: function(origin, callback){ if (!origin) return callback(null, true); if (allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error('CORS not allowed by server')); }, credentials: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Prisma client
const prisma = require('./prismaClient');

// Routes
const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const goalsRoutes = require('./routes/goals');
const announcementsRoutes = require('./routes/announcements');
const actionItemsRoutes = require('./routes/actionItems');
const notificationsRoutes = require('./routes/notifications');
const statsRoutes = require('./routes/stats');
const auditRoutes = require('./routes/audit');
const exportRoutes = require('./routes/export');
const messagesRoutes = require('./routes/messages');
const filesRoutes = require('./routes/files');
const globalChatRoutes = require('./routes/globalChat');
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces/:workspaceId/goals', goalsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/workspaces/:workspaceId/announcements', announcementsRoutes);
app.use('/api/workspaces/:workspaceId/action-items', actionItemsRoutes);
app.use('/api/workspaces/:workspaceId/notifications', notificationsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/workspaces/:workspaceId/audit', auditRoutes);
app.use('/api/workspaces/:workspaceId/export', exportRoutes);
app.use('/api/workspaces/:workspaceId/messages', messagesRoutes);
app.use('/api/workspaces/:workspaceId/files', filesRoutes);
app.use('/api/chat', globalChatRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Error handler for invalid JSON payloads from body-parser
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('[server] Invalid JSON received:', err.message)
    return res.status(400).json({ error: 'Invalid JSON' })
  }
  next(err)
});

io.on('connection', async (socket) => {
  // Extract and verify JWT from Authorization header
  const auth = socket.handshake.headers.authorization;
  let userId = null;
  
  if (auth) {
    const parts = auth.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      try {
        const payload = verify(parts[1], 'access');
        userId = payload.userId;
        socket.userId = userId;
        console.log('[socket] user connected:', socket.id, 'userId:', userId);
      } catch (err) {
        console.warn('[socket] invalid token:', err.message);
      }
    }
  }
  
  if (!userId) {
    console.warn('[socket] connection without valid auth:', socket.id);
    socket.disconnect();
    return;
  }

  socket.on('join-global-chat', (data) => {
    socket.join('global-chat-room');
    console.log('[socket] user joined global chat:', socket.id, 'userId:', userId);
  });

  socket.on('send-global-message', async (data) => {
    try {
      const { content, attachmentUrl, attachmentType, attachmentName, attachmentSize } = data;
      console.log('[socket] send-global-message received:', { userId, content, attachmentType, attachmentName });
      if (!content && !attachmentUrl) {
        console.warn('[socket] missing content');
        return socket.emit('error', { message: 'Content required' });
      }
      // Check user role - allow all authenticated users to send messages
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        console.warn('[socket] user not found:', userId);
        return socket.emit('error', { message: 'User not found' });
      }
      const message = await prisma.globalMessage.create({
        data: {
          authorId: userId,
          content: content || (attachmentName ? `📎 ${attachmentName}` : 'Sticker'),
          attachmentUrl: attachmentUrl || null,
          attachmentType: attachmentType || null,
          attachmentName: attachmentName || null,
          attachmentSize: attachmentSize || null
        },
        include: { author: true }
      });
      console.log('[socket] message created successfully:', message.id, 'from', user.name);
      io.to('global-chat-room').emit('new-global-message', message);
    } catch (err) {
      console.error('[socket] send-global-message error:', err.message, err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('[socket] user disconnected:', socket.id, 'userId:', userId);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`API server listening on ${PORT}`));

module.exports = { app, server, io };
