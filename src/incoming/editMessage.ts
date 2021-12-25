import { prI } from '../prisma-instance';
import { MessageDto } from '../outgoing/messageDto';

export type EditMessageDto = {
  id: number;
  content: string;
};

export async function editMessage(editMsg: EditMessageDto): Promise<MessageDto> {
  const messageEdited = await prI.shli_message
    .update({
      where: {
        id: editMsg.id,
      },
      data: {
        content: editMsg.content,
        edited: true,
      },
      include: {
        shli_person: {
          select: {
            ident: true,
          },
        },
        shli_purchase: true,
      },
    })
    .catch(reason => {
      throw reason;
    });

  const ret: MessageDto = {
    id: messageEdited.id,
    date_created: messageEdited.date_created,
    date_updated: messageEdited.date_updated,

    content: messageEdited.content || '',
    edited: messageEdited.edited,
    room: messageEdited.room,
    user: messageEdited.person,
    user_name: messageEdited.shli_person.ident,

    purchaseId: messageEdited.purchase ?? undefined,
  };

  return ret;
}
