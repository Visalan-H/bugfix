# GW-512: Rate limiter is broken in prod

`GET /api/quote` is limited to **5 requests per client per 60 s** (sliding window). Each client sends `x-api-key`.

Reports: **abusive clients aren't limited at all**, but once someone does get limited, **every customer gets 429s**. And clients are told to wait **hours**.

## Rules
* Missing `x-api-key` → **401**.
* Requests from the last **60 s** count. A request exactly 60 s old no longer counts.
* Over the limit → **429** with `Retry-After` = **seconds** (rounded up) until the oldest counted request expires.
* Rejected requests do **not** count toward the limit.
* Limits are **per key**.

Tests control time with `src/lib/clock.js`.
