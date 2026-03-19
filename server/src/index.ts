import express from 'express';
import http from 'node:http';
import cors from 'cors';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/index.js';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/games.js';
import fantasyRoutes from './routes/fantasy.js';
import predictionRoutes from './routes/predictions.js';
import socialRoutes from './routes/social.js';
import leaderboardRoutes from './routes/leaderboard.js';

// ─── Express App ────────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.isDevelopment ? 'dev' : 'combined'));

// ─── Health Check ───────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'GridIron IQ API is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ─── Route Modules ──────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/fantasy', fantasyRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// ─── Global Error Handler (must be registered after routes) ─────────────────

app.use(errorHandler);

// ─── Socket.io ──────────────────────────────────────────────────────────────

const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('join_room', (room: string) => {
    socket.join(room);
    console.log(`[Socket.io] ${socket.id} joined room: ${room}`);
    socket.to(room).emit('user_joined', { socketId: socket.id, room });
  });

  socket.on('leave_room', (room: string) => {
    socket.leave(room);
    console.log(`[Socket.io] ${socket.id} left room: ${room}`);
    socket.to(room).emit('user_left', { socketId: socket.id, room });
  });

  socket.on('chat_message', (data: { room: string; message: string; username: string }) => {
    io.to(data.room).emit('chat_message', {
      socketId: socket.id,
      username: data.username,
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('draft_pick', (data: { room: string; playerId: string; userId: string }) => {
    io.to(data.room).emit('draft_pick', {
      socketId: socket.id,
      playerId: data.playerId,
      userId: data.userId,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────

server.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   GridIron IQ Server                     ║
  ║   Port: ${String(config.port).padEnd(33)}║
  ║   Env:  ${config.nodeEnv.padEnd(33)}║
  ╚══════════════════════════════════════════╝
  `);
});

export { app, server, io };
