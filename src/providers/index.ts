import { config } from "@/core/config";
import type { LyricsProvider, MusicProvider } from "@/core/types";
import { mockLyricsProvider } from "./mock-lyrics";
import { mockMusicProvider } from "./mock-music";

export function getLyricsProvider(): LyricsProvider {
  if (config.lyricsProvider === "mock") return mockLyricsProvider;
  // Real KIE/Aporto adapters are intentionally opt-in after contract fixtures exist.
  return mockLyricsProvider;
}

export function getMusicProvider(): MusicProvider {
  if (config.musicProvider === "mock") return mockMusicProvider;
  return mockMusicProvider;
}
