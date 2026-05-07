# Storage

MVP local storage is used by default.

```env
STORAGE_PROVIDER=local
```

AWS S3 production rules:

- Private bucket.
- Server-side copy from provider URL.
- Key format: `users/{userId}/songs/{generationJobId}/{variantIndex}.mp3`.
- Short-lived presigned download URLs.
- Validate MIME, size, and duration where possible.
- Store hashes of provider URLs, not raw temporary URLs.
- Add lifecycle cleanup for orphaned failed-copy objects.
