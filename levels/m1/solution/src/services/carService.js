const carRepo = require('../repositories/carRepo');
const cache = require('../lib/cache');

const EDITABLE = ['model', 'dailyRate'];
const key = (ownerId) => `cars:${ownerId}`;

function pick(obj, fields) {
  const out = {};
  for (const f of fields) if (obj[f] !== undefined) out[f] = obj[f];
  return out;
}

function invalidate(ownerId) {
  cache.del(key(ownerId));
}

async function listMine(ownerId) {
  const cached = cache.get(key(ownerId));
  if (cached) return cached;
  const cars = await carRepo.findByOwner(ownerId);
  cache.set(key(ownerId), cars);
  return cars;
}

async function addCar(ownerId, { model, dailyRate }) {
  const car = await carRepo.insert({ owner: ownerId, model, dailyRate });
  invalidate(ownerId);
  return car;
}

async function getCar(ownerId, carId) {
  const car = await carRepo.findById(carId);
  if (!car || car.owner !== ownerId) return null;
  return car;
}

async function updateCar(ownerId, carId, changes) {
  const car = await carRepo.findById(carId);
  if (!car || car.owner !== ownerId) return null;

  const updated = await carRepo.update(carId, pick(changes, EDITABLE));
  invalidate(ownerId);
  return updated;
}

module.exports = { listMine, addCar, getCar, updateCar };
