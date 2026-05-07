# Deploy

Do not enable real payments until legal/compliance and webhook fixture tests are done.

## Required Production Services

- Supabase Postgres/Auth
- AWS S3 private bucket
- KIE API credentials
- Optional Aporto credentials
- Stripe account and webhook endpoint
- NOWPayments account and IPN secret
- Sentry project

## Launch Flags

Internal/closed beta:

```env
ENABLE_REAL_PAYMENTS=false
PAYMENT_PROVIDERS=fake
LYRICS_PROVIDER=mock
MUSIC_PROVIDER=mock
STORAGE_PROVIDER=local
```

Local Postgres:

```bash
docker compose up -d postgres
npm run db:setup
npm run seed
npm run smoke:mock-generation
```

Closed beta with real generation:

```env
ENABLE_REAL_PAYMENTS=false
LYRICS_PROVIDER=kie
MUSIC_PROVIDER=kie
STORAGE_PROVIDER=s3
```

Paid beta:

```env
ENABLE_REAL_PAYMENTS=true
PAYMENT_PROVIDERS=stripe,nowpayments
```
