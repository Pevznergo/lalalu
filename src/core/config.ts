export const config = {
  lyricsProvider: process.env.LYRICS_PROVIDER ?? "mock",
  musicProvider: process.env.MUSIC_PROVIDER ?? "mock",
  paymentProviders: (process.env.PAYMENT_PROVIDERS ?? "fake").split(","),
  storageProvider: process.env.STORAGE_PROVIDER ?? "local",
  enableRealPayments: process.env.ENABLE_REAL_PAYMENTS === "true",
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY ?? "1"),
  disableFallbacks: process.env.DISABLE_FALLBACKS === "true",
  webhookBaseUrl: process.env.WEBHOOK_BASE_URL ?? "http://localhost:3000",
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
};
