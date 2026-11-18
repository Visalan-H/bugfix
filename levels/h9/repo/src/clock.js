let t = Date.UTC(2026, 5, 1, 12, 0, 0);
module.exports = { now: () => t, advance: (ms) => { t += ms; } };
