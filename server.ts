import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Simple in-memory storage for the board state
  // In a production app, this would be a database
  const boards: Record<string, any[]> = {};

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-board', (boardId) => {
      socket.join(boardId);
      console.log(`User ${socket.id} joined board ${boardId}`);
      
      // Send current state of the board to the new user
      if (boards[boardId]) {
        socket.emit('init-board', boards[boardId]);
      } else {
        boards[boardId] = [];
        socket.emit('init-board', []);
      }
    });

    socket.on('draw-stroke', ({ boardId, stroke }) => {
      if (!boards[boardId]) boards[boardId] = [];
      boards[boardId].push(stroke);
      
      // Broadcast to others in the room
      socket.to(boardId).emit('stroke-drawn', stroke);
    });

    socket.on('clear-board', (boardId) => {
      boards[boardId] = [];
      io.to(boardId).emit('board-cleared');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
