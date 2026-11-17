# PAY-1337: Oversold inventory & double charges

Finance found **orders for stock we didn't have**, **customers charged twice** after a network retry, and **totals that are off by paise**.

## Rules
* `POST /orders` `{ items: [{ productId, qty }] }`, header `x-user-id`.
* All-or-nothing: if any line fails (unknown product **404**, bad qty **400**, not enough stock **409**), **no stock changes**.
* Never sell more than `stock`, even with concurrent requests.
* `total` = Σ price × qty, rounded to 2 decimals.
* Optional `Idempotency-Key` header (a unique id the app sends so retries are safe): a retry with the same key returns the **same order** (**200**) and doesn't touch stock. Without a key, every request is a new order (**201**).
* `GET /products/:id` → product with current `stock`.

## Seed stock
`p-echo` Echo Dot ₹49.99 × 5 · `p-cable` USB-C Cable ₹9.99 × 2 · `p-kindle` Kindle ₹139.99 × 1
