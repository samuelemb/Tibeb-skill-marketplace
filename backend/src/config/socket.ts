import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { extractTokenFromHeader } from '../utils/jwt';

/**
 * Socket.IO Configuration for Real-Time In-App Notifications
 * 
 * This module handles real-time delivery of in-app notifications via WebSocket.
 * All marketplace notifications are delivered through Socket.IO (in-app only).
 * 
 * NOTE: Email is NOT used for marketplace notifications. Email is reserved for
 * future authentication/security features (account verification, password reset).
 */

// Store user socket connections: userId -> socketId[]
const userSockets = new Map<string, Set<string>>();

// Store socket to user mapping: socketId -> userId
const socketToUser = new Map<string, string>();

export interface AuthenticatedSocket {
  userId: string;
  user: JWTPayload;
}

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const payload = verifyToken(token);
      
      // Attach user info to socket
      (socket as any).userId = payload.userId;
      (socket as any).user = payload;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    const socketId = socket.id;

    console.log(`✅ User ${userId} connected (socket: ${socketId})`);

    // Add socket to user's socket list
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socketId);
    socketToUser.set(socketId, userId);

    // Join user's personal room for direct notifications
    socket.join(`user:${userId}`);

    // Handle joining conversation rooms
    socket.on('join:job', (jobId: string) => {
      socket.join(`job:${jobId}`);
      console.log(`📨 User ${userId} joined job room: ${jobId}`);
    });

    socket.on('join:contract', (contractId: string) => {
      socket.join(`contract:${contractId}`);
      console.log(`📨 User ${userId} joined contract room: ${contractId}`);
    });

    socket.on('leave:job', (jobId: string) => {
      socket.leave(`job:${jobId}`);
      console.log(`📨 User ${userId} left job room: ${jobId}`);
    });

    socket.on('leave:contract', (contractId: string) => {
      socket.leave(`contract:${contractId}`);
      console.log(`📨 User ${userId} left contract room: ${contractId}`);
    });

    // Handle typing indicators
    socket.on('typing:start', (data: { jobId?: string; contractId?: string; receiverId: string }) => {
      const receiverSockets = userSockets.get(data.receiverId);
      if (receiverSockets) {
        receiverSockets.forEach(sockId => {
          io.to(sockId).emit('typing:start', {
            userId,
            jobId: data.jobId,
            contractId: data.contractId,
          });
        });
      }
    });

    socket.on('typing:stop', (data: { jobId?: string; contractId?: string; receiverId: string }) => {
      const receiverSockets = userSockets.get(data.receiverId);
      if (receiverSockets) {
        receiverSockets.forEach(sockId => {
          io.to(sockId).emit('typing:stop', {
            userId,
            jobId: data.jobId,
            contractId: data.contractId,
          });
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User ${userId} disconnected (socket: ${socketId})`);
      
      // Remove socket from user's list
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socketId);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
        }
      }
      socketToUser.delete(socketId);
    });
  });

  return io;
}

/**
 * Helper function to emit to specific user (IN-APP NOTIFICATIONS ONLY)
 * 
 * Used for delivering in-app notifications via Socket.IO.
 * All marketplace notifications use this for real-time delivery.
 * 
 * NOTE: This does NOT send emails. Email is reserved for future auth/security features.
 */
export function emitToUser(userId: string, event: string, data: any) {
  const io = (global as any).io as SocketIOServer | undefined;
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit to user');
    return;
  }

  const userSocketSet = userSockets.get(userId);
  if (userSocketSet) {
    userSocketSet.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  } else {
    // User not connected, emit to their personal room (they'll receive when they reconnect)
    io.to(`user:${userId}`).emit(event, data);
  }
}

// Helper function to emit to a room
export function emitToRoom(room: string, event: string, data: any) {
  const io = (global as any).io as SocketIOServer | undefined;
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit to room');
    return;
  }
  io.to(room).emit(event, data);
}

// Get active socket count for a user
export function getUserSocketCount(userId: string): number {
  return userSockets.get(userId)?.size || 0;
}

// Check if user is online
export function isUserOnline(userId: string): boolean {
  return (userSockets.get(userId)?.size || 0) > 0;
}

