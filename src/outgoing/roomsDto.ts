import { UserDto } from '../incoming/login';

export type RoomDto = {
  id: number;
  name: string;
  users: UserDto[];
};

export type RoomsDto = {
  rooms: RoomDto[];
};
