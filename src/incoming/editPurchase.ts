import { prI } from '../prisma-instance';
import { PuritemDto } from '../outgoing/purchaseDto';
import { prisma, shli_message, shli_purchase } from '@prisma/client';
import { updateMessageSetEditedTrue } from './editMessage';

export type EditPurchaseDto = {
  id: number;
  name: string;

  room: number;
  message: number;

  show_pgroup: boolean;
  show_price: boolean;
  show_qnty: boolean;
  show_weight: boolean;

  persons_can_edit: number[];

  purItems: PuritemDto[];
};

export async function editPurchase(editPurchase: EditPurchaseDto): Promise<shli_purchase> {
  const {
    id,
    name,
    room,
    show_pgroup,
    show_price,
    show_qnty,
    show_weight,
    persons_can_edit,
    purItems,
  } = editPurchase;

  const purchaseEdited: shli_purchase = await prI.shli_purchase
    .update({
      where: {
        id: id,
      },
      data: {
        ident: name,
        show_pgroup,
        show_price,
        show_qnty,
        show_weight,
        persons_can_edit,
      },
    })
    .catch(reason => {
      throw `${reason} //editPurchase(${id})`;
    });

  // https://stackoverflow.com/questions/64427407/map-over-collection-to-upsert-into-the-database-how-to-batch-upsert
  for (let j = 0; j < purItems.length; j++) {
    const purItem: PuritemDto = purItems[j];
    const purItemId = purItem.id == 0 ? undefined : purItem.id;
    await prI.shli_puritem
      .upsert({
        where: {
          id: purItem.id,
        },
        update: {
          ident: purItem.name,
          comment: purItem.comment,
          qnty: purItem.qnty,
          pgroup: purItem.pgroup_id,
          product: purItem.product_id,
        },
        create: {
          room,
          purchase: id,
          ident: purItem.name,
          comment: purItem.comment,
          qnty: purItem.qnty,
          pgroup: purItem.pgroup_id,
          product: purItem.product_id,
        },
      })
      .catch(reason => {
        throw (
          `${reason} //puritem[${j}/${purItems.length - 1}].upsert(${purItemId}) ` +
          JSON.stringify(purItem)
        );
      });
  }

  const messageEdited: shli_message = await updateMessageSetEditedTrue(purchaseEdited.message);

  return purchaseEdited;
}
