const sessions = require('./sessions');

const dayKey = (ts) => {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
};

function daily(from, to) {
  const start = Date.parse(from);
  const end = Date.parse(to);
  const inRange = sessions.filter((s) => s.ts >= start && s.ts < end);

  const byDay = {};
  for (const s of inRange) {
    const k = dayKey(s.ts);
    (byDay[k] = byDay[k] || []).push(s.durationSec);
  }

  const days = Object.keys(byDay).sort().map((day) => {
    const list = byDay[day];
    return { day, sessions: list.length, avgSec: Math.round(list.reduce((a, b) => a + b, 0) / list.length) };
  });

  const overallAvgSec = days.length ? Math.round(days.reduce((a, d) => a + d.avgSec, 0) / days.length) : 0;
  return { days, overallAvgSec };
}

module.exports = { daily };
