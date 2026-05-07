# Errors

Every user-facing error must include:

- `code`
- problem
- likely cause
- user CTA
- retry policy
- support severity
- logged context

Initial codes are tracked in `src/core/errors.ts`.

Critical operational codes:

- `PAYMENT_SIGNATURE_INVALID`
- `PAYMENT_AMOUNT_MISMATCH`
- `CREDIT_RESERVATION_CONFLICT`
- `PROVIDER_SUBMIT_FAILED`
- `S3_COPY_FAILED`
- `QUALITY_GATE_FAILED`
- `JOB_STUCK`
- `PROMO_CODE_INVALID`
- `ADMIN_PERMISSION_DENIED`
