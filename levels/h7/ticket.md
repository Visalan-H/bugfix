# QUEUE-4: Duplicate emails sent

| Method | Path | Behaviour |
|---|---|---|
| `POST` | `/jobs { type }` | **201** queued |
| `POST` | `/workers/:w/claim` | Claim the **oldest** available job → **200** job (status `running`, lease 30 s). None → **204** |
| `POST` | `/workers/:w/jobs/:id/complete` | Only the worker holding it → **200**. Else **409** |

A job is available if it's `queued`, or `running` with an **expired** lease. Every job must be claimed by exactly one worker at a time.
