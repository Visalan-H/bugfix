const db = require('memdb');
const users = db.collection('users');

exports.findByEmail = (email) => users.findOne({ email });
exports.findById = (id) => users.findById(id);
exports.insert = (doc) => users.insert(doc);
exports.update = (id, patch) => users.updateById(id, patch);
