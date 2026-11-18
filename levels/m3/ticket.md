# MDB-420: Watch list is unreliable

Each user has one watch list of movies.

## API (header `x-user-id`)
| Method | Path | Behaviour |
|---|---|---|
| `GET` | `/watchlist` | `{ items: [{ movieId, title, addedAt }] }` |
| `POST` | `/watchlist` `{ movieId }` | **201** + the list. Unknown movie → **404** (nothing added). Already in list → **409**. |
| `DELETE` | `/watchlist/:movieId` | **204**. Not in the list → **404**. |

Movies `m1`–`m4` are seeded.
