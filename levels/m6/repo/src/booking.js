const db = require('memdb');
const appts = db.collection('appointments');

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }

const overlaps = (a, b) => a.start <= b.end && b.start <= a.end;

async function book({ doctorId, start, end }) {
  if (!doctorId) throw new HttpError(400, 'doctorId is required');
  const existing = await appts.find({});
  if (existing.some((e) => overlaps(e, { start, end }))) throw new HttpError(409, 'slot taken');
  return appts.insert({ doctorId, start, end, status: 'booked' });
}

async function cancel(id) {
  const a = await appts.findById(id);
  if (!a) throw new HttpError(404, 'not found');
  return appts.updateById(id, { status: 'cancelled' });
}

module.exports = { book, cancel };
