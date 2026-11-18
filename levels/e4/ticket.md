# ACC-19: Signup broken + security review findings

After the new user service shipped: **nobody can sign up**. The security review also flagged **password hashes in API responses** and **privilege escalation through the profile endpoint**.

## API
| Method | Path | Behaviour |
|---|---|---|
| `POST` | `/users` `{ email, password, name }` | **201** with the public user (`_id, email, name, bio, role`), never `passwordHash`. Duplicate email (case-insensitive) → **409**. Missing fields → **400**. |
| `GET` | `/users/me` | Caller's public profile (`x-user-id` header) |
| `PATCH` | `/users/me` `{ name?, bio? }` | Only `name` and `bio` can change. Everything else is ignored. |

New users get `role: 'user'`.
