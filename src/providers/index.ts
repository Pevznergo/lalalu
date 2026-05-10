import { config } from "@/core/config";
import type { LyricsProvider, MusicProvider } from "@/core/types";
import { aportoLyricsProvider } from "./aporto-lyrics";
import { aportoMusicProvider } from "./aporto-music";
import { kieLyricsProvider } from "./kie-lyrics";
import { kieMusicProvider } from "./kie-music";
import { mockLyricsProvider } from "./mock-lyrics";
import { mockMusicProvider } from "./mock-music";

export function getLyricsProvider(): LyricsProvider {
  if (config.lyricsProvider === "mock") return mockLyricsProvider;
  if (config.lyricsProvider === "kie") return kieLyricsProvider;
  if (config.lyricsProvider === "aporto") return aportoLyricsProvider;
  return mockLyricsProvider;
}

export function getMusicProvider(): MusicProvider {
  if (config.musicProvider === "mock") return mockMusicProvider;
  if (config.musicProvider === "kie") return kieMusicProvider;
  if (config.musicProvider === "aporto") return aportoMusicProvider;
  return mockMusicProvider;
}
