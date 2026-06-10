// Modern inline Stripe Payment Element — payable-amount decision (review #1009).
//
// When a one-time modern inline checkout is fully discounted to 0 (coupon, item
// removal), the Payment Element must not be required: the validator should skip
// Stripe and the mounted Element should be torn down. $0-now subscription trials
// still need a card, so they fall back to the recurring amount. These pure
// helpers carry that decision so it can be tested without the DOM/Stripe.
//   node --test tests/js/modernStripeAmount.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { modernStripeAmount, modernRequiresStripe } from '../../resources/assets/public/modernStripeAmount.mjs';

test('one-time checkout uses the one-time total', () => {
    assert.equal(modernStripeAmount(1500, 'payment', 0), 1500);
    assert.equal(modernRequiresStripe(modernStripeAmount(1500, 'payment', 0)), true);
});

test('one-time checkout discounted to zero requires no Stripe', () => {
    assert.equal(modernStripeAmount(0, 'payment', 0), 0);
    assert.equal(modernRequiresStripe(modernStripeAmount(0, 'payment', 0)), false);
});

test('$0-now subscription trial falls back to the recurring amount (still requires Stripe)', () => {
    assert.equal(modernStripeAmount(0, 'subscription', 999), 999);
    assert.equal(modernRequiresStripe(modernStripeAmount(0, 'subscription', 999)), true);
});

test('subscription with an immediate amount uses that amount', () => {
    assert.equal(modernStripeAmount(2500, 'subscription', 999), 2500);
    assert.equal(modernRequiresStripe(modernStripeAmount(2500, 'subscription', 999)), true);
});

test('subscription with no recurring amount and zero now requires no Stripe', () => {
    assert.equal(modernStripeAmount(0, 'subscription', 0), 0);
    assert.equal(modernRequiresStripe(0), false);
});

test('negative amounts are treated as not requiring Stripe', () => {
    assert.equal(modernRequiresStripe(-50), false);
});
