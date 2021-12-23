import { RoomsDto, RoomDto } from '../common/roomDto';
import { UserDto } from '../common/userDto';
import { prI } from '../prisma-instance';

export async function rooms(userId: number): Promise<RoomsDto> {
  //v2
  const result = await prI.$queryRaw`
SELECT room.id, room.ident 
  , string_agg(DISTINCT CONCAT(person.id, '=', person.ident, ';', person.phone, ';', person.email), '~~') AS room_users
FROM shli_m2m_room_person m2m
  INNER JOIN shli_room room ON m2m.room=room.id
  INNER JOIN shli_m2m_room_person m2m_room_users ON m2m_room_users.room=room.id
  INNER JOIN shli_person person ON person.id=m2m_room_users.person
WHERE m2m.person=${userId}
GROUP BY room.id, room.ident      -- , room_users
`;
  console.log(`         v2 result`, JSON.stringify(result));

  const cond = { person: userId };
  const roomsForPerson = await prI.shli_m2m_room_person.findMany({
    where: cond,
    select: {
      Room: true,
    },
  });
  if (!roomsForPerson.length) {
    throw `No rooms found where ${JSON.stringify(cond)}`;
  }

  const roomsWithoutUsers: RoomDto[] = roomsForPerson.map(
    row =>
      <RoomDto>{
        id: row.Room.id,
        name: row.Room.ident,
        users: [], //x.Rooms.map(room => room.)
      }
  );

  // const roomIds = roomsWithoutUsers.map(x => x.id);
  const roomIds: number[] = Array.from(new Set(roomsWithoutUsers.map(x => x.id)));

  const cond2 = { room: { in: roomIds } };
  const personsInRooms = await prI.shli_m2m_room_person.findMany({
    where: cond2,
    select: {
      room: true,
      Person: true,
    },
  });

  const roomById = new Map<number, RoomDto>(roomsWithoutUsers.map(x => [x.id, x]));
  const personsByRoom: Map<number, typeof personsInRooms> = GroupBy(personsInRooms, 'room');
  // console.log(`personsByRoom`, personsByRoom);

  for (var tuple of personsByRoom.entries()) {
    const [rmId, personsInRooms] = tuple;
    const room = roomById.get(rmId);
    if (room) {
      const usersInRoom: UserDto[] = personsInRooms.map(
        x =>
          <UserDto>{
            id: x.Person.id,
            name: x.Person.ident,
            phone: x.Person.phone,
            email: x.Person.email,
          }
      );
      usersInRoom.forEach(x => room.users.push(x));
    }
  }
  // console.log(`roomById`, roomById);

  const roomsWithUsersDeduplicated: RoomDto[] = Array.from(roomById.values());
  return <RoomsDto>{ rooms: roomsWithUsersDeduplicated };
}

// https://inprod.dev/blog/2020-04-06-groupby-helper/
export function GroupBy<T, K extends keyof T>(array: T[], key: K) {
  let map = new Map<T[K], T[]>();
  array.forEach(item => {
    let itemKey = item[key];
    if (!map.has(itemKey)) {
      map.set(
        itemKey,
        array.filter(i => i[key] === item[key])
      );
    }
  });
  return map;
}
