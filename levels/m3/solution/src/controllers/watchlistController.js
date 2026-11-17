const service = require('../services/watchlistService');
const movieRepo = require('../repositories/movieRepo');

exports.get = async (req, res) => {
  res.json(await service.getList(req.userId));
};

exports.add = async (req, res) => {
  const { movieId } = req.body;
  const movie = await movieRepo.findById(movieId);
  if (!movie) {
    return res.status(404).json({ error: 'movie not found' });
  }
  const list = await service.addMovie(req.userId, movieId);
  res.status(201).json(list);
};

exports.remove = async (req, res) => {
  await service.removeMovie(req.userId, req.params.movieId);
  res.status(204).end();
};
