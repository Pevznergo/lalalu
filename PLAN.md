# Lalalu Web App Plan

<!-- /autoplan restore point: no prior plan file; initial artifact created 2026-05-06T06:09:48Z -->

## Product

Build `lalalu` as a mobile-ready web application similar in outcome to Bro.Hit: a Russian-language AI song generator where a user describes a gift song, edits lyrics with an assistant, pays for song credits, generates 2 MP3 variants per credit, downloads finished tracks, and can request an instrumental/minus version after a song is ready.

Primary launch market: Russian-speaking users buying birthday gift songs. Later occasions can reuse the same engine, but the MVP optimizes for the birthday flow first.

## Source Notes

- User-provided reference: `https://brohit.ru`.
- Public reference pages observed on 2026-05-06:
  - Bro.Hit homepage claims "2 млн+ создано песен".
  - Third-party Telegram mini app listing describes Bro.Hit as a bot that writes lyrics, music, and MP3 from user story input.
- KIE docs checked on 2026-05-06:
  - Suno API supports async music generation, callbacks, custom mode, title, style, prompt/lyrics, instrumental mode, and models up to V5.
  - KIE Common API exposes account credit checks and temporary download URLs; generated media retention is documented as temporary, so the app must copy finished audio to its own storage.
  - KIE Gemini 2.5 Pro endpoint exposes an OpenAI-compatible `/gemini-2.5-pro/v1/chat/completions` route and JSON/schema style outputs.
- Stripe docs checked on 2026-05-06:
  - Checkout Sessions are the recommended hosted flow for one-time purchases; a server creates a session and redirects the user to its URL.
  - Successful Checkout Sessions reference the customer and successful PaymentIntent; webhooks must drive credit fulfillment.
- NOWPayments docs checked on 2026-05-06:
  - Invoice/payment APIs support fiat-denominated prices, crypto payment URLs, `order_id`, `success_url`, `cancel_url`, and `ipn_callback_url`.
  - IPN callbacks use an IPN secret and `x-nowpayments-sig` header; callbacks are POST requests and must be verified before fulfillment.
- Supabase docs checked on 2026-05-06:
  - Supabase provides Postgres plus Auth.
  - Supabase Auth supports email-based auth, magic links/OTP, social login, and Google OAuth.
  - Supabase Auth integrates with Postgres Row Level Security through JWTs.
- AWS S3 docs checked on 2026-05-06:
  - Objects are private by default.
  - Presigned URLs provide time-limited upload/download access without exposing AWS credentials.

## Core Scope

### User Flows

1. Landing/generator first screen
   - Mobile-first birthday song generator, not a generic music tool.
   - First viewport order:
     1. Recipient prompt: "Кому делаем песню?"
     2. Birthday context: age/date optional, relationship, sender.
     3. Large story field: memories, jokes, traits, wishes.
     4. Three starter cards: "трогательно", "с юмором", "энергично".
     5. Primary CTA: "Собрать черновик песни".
     6. Trust hint: 2 MP3 versions, saved in "Мои песни", one scoped retry policy.
   - No marketing-only first viewport; the generator is the product.

2. Song drafting chat
   - Web chat assistant asks one concrete birthday-specific question at a time.
   - Required prompts: recipient name, sender, relationship, birthday tone, memories/details, words to include, pronunciation notes.
   - Assistant creates a complete first draft quickly: title, lyrics, English style, optional `voice_gender`.
   - User can edit by natural language and then use a dedicated "Редактировать текст" mode for direct lyrics edits.
   - User can finish manually or generation can be suggested after enough context.
   - Review-before-generation screen shows title, lyrics, style, voice/pronunciation notes, credit cost, and warning: "После генерации текст изменить нельзя; можно создать новую версию или использовать один scoped retry, если результат явно сломан."

3. Generation
   - User clicks "Сгенерировать песню".
   - App checks song credit balance.
   - App creates an immutable generation job.
   - One credit produces 2 separate MP3 variants from the same lyrics/style.
   - Results are copied from KIE/Suno URLs into AWS S3.
   - Finished tracks appear in "Мои песни" with status, title, version count, downloads, and "Хочу минусовку".
   - Partial success is visible: if one of two variants succeeds, show it immediately and mark the second as "ещё готовится" or "не получилось, пробуем ещё раз".

4. Instrumental/minus
   - Available only after a vocal track exists.
   - Creates a separate job and records its own cost/credit rule explicitly.
   - UI must not imply finished tracks can be edited.

5. Payments
   - Packages:
     - 1 song: 499 RUB
     - 5 songs: 999 RUB
     - 30 songs: 2999 RUB
   - Stripe Checkout handles card payments.
   - NOWPayments handles crypto payments.
   - Webhooks/IPN credit balance only after trusted paid/succeeded event verification.
   - Purchase history and balance are visible in account.
   - Stripe and NOWPayments have separate pending/succeeded/failed copy. Crypto payments can remain pending longer and must not credit balance until verified IPN arrives.
   - Production payments can remain disabled for the first user cohort. In that mode, packages are hidden or marked "скоро", while admins issue credits through promo codes.

6. Account and recovery
   - MVP auth: email authentication plus Google OAuth through Supabase Auth.
   - Allow anonymous draft creation in browser session.
   - Require email or Google sign-in before payment/generation with copy: "чтобы сохранить песню и прислать результат".
   - Song jobs and balance must survive browser refresh and device change.
   - Support link and policy pages are required before accepting payments.

7. Promo codes
   - Promo codes are generated and managed in the admin cabinet.
   - A user can enter a promo code during registration, on the account page, or on the payment/credits page.
   - A valid promo code grants song credits through the same `credit_ledger` as paid purchases.
   - Promo code redemption must be idempotent and auditable.
   - Admin can create codes with credit amount, max redemptions, per-user limit, expiry, campaign label, active/disabled status, and optional allowed email/domain list.
   - Admin can inspect redemption history by user, code, campaign, date, and generated song count.

8. Admin cabinet
   - Admin login uses Supabase Auth with an `admin` role/claim allowlist.
   - MVP admin screens:
     - Promo code generator and list.
     - Users and balances.
     - Song jobs and provider attempts.
     - Payment events, even if real payments are disabled.
     - Error/support queue.
     - Manual credit adjustment with required reason.
   - Every admin mutation writes an audit event.

9. Reveal/share page
   - Private share link after generation.
   - Shows recipient-focused title, sender message, audio player, two versions, download buttons, and CTA "Создать похожую песню".
   - Owner can revoke/regenerate share link.

### UI State Matrix

| Surface | Loading | Empty | Error | Success | Partial/Pending |
|---|---|---|---|---|---|
| Birthday generator | Draft skeleton, disabled CTA | Starter cards + story field | Validation message by field | Draft created | Anonymous session warning if storage unavailable |
| Draft chat | Assistant typing | First birthday prompt | JSON repair/retry message | Updated lyrics/style visible | User can switch to direct edit mode |
| Review screen | Saving draft | No lyrics/style yet | Missing required fields | Ready to generate | Pronunciation warning unresolved |
| Stripe payment | Redirecting to Checkout | No package selected | Card failed/canceled | Webhook credited balance | Checkout completed but webhook delayed |
| NOWPayments | Creating invoice | No crypto option selected | Invoice expired/underpaid | Verified IPN credited balance | Payment pending/confirming |
| Promo code | Applying code | Empty code field | Invalid/expired/used code | Credits added to balance | Campaign redemption limit reached |
| Admin cabinet | Loading dashboard | No codes/jobs/users | Permission denied or mutation failed | Code/job/user updated | Long-running export/generation stats |
| Generation job | Progress by state | No songs yet | Provider/storage failure with support id | 2 MP3 variants ready | 1 of 2 variants ready, retrying second |
| My Songs | Status polling | "Песен пока нет" | Load failed with retry | Song cards with versions | Job queued/running/partially ready |
| Reveal page | Audio loading | Link revoked/not found | Link expired/private | Player + downloads | One version still processing |
| Minus request | Creating job | No source track | Minus failed | Instrumental ready | Waiting for source track or provider |

## Technical Architecture

Recommended stack for the empty `lalalu` repo:

- Next.js App Router + TypeScript.
- Supabase Postgres.
- Supabase Auth for email login and Google OAuth.
- Prisma for schema and migrations, with raw SQL only for locked job-claim queries.
- AWS S3 for generated audio and derived files.
- KIE as primary provider for Gemini 2.5 Pro and Suno.
- `api.aporto.tech` as fallback provider behind a provider abstraction.
- Stripe Checkout for card payments.
- NOWPayments for crypto payments.
- Sentry or equivalent error tracking plus structured DB event logs.
- DB-backed background worker using `generation_jobs` rows claimed with `FOR UPDATE SKIP LOCKED`; this avoids adding queue infrastructure before the MVP proves demand.

### High-Level Services

```text
Mobile/Web UI
  |
  v
Next.js API routes / server actions
  |
  +--> Supabase Auth/session
  +--> Song draft service --> KIE Gemini 2.5 Pro / Aporto fallback
  +--> Payment service ----> Stripe Checkout + NOWPayments
  +--> Generation queue ---> KIE Suno / Aporto fallback
  +--> Storage service ----> AWS S3
  +--> Observability -----> Sentry + generation_events table
  |
  v
Supabase Postgres
```

## Data Model

Minimum tables:

- `users`: id, email/phone, display name, created_at.
- `anonymous_sessions`: id, browser_session_hash, expires_at, claimed_by_user_id, claimed_at, created_at.
- `credit_ledger`: user_id, delta, reason, package_id, payment_intent_id, generation_id, idempotency_key, created_at.
- `credit_reservations`: user_id, generation_job_id, credits_reserved, status (`reserved`/`captured`/`released`), idempotency_key, created_at, updated_at.
- `song_drafts`: user_id, title, lyrics, style, voice_gender, status, message_count, prompt_version, created_at, updated_at.
- `draft_messages`: draft_id, role, content, structured_song_json, created_at.
- `generation_jobs`: draft_id, user_id, provider, provider_task_id, status, type (`song`/`instrumental`), credit_cost, error_code, error_message, created_at, updated_at.
- `generation_attempts`: generation_job_id, provider, request_hash, provider_task_id, status, provider_cost_consumed, fallback_eligible, terminal_reason, raw_request_json, raw_callback_json, created_at, updated_at.
- `tracks`: generation_job_id, variant_index, title, storage_key, duration_sec, mime_type, size_bytes, provider_source_url_hash, created_at.
- `payment_intents`: user_id, provider (`stripe`/`nowpayments`), provider_payment_id, provider_checkout_id, package_code, amount, currency, status, metadata, idempotency_key, created_at, updated_at.
- `payment_events`: payment_intent_id, provider, provider_event_id, signature_hash, event_type, payload_json, processed_at, created_at.
- `promo_campaigns`: created_by_admin_id, name, description, status, starts_at, expires_at, created_at, updated_at.
- `promo_codes`: campaign_id, code_hash, display_prefix, credits, max_redemptions, per_user_limit, allowed_email_domain, allowed_email_hash, status, expires_at, created_at, updated_at.
- `promo_redemptions`: promo_code_id, user_id, credit_ledger_id, idempotency_key, redeemed_at, metadata_json.
- `admin_audit_events`: admin_user_id, action, target_type, target_id, reason, payload_json, created_at.
- `share_links`: user_id, track_group_id, token_hash, status, expires_at, revoked_at, created_at.
- `provider_events`: provider, job_id, event_type, payload_json, created_at.
- `error_events`: severity, area, user_id, job_id, message, stack_hash, payload_json, created_at.

## Provider Rules

- Provider calls are async and idempotent.
- Persist every outbound provider request, provider task id, callback payload, and normalized status transition.
- Copy KIE media to AWS S3 immediately after provider completion because provider retention is temporary.
- If KIE fails before task creation, retry with KIE then fallback to Aporto.
- If KIE accepts a task and later fails, mark the attempt and decide fallback based on whether credits/provider cost were consumed.
- Never double-charge the user because of callback retries, payment retries, or worker restarts.
- Use `generation_attempts` for every provider call; `generation_jobs` is the user-visible aggregate.
- Credit reservation and job creation happen in one DB transaction. A credit is captured only when generation begins with a provider task or released when the job fails before provider cost is consumed.
- If one of two variants succeeds and the other fails, keep the successful track, retry the failed variant once for free if provider cost policy allows, then show partial success with support action.
- Worker job states: `draft_ready -> awaiting_payment_or_credit -> queued -> claimed -> provider_submitted -> provider_processing -> copying_to_s3 -> quality_check -> partially_ready|ready|failed|needs_support`.
- Invalid transitions are rejected server-side and logged to `provider_events`.

## Payment Rules

- First cohort mode:
  - `ENABLE_REAL_PAYMENTS=false`.
  - Users receive credits only from admin-issued promo codes or manual admin grants.
  - Stripe/NOWPayments code stays implemented behind flags but is not exposed in UI until compliance and payment tests pass.
  - This mode is preferred for early QA because it tests auth, drafting, generation, storage, job recovery, and support without payment/legal blast radius.
- Stripe: create Checkout Session server-side with package metadata, expected amount/currency, user id, and idempotency key. Fulfill only from verified webhook events.
- NOWPayments: create invoice/payment server-side with `order_id`, expected price/currency, success/cancel URLs, and `ipn_callback_url`. Fulfill only after verifying `x-nowpayments-sig` with the IPN secret.
- Never credit balance from client redirect success alone.
- Reject or park provider events if amount, currency, package, user id, or provider status does not match the local `payment_intents` row.
- Duplicate webhook/IPN events are idempotent through `payment_events.provider_event_id` or provider payment id + event type.
- NOWPayments states:
  - `waiting`/`confirming`: show pending, no credits.
  - `confirmed`/`finished`: credit once.
  - `partially_paid`/`underpaid`: show support/pending review, no automatic credits.
  - `expired`/`failed`/`refunded`: no credits, clear recovery CTA.
  - `overpaid`: credit package and log support review for overpayment.

## Promo Code Rules

- Store only hashed promo codes; show raw code only at generation time in admin.
- Promo code generation uses high-entropy random codes, not guessable words.
- Redeeming a code creates one `promo_redemptions` row and one `credit_ledger` row in the same transaction.
- Enforce campaign active window, code active status, max redemptions, per-user limit, optional email/domain restrictions, and idempotency key.
- Invalid, expired, disabled, exhausted, or already-used codes return specific user-facing error codes.
- Admin-created manual balance changes must require a reason and write `admin_audit_events`.
- Promo credits must be distinguishable from paid credits for analytics and abuse review, but spend the same way during generation.

## Storage Rules

- S3 bucket is private.
- Object keys use server-generated namespace: `users/{userId}/songs/{generationJobId}/{variantIndex}.mp3`.
- Server copies provider media to S3; browser never uploads provider output directly.
- Downloads use short-lived presigned URLs.
- Validate content type, size, duration when available, and never trust provider filename or MIME alone.
- Store `provider_source_url_hash`, not raw temporary URLs.
- Add lifecycle policy for orphaned failed-copy temp objects.

## Security Rules

- Supabase Row Level Security protects user-owned rows; server-only service role is used only in API routes/workers.
- Share links use opaque random tokens; store only token hash. Public reveal endpoint can read only the linked track metadata and presigned playback URL.
- Anonymous drafts use `anonymous_sessions`; claiming requires matching browser session and authenticated user. Expired anonymous drafts are deleted or anonymized.
- Model JSON output is never trusted for auth, payment, balance, generation state, or provider selection.
- LLM input/output limits: max prompt length, max lyrics length, schema validation, bounded JSON repair attempts, artist-name normalization, prompt injection fixtures, and moderation checks before generation.
- Webhooks/IPN endpoints reject unsigned events, stale timestamps where provider supports them, replayed event ids, and amount/package mismatches.

## Load And Backpressure

- Provider calls are rate-limited per user and globally.
- Worker concurrency starts low and is config-driven.
- Job claiming uses DB locks and `locked_at` timeout recovery.
- Stuck jobs older than provider SLA are marked `needs_support` or retried by a scheduled reconciler.
- UI uses polling for MVP with exponential backoff; SSE can be added later if polling becomes expensive.
- Indexes required:
  - `generation_jobs(status, locked_at, created_at)`
  - `generation_jobs(user_id, created_at)`
  - `generation_attempts(provider, provider_task_id)`
  - `payment_intents(provider, provider_payment_id)`
  - `payment_events(provider, provider_event_id)`
  - `credit_ledger(user_id, created_at)`
  - `share_links(token_hash)`

## Developer Experience Requirements

Target time-to-hello-world: under 10 minutes from fresh clone to a completed fake birthday song generation.

Local defaults:

- `LYRICS_PROVIDER=mock`
- `MUSIC_PROVIDER=mock`
- `PAYMENT_PROVIDERS=fake`
- `STORAGE_PROVIDER=local`
- `AUTH_PROVIDER=supabase`
- `ENABLE_REAL_PAYMENTS=false`
- `WORKER_CONCURRENCY=1`
- `DISABLE_FALLBACKS=false`
- `WEBHOOK_BASE_URL=http://localhost:3000`

Provider contracts:

- `LyricsProvider`: `createDraft(messages, schemaVersion) -> {title, lyrics, style, voiceGender, raw}`.
- `MusicProvider`: `submitSong({lyrics,title,style,voiceGender,variants}) -> providerTask`, `normalizeCallback(payload) -> normalizedStatus`.
- `PaymentProvider`: `createCheckout(package,user) -> checkoutUrl`, `verifyWebhook(request) -> normalizedPaymentEvent`.
- `StorageProvider`: `putFromUrl(sourceUrl,key,metadata) -> storedObject`, `createDownloadUrl(key,ttl) -> url`.

Required docs:

- `README.md`: quickstart, env, scripts, mock flow.
- `docs/providers.md`: KIE/Aporto contracts, fixtures, fallback rules.
- `docs/payments.md`: Stripe/NOWPayments setup, local fake payments, webhook fixtures.
- `docs/jobs.md`: generation state machine, retries, stuck job recovery.
- `docs/storage.md`: S3 bucket policy, local storage, presigned URLs.
- `docs/errors.md`: error catalog and support ids.
- `docs/testing.md`: unit/integration/E2E/eval commands.
- `docs/deploy.md`: environment variables, migrations, worker deployment.
- `docs/runbook.md`: payment mismatch, provider outage, S3 copy failure, stuck jobs.

Minimum quickstart flow:

```bash
npm install
cp .env.example .env.local
npm run db:setup
npm run seed
npm run dev
npm run worker
npm run smoke:mock-generation
```

The smoke test must create a birthday draft, run fake payment crediting, reserve one credit, complete a fake two-variant generation, store local fake MP3 files, and verify "Мои песни" API returns playable URLs.

## Error Catalog Requirements

Every user-facing error has:

- `code`
- Problem: what failed.
- Cause: what likely caused it.
- Fix/CTA: what the user can do next.
- Retry policy.
- Support severity.
- Logged context fields.

Initial error codes:

| Code | Problem | Cause | Fix/CTA |
|---|---|---|---|
| `DRAFT_JSON_INVALID` | Assistant response could not be parsed | Gemini/Aporto returned invalid JSON | Retry once, then ask user to continue from last saved draft |
| `PAYMENT_SIGNATURE_INVALID` | Payment event rejected | Bad Stripe/NOWPayments signature | Show no user change; alert ops |
| `PAYMENT_AMOUNT_MISMATCH` | Payment event does not match package | Amount/currency/package mismatch | Hold for support review |
| `PROMO_CODE_INVALID` | Promo code cannot be applied | Code is wrong, expired, disabled, exhausted, or already used | Show exact recoverable reason where safe |
| `ADMIN_PERMISSION_DENIED` | Admin action rejected | User lacks admin role/claim | Block action and alert if suspicious |
| `CREDIT_RESERVATION_CONFLICT` | Credit could not be reserved | Concurrent generation or stale balance | Refresh balance and show retry |
| `PROVIDER_SUBMIT_FAILED` | Song generation could not start | KIE/Aporto timeout or rejected request | Retry/fallback, then show support id |
| `PROVIDER_CALLBACK_UNKNOWN` | Callback cannot match job | Missing local attempt or replay | Store event, reconcile, alert ops |
| `S3_COPY_FAILED` | Finished audio could not be saved | Provider URL expired or S3 failure | Retry copy, then mark needs_support |
| `QUALITY_GATE_FAILED` | Generated file is not deliverable | Missing/corrupt/too-short audio | Retry failed variant if policy allows |
| `SHARE_LINK_REVOKED` | Reveal page unavailable | Owner revoked link | Show "ссылка закрыта" |
| `JOB_STUCK` | Song is taking too long | Worker/provider stalled | Show queued/support copy and alert ops |

## Web Prompt V1

Use this as the initial system prompt for the lyric assistant. The app should request JSON schema output from Gemini 2.5 Pro and validate server-side.

```text
Ты — интерактивный генератор персональных песен в веб-приложении lalelu.
Ты дружелюбен, общаешься с пользователем на "ты", естественно и тепло, как хороший друг, который помогает сделать подарок. Пиши просто, с участием и доброжелательностью, без фамильярности.

Ты работаешь в паре с генератором треков: сначала помогаешь пользователю создать текст песни и музыкальное описание, затем веб-приложение по кнопке "Сгенерировать песню" создаст музыку и выдаст готовые MP3.

Правила продукта:
- Готовый трек нельзя переделать. Можно только создать новый трек, и за новую генерацию списывается 1 песня с баланса.
- Одна генерация песни отдаёт 2 отдельные MP3-версии на один текст. За это списывается 1 песня с баланса.
- После готовой песни в интерфейсе появляется действие "Хочу минусовку". Оно создаёт инструментальную версию по отдельному правилу продукта.
- Пакеты: 1 песня за 499₽, 5 песен за 999₽, 30 песен за 2999₽.
- Если пользователь спрашивает про оплату или баланс, объясняй, что баланс и покупка доступны в личном кабинете веб-приложения. Оплатить можно картой через Stripe или криптовалютой через NOWPayments. Не упоминай Telegram-команды.
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

Defaults for MVP:

- Launch geography/compliance: do not enable real payments until Stripe eligibility, NOWPayments compliance, tax handling, privacy policy, terms, refund policy, and data retention are approved.
- Aporto: implement as separate adapter behind contract tests; if compatibility is unknown, ship KIE + mock first and keep Aporto disabled by env.
- Instrumental/minus: separate paid job by default; configurable as free once per paid song if business decides later.
- Email auth: passwordless magic link plus Google OAuth. Email+password can be added later if needed.
- First song policy: paid-only generation with free draft preview. No free full song in MVP unless acquisition tests require it.

## Production Readiness Analysis

Recommended launch sequence:

1. Internal alpha: mock payments, admin promo credits, real KIE/Suno optional, no public traffic.
2. Closed beta: real KIE/Suno, AWS S3, Supabase Auth/Postgres, promo-code credits only, no Stripe/NOWPayments exposed.
3. Paid beta: Stripe/NOWPayments enabled for selected users after legal/compliance/webhook tests pass.
4. Public launch: payments, policies, support, monitoring, abuse controls, and acquisition pages live.

### Required Before Internal Alpha

| Area | Missing | Why It Matters |
|---|---|---|
| Repo scaffold | Next.js app, Prisma schema, worker entrypoint, `.env.example` | Without this, plan cannot be executed or tested locally. |
| Mock providers | Fake lyrics, fake music, fake payments, local storage | Allows full product QA without paid APIs or secrets. |
| Supabase local/dev setup | Migrations, seed, RLS baseline, auth config | Auth and data isolation must be tested from day 1. |
| Admin roles | Admin allowlist/claim strategy | Promo code generation and manual credits are high-risk mutations. |
| Promo codes | Code generation, redemption, audit log | First cohort depends on free credits instead of payments. |
| Credit ledger | Reservation/capture/release transactions | Prevents double-spend and broken balances. |
| Generation worker | State machine, retry, stuck job recovery | Song generation is async and will fail in real use. |
| S3 abstraction | Local storage + AWS S3 adapter | Real generated media must not depend on provider retention. |
| Basic observability | Sentry, structured logs, support id | Debugging generated-song failures without this is painful. |
| Smoke tests | `npm run smoke:mock-generation` | Fast proof that the core loop works end to end. |

### Required Before Closed Beta

| Area | Missing | Why It Matters |
|---|---|---|
| Real KIE fixtures | Gemini and Suno request/callback examples | Provider contracts must match reality before users test. |
| Aporto contract decision | Enabled or explicitly disabled | Fallback cannot be pretend architecture. |
| Quality gate | File count, playable MP3, duration, metadata checks | Users should not receive broken audio. |
| Partial success handling | One-of-two variant UX and retry policy | Real generations will partially fail. |
| Support workflow | Admin job view, retry button, manual credit adjustment | Early users need rescue without DB surgery. |
| Privacy/security pass | RLS tests, share token tests, S3 policy test | User songs and private links are sensitive. |
| Prompt evals | Birthday fixtures, JSON validity, injection tests | The assistant is core product behavior. |
| Rate limits | Per-user draft/generate limits | Promo-code cohorts can still abuse provider spend. |
| Content policy | Moderation and blocked categories | Reduces legal/support risk. |
| Backups | Supabase backup strategy and S3 retention policy | Songs, ledgers, and audit logs are business records. |

### Required Before Paid Beta

| Area | Missing | Why It Matters |
|---|---|---|
| Stripe setup | Account eligibility, products/prices, webhook signing, test mode evidence | Card payments cannot be enabled from redirect success alone. |
| NOWPayments setup | IPN secret, underpaid/expired/confirming fixtures | Crypto payment states are messy and must be reconciled. |
| Terms/refund/privacy | Public legal pages | Required before taking money and processing personal data. |
| Tax/accounting export | Payment and credit ledger export | Finance operations need source of truth. |
| Fraud/abuse controls | Promo abuse, payment mismatch, repeated failed generations | Prevents provider-cost leakage. |
| Customer support SLA | Contact channel, response policy, refund/retry policy | Gift purchases are time-sensitive. |
| Production monitoring | Alerts for payment failures, provider failures, stuck jobs, S3 copy failures | Money and delivery failures need immediate response. |

### Required Before Public Launch

| Area | Missing | Why It Matters |
|---|---|---|
| Real design system | Components, spacing, copy, mobile breakpoints, accessibility | The plan is product-complete but not visually specified. |
| SEO/acquisition pages | Birthday landing pages, examples, share loop analytics | Web-first needs distribution, not just app functionality. |
| Analytics funnel | Draft started, draft completed, payment started, generation completed, share opened | Without funnel data, product iteration is blind. |
| Admin analytics | Promo campaign conversion, cost per generated song, provider failure rate | Free cohort learnings need measurement. |
| Load test | 10x webhook/polling/job traffic | Avoids early launch stalls. |
| Incident runbook | Payment mismatch, provider outage, S3 outage, stuck worker | Operators need concrete actions. |

### Can Be Deferred

| Item | Defer Until |
|---|---|
| Real payments for first users | After closed beta proves generation quality and support load. |
| Telegram/VK bot | After web funnel baseline exists or acquisition demands it. |
| Multi-occasion generator | After birthday flow converts and support issues are known. |
| External queue infrastructure | After DB-backed worker shows lock/contention limits. |
| Advanced audio ML scoring | After deterministic quality gate catches basic failures. |
| Email+password auth | After magic link + Google OAuth friction is measured. |

### Free First Cohort Plan

- Create admin-only campaigns like `BETA_BIRTHDAY_2026`.
- Grant 1-3 credits per invited user through promo codes.
- Require registration before redemption so every free credit is tied to a user.
- Disable public package purchase UI while keeping payment code behind flags.
- Track per-user and per-campaign:
  - draft started
  - draft completed
  - promo redeemed
  - generation started
  - generation completed
  - share link opened
  - support/retry requested
  - user satisfaction/manual notes
- Success threshold before paid beta:
  - 80%+ generations complete without support.
  - 70%+ users find at least one version usable.
  - Median time from prompt start to ready track is acceptable for the promise shown in UI.
  - Support issues are categorizable, not random.
  - Provider cost per usable song fits planned pricing.

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | Phase 0 | Create `PLAN.md` because repo was empty | Mechanical | P6 | `/autoplan` needs a concrete plan artifact to review and edit | Waiting for a pre-existing plan file |
| 2 | Phase 0 | Mark UI scope as yes | Mechanical | P1 | Plan includes web screens, buttons, layout, mobile readiness, account/payment flows, and generated song views | Skipping design review |
| 3 | Phase 0 | Mark DX scope as yes | Mechanical | P1 | Plan includes API integrations, webhooks, provider adapters, worker jobs, operational errors, and developer setup decisions | Skipping DX review |
| 4 | Phase 1 | Run SELECTIVE EXPANSION as default review mode | Mechanical | P2 | Greenfield product benefits from surfacing strategic expansions while preserving the user's requested baseline | Scope reduction by default |
| 5 | Phase 1 | Accept birthday gift song wedge and update infrastructure providers | Mechanical | P6 | User confirmed the strategic premise and corrected storage, payment, database, and auth choices | Keeping the old provider ambiguity |
| 6 | Phase 2 | Add birthday-specific UI flow and state matrix | Mechanical | P1 | Design review found critical ambiguity around first screen, partial success, payment pending, and reveal page states | Generic generator UI |
| 7 | Phase 3 | Add transactional credit reservations and generation attempts | Mechanical | P1 | Money and async provider calls need idempotent, auditable state transitions | Mutable balance and provider_task_id only |
| 8 | Phase 3 | Choose Prisma and DB-backed worker for MVP | Taste | P5 | Prisma is common for Next/Supabase and DB-backed queue avoids extra infra before demand proof | Drizzle or external queue |
| 9 | Phase 3.5 | Add mock-provider quickstart and docs IA | Mechanical | P1 | DX review found real-provider credentials would block local hello world | Real services required for local dev |
| 10 | Product | Add admin-generated promo codes for first cohort | Mechanical | P1 | User wants promo codes at registration and free early testing without payment dependency | Forcing real payments before product QA |
| 11 | Product | Keep real payments disabled for first users | Mechanical | P3 | Promo-code beta tests generation quality, support load, and provider costs before legal/payment blast radius | Charging first users immediately |

### Phase 2 Design Review

Design scope completeness after updates: 8/10. The plan now specifies a birthday-first funnel, first viewport hierarchy, review-before-generation screen, partial generation states, reveal page, auth timing, and payment pending states. Remaining design work before implementation: visual system, exact Russian copy, component specs, and responsive screenshots.

DESIGN DUAL VOICES - LITMUS SCORECARD:

| Dimension | Claude Subagent | Codex | Consensus |
|---|---|---|---|
| First-screen hierarchy | High gap found | N/A | FIXED IN PLAN |
| Birthday wedge propagation | Critical gap found | N/A | FIXED IN PLAN |
| Missing states | Critical gap found | N/A | FIXED IN PLAN |
| Partial success UX | High gap found | N/A | FIXED IN PLAN |
| Reveal/share page | Medium gap found | N/A | FIXED IN PLAN |
| Auth/payment trust | High/medium gaps found | N/A | FIXED IN PLAN |

Pass scores:

| Pass | Score | Notes |
|---|---:|---|
| Information hierarchy | 8/10 | Birthday-first first viewport now specified. |
| State coverage | 8/10 | Matrix covers async generation, payment, storage, reveal, and minus request. |
| Emotional arc | 7/10 | Review and reassurance points added; exact copy still needed. |
| Specificity | 8/10 | Screen-level requirements exist; visual design remains future work. |
| Mobile readiness | 7/10 | Mobile-first stated and hierarchy constrained; needs breakpoint/component specs. |
| Accessibility | 6/10 | Not yet detailed beyond state and flow requirements. |
| Trust/recovery | 8/10 | Auth timing, retry policy, pending payment and partial success are explicit. |

### Phase 3 Engineering Review

Architecture score after updates: 8/10. Critical money/job risks are now in scope: transactional credit reservations, provider attempts, signed payment fulfillment, S3 private storage, share link token hashing, worker locking, and load/backpressure.

#### System Architecture Diagram

```text
Browser / Mobile Web
  |
  +--> Next.js App Router UI
  |      - birthday generator
  |      - draft chat / direct lyrics editor
  |      - review-before-generation
  |      - payment screens
  |      - My Songs / reveal page
  |
  +--> Next.js API routes / server actions
         |
         +--> Supabase Auth
         |      - email magic link
         |      - Google OAuth
         |      - anonymous draft claim
         |
         +--> Supabase Postgres + Prisma
         |      - drafts/messages
         |      - payment_intents/payment_events
         |      - credit_ledger/credit_reservations
         |      - generation_jobs/generation_attempts
         |      - tracks/share_links/provider_events/error_events
         |
         +--> Payment adapters
         |      +--> Stripe Checkout + verified webhooks
         |      +--> NOWPayments invoices + verified IPN
         |
         +--> Provider adapters
         |      +--> KIE Gemini 2.5 Pro
         |      +--> KIE Suno
         |      +--> Aporto fallback
         |      +--> Mock providers for local dev
         |
         +--> Worker loop
         |      - FOR UPDATE SKIP LOCKED job claim
         |      - provider submit/callback normalize
         |      - S3 copy
         |      - quality gate
         |      - stuck job reconciliation
         |
         +--> AWS S3 private bucket
         |      - generated MP3 storage
         |      - presigned playback/download URLs
         |
         +--> Sentry + structured logs
```

#### Generation State Machine

```text
draft_ready
  -> awaiting_payment_or_credit
  -> queued
  -> claimed
  -> provider_submitted
  -> provider_processing
  -> copying_to_s3
  -> quality_check
  -> ready

quality_check -> partially_ready -> ready
quality_check -> failed
claimed/provider_processing/copying_to_s3 -> needs_support
queued/claimed stale -> queued via reconciler OR needs_support after SLA

Invalid transitions are rejected and logged.
```

#### Data Flow With Shadow Paths

```text
User story input
  -> validate birthday fields
  -> draft assistant JSON
  -> schema validate / repair once
  -> save draft/messages
  -> review screen
  -> payment or credit check
  -> transaction: reserve credit + create generation_job
  -> worker submits provider attempt
  -> provider callback/status
  -> copy media to S3
  -> quality gate
  -> tracks + reveal link
  -> My Songs / reveal page

Shadow paths:
  nil/empty input -> field errors
  invalid JSON -> retry/repair then DRAFT_JSON_INVALID
  zero credits -> payment screen
  duplicate generate click -> idempotency key prevents double reservation
  webhook replay -> payment_events prevents double credit
  provider timeout -> retry/fallback
  expired provider URL -> S3_COPY_FAILED retry
  one variant failed -> partially_ready
```

#### Error & Rescue Registry

| Codepath | What Can Go Wrong | Error Code/Class | Rescued | Rescue Action | User Sees |
|---|---|---|---|---|---|
| Draft assistant | Invalid JSON | `DRAFT_JSON_INVALID` | Yes | Repair once, then preserve last draft | "Не удалось обновить черновик, попробуй ещё раз" |
| Stripe webhook | Bad signature | `PAYMENT_SIGNATURE_INVALID` | Yes | Reject, alert ops | No balance change |
| NOWPayments IPN | Amount mismatch | `PAYMENT_AMOUNT_MISMATCH` | Yes | Hold for support | "Платёж проверяется" |
| Generate action | Concurrent spend | `CREDIT_RESERVATION_CONFLICT` | Yes | Transaction rollback, refresh balance | "Баланс изменился, обнови страницу" |
| Provider submit | Timeout/reject | `PROVIDER_SUBMIT_FAILED` | Yes | Retry/fallback, then support | "Не удалось начать генерацию" |
| Provider callback | Unknown task | `PROVIDER_CALLBACK_UNKNOWN` | Yes | Store event, reconcile | No immediate user change |
| S3 copy | Expired URL/S3 fail | `S3_COPY_FAILED` | Yes | Retry copy, then needs_support | "Песня готовится дольше обычного" |
| Quality gate | Missing/corrupt MP3 | `QUALITY_GATE_FAILED` | Yes | Retry failed variant if allowed | Partial/failed variant state |
| Reveal page | Revoked token | `SHARE_LINK_REVOKED` | Yes | Return 404-style reveal state | "Ссылка закрыта" |
| Worker | Stuck job | `JOB_STUCK` | Yes | Reconciler retry/support alert | "Мы ещё работаем над песней" |

#### Failure Modes Registry

| Codepath | Failure Mode | Rescued | Test | User Sees | Logged |
|---|---|---|---|---|---|
| Payment webhook | Replay event double-credits | Yes | Yes | No duplicate credit | Yes |
| Credit reservation | Two tabs spend one credit | Yes | Yes | One job starts, one refreshes balance | Yes |
| Provider fallback | KIE accepted then failed | Yes | Yes | Retry/support state | Yes |
| S3 copy | Provider URL expired | Yes | Yes | Delayed/support state | Yes |
| Share link | Token guessed | Yes | Yes | Not found | Yes |
| LLM output | Prompt injection changes state | Yes | Yes | State unchanged | Yes |
| Worker | Crash after provider submit | Yes | Yes | Job continues after callback/reconcile | Yes |
| NOWPayments | Underpaid invoice | Yes | Yes | Pending support review | Yes |

Critical gaps remaining: compliance/tax/refund approval before real payments, real KIE/Aporto callback fixtures, real Stripe/NOWPayments webhook fixtures.

#### Deployment Sequence

```text
1. Create Supabase project and apply schema/RLS.
2. Create private S3 bucket and lifecycle policy.
3. Deploy app with mock providers disabled only after secrets are present.
4. Deploy worker with low concurrency.
5. Configure Stripe webhook and NOWPayments IPN.
6. Run smoke tests with fake providers.
7. Run staging tests with real provider sandbox/test credentials.
8. Enable real payments behind env flag.
```

Rollback: disable `ENABLE_REAL_PAYMENTS`, pause worker, keep read-only My Songs/reveal pages online, and reconcile pending jobs manually from `generation_jobs` and provider dashboards.

### Phase 3.5 DX Review

DX score after updates: 8/10. The plan now includes provider contracts, mock-provider defaults, docs IA, quickstart commands, error catalog requirements, and test fixtures.

DX DUAL VOICES - CONSENSUS TABLE:

| Dimension | Claude Subagent | Codex | Consensus |
|---|---|---|---|
| Getting started < 10 min | Critical gap found | N/A | FIXED IN PLAN |
| API/provider naming | High gap found | N/A | FIXED IN PLAN |
| Error messages actionable | High gap found | N/A | FIXED IN PLAN |
| Docs findable and complete | High gap found | N/A | FIXED IN PLAN |
| Escape hatches | High gap found | N/A | FIXED IN PLAN |
| Dev environment friction-free | High gap found | N/A | FIXED IN PLAN |

Developer journey map:

| Stage | Developer Action | Target |
|---|---|---|
| 1 | Clone repo | < 1 min |
| 2 | Install deps | < 2 min |
| 3 | Copy `.env.example` | < 30 sec |
| 4 | Run DB setup/seed | < 2 min |
| 5 | Start app | < 1 min |
| 6 | Start worker | < 1 min |
| 7 | Run mock smoke test | < 2 min |
| 8 | Inspect generated fake song | < 1 min |
| 9 | Switch to real providers | Follow provider docs, opt-in only |

Developer empathy narrative: "I can run the product without Stripe, KIE, Aporto, NOWPayments, Supabase cloud, or AWS credentials. I can see a birthday draft, fake payment, fake generation, and finished song locally before I touch real secrets."

### Cross-Phase Themes

**Theme: differentiation through gift workflow, not raw generation** — CEO and Design both flagged generic generator risk. Fixed by birthday-first wedge, reveal page, and quality/retry policy.

**Theme: async money/job correctness** — Eng and DX both flagged webhooks, ledgers, workers, and provider attempts. Fixed by transactional reservations, event idempotency, attempt table, and mock/local test plan.

**Theme: trust states matter** — Design and Eng both flagged partial success, payment pending, and immutable finished tracks. Fixed by review-before-generation, partial state UI, and explicit retry/support policy.

### NOT In Scope

| Item | Rationale |
|---|---|
| Full Telegram/VK bot | Important acquisition experiment, but separate from web MVP. |
| All occasions at launch | Birthday wedge gives clearer copy, templates, and conversion. |
| Free full song | Keep paid-only generation until unit economics are known. |
| External queue service | DB-backed worker is enough for MVP and reduces infra. |
| Email+password auth | Magic link + Google OAuth is simpler for launch. |
| Full audio ML quality scoring | Start with deterministic file checks; add richer scoring later. |

### Completion Summary

```text
+====================================================================+
|            /autoplan REVIEW - COMPLETION SUMMARY                   |
+====================================================================+
| Mode selected        | SELECTIVE EXPANSION                         |
| Phase 1 CEO          | 6/6 consensus risks found, premise confirmed |
| Phase 2 Design       | 8/10 after fixes, 12 findings folded in      |
| Phase 3 Eng          | 8/10 after fixes, 15 findings folded in      |
| Phase 3.5 DX         | 8/10 after fixes, 9 findings folded in       |
| Architecture         | Diagram + state machine written              |
| Error/rescue registry| 10 codepaths, 0 unresolved critical gaps      |
| Failure modes        | 8 mapped, tests required                      |
| Test plan artifact   | docs/autoplan/lalalu-test-plan-20260506.md   |
| Deferred scope       | 6 items written                               |
| Taste decisions      | Prisma + DB-backed worker for MVP             |
| User challenges      | 0 unresolved after premise confirmation       |
+====================================================================+
```

## GSTACK REVIEW REPORT

### Phase 0 Intake

Plan summary: `lalalu` is a mobile-ready Russian web app for personalized AI song gifts. The user drafts lyrics with a JSON-only assistant powered by Gemini 2.5 Pro through KIE, generates two MP3 variants through Suno/KIE, stores durable results in AWS S3, tracks balance and jobs in Supabase Postgres, uses Supabase Auth with email and Google OAuth, accepts payments through Stripe Checkout and NOWPayments, and uses `api.aporto.tech` as fallback provider.

Repository context:

- `/Users/igortkachenko/Downloads/lalalu` was empty at intake.
- No `.git` repository exists yet, so base branch fallback is `main` and git diff/log context is unavailable.
- No existing `CLAUDE.md`, `TODOS.md`, source files, migrations, tests, or design system were present.
- Restore point: `docs/autoplan/unknown-autoplan-restore-20260506-060948.md`.

Scope detection:

- UI scope: yes. The plan includes screens, forms, buttons, account/payment flows, mobile readiness, "Мои песни", and post-generation actions.
- DX scope: yes. The plan includes provider APIs, webhooks, background workers, payment callbacks, schema/migration choices, and operational debugging.

### Phase 1 CEO Review

#### 0A. Premise Challenge

| Premise | Evaluation | Risk | Decision |
|---|---|---|---|
| Users want a web version of a Bro.Hit-like song generator | Unproven. The reference market appears Telegram-native or Telegram-adjacent, while the plan assumes web-first. | High | Needs human confirmation before rewriting the wedge. |
| The buyer segment is "Russian-speaking users buying personalized songs" | Too broad. Birthdays, weddings, love confessions, and casual entertainment have different urgency, CAC, and quality bars. | High | Narrow to one first buyer unless user deliberately wants broad launch. |
| Gemini 2.5 Pro + Suno through KIE is enough product differentiation | Weak. Provider access is available to competitors and direct users. | High | Differentiation must come from gift workflow, templates, quality gates, reveal/sharing, or acquisition. |
| Two MP3 variants per credit are sufficient quality control | Risky. Gift buyers judge emotional usability, pronunciation, names, and cringe level, not just quantity. | High | Add preview/retry/quality-gate policy before launch. |
| "Finished track cannot be edited" is acceptable | Operationally convenient but may hurt trust for high-stakes gifts. | High | Keep cost control, but add one scoped satisfaction retry or pre-generation checkpoints. |
| Stripe + NOWPayments + Supabase + AWS are the right launch infrastructure | Plausible for international card/crypto payments and fast app build, but Stripe availability, crypto compliance, tax handling, and user geography are launch gates. | Medium | Keep as target architecture; do not treat payment launch as solved. |
| Aporto fallback can be abstracted behind provider interface | Plausible but unverified. Compatibility may differ by endpoint, auth, callbacks, and media retention. | Medium | Provider adapter must start with contract tests and one normalized job lifecycle. |

Outcome: The technical problem is clear, but the business problem is still underspecified. The sharpest unresolved premise is whether `lalalu` should be a generic web clone or a narrower gift-commerce product with a clear wedge.

#### 0B. Existing Code Leverage

No existing code exists in this repo. Every sub-problem is greenfield:

| Sub-problem | Existing code | Reuse decision |
|---|---|---|
| Web UI and mobile layout | None | Build from scratch with a documented design system. |
| Drafting assistant | None | Build prompt + schema validation + prompt eval fixtures from day 1. |
| KIE Gemini integration | None | Build provider adapter and contract tests. |
| KIE Suno generation | None | Build async job lifecycle and callback handler. |
| Aporto fallback | None | Build only after verifying endpoint compatibility. |
| Stripe payments | None | Build idempotent Checkout Session create + webhook processing. |
| NOWPayments payments | None | Build invoice create + verified IPN processing. |
| Credits/balance | None | Use ledger model, not mutable-only balance. |
| AWS S3 storage | None | Copy provider files immediately after completion and serve via presigned URLs. |
| Error tracking | None | Add Sentry plus DB provider events. |

#### 0C. Dream State Mapping

```text
CURRENT STATE
  Empty repo + product brief + adapted assistant prompt
    |
    v
THIS PLAN
  Birthday-focused mobile web app that drafts a personalized song, charges
  through Stripe/NOWPayments, generates two MP3 variants through KIE/Suno,
  stores results durably in AWS S3, and exposes account/history/support flows.
    |
    v
12-MONTH IDEAL
  A personalized gift-song engine with clear acquisition wedge, high emotional
  quality, occasion templates, pronunciation controls, shareable reveal pages,
  retries/refunds policy, provider-quality scoring, repeatable paid conversion,
  and operational confidence around payments, callbacks, storage, and support.
```

Dream state delta: the current plan moves toward technical delivery, but not far enough toward distribution, quality, trust, and repeat purchase. The plan needs a first-buyer wedge and measurable quality bar before implementation begins.

#### 0C-bis. Implementation Alternatives

| Approach | Summary | Effort | Risk | Pros | Cons | Completeness |
|---|---|---:|---|---|---|---:|
| A. Web MVP, paid after draft | Build mobile web generator, draft chat, Stripe/NOWPayments, KIE/Suno generation, S3 storage, Supabase Auth recovery. | M | Medium | Matches user request; enough infrastructure to charge; clean foundation. | May overbuild before proving acquisition; generic positioning. | 7/10 |
| B. Gift-wedge MVP with reveal/share loop | Same core generation, but narrow first launch to one buyer, e.g. birthday gift song, with guided templates, recipient story capture, reveal page, share CTA, and one scoped retry. | M | Medium | Better differentiation; stronger conversion story; quality gates fit gift use. | Requires choosing a wedge now; slightly more product/design work. | 9/10 |
| C. Fast validation funnel before full app | Build landing + concierge/manual generation + Stripe Payment Link/NOWPayments invoice + S3 delivery, then automate after demand signal. | S | Medium | Fastest learning; avoids full auth/ledger/worker upfront. | Less scalable; manual ops; not the requested full web app. | 5/10 |

Recommendation: Approach B. It keeps the requested web app, but reframes it from "song generator wrapper" to "gift conversion workflow"; that is the smallest strategic change with the highest chance of mattering.

#### 0D. SELECTIVE EXPANSION Scan

Complexity check: the plan introduces more than 8 modules and at least 6 integrations or service boundaries. This is acceptable for a paid generation product only if the first release is constrained by a buyer wedge and a strict job lifecycle. Without that, the architecture is doing more work than the product strategy.

Minimum set that achieves the stated goal:

- Mobile-first generator screen.
- Draft assistant with validated JSON output.
- User/session identity that survives payment and delivery.
- Credit ledger and Stripe/NOWPayments webhook/IPN processing.
- Async generation job with two variants and durable storage copy.
- "Мои песни" status/result page.
- Error/event logging sufficient for support.

Expansion candidates for final gate:

| # | Candidate | Effort | Risk | Recommendation |
|---|---|---:|---|---|
| E1 | Narrow launch wedge to birthday gift songs first | S | Low | Add. It improves positioning and does not block later occasions. |
| E2 | Add shareable reveal page for finished song | M | Low | Add. It creates a viral loop and makes web-first more defensible. |
| E3 | Add one scoped satisfaction retry policy | M | Medium | Add with strict limits. It reduces refund/support pain for gifts. |
| E4 | Add quality gate before user delivery | M | Medium | Add. At minimum validate file count, duration, URLs, and metadata; later add LLM/audio checks. |
| E5 | Add Telegram/VK acquisition experiment to TODO, not MVP scope | S | Low | Defer. It is strategically important but separate from web build. |

#### 0E. Temporal Interrogation

| Implementation moment | Decision needed now |
|---|---|
| Hour 1 foundations (CC+gstack: ~5-10 min) | Choose wedge, auth timing, package semantics, provider abstraction boundary, and DB choice. |
| Hour 2-3 core logic (CC+gstack: ~10-20 min) | Define generation job state machine, ledger idempotency rules, and callback retry behavior. |
| Hour 4-5 integrations (CC+gstack: ~20-40 min) | Confirm KIE/Aporto callback compatibility, Stripe webhook verification, NOWPayments IPN verification, and AWS S3 signed URL strategy. |
| Hour 6+ polish/tests (CC+gstack: ~30-60 min) | Decide quality gates, retry/refund policy, mobile states, and support/admin diagnostics. |

#### 0F. Mode Selection

Autoplan selected `SELECTIVE EXPANSION`: the user's requested scope remains the baseline, but high-leverage expansions are surfaced and reviewed. No user-facing scope change is applied until the premise gate and final approval gate.

#### CEO Dual Voices

CLAUDE SUBAGENT (CEO - strategic independence):

- Critical: the product frame is too narrow. A Bro.Hit-like generator is a commodity wrapper; a better frame is personalized gift experience.
- Critical: channel premise is assumed. The visible market is Telegram-first; validate web acquisition before heavy build.
- High: differentiation is weak because KIE/Suno/Gemini are accessible infrastructure.
- High: full auth, ledgers, storage, provider abstraction, and policy pages before demand proof may be a 6-month regret.
- High: pricing and emotional quality premises are unproven.
- Medium: legal/payment readiness and alternatives need more work.

CODEX SAYS (CEO - strategy challenge):

- The plan assumes "Bro.Hit, but web" is a valid wedge.
- Primary market is too broad to guide acquisition or UX.
- No acquisition strategy exists.
- Web-first decision is unproven against Telegram-native behavior.
- Account durability may be overbuilt before preview/paywall validation.
- Pricing lacks unit economics, refund risk, and support assumptions.
- No quality threshold is defined.
- "Finished tracks cannot be edited" may damage trust.
- Provider dependence is a business risk, not just an engineering risk.

CEO DUAL VOICES - CONSENSUS TABLE:

| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| Premises valid? | Partly assumed | Partly assumed | CONFIRMED RISK |
| Right problem to solve? | Reframe to gift experience | Reframe away from clone | CONFIRMED RISK |
| Scope calibration correct? | Overbuilt before validation | Overbuilt before demand proof | CONFIRMED RISK |
| Alternatives sufficiently explored? | No | No | CONFIRMED RISK |
| Competitive/market risks covered? | No | No | CONFIRMED RISK |
| 6-month trajectory sound? | Risk of polished wrapper | Risk of strategic underdetermination | CONFIRMED RISK |

#### Phase 1 Premise Gate

The one decision `/autoplan` cannot auto-decide: should the plan remain a broad Bro.Hit-like web app, or should it be reframed before design/engineering review?

Confirmed direction: reframe to `birthday gift song web MVP` with shareable reveal page, quality gate, and one scoped retry policy. Use Supabase Postgres/Auth, AWS S3, Stripe Checkout, NOWPayments, KIE primary, and Aporto fallback.
