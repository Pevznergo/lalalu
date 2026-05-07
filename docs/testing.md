# Testing

Primary test artifact: `docs/autoplan/lalalu-test-plan-20260506.md`.

Minimum before closed beta:

- Mock smoke generation passes.
- Promo code redemption is idempotent.
- Non-admin cannot create promo codes.
- Credit reservation prevents two-tab double-spend.
- Worker crash after provider submit does not duplicate provider tasks.
- S3 copy failure becomes support-visible.
- Prompt injection cannot change payment, balance, auth, or job state.
- RLS tests cover all user-owned tables.

Useful commands:

```bash
npm run typecheck
npm run smoke:mock-generation
```
