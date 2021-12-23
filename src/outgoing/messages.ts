import { prI } from '../prisma-instance';
import { PurchaseDto } from './purchaseDto';
import { dateShift } from '../utils/conversion.tz';
import { GetMessagesDto, MessageDto, MessagesDto } from './messageDto';

export async function getMessages({
  room,
  fromMessageId,
  deviceTimezoneOffsetMinutes,
}: GetMessagesDto): Promise<MessagesDto> {
  const cond = { room: room, deleted: 0 };
  const messagesSelected = await prI.shli_message.findMany({
    include: {
      shli_person: {
        select: {
          ident: true,
        },
      },
      shli_purchase: {
        include: {
          shli_person_shli_personToshli_purchase_person_created: {
            select: {
              ident: true,
            },
          },
          shli_person_shli_personToshli_purchase_person_purchased: {
            select: {
              ident: true,
            },
          },
        },
      },
    },
    where: cond,
    orderBy: {
      id: 'asc',
    },
  });
  if (!messagesSelected.length) {
    throw `No messages found where ${JSON.stringify(cond)}`;
  }

  var lastMessageId = fromMessageId;
  const messages: MessageDto[] = messagesSelected.map(msgDao => {
    lastMessageId = msgDao.id;
    const purDao = msgDao.shli_purchase;
    const purDto: PurchaseDto | undefined = purDao
      ? {
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
          person_created_name: purDao.shli_person_shli_personToshli_purchase_person_created.ident,
          person_purchased: purDao.person_purchased || undefined,
          person_purchased_name:
            purDao.shli_person_shli_personToshli_purchase_person_purchased?.ident || undefined,

          price_total: purDao.price_total?.toNumber(),
          weight_total: purDao.weight_total?.toNumber(),
        }
      : undefined;

    const ret: MessageDto = {
      id: msgDao.id,
      date_created: dateShift(msgDao.date_created, deviceTimezoneOffsetMinutes),
      date_updated: dateShift(msgDao.date_updated, deviceTimezoneOffsetMinutes),

      content: msgDao.content ?? '',
      room: msgDao.room,
      user: msgDao.person,
      user_name: msgDao.shli_person.ident,

      purchaseId: msgDao.purchase ?? undefined,
      purchase: purDto,
    };
    return ret;
  });

  const ret: MessagesDto = {
    room,
    messages,
    lastMessageId,
  };
  return ret;
}
