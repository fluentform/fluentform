# Workflow: Payments

Read this when working on payment processing, Stripe integration, payment components, subscriptions, or transaction management.

## Key Files

- `app/Modules/Payments/PaymentHandler.php` — Core initialization, registers all payment components & hooks
- `app/Modules/Payments/PaymentHelper.php` — Utility hub: currency formatting, settings retrieval, payment config
- `app/Modules/Payments/AjaxEndpoints.php` — AJAX routes for payment settings management
- `app/Modules/Payments/TransactionShortcodes.php` — Shortcodes for displaying payment data
- `app/Modules/Payments/Classes/PaymentAction.php` — Orchestrates payment submission workflow (33KB)
- `app/Modules/Payments/Classes/PaymentEntries.php` — Entry-level payment handling
- `app/Modules/Payments/Classes/PaymentManagement.php` — Subscription & transaction management
- `app/Modules/Payments/Classes/PaymentReceipt.php` — Receipt generation & rendering
- `app/Modules/Payments/PaymentMethods/BaseProcessor.php` — Abstract payment processor (38KB)
- `app/Modules/Payments/PaymentMethods/BasePaymentMethod.php` — Abstract payment method base
- `app/Modules/Payments/PaymentMethods/Stripe/` — Full Stripe integration (14 files)
- `resources/assets/public/payment_handler.js` — Frontend payment processing (jQuery)

## Database Tables (3 payment-specific)

| Table | Migration File | Key Columns |
|-------|---------------|-------------|
| `fluentform_transactions` | `Migrations/Transactions.php` | form_id, submission_id, transaction_hash, payer_name, payer_email, payment_method, payment_total (cents), status, currency, charge_id, card_last_4, card_brand |
| `fluentform_order_items` | `Migrations/OrderItems.php` | form_id, submission_id, type ('single'), item_name, quantity, item_price, line_total, billing_interval |
| `fluentform_subscriptions` | `Migrations/OrderSubscriptions.php` | form_id, submission_id, payment_total, recurring_amount, plan_name, billing_interval, trial_days, bill_times, bill_count, vendor_subscription_id, status, expiration_at |

**Note:** Payment amounts are stored in **cents** (BIGINT UNSIGNED). Use `PaymentHelper::formatMoney()` for display.

## Payment Submission Flow

1. Form submitted with payment fields → `fluentform/before_insert_payment_form` action fires
2. `PaymentAction` calculates totals from pricing fields (item quantities, subscriptions)
3. Payment method determined → `fluentform/process_payment` action dispatched
4. Method-specific handler fires: `fluentform/process_payment_{method}` (e.g., `_stripe`)
5. Processor (e.g., `StripeProcessor`) creates charge via gateway API
6. Transaction recorded in `fluentform_transactions` table
7. Order items saved to `fluentform_order_items`
8. Submission `payment_status`, `payment_total`, `payment_method` columns updated
9. Post-payment actions fire (confirmations, notifications)

## Stripe Integration Structure

```
PaymentMethods/Stripe/
├── StripeHandler.php          # Entry point, registers Stripe hooks
├── StripeProcessor.php        # Standard checkout flow
├── StripeInlineProcessor.php  # Inline (embedded) payment flow
├── StripeSettings.php         # Stripe config management
├── ConnectConfig.php          # Stripe Connect configuration
├── PaymentManager.php         # Payment orchestration
├── Components/
│   └── StripeInline.php       # Inline payment form component
└── API/
    ├── ApiRequest.php         # Base Stripe API request handler
    ├── RequestProcessor.php   # Request processing logic
    ├── Account.php            # Account operations
    ├── Customer.php           # Customer management
    ├── CheckoutSession.php    # Checkout session handling
    ├── Invoice.php            # Invoice operations
    ├── Plan.php               # Subscription plan management
    ├── SCA.php                # Strong Customer Authentication
    └── StripeListener.php     # Webhook listener
```

## Payment Components (Form Builder)

| Component | File | Purpose |
|-----------|------|---------|
| CustomPaymentComponent | `Components/CustomPaymentComponent.php` | Custom payment field |
| ItemQuantity | `Components/ItemQuantity.php` | Quantity input for items |
| MultiPaymentComponent | `Components/MultiPaymentComponent.php` | Multiple payment methods |
| PaymentMethods | `Components/PaymentMethods.php` | Payment method selector |
| PaymentSummaryComponent | `Components/PaymentSummaryComponent.php` | Order summary display |
| Subscription | `Components/Subscription.php` | Recurring payment field |
| StripeInline | `Stripe/Components/StripeInline.php` | Embedded Stripe form |

## AJAX Endpoints (Payment Settings)

All registered in `AjaxEndpoints.php` via `wp_ajax_fluentform_handle_payment_ajax_endpoint`:

- `enable_payment` — Toggle payment module on/off
- `update_global_settings` — Save global payment config
- `get_payment_method_settings` / `save_payment_method_settings` — Per-gateway settings
- `get_form_settings` / `save_form_settings` — Per-form payment settings
- `update_transaction` — Modify transaction record
- `get_coupons` / `enable_coupons` / `save_coupon` / `delete_coupon` — Coupon management
- `get_stripe_connect_config` / `disconnect_stripe_connection` — Stripe Connect
- `get_pages` — WP pages for receipt redirect
- `cancel_subscription` — Cancel active subscription

## Key Hooks

**Actions:**
```
fluentform/process_payment                              # Main payment dispatch
fluentform/process_payment_{method}                     # Per-method processing
fluentform/before_payment_status_change                 # Pre status change
fluentform/after_payment_status_change                  # Post status change
fluentform/payment_{status}_{method}                    # Method-specific status
fluentform/payment_{status}                             # General status change
fluentform/subscription_received_payment                # Subscription payment received
fluentform/subscription_payment_canceled                # Subscription canceled
fluentform/payment_subscription_status_to_cancelled     # Subscription status → cancelled
fluentform/payment_receipt_before_content               # Before receipt HTML
fluentform/payment_receipt_after_content                # After receipt HTML
fluentform/before_entry_payment_deleted                 # Before deleting payment entries
fluentform/after_entry_payment_deleted                  # After deleting payment entries
fluentform/rendering_payment_method_{name}              # Rendering a specific method
fluentform/handle_payment_ajax_endpoint                 # AJAX endpoint dispatch
```

**Filters:**
```
fluentform/payment_settings_{method}                    # Filter method settings
fluentform/form_payment_settings                        # Filter form payment config
fluentform/transaction_data_{method}                    # Filter transaction data
fluentform/subscription_items_{method}                  # Filter subscription items
fluentform/payment_submission_data                      # Filter submission data
fluentform/payment_field_{element}_pricing_options      # Filter pricing options
```

## How Pro Extends Payments

The free plugin provides the payment framework (tables, components, base processors, Stripe). FluentForm Pro (`fluentformpro`) adds:

- **9 additional gateways**: PayPal, Mollie, Square, AuthorizeNet, Paddle, Paystack, RazorPay, Offline + enhanced Stripe
- **Coupon system**: `CouponController.php`, `CouponModel.php` in pro
- **Transaction shortcodes**: Extended display options
- **Payment entries admin**: Full payment management UI
- **Subscription lifecycle**: Advanced subscription management

Pro hooks into `fluentform/process_payment_{method}` to register additional processors.

## Common Pitfalls

- Payment amounts are **integers in cents** — always use `PaymentHelper::formatMoney()` for display
- Stripe uses two flows: standard checkout (redirect) and inline (embedded) — check `StripeProcessor` vs `StripeInlineProcessor`
- The `payment_status` column on `fluentform_submissions` is separate from transaction status in `fluentform_transactions`
- Webhook listeners (`StripeListener`) handle async payment confirmations — test with Stripe CLI
- SCA (Strong Customer Authentication) flow in `API/SCA.php` is required for EU payments
