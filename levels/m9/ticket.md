# ORD-77: Order status updates broken

`POST /orders/:id/transition { to }` (headers `x-user-id`, `x-role`: `customer` | `staff`, default **customer**)

```
placed → paid → shipped → delivered
placed → cancelled,  paid → cancelled
```
* Customers may only move to `cancelled`. Staff may do any allowed transition. Else **403**.
* Not allowed from the current status → **409**. Unknown status → **400**.
* Response: the **updated** order.

`POST /orders` creates an order in `placed`.
