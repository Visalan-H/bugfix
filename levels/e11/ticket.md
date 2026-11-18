# BLOG-31: Comment threads look random

`GET /posts/:postId/comments?authorId=` → `{ total, comments }`

* Newest first.
* `authorId` (optional) filters by author.
* `total` = number of comments matching the filters.

The legacy DB stores `createdAt` as `"DD/MM/YYYY HH:mm"` (UTC). Don't change the stored format.
