const db = require('memdb');
const { parseLine } = require('./csv');

const customers = db.collection('customers');

async function importCsv(text) {
  const [header, ...rows] = String(text).split('\n');
  const result = { imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const [name, email, rawAmount] = parseLine(rows[i]);
    if (!name || !email || !email.includes('@')) {
      result.errors.push({ line: i, reason: 'name and a valid email are required' });
      continue;
    }
    const amount = parseInt(rawAmount, 10);
    if (Number.isNaN(amount)) {
      result.errors.push({ line: i, reason: 'amount is not a number' });
      continue;
    }
    await customers.insert({ name, email: email.toLowerCase(), amount });
    result.imported++;
  }
  return result;
}

module.exports = { importCsv, customers };
