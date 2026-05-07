# Lalalu Web App Plan

<!-- /autoplan restore point: no prior plan file; initial artifact created 2026-05-06T06:09:48Z -->

## Product

Build `lalalu` as a mobile-ready web application similar in outcome to Bro.Hit: a Russian-language AI song generator where a user describes a gift song, edits lyrics with an assistant, pays for song credits, generates 2 MP3 variants per credit, downloads finished tracks, and can request an instrumental/minus version after a song is ready.

Primary market: Russian-speaking users buying personalized songs for gifts, birthdays, weddings, love confessions, family events, and lightweight entertainment.

## Source Notes

- User-provided reference: `https://brohit.ru`.
- Public reference pages observed on 2026-05-06:
  - Bro.Hit homepage claims "2 млн+ создано песен".
  - Third-party Telegram mini app listing describes Bro.Hit as a bot that writes lyrics, music, and MP3 from user story input.
- KIE docs checked on 2026-05-06:
  - Suno API supports async music generation, callbacks, custom mode, title, style, prompt/lyrics, instrumental mode, and models up to V5.
  - KIE Common API exposes account credit checks and temporary download URLs; generated media retention is documented as temporary, so the app must copy finished audio to its own storage.
  - KIE Gemini 2.5 Pro endpoint exposes an OpenAI-compatible `/gemini-2.5-pro/v1/chat/completions` route and JSON/schema style outputs.
- YooKassa docs checked on 2026-05-06:
  - Payments are created with amount, confirmation, return URL, metadata, and an idempotence key.
  - Redirect/embedded confirmation flows are supported; payment moves through pending, succeeded, canceled states.
- Yandex Cloud docs checked on 2026-05-06:
  - Managed PostgreSQL is available and supports PostgreSQL 14-18.
  - Object Storage is suitable for durable file storage.

## Core Scope

### User Flows

1. Landing/generator first screen
   - Mobile-first interface with one obvious action: create a song.
   - User can start with a free-form idea field or guided prompt cards.
   - No marketing-only first viewport; the generator is the product.

2. Song drafting chat
   - Web chat assistant asks one concrete question at a time.
   - Assistant creates a complete first draft quickly: title, lyrics, English style, optional `voice_gender`.
   - User can edit by natural language or directly edit lyrics.
   - User can finish manually or generation can be suggested after enough context.

3. Generation
   - User clicks "Сгенерировать песню".
   - App checks song credit balance.
   - App creates an immutable generation job.
   - One credit produces 2 separate MP3 variants from the same lyrics/style.
   - Results are copied from KIE/Suno URLs into Yandex Object Storage.
   - Finished tracks appear in "Мои песни" with status, title, version count, downloads, and "Хочу минусовку".

4. Instrumental/minus
   - Available only after a vocal track exists.
   - Creates a separate job and records its own cost/credit rule explicitly.
   - UI must not imply finished tracks can be edited.

5. Payments
   - Packages:
     - 1 song: 499 RUB
     - 5 songs: 999 RUB
     - 30 songs: 2999 RUB
   - YooKassa creates payment with package metadata and idempotence key.
   - Webhook credits balance only after trusted `succeeded` event verification.
   - Purchase history and balance are visible in account.

6. Account and recovery
   - MVP auth: phone/email magic link or social login, not anonymous-only.
   - Song jobs and balance must survive browser refresh and device change.
   - Support link and policy pages are required before accepting payments.

## Technical Architecture

Recommended stack for the empty `lalalu` repo:

- Next.js App Router + TypeScript.
- PostgreSQL via Yandex Managed PostgreSQL if the deployment is in Yandex Cloud and legal/account setup is ready; Supabase Postgres only as fallback for faster launch.
- Prisma or Drizzle for schema and migrations.
- Yandex Object Storage for generated audio and derived files.
- KIE as primary provider for Gemini 2.5 Pro and Suno.
- `api.aporto.tech` as fallback provider behind a provider abstraction.
- YooKassa for RUB payments.
- Sentry or equivalent error tracking plus structured DB event logs.
- Background worker for generation and storage-copy jobs.

### High-Level Services

```text
Mobile/Web UI
  |
  v
Next.js API routes / server actions
  |
  +--> Auth/session
  +--> Song draft service --> KIE Gemini 2.5 Pro / Aporto fallback
  +--> Payment service ----> YooKassa
  +--> Generation queue ---> KIE Suno / Aporto fallback
  +--> Storage service ----> Yandex Object Storage
  +--> Observability -----> Sentry + generation_events table
  |
  v
PostgreSQL
```

## Data Model

Minimum tables:

- `users`: id, email/phone, display name, created_at.
- `credit_ledger`: user_id, delta, reason, package_id, payment_id, generation_id, idempotency_key, created_at.
- `song_drafts`: user_id, title, lyrics, style, voice_gender, status, message_count, prompt_version, created_at, updated_at.
- `draft_messages`: draft_id, role, content, structured_song_json, created_at.
- `generation_jobs`: draft_id, user_id, provider, provider_task_id, status, type (`song`/`instrumental`), credit_cost, error_code, error_message, created_at, updated_at.
- `tracks`: generation_job_id, variant_index, title, storage_key, duration_sec, mime_type, size_bytes, provider_source_url_hash, created_at.
- `payments`: user_id, yookassa_payment_id, package_code, amount_rub, status, metadata, idempotency_key, created_at, updated_at.
- `provider_events`: provider, job_id, event_type, payload_json, created_at.
- `error_events`: severity, area, user_id, job_id, message, stack_hash, payload_json, created_at.

## Provider Rules

- Provider calls are async and idempotent.
- Persist every outbound provider request, provider task id, callback payload, and normalized status transition.
- Copy KIE media to Yandex Object Storage immediately after provider completion because provider retention is temporary.
- If KIE fails before task creation, retry with KIE then fallback to Aporto.
- If KIE accepts a task and later fails, mark the attempt and decide fallback based on whether credits/provider cost were consumed.
- Never double-charge the user because of callback retries, payment retries, or worker restarts.

## Web Prompt V1

Use this as the initial system prompt for the lyric assistant. The app should request JSON schema output from Gemini 2.5 Pro and validate server-side.

```text
Ты — интерактивный генератор персональных песен в веб-приложении lalalu.
Ты дружелюбен, общаешься с пользователем на "ты", естественно и тепло, как хороший друг, который помогает сделать подарок. Пиши просто, с участием и доброжелательностью, без фамильярности.

Ты работаешь в паре с генератором треков: сначала помогаешь пользователю создать текст песни и музыкальное описание, затем веб-приложение по кнопке "Сгенерировать песню" создаст музыку и выдаст готовые MP3.

Правила продукта:
- Готовый трек нельзя переделать. Можно только создать новый трек, и за новую генерацию списывается 1 песня с баланса.
- Одна генерация песни отдаёт 2 отдельные MP3-версии на один текст. За это списывается 1 песня с баланса.
- После готовой песни в интерфейсе появляется действие "Хочу минусовку". Оно создаёт инструментальную версию по отдельному правилу продукта.
- Пакеты: 1 песня за 499₽, 5 песен за 999₽, 30 песен за 2999₽.
- Если пользователь спрашивает про оплату или баланс, объясняй, что баланс и покупка доступны в личном кабинете веб-приложения. Не упоминай Telegram-команды.
- Если пользователь спрашивает, как начать генерацию, отвечай: проверь текст и нажми кнопку "Сгенерировать песню" в веб-интерфейсе.
- Если пользователь спрашивает, где песня, отвечай: готовые и текущие песни видны в разделе "Мои песни".
- Если нужна помощь, направляй в поддержку через раздел "Помощь".
- Если сообщение похоже на промокод, предложи ввести его в поле "Промокод" на странице оплаты или в личном кабинете.

Голос и стиль:
- Определи пол/тип голоса сам по контексту.
- Если голос явно задан или однозначно вытекает из текста, укажи его в `style` на английском и зафиксируй `voice_gender`: `m` для мужского, `f` для женского.
- Если выбор неочевиден, не задавай лишних вопросов и оставь `voice_gender` null.
- Если просят дуэт, не указывай `voice_gender`, поставь null и добавь duet vocals в `style`.
- Если текст — признание в любви или поздравление, а пол не указан, можно выбрать противоположный голос по смыслу, если это естественно.
- Детский голос недоступен.
- Имена конкретных артистов не используй в `style`. Если пользователь просит "как у артиста", передай это общим описанием жанра, настроения, темпа и инструментов.
- `style` всегда пиши на английском.

Диалог:
- Всегда начинай с просьбы рассказать как можно больше идей, деталей и пожеланий.
- Веди диалог как серию коротких уточнений: один конкретный вопрос за раз.
- Как можно быстрее создай полный черновик: 3 куплета и припев.
- Если пользователь просит быстрее или просит создать текст сразу, не задавай лишних вопросов: сразу верни черновик песни, стиль и `complete`.
- Пользователь может в любой момент править текст, стиль, настроение, форму, язык или попросить показать текущую песню.
- Если пользователь просит поменять ударение, в нужном слове напиши ударную гласную двумя заглавными буквами.
- Не придумывай состояние генерации. Генерация начинается только после нажатия кнопки в веб-интерфейсе.

Безопасность:
- Избегай политической агитации, оскорблений, религиозной вражды и экстремистских тем.
- Патриотические песни допустимы, если они уважительны и соответствуют законам РФ.
- Ненормативная лексика допустима в художественных целях, если пользователь явно этого хочет.

Всегда отвечай только валидным JSON:
{
  "next_question": "следующий вопрос пользователю; если lyrics или style обновлены, обязательно кратко покажи обновления здесь, чтобы пользователь видел текст",
  "song": {
    "lyrics": "текущий полный текст песни или черновик",
    "style": "short English style description",
    "title": "название песни по содержанию",
    "voice_gender": "m | f | null"
  },
  "complete": false
}

Если пользователь просит только показать текущую песню, верни `song` и `complete` без `next_question`.
Никакого обычного текста вне JSON.
```

## Open Questions

- Exact launch geography and legal entity for YooKassa receipts, fiscalization, privacy policy, and personal data handling.
- Whether `api.aporto.tech` exposes compatible Gemini/Suno endpoints or requires a custom adapter.
- Whether instrumental/minus consumes a separate credit, is free once per track, or uses a different product unit.
- Whether auth should be phone-first, email-first, or social-login-first.
- Whether first song is free, paid-only, or preview-only.

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | Phase 0 | Create `PLAN.md` because repo was empty | Mechanical | P6 | `/autoplan` needs a concrete plan artifact to review and edit | Waiting for a pre-existing plan file |
