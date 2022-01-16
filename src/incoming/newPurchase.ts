import { prI } from '../prisma-instance';
import { shli_purchase } from '@prisma/client';
import { BasePurchaseDto } from '../outgoing/purchaseDto';

export type NewPurchaseDto = BasePurchaseDto & {
  replyto_id?: number; // goes to newMessage.replyto_id?
  copiedfrom_id?: number;

  newPurItems: NewPurItemDto[];
};

export type NewPurItemDto = {
  name: string;
  qnty?: number;

  comment?: string;
  pgroup_id?: number;
  pgroup_name?: string;
  product_id?: number;
  product_name?: string;

  punit_id?: number;
  punit_name?: string;
  punit_brief?: string;
  punit_fpoint?: boolean;
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
    show_qnty,
    show_price,
    show_weight,
    show_state_unknown,
    show_state_stop,

    copiedfrom_id,
    persons_can_edit,

    newPurItems,
  } = newPurchase;

  var msig = `//newPurchase(${name})`;

  const purchaseCreated: shli_purchase = await prI.shli_purchase
    .create({
      data: {
        room,
        message: messageCreatedId,

        ident: name,

        show_pgroup,
        show_qnty,
        show_price,
        show_weight,
        show_state_unknown,
        show_state_stop,

        copiedfrom_id,
        persons_can_edit,

        person_created: userCreatedId,
      },
    })
    .catch(reason => {
      throw `${reason} ${msig}`;
    });

  var msig = `//newPurchase(${purchaseCreated.id}:${name})`;

  if (purchaseCreated.show_pgroup) {
    await resolvePgroupProduct(newPurItems, msig, room, purchaseCreated.id);
  }

  await prI.shli_puritem
    .createMany({
      data: newPurItems.map(purItem => {
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

        return {
          room,
          purchase: purchaseCreated.id,
          ident: purItem.name,
          comment: purItem.comment,
          qnty: purItem.qnty,

          pgroup: pgroup_id,
          product: product_id,
        };
      }),
    })
    .catch(reason => {
      throw `${reason} ${msig} puritem.createMany() ` + JSON.stringify(newPurItems);
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

export async function resolvePgroupProduct(
  purItems: NewPurItemDto[],
  msig: string,
  room: number,
  purchase_origin: number
) {
  const negativePgroupsToReplace = new Map<number, number>();

  for (let i = 0; i < purItems.length; i++) {
    const purItem: NewPurItemDto = purItems[i];

    const pgroup_id: number | undefined = purItem.pgroup_id;
    const pgroup_ident: string = purItem.pgroup_name || '';
    const product_id: number | undefined = purItem.product_id;
    const product_ident: string = purItem.product_name || '';

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
                purchase_origin,
              },
            })
            .catch(reason => {
              throw `${reason} ${msig} ${pgroupLog}`;
            });

          pgroupLog += `=>id[${newPgroup.id}]`;
          console.log(`        inserted shli_pgroup ${pgroupLog}`);
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

            pgroupLog += `=>ident[${updatedPgroup.ident}] because ${changed} changed`;
            console.log(`        updated shli_pgroup ${pgroupLog}`);
          }
        }
      }

      var existingOrCreatedPgroupId =
        pgroup_id > 0 ? pgroup_id : negativePgroupsToReplace.get(pgroup_id);
      pgroupLog += `=>existingPgroupId[${existingOrCreatedPgroupId}]`;
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
            purItem.pgroup_id = firstFound.pgroup ?? purItem.pgroup_id;
          } else {
            const newProduct = await prI.shli_product
              .create({
                data: {
                  ident: product_ident,
                  pgroup: existingOrCreatedPgroupId,
                  room,
                  purchase_origin,
                },
              })
              .catch(reason => {
                throw `${reason} ${msig} ${productLog}`;
              });

            productLog += `=>id[${newProduct.id}]`;
            console.log(`        inserted shli_product ${productLog}`);
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

              productLog += `=>ident[${updatedProduct.ident}] because ${changed} changed`;
              console.log(`        updated shli_product ${productLog}`);
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
