import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

const rooms = new Map();

// API
app.post('/api/rooms', async (req, res) => {
  try {
    const room = await prisma.room.create({
      data: { hostId: 'temp' }
    });
    res.json(room);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка создания' });
  }
});

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id }
    });
    if (!room) return res.status(404).json({ error: 'Не найдено' });
    res.json(room);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

// WebSocket
io.on('connection', (socket) => {
  console.log('✅ Подключён:', socket.id);

  socket.on('join-room', async (data) => {
    const { roomId, name, avatar } = data;
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, { participants: new Map(), host: socket.id });
    }

    const room = rooms.get(roomId);
    room.participants.set(socket.id, { id: socket.id, name, avatar });

    const dbRoom = await prisma.room.findUnique({ where: { id: roomId } });
    
    socket.emit('room-state', {
      currentVideo: dbRoom?.currentVideo,
      videoType: dbRoom?.videoType,
      playState: dbRoom?.playState || false,
      currentTime: dbRoom?.currentTime || 0,
      participants: Array.from(room.participants.values()),
      host: room.host,
      isHost: socket.id === room.host
    });

    io.to(roomId).emit('user-joined', {
      user: { id: socket.id, name, avatar },
      participants: Array.from(room.participants.values())
    });
  });

  socket.on('change-video', async (data) => {
    const { roomId, videoUrl, videoType } = data;
    await prisma.room.update({
      where: { id: roomId },
      data: { currentVideo: videoUrl, videoType }
    });
    io.to(roomId).emit('video-changed', { videoUrl, videoType });
  });

  socket.on('play-pause', async (data) => {
    const { roomId, isPlaying, currentTime } = data;
    await prisma.room.update({
      where: { id: roomId },
      data: { playState: isPlaying, currentTime }
    });
    socket.to(roomId).emit('play-pause-update', { isPlaying, currentTime });
  });

  socket.on('seek', async (data) => {
    const { roomId, time } = data;
    socket.to(roomId).emit('seek-update', { time });
  });

  socket.on('chat-message', (data) => {
    io.to(data.roomId).emit('chat-message', {
      id: Date.now().toString(),
      userName: data.userName,
      message: data.message,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Отключён:', socket.id);
    rooms.forEach((room, roomId) => {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id);
        io.to(roomId).emit('user-left', {
          userId: socket.id,
          participants: Array.from(room.participants.values())
        });
      }
    });
  });
});

server.listen(3001, () => {
  console.log('');
  console.log('╔════════════════════════════════════╗');
  console.log('║  ✅ СЕРВЕР ЗАПУЩЕН НА ПОРТУ 3001  ║');
  console.log('╚════════════════════════════════════╝');
  console.log('');
});
