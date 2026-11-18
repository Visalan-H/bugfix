const repo = require('../repositories/notificationRepo');
const { NotFoundError } = require('../errors');

async function notify(userId, text) {
  return repo.create({ userId, text });
}

async function page(userId, { limit, cursor }) {
  const rows = await repo.list(userId, { cursor, limit: limit + 1 });
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  return { items, nextCursor: hasMore ? items[items.length - 1].seq : null };
}

async function unreadCount(userId) {
  return repo.countUnread(userId);
}

async function markAllRead(userId) {
  const unread = await repo.findUnread(userId);
  await Promise.all(unread.map((n) => repo.markRead(n._id)));
  return { updated: unread.length };
}

async function remove(userId, id) {
  const n = await repo.findById(id);
  if (!n || n.userId !== userId || n.deletedAt !== null) throw new NotFoundError('notification not found');
  await repo.softDelete(id);
}

module.exports = { notify, page, unreadCount, markAllRead, remove };
