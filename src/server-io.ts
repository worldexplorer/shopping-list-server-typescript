import * as http from 'http';
import * as socketio from 'socket.io';
import { runConfig, URL } from './server.config';

import { PrismaInit } from './prisma-instance';

import { MessageDto } from './outgoing/messageDto';
import { login } from './incoming/login';
import { LoginDto } from './incoming/loginDto';

import { rooms } from './outgoing/rooms';
import { GetMessagesDto, getMessages } from './outgoing/messages';
import { newMessage } from './incoming/newMessage';
import { NewMessageDto } from './incoming/newMessage';
import { editMessage, EditMessageDto } from './incoming/editMessage';

export function create(httpServer: http.Server) {
  const ioServer = new socketio.Server(httpServer);

  ioServer.on('connect', socket => {
    console.log('Socket.IO client connected', socket.id);

    const sendServerError = (reason: any) => {
      console.log('   << ERROR', reason);
      socket.emit('error', reason);
    };

    socket.on('typing', (data: any) => {
      // console.log('> TYPING', data);
      ioServer.emit('typing', data);
    });

    socket.on('login', async (json: LoginDto) => {
      try {
        console.log('> LOGIN', json);

        const userDto = await login(json.phone);
        console.log('   << USER', userDto);
        socket.emit('user', userDto);

        const roomsDto = await rooms(userDto.id);
        console.log('   << ROOMS', JSON.stringify(roomsDto));
        socket.emit('rooms', roomsDto);
      } catch (e) {
        sendServerError(e);
      }
    });

    socket.on('newMessage', async (json: NewMessageDto) => {
      console.log('> NEW_MESSAGE', json);
      try {
        const messageInserted: MessageDto = await newMessage(json);
        ioServer.emit('message', messageInserted);
      } catch (e) {
        sendServerError(e);
      }
    });

    socket.on('editMessage', async (json: EditMessageDto) => {
      console.log('> EDIT_MESSAGE', json);
      try {
        const messageEdited: MessageDto = await editMessage(json);
        ioServer.emit('message', messageEdited);
      } catch (e) {
        sendServerError(e);
      }
    });

    socket.on('getMessages', async (json: GetMessagesDto) => {
      try {
        console.log('> GET_MESSAGES', json);

        const messagesDto = await getMessages(json);
        console.log('   << MESSAGES', messagesDto);
        socket.emit('messages', messagesDto);
      } catch (e) {
        sendServerError(e);
      }
    });

    socket.on('connect', () => {
      console.log('<who?> connected', ioServer.sockets.name);
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO client disconnect...', socket.id);
      // handleDisconnect()
    });

    socket.on('error', (err: any) => {
      console.log('received error from Socket.IO client:', socket.id);
      console.log(err);
    });
  });

  httpServer.listen(runConfig.PORT, runConfig.HOST, async () => {
    //if (err) throw err;
    console.log(`Socket.IO is listening on ${URL}`);
    await PrismaInit();
  });
}
