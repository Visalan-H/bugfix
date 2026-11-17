// Frozen clock: time only moves when a test advances it.
const START = Date.UTC(2026, 0, 5, 9, 0, 0);
let offset = 0;
const DAY = 24 * 60 * 60 * 1000;

module.exports = {
  now: () => START + offset,
  advance: (ms) => { offset += ms; },
  advanceDays: (d) => { offset += d * DAY; },
};
