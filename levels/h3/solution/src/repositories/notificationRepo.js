const db = require('memdb');
const items = db.collection('notifications');

let seq = 0;

exports.create = (doc) => items.insert({ ...doc, seq: ++seq, read: false, deletedAt: null });
exports.findById = (id) => items.findById(id);
exports.softDelete = (id) => items.updateById(id, { deletedAt: Date.now() });
exports.markRead = (id) => items.updateById(id, { read: true });
exports.findUnread = (userId) => items.find({ userId, read: false, deletedAt: null });
exports.countUnread = (userId) => items.count({ userId, read: false, deletedAt: null });

// Newest first. `cursor` = seq of the last item the client has seen.
exports.list = async (userId, { cursor, limit }) => {
  const filter = { userId, deletedAt: null };
  if (cursor !== undefined) filter.seq = { $lt: cursor };
  const rows = await items.find(filter);
  return rows.sort((a, b) => b.seq - a.seq).slice(0, limit);
};
