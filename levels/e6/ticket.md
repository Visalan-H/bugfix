# HR-204: Directory search misbehaves

`GET /users/search?q=&limit=`

* Match: name **starts with** `q`, case-insensitive. `q` is trimmed. Missing/empty `q` → everyone.
* Sorted by name A→Z.
* `limit` default **5**, max **20** (bigger values are capped, not errors).
* Response: array of `{ name, team }`.
