import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "@/core/types";

const root = path.join(process.cwd(), "local-storage");

export const localStorageProvider: StorageProvider = {
  async putFromUrl({ sourceUrl, key, metadata }) {
    const filePath = path.join(root, key);
    await mkdir(path.dirname(filePath), { recursive: true });
    const body = `mock audio from ${sourceUrl}\n${JSON.stringify(metadata)}`;
    await writeFile(filePath, body);
    return {
      key,
      mimeType: "audio/mpeg",
      sizeBytes: Buffer.byteLength(body)
    };
  },
  async createDownloadUrl({ key }) {
    return `/api/local-storage/${encodeURIComponent(key)}`;
  }
};
