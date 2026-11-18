const db = require('memdb');
const orders = db.collection('orders');

exports.create = (doc) => orders.insert({ ...doc, createdAt: Date.now() });
exports.findById = (id) => orders.findById(id);
