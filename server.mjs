import http from 'node:http';
import next from 'next';
import { WebSocketServer } from 'ws';
import { registerSocket, handleSocketMessage } from './lib/ws.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '127.0.0.1';
const port = Number(process.env.PORT || 3100);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = http.createServer((req, res) => {
  handle(req, res);
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (socket, request, context) => {
  registerSocket(socket, context);
  socket.on('message', (payload) => handleSocketMessage(socket, payload));
});

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname !== '/ws') {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    const threadId = url.searchParams.get('threadId') || '';
    const ownerId = url.searchParams.get('ownerId') || '';
    wss.emit('connection', ws, request, { threadId, ownerId });
  });
});

server.listen(port, hostname, () => {
  console.log(`Pet community MVP ready at http://${hostname}:${port}`);
});
