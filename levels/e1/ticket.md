# TODO-142: Todo service is flaky

A small Express todo service. Customers say **new todos come back empty**, **bad input crashes the server**, and **the "completed" filter never shows anything**.

## How the API should work
| Method | Path | Behaviour |
|---|---|---|
| `GET` | `/todos?done=true\|false` | List todos, optionally filtered by `done` |
| `POST` | `/todos` `{ title }` | **201** + created todo. Blank or missing title → **400**, nothing created. Title is trimmed. |
| `PATCH` | `/todos/:id/toggle` | Flip `done`. Unknown id → **404** |

## Your job
Make every test in `tests/todos.test.js` pass, then **Submit** to run the hidden tests too.
Don't change the tests or the API shape.
