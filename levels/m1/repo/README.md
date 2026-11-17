# car-rental-api

Layers: `routes → controllers → services → repositories → memdb`

* `memdb` behaves like Mongoose: async calls, returns **copies**, and **drops `undefined` keys from filters**.
* `src/lib/cache.js` is a per-process in-memory cache.
