const db = require('memdb');
const { parseLine } = require('./csv');

const customers = db.collection('customers');

async function importCsv(text) {
  const [header, ...rows] = String(text).replace(/\r/g, '').split('\n');
  const result = { imported: 0, skipped: 0, errors: [] };
  const seen = new Set();

  for (let i = 0; i < rows.length; i++) {
    if (!rows[i].trim()) continue;
    const line = i + 2;
    const [name, email, rawAmount] = parseLine(rows[i]);
    if (!name || !email || !email.includes('@')) {
      result.errors.push({ line, reason: 'name and a valid email are required' });
      continue;
    }
    const amount = Number(String(rawAmount || '').replace(/,/g, ''));
    if (rawAmount === undefined || rawAmount === '' || !Number.isFinite(amount)) {
      result.errors.push({ line, reason: 'amount is not a number' });
      continue;
    }
    const key = email.toLowerCase();
    if (seen.has(key) || (await customers.findOne({ email: key }))) { result.skipped++; continue; }
    seen.add(key);
    await customers.insert({ name, email: key, amount });
    result.imported++;
  }
  return result;
}

module.exports = { importCsv, customers };
