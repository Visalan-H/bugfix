const db = require('memdb');
const resets = db.collection('password_resets');

exports.create = (doc) => resets.insert(doc);
exports.findByToken = (token) => resets.findOne({ token });
exports.markUsed = (id) => resets.updateById(id, { used: true });
