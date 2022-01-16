import { dateShift } from '../utils/conversion.tz';
import { shli_message, shli_purchase, shli_puritem } from '@prisma/client';
import { MessageDto } from './messageDto';
import { NewPurItemDto as NewPurItemDto } from '../incoming/newPurchase';

// base for NewPurchaseDto , EditPurchaseDto; FillPurchaseDto is out of inheritance
export type BasePurchaseDto = {
  name: string;

  room: number;
  message: number;

  show_pgroup: boolean;
  show_serno: boolean;
  show_price: boolean;
  show_qnty: boolean;
  show_weight: boolean;
  show_state_unknown: boolean;
  show_state_stop: boolean;

  persons_can_edit: number[];
};

export type EditPurchaseDto = BasePurchaseDto & {
  id: number;
  purItems: PurItemDto[];
};

export type PurchaseDto = EditPurchaseDto & {
  date_created: Date;
  date_updated: Date;

  replyto_id?: number; // goes to newMessage.replyto_id?
  copiedfrom_id?: number;

  person_created: number;
  person_created_name: string;

  purchased: boolean;
  person_purchased?: number;
  person_purchased_name?: string;

  price_total?: number;
  weight_total?: number;
};

export type PurItemDto = NewPurItemDto & {
  id: number;

  bought: number;
  bought_qnty?: number;
  bought_price?: number;
  bought_weight?: number;

  // date_updated: Date;
  // date_created: Date;
  // published: number;
  // deleted: number;
  // manorder: number;
};

export type PurchaseDao = shli_purchase & {
  Person_created: {
    ident: string;
  };
  Person_purchased: {
    ident: string;
  } | null;
  Puritems: PuritemDao[];
};

export type PuritemDao = shli_puritem & {
  Pgroup: {
    ident: string;
  } | null;
  Product: {
    ident: string;
    punit: number | null;
    Punit: {
      ident: string;
      brief: string;
      fpoint: boolean;
    } | null;
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
    show_serno: purDao.show_serno,
    show_qnty: purDao.show_qnty,
    show_price: purDao.show_price,
    show_weight: purDao.show_weight,
    show_state_unknown: purDao.show_state_unknown,
    show_state_stop: purDao.show_state_stop,

    person_created: purDao.person_created,
    person_created_name: purDao.Person_created.ident,
    persons_can_edit: purDao.persons_can_edit,
    purchased: purDao.purchased,
    person_purchased: purDao.person_purchased || undefined,
    person_purchased_name: purDao.Person_purchased?.ident || undefined,

    price_total: purDao.price_total?.toNumber(),
    weight_total: purDao.weight_total?.toNumber(),

    purItems: purDao.Puritems.map(puritemDaoToDto),
  };
  return ret;
}

function puritemDaoToDto(x: PuritemDao): PurItemDto {
  return {
    id: x.id,
    name: x.ident,
    qnty: x.qnty?.toNumber() || undefined,
    bought: x.bought,
    bought_qnty: x.bought_qnty?.toNumber() || undefined,
    bought_price: x.bought_price?.toNumber() || undefined,
    bought_weight: x.bought_weight?.toNumber() || undefined,
    comment: x.comment || undefined,
    pgroup_id: x.pgroup || undefined,
    pgroup_name: x.Pgroup?.ident || undefined,
    product_id: x.product || undefined,
    product_name: x.Product?.ident || undefined,
    punit_id: x.Product?.punit || undefined,
    punit_name: x.Product?.Punit?.ident || undefined,
    punit_brief: x.Product?.Punit?.brief || undefined,
    punit_fpoint: x.Product?.Punit?.fpoint || false,
  };
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
