# DESK-58: Support desk broke after a code clean-up

After a "small refactor" of the error classes and routes, the support desk is broken.
Customers open tickets, people reply in a thread, and the author or an **agent** closes them.

## Auth
`x-user-id` (required, else **401**). `x-role`: `agent` or `customer` (default `customer`).

## API
| Method | Path | Behaviour |
|---|---|---|
| `GET` | `/tickets?status=` | List tickets, each with `replyCount` |
| `POST` | `/tickets` `{ title, description }` | **201** |
| `GET` | `/tickets/:id` | Ticket + `replies` (oldest first). Unknown → **404** |
| `POST` | `/tickets/:ticketId/replies` `{ body }` | **201**. Empty body → **400**. Closed ticket → **409** |
| `POST` | `/tickets/:id/close` | Author **or** agent → **200** `{ status: 'closed' }`. Anyone else → **403** |

Several bugs hide behind each other: fix one and the next test fails in a new way. That's normal.
