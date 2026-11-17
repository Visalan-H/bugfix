# SHIP-55: Customers overcharged for delivery

`POST /shipping/quote { weightKg, zone, orderTotal }` → `{ fee }`

* Base fee: `local` ₹40 · `regional` ₹60 · `national` ₹90. Unknown zone → **400**
* + ₹20 per **started** kg above 1 kg (1.2 kg → 1 extra kg, 2.2 kg → 2)
* Orders of **₹499 or more** ship free
* `weightKg` must be > 0 → else **400**
