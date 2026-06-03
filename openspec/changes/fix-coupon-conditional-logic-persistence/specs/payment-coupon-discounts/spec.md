## ADDED Requirements

> Scope: one coupon field per form — the supported configuration. Multiple
> coupon fields on a single form is not a supported scenario (the coupon
> apply path already fails with more than one coupon field, independent of
> this change) and is out of scope for these requirements.

### Requirement: Coupon discount follows coupon-field visibility on standard forms

A coupon applied through the coupon field SHALL stop contributing a discount as soon as that field is hidden by conditional logic. The displayed payment summary table and the order total SHALL reflect the cleared discount.

#### Scenario: Coupon field hidden after a coupon was applied

- **WHEN** a user applies a valid coupon while the coupon field is visible, then changes a field so conditional logic hides the coupon field
- **THEN** the applied coupon is removed from the active discount list
- **AND** the payment summary table and order total recalculate to the product price with no discount line

#### Scenario: Coupon field shown again after being hidden

- **WHEN** the coupon field is hidden (clearing its coupon) and later shown again by conditional logic
- **THEN** no discount is applied automatically
- **AND** the user must re-enter and re-apply a coupon for a discount to appear

### Requirement: Backend enforces coupon-field effective visibility before applying a discount

The server SHALL resolve the coupon field's effective visibility for the submitted answers before processing applied coupon codes — evaluating the coupon field's own conditional logic AND the conditional logic of every container that wraps it. When the coupon field is not effectively visible, the server SHALL ignore the submitted coupon codes and apply no discount, regardless of the request payload.

#### Scenario: Submission with coupon code but unsatisfied coupon-field condition

- **WHEN** a submission includes applied coupon codes but the coupon field's conditional logic does not pass for the submitted answers
- **THEN** the server applies no discount
- **AND** no discount order item is recorded

#### Scenario: Coupon field hidden by a conditional container

- **WHEN** the coupon field has no conditional logic of its own but lives inside a container whose conditional logic does not pass for the submitted answers
- **THEN** the server applies no discount, even though the coupon field's own conditions pass

#### Scenario: Crafted POST with coupon code on a hidden coupon field

- **WHEN** a request directly sets the applied-coupons payload for a coupon field that is not effectively visible (by its own condition or a container's)
- **THEN** the server applies no discount

#### Scenario: Coupon field with no conditional logic

- **WHEN** the coupon field has no conditional logic configured (or it is disabled) and is not inside a hidden container
- **THEN** the server processes applied coupon codes exactly as before, with no behaviour change

#### Scenario: Visibility matches the frontend for a missing controlling field

- **WHEN** the coupon field is shown by a condition such as `field != ''` and the controlling field is absent from the submission (so the frontend shows the coupon)
- **THEN** the server resolves the coupon field as visible too and honors the applied codes — the missing-field evaluation matches the client

### Requirement: Conversational forms clear coupon state when the coupon question leaves the active path

When the conversational form's active question path no longer includes the coupon question — whether it was hidden by conditional logic or skipped by jump logic — the shared applied-coupon state used for display and submission SHALL be cleared so no stale discount is shown or sent.

#### Scenario: Coupon question hidden by conditional logic after a coupon was applied

- **WHEN** a coupon was applied on a coupon question and a later answer causes that question's conditional logic to fail
- **THEN** the applied-coupon state is cleared
- **AND** the payment summary shows no discount and the submission carries no coupon codes

#### Scenario: Coupon question skipped by jump logic after a coupon was applied

- **WHEN** a coupon was applied on a coupon question and a changed answer makes an earlier question jump past the coupon question
- **THEN** the applied-coupon state is cleared
- **AND** the payment summary shows no discount and the submission carries no coupon codes
