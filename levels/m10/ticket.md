# SAAS-1: Companies can see each other's projects

Many companies (tenants) use the same app. Each request says which company it's from. Headers: `x-tenant` (company), `x-user-id`, `x-role` (`admin` or `member`).

| Method | Path | Behaviour |
|---|---|---|
| `GET` | `/projects` | Only the caller's company |
| `GET` | `/projects/search?q=` | Name contains `q` (capitals ignored). Only the caller's company |
| `DELETE` | `/projects/:id` | Company **admin** or the project's **owner** → **204**. Anyone else → **403**. Another company's project → **404** |

Seed: `acme` has Apollo (owner u1), Atlas (owner u2). `globex` has Apex (owner g1).
