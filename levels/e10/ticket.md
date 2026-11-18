# FLAG-9: Flags leak to users who shouldn't see them

`GET /flags/:name?userId=` → `{ flag, enabled }`

* A flag is on for a user if it's **enabled** and the user's bucket (0–99, stable per user) is **below** `rollout`.
* `enabled` may arrive as a boolean or the strings `'true'`/`'false'` (it comes from env config).
* Unknown flag → `{ enabled: false }` (200, never an error).
