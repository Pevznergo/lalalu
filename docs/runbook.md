# Runbook

## Payment Mismatch

1. Do not credit the user automatically.
2. Inspect `payment_intents` and `payment_events`.
3. Confirm provider amount, currency, package, and user metadata.
4. Manually grant credits only with an admin audit reason.

## Provider Outage

1. Disable real provider adapter if outage is widespread.
2. Stop new generation submissions if provider accepts tasks but fails callbacks.
3. Keep existing jobs visible as `needs_support`.
4. Reconcile provider task ids when service returns.

## S3 Copy Failure

1. Retry copy if provider URL is still valid.
2. If expired, attempt provider status/media refresh.
3. Mark job `needs_support` if media cannot be recovered.
4. Release or refund credit only if no usable variant exists and provider cost policy allows.

## Stuck Worker

1. Inspect `generation_jobs.status` and `locked_at`.
2. Requeue stale jobs if provider was not submitted.
3. Reconcile provider-submitted jobs by provider task id.
4. Alert if stuck jobs exceed beta SLA.

## Promo Abuse

1. Disable campaign or code.
2. Inspect redemptions by user/email/domain.
3. Revoke unused promo credits through ledger adjustment if needed.
4. Keep generated songs intact unless abuse violates policy.
