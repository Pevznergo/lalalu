import { config } from "@/core/config";
import type { StorageProvider } from "@/core/types";
import { localStorageProvider } from "./local";

export function getStorageProvider(): StorageProvider {
  if (config.storageProvider === "local") return localStorageProvider;
  // AWS S3 adapter should be enabled only after bucket policy tests pass.
  return localStorageProvider;
}
