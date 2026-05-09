export const errorCatalog = {
  DRAFT_JSON_INVALID: {
    message: "Could not update the draft, try again",
    severity: "warn"
  },
  PAYMENT_SIGNATURE_INVALID: {
    message: "Payment not confirmed",
    severity: "critical"
  },
  PAYMENT_AMOUNT_MISMATCH: {
    message: "Payment is under review",
    severity: "critical"
  },
  PROMO_CODE_INVALID: {
    message: "Promo code is invalid or already used",
    severity: "info"
  },
  ADMIN_PERMISSION_DENIED: {
    message: "Not enough permissions",
    severity: "critical"
  },
  CREDIT_RESERVATION_CONFLICT: {
    message: "Balance changed, refresh the page",
    severity: "warn"
  },
  PROVIDER_SUBMIT_FAILED: {
    message: "Could not start generation",
    severity: "error"
  },
  S3_COPY_FAILED: {
    message: "Song is taking longer than usual",
    severity: "error"
  },
  QUALITY_GATE_FAILED: {
    message: "One song version failed validation",
    severity: "error"
  },
  JOB_STUCK: {
    message: "We are still working on the song",
    severity: "error"
  }
} as const;

export type ErrorCode = keyof typeof errorCatalog;

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string = errorCatalog[code].message,
    public readonly context: Record<string, unknown> = {}
  ) {
    super(message);
  }
}
