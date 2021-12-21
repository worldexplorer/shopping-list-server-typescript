import { UserDto } from '../entity/user';

export type RoomDto = {
  id: number;
  name: string;
  users: UserDto[];
};

export type RoomsDto = {
  rooms: RoomDto[];
};
