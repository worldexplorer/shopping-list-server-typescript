import { prI } from '../prisma-instance';
import { MessageDto } from '../outgoing/messageDto';
import { messageDaoToDto, PurchaseDto } from '../outgoing/purchaseDto';

export type NewMessageDto = {
  room: number;
  content: string;
  replyto_id?: number;
  purchase?: number;
};

export async function newMessage(
  newMsg: NewMessageDto,
  userIdCreated: number,
  roomUserIds: number[]
): Promise<MessageDto> {
  const { room, content, replyto_id, purchase } = newMsg;

  const uniqueUserIds: number[] = Array.from(new Set(roomUserIds));

  const messageCreated = await prI.shli_message
    .create({
      data: {
        room,
        person: userIdCreated,
        ident: content.substring(0, 20),
        content,
        replyto_id,
        purchase,
        persons_sent: uniqueUserIds,
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
