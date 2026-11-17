let t = Date.UTC(2026, 10, 17, 12, 0, 0);
module.exports = { now: () => t, set: (v) => { t = v; } };
