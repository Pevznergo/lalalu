export type VoiceGender = "m" | "f" | null;

export interface SongDraftData {
  title: string;
  lyrics: string;
  style: string;
  voiceGender: VoiceGender;
}

export interface LyricsProvider {
  createDraft(input: {
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    schemaVersion: string;
  }): Promise<SongDraftData & { raw: unknown }>;
}

export interface MusicProvider {
  submitSong(input: {
    lyrics: string;
    title: string;
    style: string;
    voiceGender: VoiceGender;
    variants: number;
  }): Promise<{ providerTaskId: string; status: "submitted" | "processing" }>;
  getMockTracks?(taskId: string): Promise<GeneratedTrack[]>;
}

export interface GeneratedTrack {
  variantIndex: number;
  title: string;
  sourceUrl: string;
  mimeType: string;
  sizeBytes: number;
  durationSec?: number;
}

export interface PaymentProvider {
  createCheckout(input: {
    userId: string;
    packageCode: string;
    amount: number;
    currency: string;
  }): Promise<{ checkoutUrl: string; providerPaymentId: string; status: string }>;
  verifyWebhook(input: {
    body: string;
    signature: string | null;
  }): Promise<NormalizedPaymentEvent>;
}

export interface NormalizedPaymentEvent {
  provider: "stripe" | "nowpayments" | "fake";
  providerEventId: string;
  providerPaymentId: string;
  eventType: string;
  status: "pending" | "succeeded" | "failed" | "needs_review";
  amount?: number;
  currency?: string;
  raw: unknown;
}

export interface StorageProvider {
  putFromUrl(input: {
    sourceUrl: string;
    key: string;
    metadata: Record<string, string>;
  }): Promise<{ key: string; mimeType: string; sizeBytes: number }>;
  createDownloadUrl(input: { key: string; ttlSeconds: number }): Promise<string>;
}
