import { prI } from '../prisma-instance';
import { NewMessageDto } from './newMessageDto';
import { MessageDto } from '../outgoing/messageDto';
import { PurchaseDto } from '../outgoing/purchaseDto';

export async function newMessage({
  room,
  user,
  content,
  purchase,
}: NewMessageDto): Promise<MessageDto> {
  const messageCreated = await prI.shli_message.create({
    data: {
      room,
      person: user,
      content,
      purchase: undefined, // TODO
    },
    include: {
      shli_person: {
        select: {
          ident: true,
        },
      },
    },
  });

  const purchaseDto: PurchaseDto | undefined = undefined;

  const ret: MessageDto = {
    id: messageCreated.id,
    date_created: messageCreated.date_created,
    date_updated: messageCreated.date_updated,

    content: messageCreated.content || '',
    room: messageCreated.room,
    user: messageCreated.person,
    user_name: messageCreated.shli_person.ident,

    purchaseId: messageCreated.purchase ?? undefined,
    purchase: purchaseDto,
  };
  return ret;
}
