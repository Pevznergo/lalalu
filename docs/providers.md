# Providers

Provider contracts live in `src/core/types.ts`.

## LyricsProvider

```ts
createDraft(messages, schemaVersion) -> { title, lyrics, style, voiceGender, raw }
```

Default: `mock`.

Real adapters to add:

- KIE Gemini 2.5 Pro
- Aporto fallback if contract fixtures match

## MusicProvider

```ts
submitSong({ lyrics, title, style, voiceGender, variants }) -> providerTask
normalizeCallback(payload) -> normalizedStatus
```

Default: `mock`.

Real adapters to add:

- KIE Suno
- Aporto fallback if it supports the same lifecycle

## Required Fixtures Before Enabling Real Providers

- Successful Gemini JSON output.
- Malformed Gemini JSON output.
- Suno submit accepted.
- Suno callback with 2 tracks.
- Suno callback with 1 failed variant.
- Provider failure after accepted task.
- Expired media URL.
