import { WebSocket } from 'ws';
import { findOwner, getThreadParticipants } from './state.js';

const socketsByThread = new Map();
const socketsByOwner = new Map();

export function registerSocket(socket, { threadId, ownerId }) {
  if (threadId) {
    if (!socketsByThread.has(threadId)) {
      socketsByThread.set(threadId, new Set());
    }
    socketsByThread.get(threadId).add(socket);
  }
  if (ownerId) {
    if (!socketsByOwner.has(ownerId)) {
      socketsByOwner.set(ownerId, new Set());
    }
    socketsByOwner.get(ownerId).add(socket);
  }

  socket.send(JSON.stringify({ type: 'connected', threadId, ownerId }));

  socket.on('close', () => {
    if (threadId && socketsByThread.has(threadId)) {
      socketsByThread.get(threadId).delete(socket);
      if (socketsByThread.get(threadId).size === 0) socketsByThread.delete(threadId);
    }
    if (ownerId && socketsByOwner.has(ownerId)) {
      socketsByOwner.get(ownerId).delete(socket);
      if (socketsByOwner.get(ownerId).size === 0) socketsByOwner.delete(ownerId);
    }
  });
}

export function broadcastThread(threadId, payload) {
  const sockets = socketsByThread.get(threadId);
  if (!sockets) return;
  const message = JSON.stringify(payload);
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }
}

export function broadcastOwner(ownerId, payload) {
  const sockets = socketsByOwner.get(ownerId);
  if (!sockets) return;
  const message = JSON.stringify(payload);
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }
}

export async function handleSocketMessage(socket, payload) {
  try {
    const message = JSON.parse(payload.toString());
    if (message.type === 'ping') {
      socket.send(JSON.stringify({ type: 'pong', at: new Date().toISOString() }));
    }
  } catch {
    socket.send(JSON.stringify({ type: 'error', message: 'invalid payload' }));
  }
}

export async function notifyChatUpdate(threadId, ownerId, content) {
  const participants = getThreadParticipants(threadId);
  const ownerRecords = await Promise.all(participants.map((id) => findOwner(id)));
  for (const participant of ownerRecords.filter(Boolean)) {
    broadcastOwner(participant.id, {
      type: 'chat_update',
      threadId,
      ownerId,
      content,
      at: new Date().toISOString()
    });
  }
  broadcastThread(threadId, {
    type: 'chat_update',
    threadId,
    ownerId,
    content,
    at: new Date().toISOString()
  });
}
