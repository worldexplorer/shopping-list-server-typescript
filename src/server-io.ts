import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import { runConfig, URL } from './server.config';

export function create(httpServer: http.Server) {
  const ioServer = new socketio.Server(httpServer);

  ioServer.on('connect', client => {
    console.log('client connect...', client.id);

    client.on('typing', (data: any) => {
      ioServer.emit('typing', data);
    });

    client.on('message', (data: any) => {
      console.log(data);
      ioServer.emit('message', data);
    });

    client.on('location', (data: any) => {
      console.log(data);
      ioServer.emit('location', data);
    });

    client.on('connect', () => {
      console.log('<who?> connected', ioServer.sockets.name);
    });

    client.on('disconnect', () => {
      console.log('client disconnect...', client.id);
      // handleDisconnect()
    });

    client.on('error', (err: any) => {
      console.log('received error from client:', client.id);
      console.log(err);
    });
  });

  httpServer.listen(runConfig.PORT, runConfig.HOST, () => {
    // if (err) throw err;
    console.log(`Socket.IO is listening on ${URL}`);
  });
}
