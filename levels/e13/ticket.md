# KIDS-2: Family profiles validation

`POST /profiles { name, age, email, tags? }` → **201** or **400** `{ errors: [...] }`

* `name`: non-empty after trim
* `age`: **integer 0–120** (0 is valid: infant profiles exist)
* `email`: the whole value must look like `x@y.z` (no spaces)
* `tags`: optional; if present, an array of **at most 5 strings**
