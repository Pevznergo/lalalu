import { config } from "./config";
import { db } from "./db";
import { grantCredits, getBalance } from "./credits";
import { createBirthdayDraft } from "./drafts";
import { enqueueGeneration } from "./generation";
import { createLocalSong, isDatabaseUnavailable, shouldUseLocalSongStore } from "./local-song-store";
import { processGenerationJob } from "@/worker/process-job";

export async function getOrCreateBetaUser() {
  return db.user.upsert({
    where: { email: "beta-user@lalalu.local" },
    create: { email: "beta-user@lalalu.local", displayName: "Beta User" },
    update: {}
  });
}

export function buildSongStory(input: {
  topic?: string;
  style?: string;
  story?: string;
}) {
  return [
    input.topic ? `Occasion: ${input.topic}` : null,
    input.style ? `Style: ${input.style}` : null,
    input.story ? `Details: ${input.story}` : null
  ]
    .filter(Boolean)
    .join(". ");
}

export async function createSongAndStartGeneration(input: {
  topic?: string;
  style?: string;
  story: string;
}) {
  if (await shouldUseLocalSongStore()) {
    const job = await createLocalSong(input);

    return {
      source: "local" as const,
      user: null,
      draft: job.draft,
      job
    };
  }

  try {
    const user = await getOrCreateBetaUser();
    const draft = await createBirthdayDraft({
      userId: user.id,
      story: buildSongStory(input)
    });

    const balance = await getBalance(user.id);
    if (balance < 1) {
      await grantCredits({
        userId: user.id,
        credits: 1,
        reason: "beta_auto_grant",
        idempotencyKey: `beta:auto:${user.id}:${draft.id}`
      });
    }

    const job = await enqueueGeneration({
      userId: user.id,
      draftId: draft.id,
      idempotencyKey: `web:${draft.id}`
    });

    const processed = config.musicProvider === "mock" ? await processGenerationJob(job.id) : job;
    const currentJob = await db.generationJob.findUnique({
      where: { id: processed?.id ?? job.id },
      include: { draft: true, tracks: true }
    });

    return {
      source: "database" as const,
      user,
      draft,
      job: currentJob ?? job
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    const job = await createLocalSong(input);

    return {
      source: "local" as const,
      user: null,
      draft: job.draft,
      job
    };
  }
}
