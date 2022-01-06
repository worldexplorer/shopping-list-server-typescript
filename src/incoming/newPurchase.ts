import { prI } from '../prisma-instance';
import { shli_purchase } from '@prisma/client';

export type NewPuritemDto = {
  name: string;
  qnty?: number;

  comment?: string;
  pgroup_id?: number;
  product_id?: number;
  punit_id?: number;
  punit_brief?: string;
  punit_fpoint?: boolean;
};

export type NewPurchaseDto = {
  //  user: number;
  replyto_id?: number; // goes to newMessage.replyto_id?

  name: string;

  room: number;
  message: number;

  show_pgroup: boolean;
  show_price: boolean;
  show_qnty: boolean;
  show_weight: boolean;

  copiedfrom_id?: number;
  persons_can_edit: number[];

  newPurItems: NewPuritemDto[];
};

export async function newPurchase(
  newPurchase: NewPurchaseDto,
  userCreatedId: number,
  messageCreatedId: number = 1 // 1 won't break FK
): Promise<shli_purchase> {
  const {
    room,
    name,

    show_pgroup,
    show_price,
    show_qnty,
    show_weight,

    copiedfrom_id,
    persons_can_edit,

    newPurItems,
  } = newPurchase;

  const purchaseCreated: shli_purchase = await prI.shli_purchase
    .create({
      data: {
        room,
        message: messageCreatedId,

        ident: name,

        show_pgroup,
        show_price,
        show_qnty,
        show_weight,

        copiedfrom_id,
        persons_can_edit,

        person_created: userCreatedId,

        // https://stackoverflow.com/questions/64427407/map-over-collection-to-upsert-into-the-database-how-to-batch-upsert
        // Puritems: {
        //   createMany: {
        //     data: newPurItems.map(purItem => {
        //       return {
        //         room,
        //         ident: purItem.name,
        //         comment: purItem.comment,
        //         qnty: purItem.qnty,
        //         pgroup: purItem.pgroup_id,
        //         product: purItem.product_id,
        //       };
        //     }),
        //   },
        // },
      },
    })
    .catch(reason => {
      throw reason;
    });

  await prI.shli_puritem
    .createMany({
      data: newPurItems.map(purItem => {
        return {
          room,
          purchase: purchaseCreated.id,
          ident: purItem.name,
          comment: purItem.comment,
          qnty: purItem.qnty,

          pgroup: purItem.pgroup_id,
          product: purItem.product_id,
        };
      }),
    })
    .catch(reason => {
      throw `${reason} //puritem.createMany() ` + JSON.stringify(newPurItems);
    });

  return purchaseCreated;
}

export async function updateMessageIdInPurchase(
  newPurchaseId: number,
  newMessageId: number
): Promise<number> {
  const purchaseUpdated = await prI.shli_purchase
    .update({
      where: { id: newPurchaseId },
      data: {
        message: newMessageId,
      },
    })
    .catch(reason => {
      throw reason;
    });

  return purchaseUpdated.message;
}
