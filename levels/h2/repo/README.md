# checkout-service

`memdb.findOneAndUpdate(filter, update)` is **atomic**: the match and the update happen in one step, like MongoDB.
Every other pair of calls (read, then write) is NOT atomic. Other requests can run between them.
