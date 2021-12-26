import { prI } from '../prisma-instance';
import { shli_message } from '@prisma/client';

export type MarkMessageReadDto = {
  message: number;
  user: number;
};

export type UpdatedMessageReadDto = {
  id: number;
  persons_read: number[];
};

export async function markMessageRead(readMsg: MarkMessageReadDto): Promise<UpdatedMessageReadDto> {
  const { message, user } = readMsg;
  const msig = `markMessageRead(messageId[${message} byUser[${user}]):`;

  const whereCondition = { id: message, deleted: 0 };
  const messageToMarkReadByOneUser = await prI.shli_message.findFirst({
    where: whereCondition,
  });

  if (!messageToMarkReadByOneUser) {
    throw `${msig} No message[${message}] found (already deleted?) where ${JSON.stringify(
      whereCondition
    )}`;
  }

  const newPersonsRead = messageToMarkReadByOneUser.persons_read;
  if (newPersonsRead.find(x => x === user)) {
    throw (
      `${msig} Message[${message}] already already has user[${user}] ` +
      `among persons_read[${newPersonsRead}] where ${JSON.stringify(whereCondition)}`
    );
  }

  newPersonsRead.push(user);

  const afterUpdate: shli_message = await prI.shli_message
    .update({
      where: {
        id: readMsg.message,
      },
      data: {
        persons_read: newPersonsRead,
      },
    })
    .catch(reason => {
      throw reason;
    });

  const ret: UpdatedMessageReadDto = {
    id: afterUpdate.id,
    persons_read: afterUpdate.persons_read,
  };
  return ret;
}
