const db = require('memdb');
const cars = db.collection('cars');

exports.findByOwner = (owner) => cars.find({ owner });
exports.findById = (id) => cars.findById(id);
exports.insert = (doc) => cars.insert(doc);
exports.update = (id, patch) => cars.updateById(id, patch);
