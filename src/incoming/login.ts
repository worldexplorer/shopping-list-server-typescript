import { UserDto } from '../entity/user';
import { mockUserBob } from '../tmp/mock';

export async function login(phone: string): Promise<UserDto> {
  const ret: UserDto = mockUserBob;
  return ret;
}
