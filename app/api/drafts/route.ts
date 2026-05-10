import { redirect } from "next/navigation";
import { createSongAndStartGeneration } from "@/core/song-flow";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const wantsJson = request.headers.get("accept")?.includes("application/json");
  const data = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const topic = String(data.topic ?? "");
  const style = String(data.style ?? "");
  const story = String(data.story ?? "");

  if (!story.trim() && !topic.trim()) {
    return Response.json({ error: "story required" }, { status: 400 });
  }

  const result = await createSongAndStartGeneration({
    topic,
    style,
    story: story || topic
  });

  if (wantsJson || contentType.includes("application/json")) {
    return Response.json({
      draftId: result.draft.id,
      jobId: result.job.id,
      status: result.job.status,
      tracks: "tracks" in result.job ? result.job.tracks : []
    });
  }

  redirect("/my-songs");
}
