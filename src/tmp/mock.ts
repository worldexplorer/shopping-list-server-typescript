import { MessagesDto } from '../common/message';
import { RoomDto, RoomsDto } from '../common/room';
import { UserDto } from '../entity/user';

export const mockUserBob: UserDto = {
  id: 1,
  name: 'Bob',
  email: 'first@user',
  phone: '+1-555-5555',
};

export const mockUserAlice: UserDto = {
  id: 2,
  name: 'Alice',
  email: 'second@user',
  phone: '+1-555-6666',
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
      room: mockRoom.id,
      user: mockUserBob.id,
      user_name: mockUserBob.name,
    },
    {
      id: 2,
      date_created: new Date(),
      date_updated: new Date(),
      content: 'Hello Bob',
      room: mockRoom.id,
      user: mockUserAlice.id,
      user_name: mockUserAlice.name,
    },
    {
      id: 3,
      date_created: new Date(),
      date_updated: new Date(),
      content: 'This app is convenient, right?',
      room: mockRoom.id,
      user: mockUserBob.id,
      user_name: mockUserBob.name,
    },
  ],
  lastMessageId: 3,
};
