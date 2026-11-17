const db = require('memdb');
const events = db.collection('events');

const ready = Promise.all([
  events.insert({ _id: 'ev-meetup', capacity: 3, attendees: [] }),
  events.insert({ _id: 'ev-workshop', capacity: 1, attendees: [] }),
]);

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }
const NotFoundError = (m) => new HttpError(404, m);
const ConflictError = (m) => new HttpError(409, m);

async function load(id) {
  await ready;
  const ev = await events.findById(id);
  if (!ev) throw NotFoundError('event not found');
  return ev;
}

async function get(id) {
  const ev = await load(id);
  return { id: ev._id, capacity: ev.capacity, attendees: ev.attendees, spotsLeft: ev.capacity - ev.attendees.length };
}

async function join(id, userId) {
  const ev = await load(id);
  if (ev.attendees.length > ev.capacity) throw ConflictError('event is full');
  ev.attendees.push(userId);
  await events.updateById(id, { attendees: ev.attendees });
}

async function leave(id, userId) {
  const ev = await load(id);
  ev.attendees.splice(ev.attendees.indexOf(userId), 1);
  await events.updateById(id, { attendees: ev.attendees });
}

module.exports = { get, join, leave };
