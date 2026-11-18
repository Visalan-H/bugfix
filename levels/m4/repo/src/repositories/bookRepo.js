const db = require('memdb');
const books = db.collection('books');

const ready = Promise.all([
  books.insert({ _id: 'b-sapiens', title: 'Sapiens', available: 5 }),
  books.insert({ _id: 'b-ponniyin', title: 'Ponniyin Selvan', available: 1 }),
  books.insert({ _id: 'b-ddia', title: 'Designing Data-Intensive Applications', available: 4 }),
]);

exports.findById = async (id) => { await ready; return books.findById(id); };
exports.adjustAvailable = async (id, delta) => {
  await ready;
  return books.findOneAndUpdate({ _id: id }, { $inc: { available: delta } });
};
