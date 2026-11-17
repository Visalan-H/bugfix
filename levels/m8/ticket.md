# REV-8: Ratings don't add up

| Method | Path | Behaviour |
|---|---|---|
| `POST` | `/products/:id/reviews { rating }` | **201**. rating = **integer 1–5** → else **400**. One active review per user per product → **409** |
| `DELETE` | `/reviews/:id` | Soft delete (author only), **204** |
| `GET` | `/products/:id/rating` | `{ avgRating, reviewCount }`. avgRating is a **number** with 1 decimal; no reviews → `0` |

Header `x-user-id`.
