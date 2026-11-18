# LNK-7: Short links misbehave

| Method | Path | Behaviour |
|---|---|---|
| `POST` | `/links` `{ url }` | **201** `{ code, url }`. `code` is **6** chars. `url` must start with http(s):// → else **400** |
| `GET` | `/:code` | **302** redirect to the url and count a visit. Unknown → **404** |
| `GET` | `/links/:code/stats` | `{ code, visits }` |
