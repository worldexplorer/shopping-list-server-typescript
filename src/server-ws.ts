import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

const app = express();
const httpServer = http.createServer(app);
const wsServer = new WebSocket.Server({ server: httpServer });

// heroku provides dynamic ports
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5000;
// heroku crashes on IPv6 binding
const HOST: string = '0.0.0.0'; // '192.168.43.135'

wsServer.on('connection', (socket: WebSocket) => {
  console.log(`client connected length=${socket.listeners.length}`);

  socket.on('typing', data => {
    wsServer.emit('typing', data);
  });

  socket.on('message', data => {
    console.log(data);
    wsServer.emit('message', data);
  });
});

wsServer.on('close', (ws: WebSocket) => {
  console.log(`client disconnected length=${ws.listeners.length}`);
});

httpServer.on('error', (e: Error) => {
  console.log('Socket error', e);
  // const retry = e.code === 'EADDRINUSE' || e.errno === 'EADDRINUSE';
  const retry = true;
  if (retry) {
    console.log('Address in use, retrying...');
    setTimeout(() => {
      httpServer.close();
      // httpServer.listen(PORT);
      httpServer.listen(PORT, HOST);
    }, 1000);
  }
});

// httpServer.listen(server_port, () => {
httpServer.listen(PORT, HOST, () => {
  console.log(`Server started`, httpServer.address());
});
