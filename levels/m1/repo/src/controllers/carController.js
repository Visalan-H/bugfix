const carService = require('../services/carService');

exports.listMine = async (req, res) => {
  const cars = await carService.listMine(req.user.userId);
  res.json(cars);
};

exports.create = async (req, res) => {
  const { model, dailyRate } = req.body;
  if (!model || typeof dailyRate !== 'number' || dailyRate <= 0) {
    return res.status(400).json({ error: 'model and positive dailyRate are required' });
  }
  const car = await carService.addCar(req.user.id, { model, dailyRate });
  res.status(201).json(car);
};

exports.getOne = async (req, res) => {
  const car = await carService.getCar(req.params.id);
  if (!car) return res.status(404).json({ error: 'car not found' });
  res.json(car);
};

exports.update = async (req, res) => {
  const car = await carService.updateCar(req.user.id, req.params.id, req.body);
  if (!car) return res.status(404).json({ error: 'car not found' });
  res.json(car);
};
