import { prI } from '../prisma-instance';
import { MessageDto } from '../outgoing/messageDto';
import { PurchaseDto } from '../outgoing/purchaseDto';
import { NewPurchaseDto } from './newPurchaseDto';

export type NewMessageDto = {
  room: number;
  user: number;
  content: string;
  new_purchase?: NewPurchaseDto;
};

export async function newMessage(newMsg: NewMessageDto): Promise<MessageDto> {
  const { room, user, content, new_purchase: purchase } = newMsg;

  const messageCreated = await prI.shli_message
    .create({
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
    })
    .catch(reason => {
      throw reason;
    });

  const purchaseDto: PurchaseDto | undefined = undefined;

  const ret: MessageDto = {
    id: messageCreated.id,
    date_created: messageCreated.date_created,
    date_updated: messageCreated.date_updated,

    content: messageCreated.content || '',
    edited: messageCreated.edited,
    room: messageCreated.room,
    user: messageCreated.person,
    user_name: messageCreated.shli_person.ident,

    purchaseId: messageCreated.purchase ?? undefined,
    purchase: purchaseDto,
  };
  return ret;
}
