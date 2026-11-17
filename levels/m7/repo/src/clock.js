let t = Date.UTC(2026, 10, 17, 9, 0, 0);
module.exports = { now: () => t, set: (ms) => { t = ms; } };
