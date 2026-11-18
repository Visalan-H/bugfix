let t = Date.UTC(2026, 0, 1);
module.exports = { now: () => t, advance: (ms) => { t += ms; } };
