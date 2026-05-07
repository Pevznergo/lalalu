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
        <div className="brand">Мои песни</div>
        <Link className="button secondary" href="/">
          Создать песню
        </Link>
      </header>
      <div className="grid">
        {jobs.length === 0 ? (
          <div className="panel">Песен пока нет.</div>
        ) : (
          jobs.map((job) => (
            <article className="card" key={job.id}>
              <h2>{job.draft.title}</h2>
              <p className="muted">Статус: {job.status}</p>
              <p>Версий: {job.tracks.length}</p>
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
