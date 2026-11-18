# GROW-3: Referral abuse

`POST /signup { email, referralCode? }` → **201** `{ email, referredBy }`

* Duplicate email (case-insensitive) → **409**, and **no** reward.
* Valid code (case-insensitive) → referrer gets ₹100, at most **3** rewards ever.
* Unknown code → ignored (signup still succeeds, `referredBy: null`).

`GET /referrers/:code` → `{ rewards, balance }`. Seed: `RAVI100` with 2 rewards already (₹200).
