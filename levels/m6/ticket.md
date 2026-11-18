# CLINIC-12: Booking says 'slot taken' when it isn't

Times are **minutes since midnight** (600 = 10:00). Intervals are `[start, end)`: an appointment ending at 630 and one starting at 630 don't clash.

| Method | Path | Behaviour |
|---|---|---|
| `POST` | `/appointments { doctorId, start, end }` | **201**. Clash with the **same doctor's** booked appointment → **409**. Bad interval → **400** |
| `POST` | `/appointments/:id/cancel` | **200**, frees the slot |
