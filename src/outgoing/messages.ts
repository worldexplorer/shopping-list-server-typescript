import { prI } from '../prisma-instance';
import { PurchaseDto } from './purchaseDto';
import { dateShift } from '../utils/conversion.tz';
import { MessageDto, MessagesDto } from './messageDto';
import { shli_message, shli_purchase } from '@prisma/client';

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
  var whereCondition = { room: room, deleted: 0, published: 1 };
  if (archived) {
    whereCondition.published = 0;
  }
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

export type PurchaseDao = shli_purchase & {
  Person_created: {
    ident: string;
  };
  Person_purchased: {
    ident: string;
  } | null;
};

export function purchaseNullableDaoToDtoUndefined(
  purDao: PurchaseDao | null,
  deviceTimezoneOffsetMinutes: number
): PurchaseDto | undefined {
  return purDao ? purchaseDaoToDto(purDao, deviceTimezoneOffsetMinutes) : undefined;
}

export function purchaseDaoToDto(
  purDao: PurchaseDao,
  deviceTimezoneOffsetMinutes: number
): PurchaseDto {
  const ret: PurchaseDto = {
    id: purDao.id,
    date_created: dateShift(purDao.date_created, deviceTimezoneOffsetMinutes),
    date_updated: dateShift(purDao.date_updated, deviceTimezoneOffsetMinutes),

    name: purDao.ident,

    message: purDao.message,
    room: purDao.room,

    show_pgroup: purDao.show_pgroup,
    show_price: purDao.show_price,
    show_qnty: purDao.show_qnty,
    show_weight: purDao.show_weight,

    person_created: purDao.person_created,
    person_created_name: purDao.Person_created.ident,
    person_purchased: purDao.person_purchased || undefined,
    person_purchased_name: purDao.Person_purchased?.ident || undefined,

    price_total: purDao.price_total?.toNumber(),
    weight_total: purDao.weight_total?.toNumber(),
  };
  return ret;
}

export type MessageDao = shli_message & {
  Creator: {
    ident: string;
  };
  Purchase?: PurchaseDao | null;
};

export function messageDaoToDto(
  msgDao: MessageDao,
  purchaseDto: PurchaseDto | undefined,
  deviceTimezoneOffsetMinutes: number
): MessageDto {
  const ret: MessageDto = {
    id: msgDao.id,
    date_created: dateShift(msgDao.date_created, deviceTimezoneOffsetMinutes),
    date_updated: dateShift(msgDao.date_updated, deviceTimezoneOffsetMinutes),

    content: msgDao.content || '',
    edited: msgDao.edited,

    replyto_id: msgDao.replyto_id ?? undefined,
    forwardfrom_id: msgDao.forwardfrom_id ?? undefined,

    persons_sent: msgDao.persons_sent,
    persons_read: msgDao.persons_read,

    room: msgDao.room,
    user: msgDao.person,
    user_name: msgDao.Creator.ident,

    purchaseId: msgDao.purchase ?? undefined,
    purchase: purchaseDto,
  };
  return ret;
}
