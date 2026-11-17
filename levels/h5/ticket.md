# CINE-99: Double-booked seats

Show `s1` has seats `A1`–`A5`. Header `x-user-id`. Holds last **5 minutes**.

| Method | Path | Behaviour |
|---|---|---|
| `POST` | `/shows/:id/holds { seats }` | All-or-nothing. **201** `{ holdId }`. Any seat unavailable → **409** and **no** seat changes |
| `POST` | `/holds/:holdId/confirm` | **200** → seats `booked`. Hold expired → **410** |
| `GET` | `/shows/:id/seats` | `[{ seat, status }]` where expired holds show as `free` |

`memdb.findOneAndUpdate` checks and changes a row in ONE step, so two requests can't both get in. Tests move time with `src/clock.js`.
