import { config } from "@/core/config";
import type { MusicProvider } from "@/core/types";
import { postJson } from "./http-json";

export const aportoMusicProvider: MusicProvider = {
  async submitSong(input) {
    if (!config.aportoBaseUrl || !config.aportoApiKey) {
      throw new Error("Aporto music provider is not configured");
    }

    const response = await postJson<{
      providerTaskId?: string;
      taskId?: string;
      status?: "submitted" | "processing";
    }>(`${config.aportoBaseUrl.replace(/\/$/, "")}/v1/suno/songs`, {
      apiKey: config.aportoApiKey,
      body: {
        title: input.title,
        lyrics: input.lyrics,
        style: input.style,
        voiceGender: input.voiceGender,
        variants: input.variants
      }
    });

    return {
      providerTaskId: response.providerTaskId ?? response.taskId ?? `aporto-${Date.now()}`,
      status: response.status ?? "submitted"
    };
  }
};
