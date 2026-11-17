let n = 0;
exports.generate = () => `rst_${++n}_${Math.random().toString(36).slice(2, 10)}`;
