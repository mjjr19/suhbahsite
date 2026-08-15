const SIBLING_DISCOUNT_CENTS = 3000;
const FAMILY_DISCOUNT_RATE = 0.15;

export interface OrderChildInput {
  basePriceCents: number;
}

export interface OrderChildResult {
  basePriceCents: number;
  siblingDiscountCents: number;
  familyDiscountCents: number;
  codeDiscountCents: number;
  finalPriceCents: number;
}

export interface OrderResult {
  children: OrderChildResult[];
  totalCents: number;
}

/**
 * Pricing for a multi-child order, three compounding discount layers in
 * order: child 2+ get $30 off (never below $0), then 15% off the
 * post-sibling subtotal if SuhbahFamily-eligible, then an optional discount
 * code percentage off whatever's left after both of those. Compounding
 * (not three independent percentages summed off the base) is deliberate —
 * it can never go negative on its own, and matches "X% off whatever they'd
 * otherwise owe" rather than "X% off the sticker price" for each layer.
 * Each layer is allocated proportionally per child with the rounding
 * remainder absorbed by the last child, so per-child amounts always sum
 * exactly to the total. Shared by the register form (display) and the
 * checkout route (authoritative) so they can't drift apart.
 */
export function calculateOrder(
  children: OrderChildInput[],
  suhbahFamilyEligible: boolean,
  codePercentOff?: number,
): OrderResult {
  const afterSibling = children.map((child, index) => {
    const siblingDiscountCents =
      index === 0 ? 0 : Math.min(SIBLING_DISCOUNT_CENTS, child.basePriceCents);
    return {
      basePriceCents: child.basePriceCents,
      siblingDiscountCents,
      subtotalCents: child.basePriceCents - siblingDiscountCents,
    };
  });

  const afterFamily = applyProportionalDiscount(
    afterSibling,
    suhbahFamilyEligible ? FAMILY_DISCOUNT_RATE : 0,
  );

  const afterCode = applyProportionalDiscount(
    afterFamily.map((c) => ({ subtotalCents: c.remainingCents })),
    codePercentOff ? codePercentOff / 100 : 0,
  );

  const results: OrderChildResult[] = afterSibling.map((child, i) => ({
    basePriceCents: child.basePriceCents,
    siblingDiscountCents: child.siblingDiscountCents,
    familyDiscountCents: afterFamily[i].discountCents,
    codeDiscountCents: afterCode[i].discountCents,
    finalPriceCents: afterCode[i].remainingCents,
  }));

  const totalCents = results.reduce((sum, c) => sum + c.finalPriceCents, 0);

  return { children: results, totalCents };
}

/** Applies one percentage-off layer across a set of per-child subtotals,
 * allocated proportionally with the rounding remainder absorbed by the
 * last child. */
function applyProportionalDiscount(
  items: { subtotalCents: number }[],
  rate: number,
): { discountCents: number; remainingCents: number }[] {
  const subtotalTotal = items.reduce((sum, c) => sum + c.subtotalCents, 0);
  const discountTotal = rate > 0 && subtotalTotal > 0 ? Math.round(subtotalTotal * rate) : 0;

  let allocated = 0;
  return items.map((item, index) => {
    const isLast = index === items.length - 1;
    let discountCents = 0;
    if (discountTotal > 0) {
      discountCents = isLast
        ? discountTotal - allocated
        : Math.round((item.subtotalCents / subtotalTotal) * discountTotal);
      discountCents = Math.max(0, Math.min(discountCents, item.subtotalCents));
      allocated += discountCents;
    }
    return { discountCents, remainingCents: item.subtotalCents - discountCents };
  });
}
