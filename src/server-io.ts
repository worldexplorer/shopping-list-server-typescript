import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as constants from './server-const';

export function create(app: any, httpServer: http.Server) {
  const ioServer = new socketio.Server(httpServer);

  ioServer.on('connection', function (socket) {
    console.log('client connect...', socket.id);

    socket.on('typing', data => {
      ioServer.emit('typing', data);
    });

    socket.on('message', data => {
      console.log(data);
      ioServer.emit('message', data);
    });

    socket.on('location', data => {
      console.log(data);
      ioServer.emit('location', data);
    });

    socket.on('connect', () => {});

    socket.on('disconnect', () => {
      console.log('client disconnect...', socket.id);
      // handleDisconnect()
    });

    socket.on('error', err => {
      console.log('received error from client:', socket.id);
      console.log(err);
    });
  });

  httpServer.listen(constants.PORT, constants.HOST, () => {
    // console.log(`process.env:`, process.env);
    // if (err) throw err;
    console.log(`Socket.IO is listening on ${constants.URL}`);
    app.set(constants.keyPort, constants.PORT);
  });
}
