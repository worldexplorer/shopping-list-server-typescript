import { prI } from '../prisma-instance';
import { MessageDto } from '../outgoing/messageDto';
import {
  messageDaoToDto,
  PurchaseDto,
  purchaseNullableDaoToDtoUndefined,
} from '../outgoing/purchaseDto';
import { shli_message } from '@prisma/client';

export type EditMessageDto = {
  id: number;
  room: number;
  content: string;
};

export async function editMessage(editMsg: EditMessageDto): Promise<MessageDto> {
  const { id, content } = editMsg;

  const messageEdited = await prI.shli_message
    .update({
      where: {
        id,
      },
      data: {
        ident: content.substring(0, 20),
        content,
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
            Puritems: {
              include: {
                Pgroup: {
                  select: {
                    ident: true,
                  },
                },
                Product: {
                  include: {
                    Punit: {
                      select: {
                        ident: true,
                        brief: true,
                        fpoint: true,
                      },
                    },
                  },
                },
              },
              where: {
                published: true,
                deleted: false,
              },
              orderBy: {
                manorder: 'asc',
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

export async function updateMessageSetEditedTrue(messageId: number): Promise<shli_message> {
  const messageEdited = await prI.shli_message
    .update({
      where: {
        id: messageId,
      },
      data: {
        edited: true,
      },
    })
    .catch(reason => {
      throw reason;
    });

  return messageEdited;
}
