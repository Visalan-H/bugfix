const db = require('memdb');
const todos = db.collection('todos');

async function create({ title }) {
  return todos.insert({ title, done: false, createdAt: Date.now() });
}

async function list(filter = {}) {
  return todos.find(filter);
}

async function findById(id) {
  return todos.findById(id);
}

async function update(id, patch) {
  return todos.updateById(id, patch);
}

module.exports = { create, list, findById, update };
