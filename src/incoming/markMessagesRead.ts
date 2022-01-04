import { prI } from '../prisma-instance';
import { shli_message } from '@prisma/client';

export type MarkMessagesReadDto = {
  messageIds: number[];
  user: number;
};

export type UpdatedMessageReadDto = {
  id: number;
  persons_read: number[];
};

export async function markMessagesRead(
  readMsg: MarkMessagesReadDto
): Promise<UpdatedMessageReadDto[]> {
  const { messageIds, user } = readMsg;
  const msig = `markMessageRead(messageIds[${messageIds.join(',')}] byUser[${user}]):`;

  const whereCondition = { id: { in: messageIds }, deleted: false };
  const messagesToMarkReadByOneUser = await prI.shli_message.findMany({
    where: whereCondition,
  });

  if (!messagesToMarkReadByOneUser.length) {
    throw `${msig} No messages[${messageIds}] found (already deleted?) where ${JSON.stringify(
      whereCondition
    )}`;
  }

  const ret: UpdatedMessageReadDto[] = [];
  for (var messageToMarkRead of messagesToMarkReadByOneUser) {
    const newPersonsRead = messageToMarkRead.persons_read;
    if (newPersonsRead.find(x => x === user)) {
      console.warn(
        `${msig} Message[${messageToMarkRead}] already has user[${user}] ` +
          `among persons_read[${newPersonsRead}] where ${JSON.stringify(whereCondition)}`
      );
      continue;
    }

    newPersonsRead.push(user);

    const afterUpdate: shli_message = await prI.shli_message
      .update({
        where: {
          id: messageToMarkRead.id,
        },
        data: {
          persons_read: newPersonsRead,
        },
      })
      .catch(reason => {
        throw reason;
      });

    const msgUpdated: UpdatedMessageReadDto = {
      id: afterUpdate.id,
      persons_read: afterUpdate.persons_read,
    };
    ret.push(msgUpdated);
  }
  return ret;
}
