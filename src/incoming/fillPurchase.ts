import { prI } from '../prisma-instance';
import { shli_purchase } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';

export type FillPurchaseDto = {
  id: number;
  room: number;
  message: number;

  purchased: boolean;
  price_total?: number;
  weight_total?: number;

  purItemsFilled: FillPurItemDto[];
};

export type FillPurItemDto = {
  id: number;
  // room: number;
  // message: number;

  bought: boolean;
  bought_qnty: number | null;
  bought_price: number | null;
  bought_weight: number | null;
  comment: string | null;
};

type PurItemForComparison = {
  id: number;
  bought: boolean;
  bought_qnty: Decimal | null;
  bought_price: Decimal | null;
  bought_weight: Decimal | null;
  comment: string | null;
};

export async function fillPurchase(
  fillPurchase: FillPurchaseDto,
  sendServerError: (error: any) => unknown
): Promise<shli_purchase | undefined> {
  const { id, purchased, price_total, weight_total, purItemsFilled } = fillPurchase;

  const purchaseFilled: shli_purchase & {
    Puritems: PurItemForComparison[];
  } = await prI.shli_purchase
    .update({
      where: {
        id,
      },
      data: {
        purchased,
        price_total,
        weight_total,
      },
      include: {
        Puritems: {
          select: {
            id: true,
            bought: true,
            bought_qnty: true,
            bought_price: true,
            bought_weight: true,
            comment: true,
          },
        },
      },
    })
    .catch(reason => {
      throw `${reason} //fillPurchase(${id})`;
    });

  let recordsUpdated = 0;
  for (let i = 0; i < purItemsFilled.length; i++) {
    const purItem: FillPurItemDto = purItemsFilled[i];
    const purItemId = purItem.id;

    const counter = `${i}/${purItemsFilled.length - 1}`;
    const msig = `purItemFilled[${counter}].update(${purItemId}) `;

    const sameInDb: PurItemForComparison | undefined = purchaseFilled.Puritems.find(
      x => x.id === purItemId
    );
    if (!sameInDb) {
      // throw `purchaseFilled.Puritems.find(x => x.id === ${purItemId})`;
      console.log(`new PurItem should not have been inserted`, purItem);
      continue;
    }

    // const changed = compare(purItem, sameInDb);
    const changes1 = whatChanged2(purItem, sameInDb);
    const changed = changes1.length > 0;
    if (!changed) {
      continue;
    }

    const { bought, bought_qnty, bought_price, bought_weight, comment } = purItem;
    const purItemUpdated: PurItemForComparison = await prI.shli_puritem
      .update({
        where: {
          id: purItemId,
        },
        data: {
          bought,
          bought_qnty,
          bought_price,
          bought_weight,
          comment,
        },
        select: {
          id: true,
          bought: true,
          bought_qnty: true,
          bought_price: true,
          bought_weight: true,
          comment: true,
        },
      })
      .catch(reason => {
        throw `${reason} //${msig}` + JSON.stringify(purItem);
      });

    const changes = whatChanged(sameInDb, purItemUpdated);
    const changesPrinted =
      changes.length == 0 ? 'UPDATED_IN_VAIN__OR_FIX_COMPARE()_FUNCTION' : changes;
    console.log(`        ${msig}: ${changesPrinted}`);

    if (changes.length == 0) {
      sendServerError(`${msig}: ${changesPrinted}`);
    } else {
      recordsUpdated++;
    }
  }

  return recordsUpdated > 0 ? purchaseFilled : undefined;
}

function compare(purItem: FillPurItemDto, sameInDb: PurItemForComparison): boolean {
  let changed = false;
  changed ||= purItem.bought !== sameInDb.bought;
  changed ||= purItem.bought_qnty !== decimalToNumber(sameInDb.bought_qnty);
  changed ||= purItem.bought_price !== decimalToNumber(sameInDb.bought_price);
  changed ||= purItem.bought_weight !== decimalToNumber(sameInDb.bought_weight);
  changed ||= purItem.comment !== sameInDb.comment;
  return changed;
}

function whatChanged2(beforeUpdate: FillPurItemDto, afterUpdate: PurItemForComparison): string {
  let ret = '';

  if (beforeUpdate.bought != afterUpdate.bought) {
    ret += `bought[${beforeUpdate.bought}]=>[${afterUpdate.bought}] `;
  }

  const before_bought_qnty = beforeUpdate.bought_qnty;
  const after_bought_qnty = decimalToNumber(afterUpdate.bought_qnty);
  if (before_bought_qnty != after_bought_qnty) {
    ret += `bought_qnty[${before_bought_qnty}]=>[${after_bought_qnty}] `;
  }

  const before_bought_price = beforeUpdate.bought_price;
  const after_bought_price = decimalToNumber(afterUpdate.bought_price);
  if (before_bought_price != after_bought_price) {
    ret += `bought_price[${before_bought_price}]=>[${after_bought_price}] `;
  }

  const before_bought_weight = beforeUpdate.bought_weight;
  const after_bought_weight = decimalToNumber(afterUpdate.bought_weight);
  if (before_bought_weight != after_bought_weight) {
    ret += `bought_weight[${before_bought_weight}]=>[${after_bought_weight}] `;
  }

  if (beforeUpdate.comment !== afterUpdate.comment) {
    ret += `comment[${beforeUpdate.comment}]=>[${afterUpdate.comment}] `;
  }

  return ret;
}

function whatChanged(
  beforeUpdate: PurItemForComparison,
  afterUpdate: PurItemForComparison
): string {
  let ret = '';

  if (beforeUpdate.bought != afterUpdate.bought) {
    ret += `bought[${beforeUpdate.bought}]=>[${afterUpdate.bought}] `;
  }

  const before_bought_qnty = decimalToNumber(beforeUpdate.bought_qnty);
  const after_bought_qnty = decimalToNumber(afterUpdate.bought_qnty);
  if (before_bought_qnty != after_bought_qnty) {
    ret += `bought_qnty[${before_bought_qnty}]=>[${after_bought_qnty}] `;
  }

  const before_bought_price = decimalToNumber(beforeUpdate.bought_price);
  const after_bought_price = decimalToNumber(afterUpdate.bought_price);
  if (before_bought_price != after_bought_price) {
    ret += `bought_price[${before_bought_price}]=>[${after_bought_price}] `;
  }

  const before_bought_weight = decimalToNumber(beforeUpdate.bought_weight);
  const after_bought_weight = decimalToNumber(afterUpdate.bought_weight);
  if (before_bought_weight != after_bought_weight) {
    ret += `bought_weight[${before_bought_weight}]=>[${after_bought_weight}] `;
  }

  if (beforeUpdate.comment !== afterUpdate.comment) {
    ret += `comment[${beforeUpdate.comment}]=>[${afterUpdate.comment}] `;
  }

  return ret;
}

function decimalToNumber(pgDecimal: Decimal | null): number | null {
  return pgDecimal != null ? pgDecimal.toNumber() : null;
}
