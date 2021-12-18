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
