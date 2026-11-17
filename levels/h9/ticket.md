# SEC-21: Auth bypass report

Tokens: `base64url(JSON payload) + "." + signature`, payload `{ sub, role, exp }` (`exp` = **unix seconds**). `src/token.js` makes them (it's correct).

| Path | Who |
|---|---|
| `GET /health` | anyone |
| `GET /me` | any valid token → `{ id, role }` |
| `GET /admin/stats` | valid token **and** the user's **current DB role** is `admin` → else **403** |

Missing/invalid/expired token → **401**. Clock is frozen (tests move it).
