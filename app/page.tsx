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
      </header>

      <section className="hero">
        <div>
          <p className="muted">A custom birthday song in minutes</p>
          <h1>Create a personal song gift</h1>
          <p>
            Tell us who the song is for, what memories matter, and the words
            you want to keep. First you get a draft, then you can generate two
            MP3 versions.
          </p>
          <div className="starter-grid">
            <div className="starter">Heartfelt</div>
            <div className="starter">Playful</div>
            <div className="starter">Energetic</div>
          </div>
        </div>

        <form className="panel" action="/api/drafts" method="post">
          <div className="grid">
            <label>
              Who is the song for?
              <input name="recipient" placeholder="For example, Anna" required />
            </label>
            <label>
              Who is it from?
              <input name="sender" placeholder="From family, friends, or coworkers" />
            </label>
            <label>
              Story and notes
              <textarea
                name="story"
                placeholder="Age, personality, shared memories, inside jokes, important words, name pronunciation"
                required
              />
            </label>
            <button type="submit">Build a song draft</button>
            <p className="muted">
              Early users get generation access through private beta promo
              codes. Real payments are still disabled.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
