import { mkdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { mockLyricsProvider } from "@/providers/mock-lyrics";
import { mockMusicProvider } from "@/providers/mock-music";
import { localStorageProvider } from "@/storage/local";

export type LocalSongJob = {
  id: string;
  status: "ready";
  createdAt: string;
  draft: {
    id: string;
    title: string;
    lyrics: string;
    style: string;
  };
  tracks: Array<{
    id: string;
    variantIndex: number;
    title: string;
    storageKey: string;
    durationSec?: number;
  }>;
};

const storeDir = path.join(process.cwd(), ".lalalu-local");
const storePath = path.join(storeDir, "songs.json");

function buildLocalStory(input: { topic?: string; style?: string; story?: string }) {
  return [
    input.topic ? `Occasion: ${input.topic}` : null,
    input.style ? `Style: ${input.style}` : null,
    input.story ? `Details: ${input.story}` : null
  ]
    .filter(Boolean)
    .join(". ");
}

async function readStore(): Promise<LocalSongJob[]> {
  try {
    return JSON.parse(await readFile(storePath, "utf8")) as LocalSongJob[];
  } catch {
    return [];
  }
}

async function writeStore(jobs: LocalSongJob[]) {
  await mkdir(storeDir, { recursive: true });
  await writeFile(storePath, JSON.stringify(jobs, null, 2));
}

export function isDatabaseUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Can't reach database server") || message.includes("PrismaClientInitializationError");
}

export async function shouldUseLocalSongStore() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl) return true;

  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    return false;
  }

  const isLocalHost = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  if (!isLocalHost) return false;

  const port = Number(url.port || "5432");
  return !(await canConnect(url.hostname, port));
}

function canConnect(host: string, port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (result: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(180);
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
  });
}

export async function createLocalSong(input: {
  topic?: string;
  style?: string;
  story: string;
}) {
  const story = buildLocalStory(input);
  const draftId = crypto.randomUUID();
  const jobId = crypto.randomUUID();
  const song = await mockLyricsProvider.createDraft({
    schemaVersion: "local-v1",
    messages: [{ role: "user", content: story }]
  });
  const task = await mockMusicProvider.submitSong({
    title: song.title,
    lyrics: song.lyrics,
    style: input.style || song.style,
    voiceGender: song.voiceGender,
    variants: 2
  });
  const tracks = await mockMusicProvider.getMockTracks?.(task.providerTaskId);
  if (!tracks?.length) {
    throw new Error("Local mock music provider did not return tracks");
  }
  const storedTracks = await Promise.all(tracks.map(async (track) => {
    const key = `users/local/songs/${jobId}/${track.variantIndex}.mp3`;
    const stored = await localStorageProvider.putFromUrl({
      sourceUrl: track.sourceUrl,
      key,
      metadata: { jobId, variantIndex: String(track.variantIndex) }
    });
    return {
      id: crypto.randomUUID(),
      variantIndex: track.variantIndex,
      title: track.title,
      storageKey: stored.key,
      durationSec: track.durationSec
    };
  }));

  const job: LocalSongJob = {
    id: jobId,
    status: "ready",
    createdAt: new Date().toISOString(),
    draft: {
      id: draftId,
      title: song.title,
      lyrics: song.lyrics,
      style: input.style || song.style
    },
    tracks: storedTracks
  };

  const jobs = await readStore();
  await writeStore([job, ...jobs]);
  return job;
}

export async function listLocalSongs() {
  return readStore();
}
