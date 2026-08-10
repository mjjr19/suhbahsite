const SIBLING_DISCOUNT_CENTS = 3000;
const FAMILY_DISCOUNT_RATE = 0.15;

export interface OrderChildInput {
  basePriceCents: number;
}

export interface OrderChildResult {
  basePriceCents: number;
  siblingDiscountCents: number;
  familyDiscountCents: number;
  finalPriceCents: number;
}

export interface OrderResult {
  children: OrderChildResult[];
  totalCents: number;
}

/**
 * Pricing for a multi-child order: child 2+ get $30 off (never below $0),
 * then 15% off the post-sibling-discount subtotal if the household is
 * SuhbahFamily-eligible, allocated proportionally per child with any
 * rounding remainder absorbed by the last child so per-child amounts always
 * sum exactly to the total. Shared by the register form (display) and the
 * checkout route (authoritative) so they can't drift apart.
 */
export function calculateOrder(
  children: OrderChildInput[],
  suhbahFamilyEligible: boolean,
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

  const subtotalTotal = afterSibling.reduce((sum, c) => sum + c.subtotalCents, 0);
  const familyDiscountTotal =
    suhbahFamilyEligible && subtotalTotal > 0
      ? Math.round(subtotalTotal * FAMILY_DISCOUNT_RATE)
      : 0;

  let allocated = 0;
  const results: OrderChildResult[] = afterSibling.map((child, index) => {
    const isLast = index === afterSibling.length - 1;
    let familyDiscountCents = 0;
    if (familyDiscountTotal > 0) {
      familyDiscountCents = isLast
        ? familyDiscountTotal - allocated
        : Math.round((child.subtotalCents / subtotalTotal) * familyDiscountTotal);
      familyDiscountCents = Math.max(0, Math.min(familyDiscountCents, child.subtotalCents));
      allocated += familyDiscountCents;
    }
    return {
      basePriceCents: child.basePriceCents,
      siblingDiscountCents: child.siblingDiscountCents,
      familyDiscountCents,
      finalPriceCents: child.subtotalCents - familyDiscountCents,
    };
  });

  const totalCents = results.reduce((sum, c) => sum + c.finalPriceCents, 0);

  return { children: results, totalCents };
}
