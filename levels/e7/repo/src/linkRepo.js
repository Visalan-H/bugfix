const db = require('memdb');
const links = db.collection('links');

exports.create = (doc) => links.insert(doc);
exports.findByCode = (code) => links.findOne({ code });
exports.incrementVisits = (id) => links.findOneAndUpdate({ _id: id }, { $inc: { visits: 1 } });
