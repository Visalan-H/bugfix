# SRCH-50: Filters return wrong products

`GET /items?minPrice=&maxPrice=&brand=&page=&size=` → `{ total, page, items }`

* `minPrice` and `maxPrice` include the exact value. `brand` must match exactly, but capitals don't matter.
* `page` ≥ 1 (default 1), `size` default 3. Invalid page → **400**.
* `total` = all matches (before paging). Items in catalog order.
