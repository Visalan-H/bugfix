let t = Date.UTC(2026, 4, 1, 18, 0, 0);
module.exports = { now: () => t, advance: (ms) => { t += ms; } };
