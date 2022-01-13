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
  show_serno: boolean;
  show_qnty: boolean;
  show_price: boolean;
  show_weight: boolean;
  show_threestate: boolean;

  persons_can_edit: number[];

  purItems: PurItemDto[];
};

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
    show_threestate,
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
        show_threestate,
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
    const negativePgroupsToReplace = new Map<number, number>();

    for (let i = 0; i < purItems.length; i++) {
      const purItem: PurItemDto = purItems[i];

      const pgroup_id: number | undefined = purItem.pgroup_id;
      const pgroup_ident: string | undefined = purItem.pgroup_name;
      const product_id: number | undefined = purItem.product_id;
      const product_ident: string | undefined = purItem.product_name;

      var pgroupLog = `pgroupName[${pgroup_ident}]id[${pgroup_id}]`;
      if (pgroup_id) {
        if (pgroup_id < 0 && !negativePgroupsToReplace.has(pgroup_id)) {
          const sameIdentPgroups = await prI.shli_pgroup
            .findMany({
              where: { ident: pgroup_ident },
            })
            .catch(reason => {
              throw `${reason} ${msig} ${pgroupLog}`;
            });

          if (sameIdentPgroups.length > 0) {
            const firstFound = sameIdentPgroups[0];
            pgroupLog += `=>id[${firstFound.id}]`;
            console.log(`        firstFound ${pgroupLog}`);
            negativePgroupsToReplace.set(pgroup_id, firstFound.id);
            purItem.pgroup_id = firstFound.id;
          } else {
            const newPgroup = await prI.shli_pgroup
              .create({
                data: {
                  ident: pgroup_ident,
                  parent_id: 1,
                  room,
                  purchase_origin: id,
                },
              })
              .catch(reason => {
                throw `${reason} ${msig} ${pgroupLog}`;
              });

            pgroupLog += `=>id[${newPgroup.id}]`;
            console.log(`        inserted ${pgroupLog}`);
            negativePgroupsToReplace.set(pgroup_id, newPgroup.id);
            purItem.pgroup_id = newPgroup.id;
          }
        } else {
          const oldPgroup = await prI.shli_pgroup
            .findUnique({
              where: { id: pgroup_id },
            })
            .catch(reason => {
              throw `${reason} ${msig} ${pgroupLog}`;
            });

          if (oldPgroup != null) {
            var changed = '';
            if (oldPgroup.ident != pgroup_ident) {
              changed += `ident[${oldPgroup.ident}]=>[${pgroup_ident}]`;
            }
            if (changed.length > 0) {
              const updatedPgroup = await prI.shli_pgroup
                .update({
                  data: { ident: pgroup_ident },
                  where: { id: pgroup_id },
                })
                .catch(reason => {
                  throw `${reason} ${msig} ${pgroupLog}`;
                });

              pgroupLog += `=>ident[${updatedPgroup.ident}]`;
              console.log(`        updated ${pgroupLog}`);
            }
          }
        }

        var existingOrCreatedPgroupId =
          pgroup_id > 0 ? pgroup_id : negativePgroupsToReplace.get(pgroup_id);
        pgroupLog += `=>exId[${existingOrCreatedPgroupId}]`;
        if (product_id && existingOrCreatedPgroupId) {
          var productLog = `${pgroupLog} productName[${product_ident}]id[${product_id}]`;
          if (product_id < 0) {
            const sameIdentProducts = await prI.shli_product
              .findMany({
                where: { ident: product_ident },
              })
              .catch(reason => {
                throw `${reason} ${msig} ${productLog}`;
              });

            if (sameIdentProducts.length > 0) {
              const firstFound = sameIdentProducts[0];
              productLog += `=>id[${firstFound.id}]`;
              console.log(`        firstFound ${productLog}`);
              purItem.product_id = firstFound.id;
            } else {
              const newProduct = await prI.shli_product
                .create({
                  data: {
                    ident: product_ident,
                    pgroup: existingOrCreatedPgroupId,
                    room,
                    purchase_origin: id,
                  },
                })
                .catch(reason => {
                  throw `${reason} ${msig} ${productLog}`;
                });

              productLog += `=>id[${newProduct.id}]`;
              console.log(`        inserted ${productLog}`);
              purItem.product_id = newProduct.id;
            }
            if (pgroup_id < 0) {
              purItem.pgroup_id = existingOrCreatedPgroupId;
            }
          } else {
            const oldProduct = await prI.shli_product
              .findUnique({
                where: { id: product_id },
              })
              .catch(reason => {
                throw `${reason} ${msig} ${productLog}`;
              });

            if (oldProduct != null) {
              var changed = '';
              if (oldProduct.ident != product_ident) {
                changed += `ident[${oldProduct.ident}]=>[${product_ident}] `;
              }
              if (oldProduct.pgroup != existingOrCreatedPgroupId) {
                changed += `pgroup[${oldProduct.pgroup}]=>[${existingOrCreatedPgroupId}](${pgroup_id})) `;
              }
              if (changed.length > 0) {
                const updatedProduct = await prI.shli_product
                  .update({
                    data: { ident: product_ident, pgroup: existingOrCreatedPgroupId },
                    where: { id: product_id },
                  })
                  .catch(reason => {
                    throw `${reason} ${msig} ${productLog}`;
                  });

                productLog += `=>ident[${updatedProduct.ident}]`;
                console.log(`        updated ${productLog}`);
              }
              if (oldProduct.pgroup != existingOrCreatedPgroupId) {
                purItem.pgroup_id = existingOrCreatedPgroupId;
              }
            }
          }
        }
      }
    }
  }

  for (let i = 0; i < purItems.length; i++) {
    const purItem: PurItemDto = purItems[i];
    const purItemId = purItem.id == 0 ? undefined : purItem.id;

    const pgroup_id: number | null = purchaseEdited.show_pgroup ? purItem.pgroup_id ?? null : null;

    const product_id: number | null = purchaseEdited.show_pgroup
      ? purItem.product_id ?? null
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
