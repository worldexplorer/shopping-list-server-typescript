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
import {
  markMessagesRead,
  MarkMessagesReadDto,
  UpdatedMessageReadDto,
} from './incoming/markMessagesRead';
import { DeletedMessagesDto, deleteMessages, DeleteMessagesDto } from './incoming/deleteMessages';
import {
  ArchivedMessagesDto,
  archiveMessages,
  ArchiveMessagesDto,
} from './incoming/archiveMessages';

const userBySocket = new Map<string, number>();

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

        userBySocket.set(socket.id, userDto.id);
        const record = `   socket[${socket.id}]:userId[${userDto.id}]`;
        console.log(`${record} ADDED to userBySocket Map`);

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
        const roomUsers = Array.from(new Set(userBySocket.values()));

        const messageInserted: MessageDto = await newMessage(json, roomUsers);
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

    socket.on('markMessagesRead', async (json: MarkMessagesReadDto) => {
      console.log('> MARK_MESSAGES_READ', json);
      try {
        const messagesMarkedRead: UpdatedMessageReadDto[] = await markMessagesRead(json);
        if (messagesMarkedRead.length > 0) {
          console.log('   << UPDATED_MESSAGES_READ', JSON.stringify(messagesMarkedRead));
          ioServer.emit('updatedMessagesRead', messagesMarkedRead);
        } else {
          console.log(
            '   -- UPDATED_MESSAGES_READ ZERO NOT_SENT',
            JSON.stringify(messagesMarkedRead)
          );
        }
      } catch (e) {
        sendServerError(e);
      }
    });

    socket.on('archiveMessages', async (json: ArchiveMessagesDto) => {
      console.log('> ARCHIVE_MESSAGES', json);
      try {
        const messagesArchived: ArchivedMessagesDto = await archiveMessages(json);
        if (messagesArchived.messageIds.length > 0) {
          console.log('   << ARCHIVED_MESSAGES', JSON.stringify(messagesArchived));
          ioServer.emit('archivedMessages', messagesArchived);
        } else {
          console.log('   -- ARCHIVED_MESSAGES ZERO NOT_SENT', JSON.stringify(messagesArchived));
        }
      } catch (e) {
        sendServerError(e);
      }
    });

    socket.on('deleteMessages', async (json: DeleteMessagesDto) => {
      console.log('> DELETE_MESSAGES', json);
      try {
        const messagesDeleted: DeletedMessagesDto = await deleteMessages(json);
        if (messagesDeleted.messageIds.length > 0) {
          console.log('   << DELETED_MESSAGES', JSON.stringify(messagesDeleted));
          ioServer.emit('deletedMessages', messagesDeleted);
        } else {
          console.log('   -- DELETED_MESSAGES ZERO NOT_SENT', JSON.stringify(messagesDeleted));
        }
      } catch (e) {
        sendServerError(e);
      }
    });

    socket.on('getMessages', async (json: GetMessagesDto) => {
      try {
        console.log('> GET_MESSAGES', json);

        const messagesDto = await getMessages(json);
        console.log(
          '   << MESSAGES/purchase: ',
          //  messagesDto.messages.length
          messagesDto.messages.map(x => JSON.stringify(x.purchase))
        );
        socket.emit('messages', messagesDto);
      } catch (e) {
        sendServerError(e);
      }
    });

    socket.on('connect', () => {
      console.log('<who?> connected', ioServer.sockets.name);
    });

    socket.on('disconnect', () => {
      let removedFromLookup = '';
      try {
        let record = `socket[${socket.id}]`;
        if (userBySocket.has(socket.id)) {
          const userId = userBySocket.get(socket.id);
          record += `:userId[${userId}]`;
          userBySocket.delete(socket.id);
          removedFromLookup = `${record} removed from userBySocket Map`;
        } else {
          removedFromLookup = `${record} REMOVED EARLIER from userBySocket Map`;
        }
      } catch (e) {
        removedFromLookup = `EXCEPTION userBySocket.delete(${socket.id}): ` + JSON.stringify(e);
      }
      console.log(`Socket.IO [${socket.id}] client disconnected, ${removedFromLookup}`);
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
