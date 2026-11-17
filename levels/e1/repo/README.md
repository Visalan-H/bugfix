# todo-service

Run `npm test`.

* `src/app.js` wires Express.
* `src/routes/todos.js` holds the HTTP handlers.
* `src/repositories/todoRepo.js` talks to the DB.

`memdb` is a tiny Mongoose-like store: every call is **async** and returns **copies** of documents.
Keys whose value is `undefined` are ignored in filters (same as Mongoose).
