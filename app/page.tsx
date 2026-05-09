import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">lalelu</div>
        <nav className="nav">
          <Link href="/my-songs">My Songs</Link>
          <Link href="/admin">Admin</Link>
        </nav>
        <Link className="profile-button" href="/my-songs" aria-label="Account">
          <span className="profile-icon">◉</span>
        </Link>
      </header>

      <section className="hero hero-center">
        <p className="muted hero-kicker">2M+ songs created</p>
        <h1>Let&apos;s make a song.</h1>
        <p className="hero-subtitle">
          Choose a vibe below or describe it in your own words. We&apos;ll draft
          the song, then you can generate two MP3 versions.
        </p>

        <div className="starter-grid">
          <button className="starter-card" type="button">
            <span className="starter-emoji" aria-hidden="true">
              🎂
            </span>
            <strong>Birthday</strong>
          </button>
          <button className="starter-card" type="button">
            <span className="starter-emoji" aria-hidden="true">
              ❤️
            </span>
            <strong>Love</strong>
          </button>
          <button className="starter-card" type="button">
            <span className="starter-emoji" aria-hidden="true">
              💍
            </span>
            <strong>Wedding</strong>
          </button>
          <button className="starter-card" type="button">
            <span className="starter-emoji" aria-hidden="true">
              😂
            </span>
            <strong>Funny</strong>
          </button>
          <button className="starter-card" type="button">
            <span className="starter-emoji" aria-hidden="true">
              💪
            </span>
            <strong>Hype</strong>
          </button>
          <button className="starter-card" type="button">
            <span className="starter-emoji" aria-hidden="true">
              🎉
            </span>
            <strong>Party</strong>
          </button>
        </div>

        <p className="hero-divider">or</p>

        <form className="input-shell" action="/api/drafts" method="post">
          <input
            name="story"
            placeholder="Describe the song idea..."
            aria-label="Describe the song idea"
            required
          />
          <button className="mic-button" type="button" aria-label="Record voice note">
            <span aria-hidden="true">🎙</span>
          </button>
          <button className="send-button" type="submit" aria-label="Build a song draft">
            ↑
          </button>
        </form>

        <p className="hero-footer">
          Terms of Service and Privacy Policy. Built for personalized song
          generation.
        </p>
      </section>
    </main>
  );
}
