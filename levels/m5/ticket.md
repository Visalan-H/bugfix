# BANK-404: Money is disappearing

`POST /transfers { from, to, amount }` (header `x-user-id`)

* `amount` must be a number > 0 → else **400**. `from === to` → **400**.
* Caller must own `from` → else **403**.
* Unknown `from`/`to` → **404**. Not enough balance → **409**.
* On any error, **no balance changes**.
* `GET /accounts/:id` → `{ id, owner, balance }`

Seed: `acc-a` (owner u1, ₹1000), `acc-b` (owner u2, ₹500).
