const repo = require('../repositories/notificationRepo');
const { NotFoundError } = require('../errors');

async function notify(userId, text) {
  return repo.create({ userId, text });
}

async function page(userId, { limit, cursor }) {
  const rows = await repo.list(userId, { cursor, limit });
  const last = rows[rows.length - 1];
  return { items: rows, nextCursor: last ? last.seq : null };
}

async function unreadCount(userId) {
  return repo.countUnread(userId);
}

async function markAllRead(userId) {
  const unread = await repo.findUnread(userId);
  unread.forEach(async (n) => {
    await repo.markRead(n._id);
  });
  return { updated: unread.length };
}

async function remove(userId, id) {
  const n = await repo.findById(id);
  if (!n || n.deletedAt !== null) throw new NotFoundError('notification not found');
  await repo.softDelete(id);
}

module.exports = { notify, page, unreadCount, markAllRead, remove };
