# EVT-3: RSVP counts are off

| Method | Path | Behaviour |
|---|---|---|
| `GET` | `/events/:id` | `{ id, capacity, attendees, spotsLeft }` |
| `POST` | `/events/:id/rsvp` | **201**. Full → **409**. Already attending → **409** |
| `DELETE` | `/events/:id/rsvp` | **204**. Not attending → **404** |

Header `x-user-id`. Seeded: `ev-meetup` (capacity 3), `ev-workshop` (capacity 1).
