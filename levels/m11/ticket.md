# DRIVE-3: Quota is wrong

Quota: **1024 KB per user**. Header `x-user-id`.

| Method | Path | Behaviour |
|---|---|---|
| `PUT` | `/files/:name { sizeKb }` | Create or **replace** a file. **201**. Would exceed quota → **413** (nothing changes). Exactly 1024 is OK |
| `DELETE` | `/files/:name` | **204**, frees its space. Unknown → **404** |
| `GET` | `/usage` | `{ usedKb, quotaKb }` |
