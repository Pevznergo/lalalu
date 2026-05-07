export const errorCatalog = {
  DRAFT_JSON_INVALID: {
    message: "Не удалось обновить черновик, попробуй ещё раз",
    severity: "warn"
  },
  PAYMENT_SIGNATURE_INVALID: {
    message: "Платёж не подтверждён",
    severity: "critical"
  },
  PAYMENT_AMOUNT_MISMATCH: {
    message: "Платёж проверяется поддержкой",
    severity: "critical"
  },
  PROMO_CODE_INVALID: {
    message: "Промокод не подходит или уже использован",
    severity: "info"
  },
  ADMIN_PERMISSION_DENIED: {
    message: "Недостаточно прав",
    severity: "critical"
  },
  CREDIT_RESERVATION_CONFLICT: {
    message: "Баланс изменился, обнови страницу",
    severity: "warn"
  },
  PROVIDER_SUBMIT_FAILED: {
    message: "Не удалось начать генерацию",
    severity: "error"
  },
  S3_COPY_FAILED: {
    message: "Песня готовится дольше обычного",
    severity: "error"
  },
  QUALITY_GATE_FAILED: {
    message: "Одна версия песни не прошла проверку",
    severity: "error"
  },
  JOB_STUCK: {
    message: "Мы ещё работаем над песней",
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
