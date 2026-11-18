# HOOK-5: Webhooks retry storm

| Method | Path | Behaviour |
|---|---|---|
| `POST` | `/deliveries` | **201** `{ _id, attempts: 0, status: 'pending' }` |
| `POST` | `/deliveries/:id/fail` | Record a failed attempt → `{ attempts, status, nextRetryMs }` |
| `POST` | `/verify { payload, signature }` | `{ valid }`. Hex signature, **case-insensitive** |

* Retry delay after the n-th failure: `1000 × 2^(n−1)` ms, **capped at 5000**.
* After the **5th** failure: `status: 'dead'`, `nextRetryMs: null`.
