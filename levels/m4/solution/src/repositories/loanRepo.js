const db = require('memdb');
const loans = db.collection('loans');

exports.create = (doc) => loans.insert(doc);
exports.findById = (id) => loans.findById(id);
exports.update = (id, patch) => loans.updateById(id, patch);
exports.countActive = (memberId) => loans.count({ memberId, returnedAt: null });
