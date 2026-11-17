# LIB-31: Loans service audit

The finance team noticed **members charged ₹20,000 late fees**, **members getting money back for early returns**, and **books with negative copies**. Members also complain they **can't borrow after returning books**.

## Rules
* A member can have at most **3 active** (not returned) loans → otherwise **409**.
* Borrowing needs at least 1 available copy → otherwise **409**. Borrowing takes one copy.
* A loan is due **14 days** after borrowing.
* Late fee: **₹10 per started day** late (1 hour late = 1 day). On time or early = **0**.
* A loan can be returned **once**. A second return → **409**.

## API (header `x-member-id`)
`POST /loans { bookId }` → **201** loan · `POST /loans/:id/return` → **200** `{ ...loan, fee }` · `GET /books/:id`
