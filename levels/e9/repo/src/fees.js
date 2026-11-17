const FREE_FROM = 499;
const PER_EXTRA_KG = 20;

function baseFee(zone) {
  let fee;
  switch (zone) {
    case 'local':
      fee = 40;
    case 'regional':
      fee = 60;
      break;
    case 'national':
      fee = 90;
      break;
    default:
      throw new Error(`unknown zone: ${zone}`);
  }
  return fee;
}

function quote({ weightKg, zone, orderTotal }) {
  if (!(weightKg > 0)) throw new Error('weightKg must be > 0');
  const base = baseFee(zone);
  if (orderTotal > FREE_FROM) return 0;
  const extraKg = Math.round(Math.max(0, weightKg - 1));
  return base + extraKg * PER_EXTRA_KG;
}

module.exports = { quote };
