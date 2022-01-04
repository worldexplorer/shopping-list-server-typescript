import { prI } from '../prisma-instance';
import { shli_message } from '@prisma/client';

export type ArchiveMessagesDto = {
  messageIds: number[];
  archived: boolean;
  user: number;
};

export type ArchivedMessagesDto = {
  messageIds: number[];
};

export async function archiveMessages(readMsg: ArchiveMessagesDto): Promise<ArchivedMessagesDto> {
  const { messageIds, archived, user } = readMsg;
  const msig = `archiveMessages(messageIds[${messageIds.join(
    ','
  )}], archived[${archived}]) byUser[${user}]):`;

  const archivedToFind = !archived;

  const whereCondition = { id: { in: messageIds }, archived: archivedToFind };
  const messagesToArchive = await prI.shli_message.findMany({
    where: whereCondition,
  });

  if (!messagesToArchive.length) {
    throw (
      `${msig} No messages[${messageIds}] found (already archived=${archivedToFind})` +
      ` where ${JSON.stringify(whereCondition)}`
    );
  }

  const ret: ArchivedMessagesDto = { messageIds: [] };
  for (var messageToArchive of messagesToArchive) {
    const alreadyArchived = messageToArchive.archived;
    if (alreadyArchived) {
      console.warn(
        `${msig} Message[${messageToArchive}] is already archived ` +
          ` where ${JSON.stringify(whereCondition)}`
      );
      continue;
    }

    const afterUpdate: shli_message = await prI.shli_message
      .update({
        where: {
          id: messageToArchive.id,
        },
        data: {
          archived,
        },
      })
      .catch(reason => {
        throw reason;
      });

    ret.messageIds.push(afterUpdate.id);
  }
  return ret;
}
