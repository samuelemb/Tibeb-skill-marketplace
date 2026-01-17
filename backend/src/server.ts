import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeSocket } from './config/socket';
import app from './app';

dotenv.config();

const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

const io = initializeSocket(httpServer);
(global as any).io = io;

httpServer.listen(PORT, () => {
  console.log(`dYs? Server running on http://localhost:${PORT}`);
  console.log(`dY"? Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`dY"O Socket.IO initialized for real-time messaging`);
});

export default app;
export { io };
