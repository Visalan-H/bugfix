const repo = require('../repositories/watchlistRepo');
const movieRepo = require('../repositories/movieRepo');
const { ConflictError, NotFoundError } = require('../errors');

async function getList(userId) {
  const wl = await repo.getOrCreate(userId);
  const items = await Promise.all(wl.items.map(async (i) => {
    const movie = await movieRepo.findById(i.movieId);
    return { ...i, title: movie ? movie.title : null };
  }));
  return { items };
}

async function addMovie(userId, movieId) {
  const wl = await repo.getOrCreate(userId);
  if (wl.items.some((i) => i.movieId === movieId)) {
    throw new ConflictError('movie already in watch list');
  }
  wl.items.push({ movieId, addedAt: Date.now() });
  await repo.save(wl);
  return getList(userId);
}

async function removeMovie(userId, movieId) {
  const wl = await repo.getOrCreate(userId);
  const before = wl.items.length;
  wl.items = wl.items.filter((i) => i.movieId !== movieId);
  if (wl.items.length === before) throw new NotFoundError('movie not in watch list');
  await repo.save(wl);
}

module.exports = { getList, addMovie, removeMovie };
