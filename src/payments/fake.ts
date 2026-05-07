import type { PaymentProvider } from "@/core/types";

export const fakePaymentProvider: PaymentProvider = {
  async createCheckout({ userId, packageCode }) {
    return {
      checkoutUrl: `/api/webhooks/fake-payment?userId=${userId}&packageCode=${packageCode}`,
      providerPaymentId: `fake-payment-${Date.now()}`,
      status: "succeeded"
    };
  },
  async verifyWebhook({ body }) {
    const payload = JSON.parse(body || "{}") as {
      id?: string;
      paymentId?: string;
      status?: string;
      amount?: number;
      currency?: string;
    };
    return {
      provider: "fake",
      providerEventId: payload.id ?? `fake-event-${Date.now()}`,
      providerPaymentId: payload.paymentId ?? `fake-payment-${Date.now()}`,
      eventType: "payment.succeeded",
      status: payload.status === "failed" ? "failed" : "succeeded",
      amount: payload.amount,
      currency: payload.currency,
      raw: payload
    };
  }
};
