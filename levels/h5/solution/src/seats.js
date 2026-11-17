const db = require('memdb');
const clock = require('./clock');

const seats = db.collection('seats');
const HOLD_MS = 5 * 60 * 1000;
const ready = Promise.all(['A1', 'A2', 'A3', 'A4', 'A5'].map((s) =>
  seats.insert({ _id: `s1-${s}`, showId: 's1', seat: s, status: 'free', holdId: null, heldUntil: null })));

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }
let holdSeq = 0;

async function claim(id, patch) {
  const now = clock.now();
  return (await seats.findOneAndUpdate({ _id: id, status: 'free' }, { $set: patch }))
    || seats.findOneAndUpdate({ _id: id, status: 'held', heldUntil: { $lte: now } }, { $set: patch });
}

async function hold(showId, userId, wanted) {
  await ready;
  if (!Array.isArray(wanted) || !wanted.length) throw new HttpError(400, 'seats required');
  const holdId = `h${++holdSeq}`;
  const heldUntil = clock.now() + HOLD_MS;
  const taken = [];
  try {
    for (const s of wanted) {
      const ok = await claim(`${showId}-${s}`, { status: 'held', holdId, heldUntil, userId });
      if (!ok) throw new HttpError(409, `${s} is not available`);
      taken.push(ok._id);
    }
  } catch (err) {
    for (const id of taken) {
      await seats.findOneAndUpdate({ _id: id, holdId }, { $set: { status: 'free', holdId: null, heldUntil: null } });
    }
    throw err;
  }
  return { holdId };
}

async function confirm(holdId) {
  await ready;
  const mine = await seats.find({ holdId, status: 'held' });
  if (!mine.length) throw new HttpError(410, 'hold expired or not found');
  if (mine.some((s) => s.heldUntil <= clock.now())) throw new HttpError(410, 'hold expired');
  for (const s of mine) await seats.findOneAndUpdate({ _id: s._id, holdId }, { $set: { status: 'booked' } });
  return { booked: mine.map((s) => s.seat) };
}

async function list(showId) {
  await ready;
  const now = clock.now();
  return (await seats.find({ showId })).map((s) => ({
    seat: s.seat,
    status: s.status === 'held' && s.heldUntil <= now ? 'free' : s.status,
  }));
}

module.exports = { hold, confirm, list };
