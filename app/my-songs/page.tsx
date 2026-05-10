import { db } from "@/core/db";
import { isDatabaseUnavailable, listLocalSongs, shouldUseLocalSongStore } from "@/core/local-song-store";
import Link from "next/link";

export const dynamic = "force-dynamic";

const activeStatuses = new Set([
  "queued",
  "claimed",
  "provider_submitted",
  "provider_processing",
  "copying_to_s3",
  "quality_check"
]);

function statusCopy(status: string) {
  switch (status) {
    case "queued":
      return "Waiting for generation";
    case "claimed":
    case "provider_submitted":
    case "provider_processing":
      return "Creating music";
    case "copying_to_s3":
    case "quality_check":
      return "Preparing downloads";
    case "partially_ready":
      return "One version is ready";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    case "needs_support":
      return "Needs support";
    default:
      return status.replaceAll("_", " ");
  }
}

function trackHref(storageKey: string) {
  return `/api/local-storage/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
}

export default async function MySongsPage() {
  const jobs = await loadSongs();
  const hasActiveJobs = jobs.some((job) => activeStatuses.has(job.status));

  return (
    <main className="page songs-page">
      {hasActiveJobs ? <meta httpEquiv="refresh" content="3" /> : null}
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand">My Songs</div>
          <p className="brand-subtitle">{jobs.length ? `${jobs.length} song${jobs.length === 1 ? "" : "s"}` : "No songs yet"}</p>
        </div>
        <Link className="button secondary" href="/">
          Create a song
        </Link>
      </header>

      <section className="songs-grid">
        {jobs.length === 0 ? (
          <div className="panel empty-state">
            <h1>Your first song starts in the chat.</h1>
            <p className="muted">Pick a topic, choose a style, add details, and lalelu will create two versions.</p>
            <Link className="button" href="/">
              Start
            </Link>
          </div>
        ) : (
          jobs.map((job) => (
            <article className={`song-card song-card-${job.status}`} key={job.id}>
              <div className="song-card-header">
                <div>
                  <p className="song-status">{statusCopy(job.status)}</p>
                  <h2>{job.draft.title}</h2>
                </div>
                <span className="song-count">{job.tracks.length}/2</span>
              </div>

              <p className="song-style">{job.draft.style}</p>

              {activeStatuses.has(job.status) ? (
                <div className="progress-line" aria-label="Generation in progress">
                  <span />
                </div>
              ) : null}

              {job.tracks.length ? (
                <div className="track-list">
                  {job.tracks.map((track) => (
                    <a className="track-link" href={trackHref(track.storageKey)} key={track.id}>
                      Version {track.variantIndex + 1}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="muted">Downloads appear here automatically.</p>
              )}
            </article>
          ))
        )}
      </section>
    </main>
  );
}

async function loadSongs() {
  if (await shouldUseLocalSongStore()) {
    return listLocalSongs();
  }

  try {
    const user = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
    return user
      ? await db.generationJob.findMany({
          where: { userId: user.id },
          include: { draft: true, tracks: true },
          orderBy: { createdAt: "desc" }
        })
      : [];
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    return listLocalSongs();
  }
}
