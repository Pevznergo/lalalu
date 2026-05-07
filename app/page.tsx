import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">lalalu</div>
        <nav className="nav">
          <Link href="/my-songs">Мои песни</Link>
          <Link href="/admin">Админка</Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <p className="muted">Песня на день рождения за несколько минут</p>
          <h1>Собери личную песню в подарок</h1>
          <p>
            Расскажи, кому делаем песню, какие воспоминания и слова важно
            сохранить. Сначала получишь текст, потом сможешь сгенерировать две
            MP3-версии.
          </p>
          <div className="starter-grid">
            <div className="starter">Трогательно</div>
            <div className="starter">С юмором</div>
            <div className="starter">Энергично</div>
          </div>
        </div>

        <form className="panel" action="/api/drafts" method="post">
          <div className="grid">
            <label>
              Кому песня?
              <input name="recipient" placeholder="Например, Анне" required />
            </label>
            <label>
              От кого подарок?
              <input name="sender" placeholder="От семьи, друзей, коллег" />
            </label>
            <label>
              История и пожелания
              <textarea
                name="story"
                placeholder="Возраст, характер, общие воспоминания, шутки, важные слова, произношение имён"
                required
              />
            </label>
            <button type="submit">Собрать черновик песни</button>
            <p className="muted">
              Для первых пользователей генерация доступна по промокодам из
              закрытой беты. Реальные платежи пока выключены.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
