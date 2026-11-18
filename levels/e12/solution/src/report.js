const inventory = require('./inventory');

const DEFAULT = 5;

function lowStock(rawThreshold) {
  const threshold = rawThreshold === undefined || rawThreshold === '' ? DEFAULT : Number(rawThreshold);
  const items = inventory
    .filter((i) => Number(i.stock) <= threshold)
    .sort((a, b) => Number(a.stock) - Number(b.stock));
  const totalUnits = items.reduce((s, i) => s + Number(i.stock), 0);
  return { items, totalUnits };
}

module.exports = { lowStock };
