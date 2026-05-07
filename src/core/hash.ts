import { createHash, randomBytes } from "node:crypto";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createOpaqueToken(prefix: string, bytes = 18) {
  const raw = randomBytes(bytes).toString("base64url").toUpperCase();
  return `${prefix}_${raw}`;
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
