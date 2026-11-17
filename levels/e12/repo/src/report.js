const inventory = require('./inventory');

const DEFAULT = 5;

function lowStock(rawThreshold) {
  const threshold = Number(rawThreshold) || DEFAULT;
  const items = inventory
    .filter((i) => i.stock <= String(threshold))
    .sort((a, b) => a.stock - b.stock);
  const totalUnits = items.reduce((s, i) => s + i.stock, 0);
  return { items, totalUnits };
}

module.exports = { lowStock };
