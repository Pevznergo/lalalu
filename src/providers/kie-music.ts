import { config } from "@/core/config";
import type { MusicProvider } from "@/core/types";
import { postJson } from "./http-json";

type SubmitResponse = {
  providerTaskId?: string;
  taskId?: string;
  status?: "submitted" | "processing";
};

export const kieMusicProvider: MusicProvider = {
  async submitSong(input) {
    if (!config.kieBaseUrl || !config.kieApiKey) {
      throw new Error("KIE music provider is not configured");
    }

    const response = await postJson<SubmitResponse>(
      `${config.kieBaseUrl.replace(/\/$/, "")}/${config.kieSunoModel}/v1/songs`,
      {
        apiKey: config.kieApiKey,
        body: {
          title: input.title,
          lyrics: input.lyrics,
          style: input.style,
          voice_gender: input.voiceGender,
          variants: input.variants
        }
      }
    );

    return {
      providerTaskId: response.providerTaskId ?? response.taskId ?? `kie-${Date.now()}`,
      status: response.status ?? "submitted"
    };
  }
};
