// Payable-amount decision for the modern inline Stripe Payment Element.
//
// The one-time total drives whether a card is required. A $0-now subscription
// trial still needs a card for future billing, so it falls back to the recurring
// amount. When the result is <= 0 (e.g. a one-time checkout fully discounted by a
// coupon) no Stripe collection is required: the caller tears down the mounted
// Element and the global validator skips it. Pure (no DOM/Stripe) so it can be
// unit-tested directly.

/**
 * @param {number} totalAmountCents      one-time payable total, in cents
 * @param {string} mode                  'payment' | 'subscription'
 * @param {number} recurringAmountCents  recurring amount, in cents (subscription fallback)
 * @return {number} effective Stripe amount in cents
 */
export function modernStripeAmount(totalAmountCents, mode, recurringAmountCents) {
    let amount = Math.round(totalAmountCents || 0);
    if (mode === 'subscription' && amount <= 0) {
        amount = Math.round(recurringAmountCents || 0);
    }
    return amount;
}

/**
 * @param {number} amountCents
 * @return {boolean} whether the modern Payment Element must collect a card now
 */
export function modernRequiresStripe(amountCents) {
    return amountCents > 0;
}
