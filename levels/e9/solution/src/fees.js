const FREE_FROM = 499;
const PER_EXTRA_KG = 20;

function baseFee(zone) {
  switch (zone) {
    case 'local':
      return 40;
    case 'regional':
      return 60;
    case 'national':
      return 90;
    default:
      throw new Error(`unknown zone: ${zone}`);
  }
}

function quote({ weightKg, zone, orderTotal }) {
  if (!(weightKg > 0)) throw new Error('weightKg must be > 0');
  const base = baseFee(zone);
  if (orderTotal >= FREE_FROM) return 0;
  const extraKg = Math.ceil(Math.max(0, weightKg - 1));
  return base + extraKg * PER_EXTRA_KG;
}

module.exports = { quote };
