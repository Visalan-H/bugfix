# PERF-9: Cache made things worse

`GET /products?page=` → `{ page, items: [{ name, price, priceWithGst }] }` (2 per page, `priceWithGst = round(price × 1.18)`; `price` is the base price and must never change)

`POST /products { name, price }` → **201**. New products appear in the list straight away.

`GET /cache/stats` → `{ hits, misses }`. Cache TTL **30 seconds**. Tests move time with `src/clock.js`.
