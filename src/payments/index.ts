import { config } from "@/core/config";
import type { PaymentProvider } from "@/core/types";
import { fakePaymentProvider } from "./fake";

export function getPaymentProvider(name = "fake"): PaymentProvider {
  if (!config.enableRealPayments) return fakePaymentProvider;
  if (name === "fake") return fakePaymentProvider;
  // Stripe and NOWPayments adapters are intentionally gated until credentials
  // and real webhook fixtures are installed.
  return fakePaymentProvider;
}
