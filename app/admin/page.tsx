import { db } from "@/core/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const campaigns = await db.promoCampaign.findMany({
    include: { codes: { include: { redemptions: true } } },
    orderBy: { createdAt: "desc" }
  });
  const jobs = await db.generationJob.findMany({
    include: { draft: true, attempts: true },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">Админка</div>
        <Link className="button secondary" href="/">
          На сайт
        </Link>
      </header>
      <section className="hero">
        <form className="panel" action="/api/admin/promo" method="post">
          <h2>Создать промокод</h2>
          <div className="grid">
            <label>
              Кампания
              <input name="campaign" defaultValue="BETA_BIRTHDAY_2026" />
            </label>
            <label>
              Кредитов
              <input name="credits" type="number" min="1" defaultValue="3" />
            </label>
            <label>
              Максимум активаций
              <input name="maxRedemptions" type="number" min="1" defaultValue="100" />
            </label>
            <button type="submit">Сгенерировать</button>
          </div>
        </form>
        <div className="panel">
          <h2>Jobs</h2>
          <div className="grid">
            {jobs.map((job) => (
              <div key={job.id}>
                <strong>{job.draft.title}</strong>
                <div className="muted">{job.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="grid" style={{ marginTop: 24 }}>
        {campaigns.map((campaign) => (
          <article className="card" key={campaign.id}>
            <h2>{campaign.name}</h2>
            {campaign.codes.map((code) => (
              <p key={code.id}>
                {code.displayPrefix}... · {code.credits} credits ·{" "}
                {code.redemptions.length}/{code.maxRedemptions} used
              </p>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}
