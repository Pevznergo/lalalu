# Jobs

Generation jobs are DB-backed for MVP.

State machine:

```text
queued -> claimed -> provider_submitted -> provider_processing
  -> copying_to_s3 -> quality_check -> ready
                                |-> partially_ready
                                |-> failed
                                |-> needs_support
```

Rules:

- Create job and credit reservation in one transaction.
- Capture credit after provider task starts.
- Release reservation if job fails before provider cost is consumed.
- Every provider request creates a `generation_attempts` row.
- Worker claims jobs with DB locking. Raw SQL may be needed for `FOR UPDATE SKIP LOCKED`.
- Stale locked jobs are reconciled by scheduled worker.
