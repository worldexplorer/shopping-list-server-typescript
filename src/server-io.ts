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

const server_port = 5000;
const server_ip: string = '192.168.43.135';
//server.listen(server_port, "192.168.43.135", function (err) {
// server.listen(server_port, "10.0.2.2", function (err) {
httpServer.listen(server_port, server_ip, () => {
  // if (err) throw err;
  console.log('Listening on port %d', server_port);
});
