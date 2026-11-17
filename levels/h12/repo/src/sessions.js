const at = (d, h) => Date.UTC(2026, 2, d, h);
module.exports = [
  { ts: at(8, 10), durationSec: 100 },
  { ts: at(9, 9), durationSec: 10 },
  { ts: at(9, 13), durationSec: 20 },
  { ts: at(9, 22), durationSec: 30 },
  { ts: at(11, 7), durationSec: 50 },
  { ts: at(12, 23), durationSec: 70 },
];
