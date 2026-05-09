import { db } from "@/core/db";
import { createBirthdayDraft } from "@/core/drafts";
import { enqueueGeneration, listUserSongs } from "@/core/generation";
import { grantCredits, getBalance } from "@/core/credits";
import { processGenerationJob } from "@/worker/process-job";

async function main() {
  const user = await db.user.upsert({
    where: { email: "beta-user@lalalu.local" },
    create: { email: "beta-user@lalalu.local", displayName: "Beta User" },
    update: {}
  });

  await grantCredits({
    userId: user.id,
    credits: 3,
    reason: "smoke_seed",
    idempotencyKey: "smoke:grant:beta-user"
  });

  const draft = await createBirthdayDraft({
    userId: user.id,
    story: "Song for Anna on her birthday from family. Heartfelt, warm, and grateful."
  });

  const job = await enqueueGeneration({
    userId: user.id,
    draftId: draft.id,
    idempotencyKey: "smoke:generation:1"
  });

  const processed = await processGenerationJob(job.id);
  const songs = await listUserSongs(user.id);
  const balance = await getBalance(user.id);

  if (!processed || processed.status !== "ready") {
    throw new Error(`Expected ready job, got ${processed?.status}`);
  }
  const generated = songs.find((song) => song.id === job.id);
  if (!generated || generated.tracks.length !== 2) {
    throw new Error("Expected two generated mock tracks");
  }
  if (balance !== 2) {
    throw new Error(`Expected balance 2 after one generation, got ${balance}`);
  }

  console.log("SMOKE_OK");
  console.log(
    JSON.stringify(
      {
        userId: user.id,
        draftId: draft.id,
        jobId: job.id,
        status: processed.status,
        tracks: generated.tracks.map((track) => track.storageKey),
        balance
      },
      null,
      2
    )
  );
}

main()
  .finally(() => db.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
