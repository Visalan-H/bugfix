const sessions = require('./sessions');

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (ts) => new Date(ts).toISOString().slice(0, 10);

function daily(from, to) {
  const start = Date.parse(from);
  const end = Date.parse(to) + DAY_MS;
  const inRange = sessions.filter((s) => s.ts >= start && s.ts < end);

  const byDay = {};
  for (const s of inRange) {
    const k = dayKey(s.ts);
    (byDay[k] = byDay[k] || []).push(s.durationSec);
  }

  const days = [];
  for (let t = start; t < end; t += DAY_MS) {
    const day = dayKey(t);
    const list = byDay[day] || [];
    days.push({ day, sessions: list.length, avgSec: list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : 0 });
  }

  const total = inRange.reduce((a, s) => a + s.durationSec, 0);
  const overallAvgSec = inRange.length ? Math.round(total / inRange.length) : 0;
  return { days, overallAvgSec };
}

module.exports = { daily };
