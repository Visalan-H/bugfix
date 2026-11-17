# DATA-8: Dashboard chart looks broken

`GET /stats/daily?from=YYYY-MM-DD&to=YYYY-MM-DD` (both days included, UTC) →
`{ days: [{ day, sessions, avgSec }], overallAvgSec }`

* One entry for **every** day in the range, in order, `day` formatted `YYYY-MM-DD`. Days without sessions → `sessions: 0, avgSec: 0`.
* `avgSec` = that day's mean session duration, rounded to an integer.
* `overallAvgSec` = mean over **all sessions** in the range, rounded.

Sessions come from `src/sessions.js`.
