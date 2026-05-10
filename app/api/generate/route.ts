import { redirect } from "next/navigation";
import { config } from "@/core/config";
import { db } from "@/core/db";
import { grantCredits, getBalance } from "@/core/credits";
import { enqueueGeneration } from "@/core/generation";
import { processGenerationJob } from "@/worker/process-job";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const draftId = url.searchParams.get("draftId");
  if (!draftId) return Response.json({ error: "draftId required" }, { status: 400 });

  const draft = await db.songDraft.findUnique({ where: { id: draftId } });
  if (!draft?.userId) return Response.json({ error: "draft not found" }, { status: 404 });

  const balance = await getBalance(draft.userId);
  if (balance < 1) {
    await grantCredits({
      userId: draft.userId,
      credits: 1,
      reason: "beta_auto_grant",
      idempotencyKey: `beta:auto:${draft.userId}:${draftId}`
    });
  }

  const job = await enqueueGeneration({
    userId: draft.userId,
    draftId,
    idempotencyKey: `web:${draftId}`
  });

  if (config.musicProvider === "mock") {
    await processGenerationJob(job.id);
  }

  redirect("/my-songs");
}
