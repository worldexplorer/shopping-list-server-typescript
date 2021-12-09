import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as constants from './server-const';

export function create(app: any, httpServer: http.Server) {
  const wsServer = new WebSocket.Server({ server: httpServer });

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
        httpServer.listen(constants.PORT, constants.HOST);
      }, 1000);
    }
  });

  httpServer.listen(constants.PORT, constants.HOST, () => {
    console.log(`WsServer is listening on ${constants.URL}`);
    app.set(constants.keyPort, constants.PORT);
  });
}
