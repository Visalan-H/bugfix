# RENT-907: "My Garage" is broken

Users list cars they rent out. Support has three tickets:

1. **"My Cars shows other people's cars."**
2. **"I added a car and it never showed up."**
3. **"I edited my car's daily rate, it said saved, then it reverted after refresh."**

## Auth
Every request carries `x-user-id`. Missing → **401**.

## API
| Method | Path | Behaviour |
|---|---|---|
| `GET` | `/cars/mine` | Only the caller's cars |
| `POST` | `/cars` `{ model, dailyRate }` | **201**, owner = caller |
| `GET` | `/cars/:id` | Caller's car, otherwise **404** |
| `PATCH` | `/cars/:id` `{ model?, dailyRate? }` | Persist the edit, return the updated car. Not yours → **404**. `owner` can't be changed. |

The bugs are independent. Make `tests/cars.test.js` pass, then Submit.
