import { db } from "@/core/db";
import { reserveCreditForGeneration } from "@/core/credits";

export async function enqueueGeneration(input: {
  userId: string;
  draftId: string;
  idempotencyKey: string;
}) {
  return reserveCreditForGeneration(input);
}

export async function listUserSongs(userId: string) {
  return db.generationJob.findMany({
    where: { userId },
    include: { draft: true, tracks: true },
    orderBy: { createdAt: "desc" }
  });
}
