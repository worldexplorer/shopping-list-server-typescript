import * as http from 'http';
import * as socketio from 'socket.io';
import { runConfig, URL } from './server.config';

import { PrismaInit } from './prisma-instance';

import { MessageDto } from './outgoing/messageDto';
import { LoginDto, login, UserDto } from './incoming/login';

import { rooms } from './outgoing/rooms';
import { GetMessagesDto, getMessages, selectMessage } from './outgoing/messages';
import { newMessage } from './incoming/newMessage';
import { NewMessageDto } from './incoming/newMessage';
import { editMessage, EditMessageDto, updateMessageSetEditedTrue } from './incoming/editMessage';
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
import { updateMessageIdInPurchase, newPurchase, NewPurchaseDto } from './incoming/newPurchase';
import { RoomsDto } from './outgoing/roomsDto';
import { EditPurchaseDto, editPurchase } from './incoming/editPurchase';
import { shli_message, shli_purchase } from '@prisma/client';
import { fillPurchase, FillPurchaseDto } from './incoming/fillPurchase';

type SocketUserRoom = {
  socketId: string;
  userId: number;
  roomIds: number[];
};

const userBySocket = new Map<string, SocketUserRoom>();

const usersByRoom = new Map<number, number[]>();

export function create(httpServer: http.Server) {
  const ioServer = new socketio.Server(httpServer);

  ioServer.on('connect', socket => {
    console.log('Socket.IO client connected', socket.id);

    const sendServerError = (reason: any) => {
      console.log('   << ERROR', `${reason}`);
      socket.emit('error', `${reason}`);
    };

    socket.on('typing', (data: any) => {
      // console.log('> TYPING', data);
      ioServer.emit('typing', data);
    });

    socket.on('login', async (json: LoginDto) => {
      try {
        console.log('> LOGIN', json);

        const userDto: UserDto = await login(json.phone);
        const roomsDto: RoomsDto = await rooms(userDto.id);
        for (const room of roomsDto.rooms) {
          const users: UserDto[] = room.users;
          const userIds: number[] = users.map(x => x.id);
          usersByRoom.set(room.id, userIds);
        }

        const userInfo: SocketUserRoom = {
          socketId: socket.id,
          userId: userDto.id,
          roomIds: roomsDto.rooms.map(x => x.id),
        };

        userBySocket.set(socket.id, userInfo);
        const record = `   socket[${socket.id}]:userId[${
          userInfo.userId
        }]:rooms[${userInfo.roomIds.join(',')}]`;
        console.log(`${record} ADDED to userBySocket Map`);

        console.log('   << USER', userDto);
        socket.emit('user', userDto);

        console.log('   << ROOMS', JSON.stringify(roomsDto));
        socket.emit('rooms', roomsDto);
      } catch (e) {
        sendServerError(e);
      }
    });

    function isUserInRoom(
      msig: string,
      socketId: string,
      roomId: number
    ): [number, number[], string] {
      msig += `:socket[${socketId}]`;

      const userInfo: SocketUserRoom | undefined = userBySocket.get(socketId);
      if (!userInfo) {
        throw `NO_USER_FOR_SOCKET[${msig}]`;
      }
      const userId = userInfo.userId;
      msig += `:userId[${userId}]`;

      const roomUserIds: number[] | undefined = usersByRoom.get(roomId);
      if (!roomUserIds) {
        throw `NO_ROOMS_FOR_USER[${msig}]`;
      }

      return [userId, roomUserIds, msig];
    }

    async function canUserEdit(
      msig: string,
      socketId: string,
      roomId: number,
      messageId: number,
      purchaseId?: number
    ): Promise<[number, number[], string]> {
      const [userId, roomUserIds, msig2] = isUserInRoom(msig, socketId, roomId);
      const msig3 = msig2 + `:messageId[${messageId}]:purchaseId[${purchaseId}]`;

      const messageWithPurchase: MessageDto = await selectMessage(messageId);

      if (purchaseId) {
        if (!messageWithPurchase.purchase) {
          throw `NO_PURCHASE_FOUND_IN_MESSAGE[${msig3}]`;
        }

        if (!messageWithPurchase.purchase.persons_can_edit?.includes(userId)) {
          throw `NOT_ALLOWED_TO_EDIT_PURCHASE[${msig3}]`;
        }
      } else {
        if (messageWithPurchase.user !== userId) {
          throw `CAN_NOT_EDIT_OTHER_PERSONS_MESSAGE[${msig3}]`;
        }
      }

      return [userId, roomUserIds, msig];
    }
    socket.on('newMessage', async (json: NewMessageDto) => {
      console.log('> NEW_MESSAGE', json);
      try {
        const [userIdCreated, roomUserIds] = isUserInRoom(`newMessage()`, socket.id, json.room);

        const messageInserted: MessageDto = await newMessage(json, userIdCreated, roomUserIds);
        ioServer.emit('message', messageInserted);
      } catch (e) {
        sendServerError(e);
      }
    });

    socket.on('editMessage', async (json: EditMessageDto) => {
      console.log('> EDIT_MESSAGE', json);
      try {
        const [userId] = await canUserEdit(`editMessage()`, socket.id, json.room, json.id);

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

    socket.on('newPurchase', async (json: NewPurchaseDto) => {
      console.log('> NEW_PURCHASE', json);
      try {
        const [userIdCreated, roomUserIds] = isUserInRoom(`newPurchase()`, socket.id, json.room);

        let log = '';
        if (json.persons_can_edit == undefined) {
          json.persons_can_edit = roomUserIds;
          log += ` (added persons_can_edit=[${json.persons_can_edit.join(',')}])`;
        }
        console.log(`    1/4 inserting newPurchase${log}`, json);
        const purchaseInserted: shli_purchase = await newPurchase(json, userIdCreated);

        // copypaste from socket.on('newMessage'):
        const jsonNewMessage: NewMessageDto = {
          room: json.room,
          content: '[' + json.name.substring(0, 20) + ']',
          replyto_id: json.replyto_id,
          purchase: purchaseInserted.id,
        };

        console.log(`    2/4 inserting newMessage`, jsonNewMessage);
        const messageInserted: MessageDto = await newMessage(
          jsonNewMessage,
          userIdCreated,
          roomUserIds
        );

        console.log(
          `    3/4 updating purchase[${purchaseInserted.id}].message=${messageInserted.id}`
        );
        const messageIdUpdated = await updateMessageIdInPurchase(
          purchaseInserted.id,
          messageInserted.id
        );

        console.log(`    4/4 selecting message=${messageInserted.id}`);
        const messageInsertedUpdatedWithPurchase: MessageDto = await selectMessage(
          messageInserted.id
        );

        console.log(
          `   << MESSAGE/newPurchase[${purchaseInserted.id}]:messageIdUpdated[${messageIdUpdated}]`,
          JSON.stringify(messageInsertedUpdatedWithPurchase)
        );
        ioServer.emit('message', messageInsertedUpdatedWithPurchase);
      } catch (e) {
        sendServerError(e);
      }
    });

    socket.on('editPurchase', async (json: EditPurchaseDto) => {
      console.log('> EDIT_PURCHASE', json);
      try {
        const [userId] = await canUserEdit(
          `editPurchase()`,
          socket.id,
          json.room,
          json.message,
          json.id
        );

        console.log(`    1/3 updating purchase`, json);
        const purchaseEdited: shli_purchase = await editPurchase(json);

        console.log(`    2/3 updating message[${json.message}].edited=true`);
        const messageEdited: shli_message = await updateMessageSetEditedTrue(json.message);

        console.log(`    3/3 selecting message[${json.message}]`);
        const messageWithPurchaseEdited: MessageDto = await selectMessage(json.message);

        console.log(
          `   << MESSAGE/purchaseEdited[${purchaseEdited.id}]:messageIdUpdated[${messageEdited.id}]`,
          messageWithPurchaseEdited.purchase
        );
        ioServer.emit('message', messageWithPurchaseEdited);
      } catch (e) {
        sendServerError(e);
      }
    });

    socket.on('fillPurchase', async (json: FillPurchaseDto) => {
      console.log('> FILL_PURCHASE');
      try {
        const [userId] = await canUserEdit(
          `fillPurchase()`,
          socket.id,
          json.room,
          json.message,
          json.id
        );

        console.log(`    1/2 filling purchase`);
        const purchaseEdited: shli_purchase | undefined = await fillPurchase(json, sendServerError);

        if (!purchaseEdited) {
          const msg = `INVOKED_IN_VAIN__PR_FIX_COMPARE() //fillPurchase(${json.id})`;
          console.error(
            `        ${msg}`
            //, json
          );
          sendServerError(msg);
          // throw msg;
        }

        console.log(`    2/2 selecting message[${json.message}]`);
        const messageWithPurchaseFilled: MessageDto = await selectMessage(json.message);

        console.log(
          `   << MESSAGE/purchaseFilled[${json.id}]:messageId[${messageWithPurchaseFilled.id}]`
        );
        ioServer.emit('message', messageWithPurchaseFilled);
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
          record += `:userId[${JSON.stringify(userId)}]`;
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
