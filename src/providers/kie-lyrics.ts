import { config } from "@/core/config";
import type { LyricsProvider } from "@/core/types";
import { postJson } from "./http-json";

type OpenAICompatibleResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

export const kieLyricsProvider: LyricsProvider = {
  async createDraft({ messages, schemaVersion }) {
    if (!config.kieBaseUrl || !config.kieApiKey) {
      throw new Error("KIE lyrics provider is not configured");
    }

    const response = await postJson<OpenAICompatibleResponse>(
      `${config.kieBaseUrl.replace(/\/$/, "")}/${config.kieGeminiModel}/v1/chat/completions`,
      {
        apiKey: config.kieApiKey,
        body: {
          model: config.kieGeminiModel,
          messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "song_draft",
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  next_question: { type: "string" },
                  song: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      lyrics: { type: "string" },
                      style: { type: "string" },
                      title: { type: "string" },
                      voice_gender: { type: ["string", "null"] }
                    },
                    required: ["lyrics", "style", "title", "voice_gender"]
                  },
                  complete: { type: "boolean" }
                },
                required: ["song", "complete"]
              }
            }
          },
          metadata: { schemaVersion }
        }
      }
    );

    const content = response.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content);
    const song = parsed.song ?? parsed;

    return {
      title: song.title,
      lyrics: song.lyrics,
      style: song.style,
      voiceGender: song.voice_gender ?? null,
      raw: parsed
    };
  }
};
