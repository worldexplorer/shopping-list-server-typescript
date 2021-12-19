type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

type Room = {
  id: number;
  name: string;
  users: User[];
};

type Rooms = {
  rooms: Room[];
};

type Purchase = {
  id: number;
  date_created: Date;
  date_updated: Date;

  name: string;

  room: number;
  user: number;

  show_pgroup: number;
  show_price: number;
  show_qnty: number;
  show_weight: number;

  person_created: number;
  person_created_name: string;
  person_purchased: number;
  person_purchased_name: string;

  price_total: number;
  weight_total: number;
};

type Message = {
  id: number;
  date_created: Date;
  date_updated: Date;

  content: string;
  room: number;
  user: number;
  user_name: string;

  purchaseId?: number;
  purchase?: Purchase;
};

export type GetMessages = {
  room: number;
  fromMessageId: number;
};

type Messages = {
  room: number;
  messages: Message[];
  lastMessageId: number;
};

export const mockUserBob: User = {
  id: 1,
  name: 'Bob',
  email: 'first@user',
  phone: '+1-555-5555',
};

export const mockUserAlice: User = {
  id: 2,
  name: 'Alice',
  email: 'second@user',
  phone: '+1-555-6666',
};

export const mockRoom: Room = {
  id: 1,
  name: 'Our MOCK chat',
  users: [mockUserBob, mockUserAlice],
};

export const mockRooms: Rooms = { rooms: [mockRoom] };

export const mockMessages: Messages = {
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
