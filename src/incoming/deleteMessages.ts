import { prI } from '../prisma-instance';
import { shli_message } from '@prisma/client';

export type DeleteMessagesDto = {
  messageIds: number[];
  user: number;
};

export type DeletedMessagesDto = {
  messageIds: number[];
};

export async function deleteMessages(readMsg: DeleteMessagesDto): Promise<DeletedMessagesDto> {
  const { messageIds, user } = readMsg;
  const msig = `deleteMessages(messageIds[${messageIds.join(',')}]) byUser[${user}]):`;

  const whereCondition = { id: { in: messageIds }, deleted: 0 };
  const messagesToDelete = await prI.shli_message.findMany({
    where: whereCondition,
  });

  if (!messagesToDelete.length) {
    throw (
      `${msig} No messages[${messageIds}] found (already deleted?)` +
      ` where ${JSON.stringify(whereCondition)}`
    );
  }

  const ret: DeletedMessagesDto = { messageIds: [] };
  for (var messageToDelete of messagesToDelete) {
    const alreadyDeleted = messageToDelete.deleted == 1;
    if (alreadyDeleted) {
      console.warn(
        `${msig} Message[${messageToDelete}] is already deleted ` +
          ` where ${JSON.stringify(whereCondition)}`
      );
      continue;
    }

    const afterUpdate: shli_message = await prI.shli_message
      .update({
        where: {
          id: messageToDelete.id,
        },
        data: {
          deleted: 1,
        },
      })
      .catch(reason => {
        throw reason;
      });

    ret.messageIds.push(afterUpdate.id);
  }
  return ret;
}
