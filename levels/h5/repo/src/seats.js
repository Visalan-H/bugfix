const db = require('memdb');
const clock = require('./clock');

const seats = db.collection('seats');
const HOLD_MS = 5 * 60 * 1000;
const ready = Promise.all(['A1', 'A2', 'A3', 'A4', 'A5'].map((s) =>
  seats.insert({ _id: `s1-${s}`, showId: 's1', seat: s, status: 'free', holdId: null, heldUntil: null })));

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }
let holdSeq = 0;

async function hold(showId, userId, wanted) {
  await ready;
  if (!Array.isArray(wanted) || !wanted.length) throw new HttpError(400, 'seats required');
  const holdId = `h${++holdSeq}`;
  const heldUntil = clock.now() + HOLD_MS;

  for (const s of wanted) {
    const seat = await seats.findById(`${showId}-${s}`);
    if (!seat || seat.status !== 'free') throw new HttpError(409, `${s} is not available`);
    await seats.updateById(seat._id, { status: 'held', holdId, heldUntil, userId });
  }
  return { holdId };
}

async function confirm(holdId) {
  await ready;
  const held = await seats.find({ holdId, status: 'held' });
  if (!held.length) throw new HttpError(404, 'hold not found');
  for (const s of held) await seats.updateById(s._id, { status: 'booked' });
  return { booked: held.map((s) => s.seat) };
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
