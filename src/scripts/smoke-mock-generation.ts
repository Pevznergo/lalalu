import { db } from "@/core/db";
import { createSongAndStartGeneration } from "@/core/song-flow";

async function main() {
  const result = await createSongAndStartGeneration({
    topic: "Birthday",
    style: "Warm pop",
    story: "Song for Anna from family. Heartfelt, warm, and grateful."
  });

  if (result.job.status !== "ready" && result.job.status !== "partially_ready") {
    throw new Error(`Expected ready job, got ${result.job.status}`);
  }

  if (!("tracks" in result.job) || result.job.tracks.length !== 2) {
    throw new Error("Expected two generated mock tracks");
  }

  console.log("SMOKE_OK");
  console.log(
    JSON.stringify(
      {
        source: result.source,
        draftId: result.draft.id,
        jobId: result.job.id,
        status: result.job.status,
        tracks: result.job.tracks.map((track) => track.storageKey)
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
