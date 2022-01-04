import { RoomDto, RoomsDto } from '../outgoing/roomsDto';
import { UserDto } from '../incoming/loginDto';
import { MessagesDto } from '../outgoing/messageDto';

export const mockUserBob: UserDto = {
  id: 1,
  name: 'Bob',
  email: 'first@user',
  phone: '+1-555-5555',
  username: '@bob',
  color: 'yellow',
};

export const mockUserAlice: UserDto = {
  id: 2,
  name: 'Alice',
  email: 'second@user',
  phone: '+1-555-6666',
  username: '@alice',
  color: 'green',
};

export const mockRoom: RoomDto = {
  id: 1,
  name: 'Our MOCK chat',
  users: [mockUserBob, mockUserAlice],
};

export const mockRooms: RoomsDto = { rooms: [mockRoom] };

export const mockMessages: MessagesDto = {
  room: 1,
  messages: [
    {
      id: 1,
      date_created: new Date(),
      date_updated: new Date(),
      content: "Hello Alice, it's Bob",
      edited: false,
      persons_sent: [mockUserBob.id, mockUserAlice.id],
      persons_read: [mockUserBob.id, mockUserAlice.id],
      room: mockRoom.id,
      user: mockUserBob.id,
      user_name: mockUserBob.name,
    },
    {
      id: 2,
      date_created: new Date(),
      date_updated: new Date(),
      content: 'Hello Bob',
      edited: true,
      replyto_id: 1,
      room: mockRoom.id,
      persons_sent: [mockUserBob.id, mockUserAlice.id],
      persons_read: [mockUserBob.id, mockUserAlice.id],
      user: mockUserAlice.id,
      user_name: mockUserAlice.name,
    },
    {
      id: 3,
      date_created: new Date(),
      date_updated: new Date(),
      content: 'This app is convenient, right?',
      edited: true,
      replyto_id: 2,
      persons_sent: [mockUserBob.id, mockUserAlice.id],
      persons_read: [mockUserBob.id, mockUserAlice.id],
      room: mockRoom.id,
      user: mockUserBob.id,
      user_name: mockUserBob.name,
    },
  ],
  lastMessageId: 3,
};
