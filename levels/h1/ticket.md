# MOV-2210: Search returns wrong results

The search logic is spread over **controller → service → repository → utils**. Product signed off on these **five rules**:

1. **Partial, case-insensitive** match of `q` against the chosen field.
2. `field` ∈ `title` | `director` | `genre`, default `title`. Anything else → **400**.
3. `q` is **trimmed**. Empty after trimming → return **all** movies.
4. Sort by `rating` **desc**, ties by `title` **asc**.
5. `minRating` (optional) means 'rating **at least** this' (the value itself counts), a number from 0 to 10, otherwise **400**.

`GET /movies/search?q=&field=&minRating=` → `{ count, results }`

Don't change the endpoint path, params or response shape.
