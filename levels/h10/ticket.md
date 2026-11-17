# CRM-12: Import mangles customer files

`POST /import { csv }` → `{ imported, skipped, errors: [{ line, reason }] }`; `GET /customers` lists imported rows.

* Header: `name,email,amount`. Fields may be quoted (`"Shah, Ankit"`); `""` inside quotes is a literal quote.
* `amount` may contain thousands separators (`"1,200"`). Non-numeric → error row.
* `line` = the **file** line number (header = line 1).
* Blank lines are ignored. Repeated emails (case-insensitive) → counted in `skipped`, first one wins.
