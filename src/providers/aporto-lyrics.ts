import { config } from "@/core/config";
import type { LyricsProvider } from "@/core/types";
import { postJson } from "./http-json";

export const aportoLyricsProvider: LyricsProvider = {
  async createDraft({ messages, schemaVersion }) {
    if (!config.aportoBaseUrl || !config.aportoApiKey) {
      throw new Error("Aporto lyrics provider is not configured");
    }

    const response = await postJson<{
      title: string;
      lyrics: string;
      style: string;
      voiceGender: "m" | "f" | null;
      raw?: unknown;
    }>(`${config.aportoBaseUrl.replace(/\/$/, "")}/v1/gemini/drafts`, {
      apiKey: config.aportoApiKey,
      body: {
        messages,
        schemaVersion
      }
    });

    return {
      title: response.title,
      lyrics: response.lyrics,
      style: response.style,
      voiceGender: response.voiceGender ?? null,
      raw: response.raw ?? response
    };
  }
};
