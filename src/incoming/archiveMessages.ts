import { prI } from '../prisma-instance';
import { shli_message } from '@prisma/client';

export type ArchiveMessagesDto = {
  messageIds: number[];
  archived: number;
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

  const publishedToFind = archived == 1 ? 1 : 0;
  const publishedToSet = archived == 1 ? 0 : 1;

  const whereCondition = { id: { in: messageIds }, published: publishedToFind };
  const messagesToArchive = await prI.shli_message.findMany({
    where: whereCondition,
  });

  if (!messagesToArchive.length) {
    throw (
      `${msig} No messages[${messageIds}] found (already published=${publishedToFind})` +
      ` where ${JSON.stringify(whereCondition)}`
    );
  }

  const ret: ArchivedMessagesDto = { messageIds: [] };
  for (var messageToArchive of messagesToArchive) {
    const alreadyArchived = messageToArchive.published == publishedToSet;
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
          published: publishedToSet,
        },
      })
      .catch(reason => {
        throw reason;
      });

    ret.messageIds.push(afterUpdate.id);
  }
  return ret;
}
