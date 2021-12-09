import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';

const app = express();
const httpServer = http.createServer(app);
const wsServer = new socketio.Server(httpServer);

wsServer.on('connection', function (socket) {
  console.log('client connect...', socket.id);

  socket.on('typing', function name(data) {
    wsServer.emit('typing', data);
  });

  socket.on('message', function name(data) {
    console.log(data);
    wsServer.emit('message', data);
  });

  socket.on('location', function name(data) {
    console.log(data);
    wsServer.emit('location', data);
  });

  socket.on('connect', function () {});

  socket.on('disconnect', function () {
    console.log('client disconnect...', socket.id);
    // handleDisconnect()
  });

  socket.on('error', function (err) {
    console.log('received error from client:', socket.id);
    console.log(err);
  });
});

// heroku provides dynamic ports
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5000;
// heroku crashes on IPv6 binding
const HOST: string = '0.0.0.0'; // '192.168.43.135'

httpServer.listen(PORT, HOST, () => {
  // if (err) throw err;
  console.log(`Socket.IO is listening on http://${HOST}:${PORT}`);
});
