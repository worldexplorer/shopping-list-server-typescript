import { prI } from '../prisma-instance';
import { messageDaoToDto, PurchaseDto, purchaseNullableDaoToDtoUndefined } from './purchaseDto';
import { MessageDto, MessagesDto } from './messageDto';

export type GetMessagesDto = {
  room: number;
  fromMessageId: number;
  archived: boolean;
  deviceTimezoneOffsetMinutes: number;
  currentDeviceTime: Date;
};

export async function getMessages({
  room,
  fromMessageId,
  archived,
  deviceTimezoneOffsetMinutes,
}: GetMessagesDto): Promise<MessagesDto> {
  var whereCondition = { room: room, deleted: false, archived: archived };
  const messagesSelected = await prI.shli_message.findMany({
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
    where: whereCondition,
    orderBy: {
      id: 'asc',
    },
  });
  if (!messagesSelected.length) {
    throw `No messages found where ${JSON.stringify(whereCondition)}`;
  }

  var lastMessageId = fromMessageId;
  const messages: MessageDto[] = messagesSelected.map(msgDao => {
    lastMessageId = msgDao.id;
    const purDto: PurchaseDto | undefined = purchaseNullableDaoToDtoUndefined(
      msgDao.Purchase,
      deviceTimezoneOffsetMinutes
    );
    const ret: MessageDto = messageDaoToDto(msgDao, purDto, deviceTimezoneOffsetMinutes);
    return ret;
  });

  const ret: MessagesDto = {
    room,
    messages,
    lastMessageId,
  };
  return ret;
}
