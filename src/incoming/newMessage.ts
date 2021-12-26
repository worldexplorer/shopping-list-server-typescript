import { prI } from '../prisma-instance';
import { MessageDto } from '../outgoing/messageDto';
import { PurchaseDto } from '../outgoing/purchaseDto';
import { NewPurchaseDto } from './newPurchaseDto';
import { messageDaoToDto } from '../outgoing/messages';

export type NewMessageDto = {
  room: number;
  user: number;
  content: string;
  new_purchase?: NewPurchaseDto;
};

export async function newMessage(newMsg: NewMessageDto, roomUsers: number[]): Promise<MessageDto> {
  const { room, user, content, new_purchase: purchase } = newMsg;

  const messageCreated = await prI.shli_message
    .create({
      data: {
        room,
        person: user,
        content,
        purchase: undefined, // TODO
        persons_sent: roomUsers,
      },
      include: {
        Creator: {
          select: {
            ident: true,
          },
        },
      },
    })
    .catch(reason => {
      throw reason;
    });

  const deviceTimezoneOffsetMinutes = 0;
  const ret: MessageDto = messageDaoToDto(messageCreated, undefined, deviceTimezoneOffsetMinutes);
  return ret;
}
