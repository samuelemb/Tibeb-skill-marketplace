"use client";

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocketBaseUrl() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
}

export function connectSocket(token: string): Socket {
  if (socket) {
    return socket;
  }

  socket = io(getSocketBaseUrl(), {
    transports: ['websocket', 'polling'],
    auth: {
      token,
    },
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
