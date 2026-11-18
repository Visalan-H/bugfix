# CAT-311: Catalog pagination is broken

`GET /products` powers the storefront grid. QA reports that **page 1 is missing products**, **page 2 shows everything**, and **price sorting does nothing**.

## How it should work
`GET /products?page=&limit=&sort=&category=`

* `page` is **1-based**, default `1`. `limit` default `3`.
* `sort`: `price_asc` | `price_desc`. Omitted means catalog order (p1 … p7).
* `category` filters exactly.
* Response: `{ data, page, limit, total }`. `total` = count **after** filtering, **before** paging. `page` and `limit` are numbers.

Make `tests/catalog.test.js` pass, then Submit.
