# CART-12: Cart totals are wrong

## API (header `x-user-id`)
| Method | Path | Behaviour |
|---|---|---|
| `POST` | `/cart/items` `{ sku, qty }` | **201** + cart summary. Same SKU again → quantities merge into one line. Unknown SKU → **404**, bad qty → **400** |
| `GET` | `/cart` | `{ items, subtotal, discount, total }`. Empty cart → all zero |
| `POST` | `/cart/coupon` `{ code }` | Apply coupon (case-insensitive). Unknown → **404** |

`SAVE10` = 10% off the subtotal.
