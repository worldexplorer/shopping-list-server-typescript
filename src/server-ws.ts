import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { runConfig, URL } from './server.config';

export function create(httpServer: http.Server) {
  const wsServer = new WebSocket.Server({ server: httpServer });

  wsServer.on('connection', (socket: WebSocket) => {
    console.log(`client connected length=${socket.listeners.length}`);

    console.log('emitting USER', mockRooms);
    socket.emit('user', JSON.stringify(mockUserBob));

    console.log('emitting ROOMS', mockRooms);
    socket.emit('rooms', JSON.stringify(mockRooms));

    socket.on('typing', data => {
      console.log('received TYPING', data);
      wsServer.emit('typing', data);
    });

    socket.on('login', data => {
      console.log('received LOGIN', data);

      console.log('emitting USER', mockRooms);
      socket.emit('user', JSON.stringify(mockUserBob));

      console.log('emitting ROOMS', mockRooms);
      socket.emit('rooms', JSON.stringify(mockRooms));
    });

    socket.on('message', data => {
      console.log(data);
      wsServer.emit('message', data);
    });
  });

  wsServer.on('close', (ws: WebSocket) => {
    console.log(`websocket closed, server died; length=${ws.listeners.length}`);
  });

  httpServer.on('error', (e: Error) => {
    console.log('Socket error', e);
    // const retry = e.code === 'EADDRINUSE' || e.errno === 'EADDRINUSE';
    const retry = true;
    if (retry) {
      console.log('Address in use, retrying...');
      setTimeout(() => {
        httpServer.close();
        httpServer.listen(runConfig.PORT, runConfig.HOST);
      }, 1000);
    }
  });

  httpServer.listen(runConfig.PORT, runConfig.HOST, () => {
    console.log(`WsServer is listening on ${URL}`);
  });
}
