import { db } from "@/core/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MySongsPage() {
  const user = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
  const jobs = user
    ? await db.generationJob.findMany({
        where: { userId: user.id },
        include: { draft: true, tracks: true },
        orderBy: { createdAt: "desc" }
      })
    : [];

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">My Songs</div>
        <Link className="button secondary" href="/">
          Create a song
        </Link>
      </header>
      <div className="grid">
        {jobs.length === 0 ? (
          <div className="panel">No songs yet.</div>
        ) : (
          jobs.map((job) => (
            <article className="card" key={job.id}>
              <h2>{job.draft.title}</h2>
              <p className="muted">Status: {job.status}</p>
              <p>Versions: {job.tracks.length}</p>
              {job.tracks.map((track) => (
                <p key={track.id}>
                  Version {track.variantIndex + 1}: {track.storageKey}
                </p>
              ))}
            </article>
          ))
        )}
      </div>
    </main>
  );
}
