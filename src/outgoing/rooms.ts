import { RoomsDto, RoomDto } from '../common/roomDto';
import { prI } from '../prisma-instance';

export async function rooms(userId: number): Promise<RoomsDto> {
  const cond = { person: userId };
  const rooms = await prI.shli_m2m_room_person.findMany({ where: cond });
  if (!rooms) {
    throw `No rooms found where ${JSON.stringify(cond)}`;
  }

  const ret: RoomsDto = {
    rooms: rooms.map(
      x =>
        <RoomDto>{
          id: x.id,
          name: x.ident,
          users: [], //x.
        }
    ),
  };

  return ret;
}
