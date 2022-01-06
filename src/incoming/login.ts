import { prI } from '../prisma-instance';

export type LoginDto = {
  phone: string;
};

export type UserDto = {
  id: number;
  name: string;
  email: string;
  phone: string;
  username: string;
  color: string;
};

export async function login(phone: string): Promise<UserDto> {
  const cond = { phone: `${phone}` };
  const person = await prI.shli_person.findFirst({ where: cond });
  if (!person) {
    throw `No person found where ${JSON.stringify(cond)}`;
  }

  const ret: UserDto = {
    id: person.id,
    name: person.ident,
    email: person.email,
    phone: person.phone,
    username: person.username,
    color: person.color,
  };

  return ret;
}
