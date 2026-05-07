# Payments

Real payments stay disabled for the first cohort.

```env
ENABLE_REAL_PAYMENTS=false
PAYMENT_PROVIDERS=fake
```

Users receive credits through admin-generated promo codes.

## Stripe

Before enabling:

- Use Checkout Sessions only from the server.
- Verify webhook signatures.
- Fulfill credits only from verified webhook events.
- Match amount, currency, package, and user metadata.
- Store provider event ids to prevent replay.

## NOWPayments

Before enabling:

- Verify `x-nowpayments-sig` with the IPN secret.
- Treat `waiting` and `confirming` as pending.
- Credit only `finished` or equivalent terminal success.
- Park `partially_paid`, `underpaid`, `overpaid`, and mismatch cases for support.

## Promo Credits

Promo credits use the same `credit_ledger` as paid credits. Redemptions are transactional: one `promo_redemptions` row and one ledger row.
