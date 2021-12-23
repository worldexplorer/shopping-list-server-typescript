import { UserDto } from '../incoming/loginDto';

export type RoomDto = {
  id: number;
  name: string;
  users: UserDto[];
};

export type RoomsDto = {
  rooms: RoomDto[];
};
