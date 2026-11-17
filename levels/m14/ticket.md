# VOTE-2: Polls are rigged (accidentally)

| Method | Path | Behaviour |
|---|---|---|
| `POST` | `/polls/:id/vote { option }` | **201**. One vote per user → **409**. Unknown option → **400**. Closed → **409** |
| `GET` | `/polls/:id/results` | `{ total, results: [{ option, votes, percent }] }` in poll option order. `percent` rounded to the **nearest** integer; 0 votes → 0 |

Header `x-user-id`. Seed: `lunch` (options `yes`, `no`, closes 2026-12-01), `old` (closed 2026-01-01). Clock frozen at 2026-11-17.
