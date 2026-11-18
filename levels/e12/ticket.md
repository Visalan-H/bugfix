# WH-14: Low-stock report misses items

`GET /reports/low-stock?threshold=` → `{ items, totalUnits }`

* Items with `stock <= threshold`, sorted by stock ascending. Default threshold **5**. `threshold=0` → only out-of-stock items.
* `totalUnits` = sum of stock of the listed items (a number).
* `stock` in `inventory.js` comes from a CSV import and stays a string in the data. Respond with whatever you like for `stock`, but `totalUnits` must be a number.
