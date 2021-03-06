import { prI } from '../prisma-instance';
import { EditPurchaseDto, PurItemDto as PurItemDto } from '../outgoing/purchaseDto';
import { shli_message, shli_purchase } from '@prisma/client';
import { updateMessageSetEditedTrue } from './editMessage';
import { resolvePgroupProduct } from './newPurchase';

export async function editPurchase(editPurchase: EditPurchaseDto): Promise<shli_purchase> {
  const {
    id,
    name,
    room,
    show_pgroup,
    show_serno,
    show_qnty,
    show_price,
    show_weight,
    show_state_unknown,
    show_state_stop,
    persons_can_edit,
    purItems,
  } = editPurchase;

  var msig = `//editPurchase(${id})`;

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
        show_serno,
        show_qnty,
        show_price,
        show_weight,
        show_state_unknown,
        show_state_stop,
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
      throw `${reason} ${msig}`;
    });

  if (purchaseEdited.show_pgroup) {
    await resolvePgroupProduct(purItems, msig, room, id);
  }

  for (let i = 0; i < purItems.length; i++) {
    const purItem: PurItemDto = purItems[i];
    const purItemId = purItem.id == 0 ? undefined : purItem.id;

    const pgroup_id: number | null = purItem.pgroup_id
      ? purItem.pgroup_id < 0
        ? null
        : purItem.pgroup_id
      : null;

    const product_id: number | null = purItem.product_id
      ? purItem.product_id < 0
        ? null
        : purItem.product_id
      : null;

    await prI.shli_puritem
      .upsert({
        where: {
          id: purItem.id,
        },
        update: {
          ident: purItem.name,
          comment: purItem.comment,
          qnty: purItem.qnty,
          pgroup: pgroup_id,
          product: product_id,
        },
        create: {
          room,
          purchase: id,
          ident: purItem.name,
          comment: purItem.comment,
          qnty: purItem.qnty,
          pgroup: pgroup_id,
          product: product_id,
        },
      })
      .catch(reason => {
        const counter = `purItem[${i}/${purItems.length - 1}]`;
        throw `${reason} ${msig}.upsert(${purItemId}) ${counter} ` + JSON.stringify(purItem);
      });
  }

  const inDatabase = purchaseEdited.Puritems.map(x => x.id);
  const fromApp = purItems.map(x => x.id);
  const purItemsToDelete = calcIdsMissingAmongSubmitted(inDatabase, fromApp);
  if (purItemsToDelete.length > 0) {
    const msig = `        purItems.deleteManyIds(${purItemsToDelete.join(',')})`;
    console.log(msig);

    await prI.shli_puritem
      .deleteMany({
        where: {
          id: { in: purItemsToDelete },
        },
      })
      .catch(reason => {
        throw `${reason} //${msig}`;
      });
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
    toDelete.splice(positionFound, 1);
  }
  return toDelete; // only ids missing in submittedFromApp[]
}
