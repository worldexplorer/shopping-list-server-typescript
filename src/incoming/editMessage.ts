import { prI } from '../prisma-instance';
import { MessageDto } from '../outgoing/messageDto';
import { messageDaoToDto, purchaseNullableDaoToDtoUndefined } from '../outgoing/messages';
import { PurchaseDto } from '../outgoing/purchaseDto';

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
        Creator: {
          select: {
            ident: true,
          },
        },
        Purchase: {
          include: {
            Person_created: {
              select: {
                ident: true,
              },
            },
            Person_purchased: {
              select: {
                ident: true,
              },
            },
          },
        },
      },
    })
    .catch(reason => {
      throw reason;
    });

  const deviceTimezoneOffsetMinutes = 0;
  const purDto: PurchaseDto | undefined = purchaseNullableDaoToDtoUndefined(
    messageEdited.Purchase,
    deviceTimezoneOffsetMinutes
  );
  const ret: MessageDto = messageDaoToDto(messageEdited, purDto, deviceTimezoneOffsetMinutes);
  return ret;
}
