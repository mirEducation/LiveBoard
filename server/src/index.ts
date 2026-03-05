import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { registerBoardEvents } from './events/boardEvents';

const app = express();
const httpServer = createServer(app);

const isDev = process.env.NODE_ENV !== 'production';

const io = new Server(httpServer, {
  cors: {
    origin: isDev ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : false,
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Serve static client build in production
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Catch-all for SPA routing in production
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);
  registerBoardEvents(io, socket);
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
