import { db } from "@/core/db";
import { config } from "@/core/config";
import { captureReservation } from "@/core/credits";
import { sha256 } from "@/core/hash";
import { getMusicProvider } from "@/providers";
import { getStorageProvider } from "@/storage";

export async function processGenerationJob(jobId: string) {
  const job = await db.generationJob.findUnique({
    where: { id: jobId },
    include: { draft: true }
  });
  if (!job) throw new Error(`Job not found: ${jobId}`);
  if (job.status === "ready") return job;

  const music = getMusicProvider();
  const storage = getStorageProvider();

  await db.generationJob.update({
    where: { id: job.id },
    data: { status: "provider_submitted", provider: config.musicProvider }
  });

  const providerTask = await music.submitSong({
    lyrics: job.draft.lyrics,
    title: job.draft.title,
    style: job.draft.style,
    voiceGender: job.draft.voiceGender as "m" | "f" | null,
    variants: 2
  });

  await db.generationAttempt.create({
    data: {
      generationJobId: job.id,
      provider: config.musicProvider,
      requestHash: sha256(`${job.id}:${job.draft.lyrics}:${job.draft.style}`),
      providerTaskId: providerTask.providerTaskId,
      status: "submitted",
      providerCostConsumed: true,
      rawRequestJson: { variants: 2 }
    }
  });

  await captureReservation(job.id);

  await db.generationJob.update({
    where: { id: job.id },
    data: {
      status: "copying_to_s3",
      providerTaskId: providerTask.providerTaskId
    }
  });

  const tracks = await music.getMockTracks?.(providerTask.providerTaskId);
  if (!tracks) {
    return db.generationJob.update({
      where: { id: job.id },
      data: { status: "provider_processing" },
      include: { tracks: true, draft: true }
    });
  }

  if (!tracks.length) {
    await db.generationJob.update({
      where: { id: job.id },
      data: { status: "failed", errorCode: "PROVIDER_SUBMIT_FAILED" }
    });
    return db.generationJob.findUnique({ where: { id: job.id } });
  }

  for (const track of tracks) {
    const key = `users/${job.userId}/songs/${job.id}/${track.variantIndex}.mp3`;
    const stored = await storage.putFromUrl({
      sourceUrl: track.sourceUrl,
      key,
      metadata: { jobId: job.id, variantIndex: String(track.variantIndex) }
    });
    await db.track.upsert({
      where: {
        generationJobId_variantIndex: {
          generationJobId: job.id,
          variantIndex: track.variantIndex
        }
      },
      create: {
        generationJobId: job.id,
        variantIndex: track.variantIndex,
        title: track.title,
        storageKey: stored.key,
        durationSec: track.durationSec,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        providerSourceUrlHash: sha256(track.sourceUrl)
      },
      update: {
        storageKey: stored.key,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes
      }
    });
  }

  return db.generationJob.update({
    where: { id: job.id },
    data: { status: tracks.length === 2 ? "ready" : "partially_ready" },
    include: { tracks: true, draft: true }
  });
}

export async function processNextQueuedJob() {
  const job = await db.generationJob.findFirst({
    where: { status: "queued" },
    orderBy: { createdAt: "asc" }
  });
  if (!job) return null;
  await db.generationJob.update({
    where: { id: job.id },
    data: { status: "claimed", lockedAt: new Date() }
  });
  return processGenerationJob(job.id);
}
