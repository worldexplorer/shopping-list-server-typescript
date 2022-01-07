import { prI } from '../prisma-instance';
import { PuritemDto as PurItemDto } from '../outgoing/purchaseDto';
import { shli_message, shli_purchase } from '@prisma/client';
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

  purItems: PurItemDto[];
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

  const purchaseEdited: shli_purchase & {
    Puritems: {
      id: number;
    }[];
  } = await prI.shli_purchase
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
      include: {
        Puritems: {
          select: {
            id: true,
          },
        },
      },
    })
    .catch(reason => {
      throw `${reason} //editPurchase(${id})`;
    });

  for (let i = 0; i < purItems.length; i++) {
    const purItem: PurItemDto = purItems[i];
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
          `${reason} //purItem[${i}/${purItems.length - 1}].upsert(${purItemId}) ` +
          JSON.stringify(purItem)
        );
      });
  }

  const inDatabase = purchaseEdited.Puritems.map(x => x.id);
  const fromApp = purItems.map(x => x.id);
  const purItemsToDelete = calcIdsMissingAmongSubmitted(inDatabase, fromApp);
  if (purItemsToDelete.length > 0) {
    const msig = `purItems.deleteMany(${purItemsToDelete.join(',')})`;
    console.log(msig);

    // await prI.shli_puritem
    //   .deleteMany({
    //     where: {
    //       id: { in: purItemsToDelete },
    //     },
    //   })
    //   .catch(reason => {
    //     throw `${reason} //${msig}`;
    //   });
  }

  const messageEdited: shli_message = await updateMessageSetEditedTrue(purchaseEdited.message);

  return purchaseEdited;
}

function calcIdsMissingAmongSubmitted(inDatabase: number[], submittedFromApp: number[]): number[] {
  let toDelete = [...inDatabase]; // all database fields are candidate for deletion
  for (var removeWhenInBothArrays of submittedFromApp) {
    const positionFound = toDelete.findIndex(x => x === removeWhenInBothArrays);
    if (positionFound === -1) {
      continue; // found only in toDelete; will stay in toDelete[] => will be deleted
    }
    toDelete = toDelete.splice(positionFound, 1);
  }
  return toDelete; // only ids missing in submittedFromApp[]
}
