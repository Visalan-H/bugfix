const productRepo = require('../repositories/productRepo');
const { NotFoundError } = require('../errors');

exports.get = async (req, res) => {
  const p = await productRepo.findById(req.params.id);
  if (!p) throw new NotFoundError('Product');
  res.json(p);
};
