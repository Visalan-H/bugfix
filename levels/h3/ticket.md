# NOTIF-88: Notification centre bugs

The mobile team reports: **infinite scroll shows duplicates**, the **red badge never clears** after "mark all as read", and **deleted notifications still count**. Also a pen-test finding about deleting other users' data.

## API (header `x-user-id`)
| Method | Path | Behaviour |
|---|---|---|
| `GET` | `/notifications?limit=&cursor=` | Newest first. `{ items, nextCursor }`. `nextCursor` = `null` when no more pages. Pages never overlap. Deleted items are never shown. |
| `GET` | `/notifications/unread-count` | `{ count }`, excluding deleted |
| `POST` | `/notifications/read-all` | Marks all of the caller's notifications read before responding. `{ updated }` |
| `DELETE` | `/notifications/:id` | Soft delete, **204**. Not yours / unknown / already deleted → **404** |

Tests create notifications with `notificationService.notify(userId, text)`. Each gets an increasing `seq`.
