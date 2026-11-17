const db = require('memdb');
const users = db.collection('users');

const ready = Promise.all([
  users.insert({ email: 'asha@example.com', password: 'old-password' }),
  users.insert({ email: 'ravi@example.com', password: 'ravi-secret' }),
]);

exports.findByEmail = async (email) => {
  await ready;
  return users.findOne({ email: String(email || '').trim().toLowerCase() });
};

exports.setPassword = async (id, password) => {
  await ready;
  return users.updateById(id, { password });
};
