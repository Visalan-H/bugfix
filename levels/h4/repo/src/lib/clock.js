// Frozen clock: only moves when tests advance it.
let t = Date.UTC(2026, 0, 1, 0, 0, 0);

module.exports = {
  now: () => t,
  advance: (ms) => { t += ms; },
};
