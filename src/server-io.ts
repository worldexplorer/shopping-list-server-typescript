import * as http from 'http';
import * as socketio from 'socket.io';
import { runConfig, URL } from './server.config';
import { mockUserBob, mockRooms, GetMessages, mockMessages } from './mock';

export function create(httpServer: http.Server) {
  const ioServer = new socketio.Server(httpServer);

  ioServer.on('connect', socket => {
    console.log('client connect...', socket.id);

    socket.on('typing', (data: any) => {
      // console.log('> TYPING', data);
      ioServer.emit('typing', data);
    });

    socket.on('login', (data: any) => {
      console.log('> LOGIN', data);

      console.log('   << USER', mockUserBob);
      socket.emit('user', mockUserBob);

      console.log('   << ROOMS', mockRooms);
      socket.emit('rooms', mockRooms);
    });

    socket.on('message', (data: any) => {
      console.log('> MESSAGE', data);
      ioServer.emit('message', data);
    });

    socket.on('getMessages', (data: GetMessages) => {
      console.log('> MESSAGES', data);
      console.log('   << MESSAGES', mockMessages);
      socket.emit('messages', mockMessages);
    });

    socket.on('connect', () => {
      console.log('<who?> connected', ioServer.sockets.name);
    });

    socket.on('disconnect', () => {
      console.log('client disconnect...', socket.id);
      // handleDisconnect()
    });

    socket.on('error', (err: any) => {
      console.log('received error from client:', socket.id);
      console.log(err);
    });
  });

  httpServer.listen(runConfig.PORT, runConfig.HOST, () => {
    // if (err) throw err;
    console.log(`Socket.IO is listening on ${URL}`);
  });
}
