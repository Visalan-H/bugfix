# PROMO-21: Coupons rejected / over-applied

`POST /checkout { code, orderTotal }` (header `x-user-id`) → `{ discount, total }`. Rejections → **400** with a reason.

| Code | Rule |
|---|---|
| `WELCOME50` | ₹50 off, min order **₹300** (₹300 itself is OK), **once per user**, valid until the end of 2026-12-31 (UTC) |
| `BIG20` | 20% off, discount capped at **₹200**, valid until 2026-12-31 |
| `SUMMER20` | expired (2026-06-30) |

A successful checkout records a redemption. The clock is frozen at 2026-11-17 (tests can move it).
