# lalalu

Mobile-ready birthday song generator.

## Quickstart

```bash
npm install
cp .env.example .env.local
docker compose up -d postgres
npm run db:setup
npm run seed
npm run smoke:mock-generation
npm run dev
npm run worker
```

The default local path uses mock lyrics, mock music, fake payments, and local file storage. Real Stripe, NOWPayments, KIE, Aporto, Supabase cloud, and AWS S3 are opt-in through env flags.

## Product Mode

First cohort mode keeps real payments disabled:

```env
ENABLE_REAL_PAYMENTS=false
PAYMENT_PROVIDERS=fake
```

Admins issue promo codes from `/admin`. Users redeem credits and generate songs without touching Stripe or NOWPayments.

## Core Commands

- `npm run dev` - Next.js app
- `npm run worker` - process one queued generation job
- `npm run smoke:mock-generation` - end-to-end fake generation
- `npm run db:setup` - Prisma generate + push schema
- `npm run seed` - admin and beta promo seed

If Docker is unavailable, point `DATABASE_URL` at any Postgres database. Supabase cloud works too.

## Docs

- [Plan](./PLAN.md)
- [Test plan](./docs/autoplan/lalalu-test-plan-20260506.md)
- [Providers](./docs/providers.md)
- [Payments](./docs/payments.md)
- [Jobs](./docs/jobs.md)
- [Storage](./docs/storage.md)
- [Errors](./docs/errors.md)
- [Testing](./docs/testing.md)
- [Deploy](./docs/deploy.md)
- [Runbook](./docs/runbook.md)
