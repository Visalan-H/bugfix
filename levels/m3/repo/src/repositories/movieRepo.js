const db = require('memdb');
const movies = db.collection('movies');

const ready = Promise.all([
  movies.insert({ _id: 'm1', title: 'Inception' }),
  movies.insert({ _id: 'm2', title: 'Arrival' }),
  movies.insert({ _id: 'm3', title: 'Dune' }),
  movies.insert({ _id: 'm4', title: 'Interstellar' }),
]);

exports.findById = async (id) => { await ready; return movies.findById(id); };
